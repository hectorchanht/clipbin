-- Clipbin image support
-- Run in the Supabase SQL editor. Idempotent: safe to run more than once.

-- 1) Image metadata table ----------------------------------------------------
create table if not exists public."clipbin-images" (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  storage_path text not null,
  mime text not null default 'image/png',
  size_bytes integer not null default 0,
  width integer,
  height integer,
  created_at timestamptz not null default now()
);

create index if not exists "clipbin-images_user_id_created_at_idx"
  on public."clipbin-images" (user_id, created_at desc);

-- 2) Private storage bucket ---------------------------------------------------
insert into storage.buckets (id, name, public)
values ('clipbin-images', 'clipbin-images', false)
on conflict (id) do nothing;

-- 3) Row-level security: users only ever see their own rows ------------------
alter table public."clipbin-images" enable row level security;

drop policy if exists "Users manage their own images" on public."clipbin-images";
create policy "Users manage their own images"
  on public."clipbin-images"
  as permissive
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 4) Storage policies: each user's files live under <user_id>/... ------------
drop policy if exists "Users upload own images" on storage.objects;
create policy "Users upload own images"
  on storage.objects
  as permissive
  for insert
  to authenticated
  with check (
    bucket_id = 'clipbin-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users read own images" on storage.objects;
create policy "Users read own images"
  on storage.objects
  as permissive
  for select
  to authenticated
  using (
    bucket_id = 'clipbin-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users delete own images" on storage.objects;
create policy "Users delete own images"
  on storage.objects
  as permissive
  for delete
  to authenticated
  using (
    bucket_id = 'clipbin-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
