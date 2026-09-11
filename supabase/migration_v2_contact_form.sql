-- Run this in the Supabase SQL Editor (Project -> SQL Editor -> New query)
-- to upgrade an existing contact_submissions table with the v2 form fields.
--
-- This is safe to run even if some columns already exist because it uses
-- `if not exists`. The initial table creation is in schema.sql; use this
-- migration only when the table already exists and you need to add the
-- expanded contact form fields.

alter table public.contact_submissions
  add column if not exists phone text,
  add column if not exists contact_method text[],
  add column if not exists best_time text[],
  add column if not exists zipcode text,
  add column if not exists services text[],
  add column if not exists planning_process text,
  add column if not exists files jsonb default '[]'::jsonb;

-- The existing INSERT grant and RLS policy from schema.sql still cover the
-- new columns, so no extra GRANT or policy is needed.

-- Repair note: if an earlier version created `contact_method` as a plain
-- `text` column, the migration above may fail. Run this first to convert it:
--
--   alter table public.contact_submissions
--     alter column contact_method type text[] using array[contact_method];
