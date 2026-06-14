-- MONUMENT kit (v3) density-axis alignment.
--
-- The kit names the default density tier "cozy" (the codebase previously
-- called it "comfortable"). The live schema enforced the old vocabulary via
-- a column default and a CHECK constraint, both of which must move to "cozy"
-- in lockstep with the app code (ThemeProvider / settings / zod enums).
--
-- Sequence matters: drop the default + CHECK first, backfill the rows, then
-- re-establish both with the canonical value. Visually a no-op (cozy and the
-- former comfortable both resolve to the no-`data-density` default).
-- `compact` and `spacious` are unchanged (`spacious` is retained as a
-- documented codebase extension, flagged for Claude Design).

alter table public.user_preferences
  alter column density drop default;

alter table public.user_preferences
  drop constraint if exists user_preferences_density_check;

update public.user_preferences
  set density = 'cozy'
  where density = 'comfortable';

alter table public.user_preferences
  alter column density set default 'cozy';

alter table public.user_preferences
  add constraint user_preferences_density_check
  check (density = any (array['compact'::text, 'cozy'::text, 'spacious'::text]));
