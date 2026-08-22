# Contact form backend — setup guide

The contact form on the site posts submissions into a Supabase table, and a
Supabase Edge Function emails Thom via Resend whenever a new one arrives.

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
   public website can only *insert* rows — not read, edit, or delete them.

## 3. Connect the site to Supabase

1. In the dashboard, go to **Project Settings -> Data API**.
2. Copy the **Project URL** and the **anon public** key.
3. Open `supabase-config.js` in this repo and paste them in:
   ```js
   const SUPABASE_URL = 'https://xxxxxxxx.supabase.co';
   const SUPABASE_ANON_KEY = 'eyJ...';
   ```
   The anon key is meant to be public/client-side — it can only do what the
   RLS policy in step 2 allows (insert-only).
4. Reload the site and submit the form — you should see the new row show up
   under **Table Editor -> contact_submissions** in the dashboard.

At this point the form works end-to-end and stores submissions in Supabase.
Steps 4-6 below add the *email notification* on top of that.

## 4. Create a Resend account

1. Go to https://resend.com and sign up (free tier: 3,000 emails/month, 100/day).
2. Under **API Keys**, create a new key and copy it.
3. (Optional but recommended) Under **Domains**, verify your own domain so
   emails send from `you@yourdomain.com` instead of Resend's shared test
   domain. You can skip this at first and use the default
   `onboarding@resend.dev` sender to get started quickly.

## 5. Deploy the notify-contact Edge Function

This requires the Supabase CLI. From this project folder:

```
npm install -g supabase
supabase login
supabase link --project-ref <your-project-ref>   # found in Project Settings -> General
supabase functions deploy notify-contact
supabase secrets set RESEND_API_KEY=re_your_key_here
supabase secrets set NOTIFY_TO_EMAIL=thom@example.com
```

(`NOTIFY_FROM_EMAIL` is optional — defaults to Resend's shared test address.)

## 6. Wire up the trigger

1. In the Supabase dashboard, go to **Database -> Webhooks -> Create a new hook**.
2. Table: `contact_submissions`. Event: `Insert`.
3. Type: **Supabase Edge Functions**, and select `notify-contact`.
4. Save. Submit the contact form again — you should get an email.

## Viewing / managing submissions

Submissions always live in **Table Editor -> contact_submissions** in the
Supabase dashboard, whether or not the email step is set up.
