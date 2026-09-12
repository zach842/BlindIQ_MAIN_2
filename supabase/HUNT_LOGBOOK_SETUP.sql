-- BlindIQ v1.60 consolidated Hunt Logbook setup/repair.
-- Safe to run more than once. Existing hunts are preserved.

create extension if not exists pgcrypto;

create table if not exists public.hunts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  hunted_at timestamptz not null default now(),
  state_code text not null,
  state_name text not null,
  zone text not null,
  is_simulation boolean not null default false,
  hunt_category text not null default 'waterfowl',
  season_year text,
  entries jsonb not null default '[]'::jsonb,
  bird_count integer not null default 0,
  blind_name text,
  firearm_used text,
  notes text,
  photo_path text,
  app_version text not null default '1.60',
  created_at timestamptz not null default now()
);

alter table public.hunts
  add column if not exists hunt_category text not null default 'waterfowl',
  add column if not exists blind_name text,
  add column if not exists firearm_used text,
  add column if not exists notes text,
  add column if not exists photo_path text;

alter table public.hunts
  drop constraint if exists hunts_hunt_category_check,
  drop constraint if exists hunts_blind_name_length,
  drop constraint if exists hunts_firearm_used_length,
  drop constraint if exists hunts_notes_length,
  drop constraint if exists hunts_photo_path_owner_prefix;

alter table public.hunts
  add constraint hunts_hunt_category_check check (
    hunt_category in (
      'waterfowl',
      'deer',
      'turkey',
      'dove-migratory',
      'upland-birds',
      'big-game',
      'small-game',
      'predator-furbearer',
      'other-game'
    )
  ),
  add constraint hunts_blind_name_length
    check (blind_name is null or char_length(blind_name) <= 120),
  add constraint hunts_firearm_used_length
    check (firearm_used is null or char_length(firearm_used) <= 120),
  add constraint hunts_notes_length
    check (notes is null or char_length(notes) <= 2000),
  add constraint hunts_photo_path_owner_prefix
    check (photo_path is null or position(user_id::text || '/' in photo_path) = 1);

create index if not exists hunts_user_hunted_at_idx
  on public.hunts (user_id, hunted_at desc);

create index if not exists hunts_user_category_hunted_at_idx
  on public.hunts (user_id, hunt_category, hunted_at desc);

alter table public.hunts enable row level security;

revoke all on table public.hunts from anon;
revoke all on table public.hunts from authenticated;
grant usage on schema public to authenticated;
grant select, insert on table public.hunts to authenticated;
grant all on table public.hunts to service_role;

drop policy if exists "Users can view their own hunts" on public.hunts;
create policy "Users can view their own hunts"
  on public.hunts
  for select
  to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "Users can save their own hunts" on public.hunts;
create policy "Users can save their own hunts"
  on public.hunts
  for insert
  to authenticated
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'hunt-photos',
  'hunt-photos',
  false,
  5242880,
  array['image/jpeg']::text[]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Hunters can upload their own hunt photos" on storage.objects;
create policy "Hunters can upload their own hunt photos"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'hunt-photos'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "Hunters can view their own hunt photos" on storage.objects;
create policy "Hunters can view their own hunt photos"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'hunt-photos'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "Hunters can delete their own hunt photos" on storage.objects;
create policy "Hunters can delete their own hunt photos"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'hunt-photos'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

comment on table public.hunts is
  'Account-owned BlindIQ field log. The v1.60 interface records waterfowl hunts; each hunter can read and create only their own records.';
