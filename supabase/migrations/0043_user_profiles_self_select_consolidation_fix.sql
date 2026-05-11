DO $migrate$ BEGIN
  -- Restore SELECT for the profile owner on user_profiles. Same
-- consolidation regression as talent_offers + the marketplace batch:
-- the FOR ALL `user_profiles_self_rw` policy was split into
-- self_insert/update/delete but the SELECT case was lost. The
-- remaining `user_profiles_public_select` only matches is_public=true,
-- which excludes new profiles (is_public defaults to false) — meaning
-- the owner can create their profile and immediately can't read it.

drop policy if exists user_profiles_self_select on public.user_profiles;
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy user_profiles_self_select on public.user_profiles
  for select using (user_id = (select auth.uid()));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;

DO $migrate$ BEGIN
  comment on policy user_profiles_self_select on public.user_profiles is
  'Profile owner reads their own profile regardless of is_public flag. '
  'Companion to user_profiles_public_select (is_public=true) — both '
  'needed because is_public defaults to false on new profiles.';
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
