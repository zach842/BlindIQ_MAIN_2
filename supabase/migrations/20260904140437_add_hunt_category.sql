alter table public.hunts
  add column if not exists hunt_category text not null default 'waterfowl';

alter table public.hunts
  drop constraint if exists hunts_hunt_category_check;

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
  );

create index if not exists hunts_user_category_hunted_at_idx
  on public.hunts (user_id, hunt_category, hunted_at desc);
