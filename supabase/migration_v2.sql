-- ─────────────────────────────────────────────────────────
-- PDFly — Migration v2 (adds Auth-aware file history + tools)
-- Run this in Supabase Dashboard → SQL Editor → New query
-- Safe to run even if you already ran the original schema.sql —
-- everything below uses IF NOT EXISTS / ON CONFLICT guards.
-- ─────────────────────────────────────────────────────────

-- 1. Table: file_operations
-- Tracks every tool run (merge, split, compress, word-to-pdf, etc.)
create table if not exists public.file_operations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  original_filename text not null,
  original_file_path text,
  output_file_path text,
  tool_name text not null,
  file_size bigint not null default 0,
  status text not null default 'processing' check (status in ('processing', 'completed', 'failed')),
  created_at timestamptz not null default now()
);

create index if not exists file_operations_user_id_idx
  on public.file_operations (user_id, created_at desc);

-- 2. Row Level Security — each user can only see/manage their own rows.
alter table public.file_operations enable row level security;

drop policy if exists "Users can view their own operations" on public.file_operations;
create policy "Users can view their own operations"
  on public.file_operations for select
  using (auth.uid() = user_id);

drop policy if exists "Users can delete their own operations" on public.file_operations;
create policy "Users can delete their own operations"
  on public.file_operations for delete
  using (auth.uid() = user_id);

-- Inserts/updates happen server-side via the service_role key (bypasses RLS),
-- so no insert/update policy is needed for the anon/authenticated roles.

-- ─────────────────────────────────────────────────────────
-- 3. Storage: add a third bucket for image-based tools
-- (word-files and pdf-files already exist from schema.sql)
-- ─────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('images', 'images', false)
on conflict (id) do nothing;

-- 4. Storage RLS — files are stored under "<user_id>/..." paths.
-- Allow each authenticated user to read/delete only their own files,
-- and to generate signed download URLs for their own files.
-- (Uploads/inserts still go through the service_role key on the server.)

drop policy if exists "Users can read their own word files" on storage.objects;
create policy "Users can read their own word files"
  on storage.objects for select
  using (bucket_id = 'word-files' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "Users can delete their own word files" on storage.objects;
create policy "Users can delete their own word files"
  on storage.objects for delete
  using (bucket_id = 'word-files' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "Users can read their own pdf files" on storage.objects;
create policy "Users can read their own pdf files"
  on storage.objects for select
  using (bucket_id = 'pdf-files' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "Users can delete their own pdf files" on storage.objects;
create policy "Users can delete their own pdf files"
  on storage.objects for delete
  using (bucket_id = 'pdf-files' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "Users can read their own image files" on storage.objects;
create policy "Users can read their own image files"
  on storage.objects for select
  using (bucket_id = 'images' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "Users can delete their own image files" on storage.objects;
create policy "Users can delete their own image files"
  on storage.objects for delete
  using (bucket_id = 'images' and auth.uid()::text = (storage.foldername(name))[1]);

-- Note: the original `conversions` table from schema.sql is left untouched
-- so the legacy /api/convert endpoint keeps working exactly as before.
