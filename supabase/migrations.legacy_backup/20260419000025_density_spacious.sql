-- Allow `spacious` density per IA redesign §5.4. Three-mode range
-- (compact | comfortable | spacious) replaces the legacy two-mode check
-- that clamped to (compact | comfortable).
alter table public.user_preferences
  drop constraint if exists user_preferences_density_check;

alter table public.user_preferences
  add constraint user_preferences_density_check
  check (density in ('compact', 'comfortable', 'spacious'));
