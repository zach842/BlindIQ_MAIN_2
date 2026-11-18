-- Nullable preserves existing state preferences and prompts once for a category.
-- Existing owner-only profiles SELECT/UPDATE policies remain unchanged.
alter table public.profiles add column if not exists default_hunt_category text
  check (default_hunt_category in ('waterfowl','deer','turkey','big-game','small-game','dove-migratory','upland-birds','predator-furbearer','other-game'));
