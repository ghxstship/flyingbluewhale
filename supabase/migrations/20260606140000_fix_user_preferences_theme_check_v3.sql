-- The user_preferences theme CHECK still only allowed the purged pre-v3 CHROMA
-- exploration themes (bermuda-triangle, glass, brutal, bento, kinetic, copilot,
-- cyber, soft, earthy, system) — NOT the current canonical themes. So
-- PATCH /api/v1/me/preferences with theme='ghxstship' or 'atlvs-product' (both
-- valid per the route's Zod enum) failed the DB CHECK with a 500. Drop the old
-- constraint first (so stale rows can be migrated), normalize stale rows to the
-- default, then re-add the CHECK aligned to the current two-skin canon.
alter table public.user_preferences drop constraint if exists user_preferences_theme_check;

update public.user_preferences
  set theme = 'ghxstship'
  where theme is not null and theme not in ('ghxstship', 'atlvs-product', 'system');

alter table public.user_preferences
  add constraint user_preferences_theme_check
  check (theme is null or theme = any (array['ghxstship'::text, 'atlvs-product'::text, 'system'::text]));
