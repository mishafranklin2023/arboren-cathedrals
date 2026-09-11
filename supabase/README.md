# Contact form backend — setup guide

The contact form on the site posts submissions into a Supabase table, and a
Supabase Edge Function emails Thom via Resend whenever a new one arrives.
Everything below can be done entirely from the Supabase and Resend web
dashboards — no CLI or local Node.js install required.

## 1. Create the Supabase project

1. Go to https://supabase.com and sign up / log in.
2. Click **New project**. Pick an org, name it (e.g. `arboren-cathedrals`),
   set a database password (save it somewhere safe), pick a region close to
   Portland (e.g. `us-west-1`), and create the project. It takes a minute or
   two to provision.

## 2. Create the table

1. In the project dashboard, open **SQL Editor** -> **New query**.
2. Paste in the contents of `supabase/schema.sql` (in this repo) and run it.
   This creates a `contact_submissions` table with Row Level Security so the
   public website can only *insert* rows — not read, edit, or delete them —
   **and** grants the `anon` role table-level `INSERT` privilege.

   > **Why the explicit `GRANT` matters:** Supabase does NOT auto-grant table
   > access for tables created via the SQL editor. An RLS policy alone is not
   > enough — without the `grant insert on public.contact_submissions to
   > anon;` line at the bottom of `schema.sql`, every submission fails with
   > `42501 permission denied for table contact_submissions`, even though the
   > policy looks correct. If you ever see that error, re-run just that one
   > `grant` statement in the SQL Editor.

## 2b. Upgrading an existing table (v2 form fields)

If the table already exists from an earlier version of the site, the expanded
contact form needs extra columns. Without them, submissions fail with:

```
PGRST204: Could not find the 'best_time' column of 'contact_submissions' in the schema cache
```

1. In the project dashboard, open **SQL Editor** -> **New query**.
2. Paste in the contents of `supabase/migration_v2_contact_form.sql` and run it.
   This adds `phone`, `contact_method`, `best_time`, `zipcode`, `services`,
   `planning_process`, and `files`.
3. If you see an error about `contact_method` already being `text`, run the
   commented repair statement in that file first to convert it to `text[]`.

## 3. Connect the site to Supabase

1. In the dashboard, go to **Project Settings -> Data API**.
2. Copy the **Project URL** and the **anon public** key.
3. Open `supabase-config.js` in this repo and paste them in:
   ```js
   const SUPABASE_URL = 'https://xxxxxxxx.supabase.co';
   const SUPABASE_ANON_KEY = 'eyJ...';
   ```
   The anon key is meant to be public/client-side — it can only do what the
   RLS policy + grant in step 2 allow (insert-only).
4. Reload the site and submit the form — you should see the new row show up
   under **Table Editor -> contact_submissions** in the dashboard.

At this point the form works end-to-end and stores submissions in Supabase.
Steps 5-7 below add the *email notification* on top of that.

## 4. Create the Storage bucket for file uploads (optional)

The contact form lets visitors attach sketches, photos, or plans. These are
stored in a Supabase Storage bucket named `contact-uploads`.

1. In the dashboard, go to **Storage -> New bucket**.
2. Name it exactly `contact-uploads`.
3. In the bucket's **Policies** tab, add the following policies for the `anon`
   role so the public website can upload and read back file URLs:
   - **INSERT** policy: `bucket_id = 'contact-uploads'` (or `(auth.role() = 'anon')`).
   - **SELECT** policy: `bucket_id = 'contact-uploads'`.

Without this bucket, file uploads fail after the form's table insert succeeds.
Submissions without files work fine with just step 2.

## 5. Create a Resend account


1. Go to https://resend.com and sign up (free tier: 3,000 emails/month, 100/day).
2. Under **API Keys**, create a new key and copy it (you'll only see it once).
3. (Optional but recommended) Under **Domains**, add & verify your own domain
   (e.g. `arborencathedrals.com`) so emails send from
   `notifications@arborencathedrals.com` instead of Resend's shared test
   domain. This adds a few SPF/DKIM DNS records — straightforward once the
   domain's DNS is on Cloudflare. You can skip this at first and use the
   default `onboarding@resend.dev` sender to get started quickly, then switch
   later by just updating the `NOTIFY_FROM_EMAIL` secret (no redeploy of code
   needed).

## 6. Deploy the notify-contact Edge Function (via the Supabase Dashboard)

1. In your Supabase project, go to **Edge Functions** in the sidebar.
2. Click **Deploy a new function** -> **Via Editor**.
3. Name it exactly `notify-contact` (the webhook in step 7 calls it by name).
4. Replace the template code with the contents of
   `supabase/functions/notify-contact/index.ts` from this repo.
5. Click **Deploy function**.

Then set the secrets it needs — still under **Edge Functions**, open
**Secrets** (or **Manage secrets**) and add:

| Secret | Value |
|---|---|
| `RESEND_API_KEY` | the key from step 5 |
| `NOTIFY_TO_EMAIL` | Thom's real inbox, e.g. `thom@arborencathedrals.com` |
| `NOTIFY_FROM_EMAIL` | `Arboren CAThedrals <onboarding@resend.dev>` for now, or your verified domain sender once set up (optional — defaults to Resend's shared test address if omitted) |

Secrets are shared across all Edge Functions in the project.

> **Prefer the CLI?** You can also deploy with
> `supabase functions deploy notify-contact` and
> `supabase secrets set RESEND_API_KEY=...` if you have the Supabase CLI and
> Node.js installed locally — the Dashboard editor above is just the
> no-install alternative used for this project.

## 7. Wire up the trigger

1. In the Supabase dashboard, go to **Database -> Webhooks -> Create a new hook**.
2. Table: `contact_submissions`. Event: `Insert`.
3. Type: **Supabase Edge Functions**, and select `notify-contact`.
4. Save. Submit the contact form again — you should get an email within a
   few seconds.

If the email doesn't arrive, check **Edge Functions -> notify-contact ->
Logs** in the dashboard — the function logs an error on both missing secrets
and Resend API failures, so the exact cause will show up there.

## Viewing / managing submissions

Submissions always live in **Table Editor -> contact_submissions** in the
Supabase dashboard, whether or not the email step is set up.
