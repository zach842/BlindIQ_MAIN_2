-- Apply AFTER migrations/202608270001_web_push_notifications.sql.
-- Does not enable push, publish dates, or send notifications.
begin;
alter table public.notification_preferences
 add column if not exists nationwide_alerts boolean not null default false,
 add column if not exists logging_nudges boolean not null default false,
 add column if not exists notification_timezone text not null default 'America/New_York',
 add column if not exists nudge_every_days smallint not null default 7,
 add column if not exists nudge_hour smallint not null default 18;
alter table public.notification_preferences drop constraint if exists notification_nudge_frequency;
alter table public.notification_preferences add constraint notification_nudge_frequency check(nudge_every_days between 7 and 30 and nudge_hour between 8 and 20);
alter table public.notification_season_periods
 add column if not exists time_zone text,
 add column if not exists verification_status text not null default 'unverified',
 add column if not exists verified_at timestamptz,
 add column if not exists conditions text;
alter table public.notification_season_periods drop constraint if exists notification_season_verification;
alter table public.notification_season_periods add constraint notification_season_verification check(verification_status in ('unverified','verified','withdrawn') and (verification_status <> 'verified' or (verified_at is not null and time_zone is not null and source_url like 'https://%')));
alter table public.notification_season_periods drop constraint if exists notification_season_category;
alter table public.notification_season_periods add constraint notification_season_category check(category in ('ducks','geese','other','waterfowl','deer','turkey','dove','upland','big-game','small-game','predators','other-game'));
grant select on public.notification_season_periods to authenticated;
drop policy if exists "Members read reviewed notification calendar" on public.notification_season_periods;
create policy "Members read reviewed notification calendar" on public.notification_season_periods for select to authenticated using(verification_status='verified' and data_status='current' and active and verified_at <= now() and verified_at >= now()-interval '90 days');
-- Temporary push failures remain eligible for retries, capped by processor policy.
alter table public.notification_deliveries add column if not exists attempt_count smallint not null default 0;
commit;
