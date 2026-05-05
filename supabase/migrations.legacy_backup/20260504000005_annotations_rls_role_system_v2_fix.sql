-- ============================================================================
-- Annotations — RLS update policy: align with role_system_v2
-- ============================================================================
-- The annotations_system migration (20260504000003) was authored against the
-- legacy 10-value platform_role enum and granted update access to roles
-- 'controller' and 'collaborator'. role_system_v2 (20260504_000001) replaced
-- that enum with the new 4-value model: owner, admin, manager, member.
-- The legacy values still pass into the array literal as text, but they no
-- longer match any caller, so non-creator non-assignee operators effectively
-- couldn't update annotations.
--
-- This migration replaces the policy with the new role names. owner / admin
-- keep full control; manager gains operator access (matches their role in
-- the new model — privileged ops without billing). Member-tier users still
-- need to be the creator or assignee to update.
-- ============================================================================

drop policy if exists annotations_update on annotations;
create policy annotations_update on annotations
  for update to authenticated
  using (
    is_org_member(org_id) and (
      created_by = auth.uid()
      or assigned_to = auth.uid()
      or has_org_role(org_id, array['owner','admin','manager'])
    )
  )
  with check (is_org_member(org_id));
