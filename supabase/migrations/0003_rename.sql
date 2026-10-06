-- Rebrand: rushbin-* tables -> clipbin-*.
-- Run in the Supabase SQL editor AFTER 0002_images.sql. Idempotent.

alter table if exists public."rushbin-data" rename to "clipbin-data";
alter table if exists public."rushbin-setting" rename to "clipbin-setting";

alter index if exists public."rushbin-data_user_id_created_at_idx"
  rename to "clipbin-data_user_id_created_at_idx";
