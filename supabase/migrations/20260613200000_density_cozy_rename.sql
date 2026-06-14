-- MONUMENT kit (v3) density-axis alignment.
--
-- The kit names the default density tier "cozy" (the codebase previously
-- called it "comfortable"). `user_preferences.density` is a free-text column,
-- so existing rows may hold the retired value. Backfill them to the canonical
-- "cozy" — visually identical (both resolve to the no-`data-density` default),
-- so this is a label normalization, not a behavior change.
--
-- `compact` and `spacious` are unchanged (`spacious` is retained as a
-- documented codebase extension flagged for Claude Design).
update public.user_preferences
set density = 'cozy'
where density = 'comfortable';
