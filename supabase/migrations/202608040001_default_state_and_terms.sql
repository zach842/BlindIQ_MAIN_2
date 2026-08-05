alter table public.profiles
  add column if not exists default_state text not null default 'MD',
  add column if not exists terms_version text,
  add column if not exists terms_accepted_at timestamptz;

alter table public.profiles
  drop constraint if exists profiles_default_state_format;

alter table public.profiles
  add constraint profiles_default_state_format
  check (default_state ~ '^[A-Z]{2}$');

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, username, default_state, terms_version, terms_accepted_at)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'username'), ''), split_part(new.email, '@', 1)),
    coalesce(nullif(new.raw_user_meta_data ->> 'default_state', ''), 'MD'),
    nullif(new.raw_user_meta_data ->> 'terms_version', ''),
    nullif(new.raw_user_meta_data ->> 'terms_accepted_at', '')::timestamptz
  );
  insert into public.subscriptions (user_id, status)
  values (new.id, 'inactive')
  on conflict (user_id) do nothing;
  return new;
end;
$$;
