-- Run this in the Supabase SQL Editor (Project -> SQL Editor -> New query)
-- to set up the contact form table for the Arboren CAThedrals site.

create table if not exists public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  created_at timestamptz not null default now()
);

-- Lock the table down by default...
alter table public.contact_submissions enable row level security;

-- ...then allow anyone (the public website, using the anon key) to INSERT
-- new rows only. No one using the anon key can SELECT, UPDATE, or DELETE,
-- so submissions can only be read from the Supabase dashboard or with the
-- service role key.
create policy "Anyone can submit the contact form"
  on public.contact_submissions
  for insert
  to anon
  with check (true);

-- RLS policies alone are NOT enough — Supabase does not auto-grant table
-- privileges for tables created outside the dashboard UI. The anon role
-- also needs an explicit table-level GRANT, or every insert fails with
-- "42501 permission denied for table contact_submissions" even though the
-- policy above allows it.
grant insert on public.contact_submissions to anon;

-- Backward-compatible migration: add contact form v2 fields.
-- Run this after the table already exists. All new columns are nullable so
-- existing rows are not broken; the browser enforces required fields.
alter table public.contact_submissions
  add column if not exists phone text,
  add column if not exists contact_method text[],
  add column if not exists best_time text[],
  add column if not exists zipcode text,
  add column if not exists services text[],
  add column if not exists planning_process text,
  add column if not exists files jsonb default '[]'::jsonb;

-- Note: the existing INSERT grant and RLS policy still cover the new columns.
-- If you add a Storage bucket for file uploads, create it in the Supabase UI
-- and allow anon INSERT/SELECT so the browser can upload sketches/plans.
--
-- Migration note: if an earlier version created `contact_method` as `text`,
-- run this before the new form can insert arrays:
--   alter table public.contact_submissions
--     alter column contact_method type text[] using array[contact_method];
