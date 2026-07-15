-- D1-class (authorization) fix: public.approval_instances had RLS ENABLED with
-- ONLY a SELECT policy (uas_inst_org, baseline §RLS) — no INSERT / UPDATE / ALL
-- policy in any migration. The table-level GRANT to `authenticated` is therefore
-- inert for writes: every insert is denied for every persona.
--
-- Impact: the v7.8 "Route To Approvals" record action is non-functional from the
-- UI everywhere. `routeToApprovals` (src/lib/approvals/route.ts) inserts an
-- approval_instances row using the RLS-enforced anon-cookie client, so the insert
-- is rejected ("new row violates row-level security policy"), the action returns
-- an error toast, and the flow never redirects to /studio/governance/approvals.
-- Wired on PO detail (routePoToApprovalsAction) and PO change-order detail
-- (routePoChangeOrderToApprovalsAction), both app-gated on isManagerPlus().
--
-- The fix — mirror the app-layer gate at the DB
-- ---------------------------------------------
-- 1. INSERT policy on the canonical OPERATOR-WRITE band
--    ['owner','admin','manager','controller','collaborator'] — the same band the
--    2026-06-25 rls_manager_grant_sweep standardised for procurement writes
--    (requisitions/purchase_orders/leads/clients/...). isManagerPlus() (role
--    owner|admin|manager) is a strict subset of this band, so any operator the
--    app already authorized passes the DB check. `manager` is present so a real
--    role=manager operator (persona NOT in owner/admin/controller/collaborator)
--    is not rejected — the exact inversion the sweep fixed elsewhere; guarded
--    against regression by src/lib/proposal-rls-manager-canon.test.ts.
--    The sweep SKIPPED approval_instances because it had NO write policy to
--    recreate (it rewrites existing collaborator/controller-but-not-manager
--    bands); this migration closes that gap.
--
-- 2. DELETE policy scoped to org admins (is_org_admin = role owner|admin). Org
--    admins legitimately manage/cancel stray approval instances, and the e2e
--    fixture teardown (scripts/e2e-clean-fixtures.mjs, owner client) needs it to
--    purge route-to-approvals residue by metadata title — without a DELETE path
--    the E2E-tagged instances would accumulate forever.
--
-- 3. SELECT on approval_policies + approval_steps for org members. Both were
--    FOR ALL USING is_org_admin (owner|admin only), so routeToApprovals — which
--    runs as the acting operator and must READ the active policy (and its first
--    step) before opening an instance — saw NO policy for a manager and bailed
--    with "No approval policy covers <table>" BEFORE ever reaching the insert.
--    Reads widen to is_org_member (the same band that can SELECT the instances);
--    the existing FOR ALL policies still gate WRITES to admins (permissive
--    policies OR, so adding a member SELECT policy only widens reads).
--
-- NOT changed here: the approval_instances SELECT policy (is_org_member) is
-- correct and kept. UPDATE on approval_instances is intentionally NOT granted —
-- recordDecision's best-effort instance-state advance is a separate downstream
-- flow outside this fix's scope.

begin;

drop policy if exists approval_instances_insert on public.approval_instances;
create policy approval_instances_insert on public.approval_instances
  as permissive
  for insert
  to authenticated
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists approval_instances_admin_delete on public.approval_instances;
create policy approval_instances_admin_delete on public.approval_instances
  as permissive
  for delete
  to authenticated
  using (private.is_org_admin(org_id));

-- Members can READ the policy catalog (routing needs to match a policy + seed
-- the first step). Writes stay admin-only via the existing uas_pol_org / uas_step_org
-- FOR ALL policies.
drop policy if exists approval_policies_read on public.approval_policies;
create policy approval_policies_read on public.approval_policies
  as permissive
  for select
  to authenticated
  using (private.is_org_member(org_id));

drop policy if exists approval_steps_read on public.approval_steps;
create policy approval_steps_read on public.approval_steps
  as permissive
  for select
  to authenticated
  using (exists (
    select 1 from public.approval_policies p
    where p.id = approval_steps.policy_id and private.is_org_member(p.org_id)
  ));

commit;
