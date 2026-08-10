-- ─────────────────────────────────────────────────────────
-- Word2PDF — Supabase schema
-- Run this in Supabase Dashboard → SQL Editor → New query
-- ─────────────────────────────────────────────────────────

-- 1. Table: conversions
create table if not exists public.conversions (
  id uuid primary key default gen_random_uuid(),
  original_filename text not null,
  original_file_path text not null,
  pdf_file_path text,
  file_size bigint not null,
  status text not null default 'processing' check (status in ('processing', 'completed', 'failed')),
  created_at timestamptz not null default now()
);

-- Helpful index for listing recent conversions
create index if not exists conversions_created_at_idx
  on public.conversions (created_at desc);

-- 2. Row Level Security
-- All reads/writes for this app go through the server (service role key),
-- which bypasses RLS. We still enable RLS and keep the table locked down
-- from the public/anon key by default.
alter table public.conversions enable row level security;

-- No policies are created for the anon/authenticated roles on purpose:
-- this means the browser (anon key) cannot read or write this table directly.
-- Only the server, using the service_role key, can access it.

-- ─────────────────────────────────────────────────────────
-- Storage buckets
-- You still need to create these two buckets from the Dashboard UI
-- (Storage → New bucket) OR you can run the statements below.
-- Keep both buckets PRIVATE (not public) since access happens through
-- server-generated signed URLs only.
-- ─────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public)
values ('word-files', 'word-files', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('pdf-files', 'pdf-files', false)
on conflict (id) do nothing;

-- No storage.objects policies are added for anon/authenticated roles,
-- since all uploads/downloads happen server-side via the service_role key,
-- which bypasses storage RLS as well.
