-- rushbin-clipboard initial schema
-- Run this in the Supabase SQL editor (https://supabase.com/dashboard/project/_/sql)
-- to set up cloud mode. Idempotent: safe to run more than once.

-- 1) Clipboard entries -------------------------------------------------------
create table if not exists public."rushbin-data" (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  val text not null,
  created_at timestamptz not null default now()
);

create index if not exists "rushbin-data_user_id_created_at_idx"
  on public."rushbin-data" (user_id, created_at desc);

-- 2) Per-user UI settings ----------------------------------------------------
create table if not exists public."rushbin-setting" (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  "isAuthHidden" boolean not null default false,
  "isSettingHidden" boolean not null default false,
  "currentPage" smallint not null default 1,
  "pageSize" smallint not null default 10,
  "isEditing" boolean not null default false,
  created_at timestamptz not null default now(),
  -- one settings row per user; the app upserts against this
  constraint "rushbin-setting_user_id_key" unique (user_id)
);

-- 3) Row-level security: users only ever see their own rows -----------------
alter table public."rushbin-data" enable row level security;
alter table public."rushbin-setting" enable row level security;

drop policy if exists "Users manage their own clips" on public."rushbin-data";
create policy "Users manage their own clips"
  on public."rushbin-data"
  as permissive
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users manage their own settings" on public."rushbin-setting";
create policy "Users manage their own settings"
  on public."rushbin-setting"
  as permissive
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
