alter table public.hunts
  add column if not exists blind_name text,
  add column if not exists firearm_used text,
  add column if not exists notes text;

alter table public.hunts
  drop constraint if exists hunts_blind_name_length,
  drop constraint if exists hunts_firearm_used_length,
  drop constraint if exists hunts_notes_length;

alter table public.hunts
  add constraint hunts_blind_name_length
    check (blind_name is null or char_length(blind_name) <= 120),
  add constraint hunts_firearm_used_length
    check (firearm_used is null or char_length(firearm_used) <= 120),
  add constraint hunts_notes_length
    check (notes is null or char_length(notes) <= 2000);

comment on column public.hunts.blind_name is
  'Optional hunter-entered blind location or blind name. Exact GPS coordinates are not collected by this field.';

comment on column public.hunts.firearm_used is
  'Optional hunter-entered firearm description for the saved field log.';

comment on column public.hunts.notes is
  'Optional private field-log notes entered by the hunt owner.';
