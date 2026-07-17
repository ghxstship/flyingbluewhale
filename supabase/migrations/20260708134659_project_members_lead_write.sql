-- D1 — wire project-role enforcement into project_members writes.
--
-- Before: roster writes (insert/update/delete) required is_org_manager_plus
-- only, so a project `lead` (a platform member) could not manage their own
-- project's membership, and the TS auth helper hasProjectRole had NO matching
-- RLS call site anywhere in the schema.
--
-- After: the write policies gate on private.has_project_role(project_id,
-- ARRAY['lead']). That SECURITY DEFINER helper already encodes the platform
-- owner/admin/manager auto-bypass (see baseline), so this change is purely
-- ADDITIVE: manager+ retain full roster authority, project leads GAIN it, and
-- everyone else (editor/contributor/viewer/vendor project roles, non-members)
-- stays denied exactly as before. Self-remove (user_id = auth.uid()) is
-- preserved on delete, mirroring the prior policy.

drop policy if exists "project_members_insert" on "public"."project_members";
create policy "project_members_insert" on "public"."project_members"
  for insert to "authenticated"
  with check ( "private"."has_project_role"("project_id", ARRAY['lead']) );

drop policy if exists "project_members_update" on "public"."project_members";
create policy "project_members_update" on "public"."project_members"
  for update to "authenticated"
  using ( "private"."has_project_role"("project_id", ARRAY['lead']) )
  with check ( "private"."has_project_role"("project_id", ARRAY['lead']) );

drop policy if exists "project_members_delete" on "public"."project_members";
create policy "project_members_delete" on "public"."project_members"
  for delete to "authenticated"
  using (
    ("user_id" = ( select "auth"."uid"() ))
    or "private"."has_project_role"("project_id", ARRAY['lead'])
  );
