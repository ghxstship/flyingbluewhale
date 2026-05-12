-- ============================================================================
-- Org members can SELECT redemption audit rows for their projects.
-- ============================================================================
-- Original RLS on guide_access_redemptions was deny-all (service-role only).
-- That assumed SUPABASE_SERVICE_ROLE_KEY would always be set in env so the
-- console could read the log. In environments without the service-role key
-- (dev, preview deploys, restricted contexts) the audit log was invisible.
--
-- We open it up via an org-membership join through guide_access_codes
-- (which is itself org-scoped via RLS), so the console can read the log
-- via the authenticated client. Writes remain service-role-only by virtue
-- of having no INSERT/UPDATE/DELETE policy.
-- ============================================================================

drop policy if exists "guide_access_redemptions_org_select" on guide_access_redemptions;
create policy "guide_access_redemptions_org_select"
  on guide_access_redemptions for select
  using (
    exists (
      select 1 from guide_access_codes c
      where c.id = guide_access_redemptions.code_id
        and private.is_org_member(c.org_id)
    )
  );
