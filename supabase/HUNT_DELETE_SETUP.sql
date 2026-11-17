-- BlindIQ v1.65.1: run once in the existing project's Supabase SQL editor.
-- Requires the existing public.hunts table / Logbook Setup. Does not delete data.
begin;
alter table public.hunts enable row level security;
grant delete on table public.hunts to authenticated;
drop policy if exists "Users can delete their own hunts" on public.hunts;
create policy "Users can delete their own hunts"
  on public.hunts for delete to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);
commit;
