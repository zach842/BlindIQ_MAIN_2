alter table public.hunts
  add column if not exists photo_path text;

alter table public.hunts
  drop constraint if exists hunts_photo_path_owner_prefix;

alter table public.hunts
  add constraint hunts_photo_path_owner_prefix
  check (photo_path is null or position(user_id::text || '/' in photo_path) = 1);

revoke all on table public.hunts from anon;
grant select, insert on table public.hunts to authenticated;
grant all on table public.hunts to service_role;

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
    and owner_id = (select auth.uid()::text)
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "Hunters can delete their own hunt photos" on storage.objects;
create policy "Hunters can delete their own hunt photos"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'hunt-photos'
    and owner_id = (select auth.uid()::text)
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

comment on column public.hunts.photo_path is
  'Private Supabase Storage object path for an optional user-owned harvest photo.';
