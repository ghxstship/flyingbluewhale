-- The mirror-image defect: a FOR ALL admin policy silently gates SELECT too.
-- (ADR-0008 Amendment 7, part 2 — handoff from the concurrent approvals-RLS session.)
--
-- ## The class
--
-- Every other finding in this ADR is "the app filters, the DB doesn't" — a leak.
-- This is the same root cause with the opposite sign: **the DB refuses a read
-- the app fully expects**, and nothing errors. A policy written
-- `FOR ALL USING private.is_org_admin(org_id)` (no cmd ⇒ ALL) gates SELECT as
-- well as writes. `private.is_org_admin` is `role in ('owner','admin')` — no
-- persona branch and, decisively, **no `manager`**. So the manager band reads
-- zero rows, the list renders its own empty state, and the surface says "No
-- Pipelines" rather than failing. Indistinguishable from an org that has none.
--
-- The 2026-06-25 `rls_manager_grant_sweep` only rewrote INSERT/UPDATE/ALL
-- *bands*, so it never looked at these; and it is masked for owner/admin
-- personas, which is why it survived. Confirmed live rather than inferred:
--
--   pipeline_definitions / pipeline_stages   owner 5/30 · admin 5/30 · manager 0/0 · crew 0/0
--
-- Intent checked before touching anything, because "the DB is wrong" is only
-- half the possible answer — the other half is "the app is missing a gate":
--
--   · /studio/pipeline gates on requireSession() only (any operator)
--   · nav.ts lists it as Sales → "Deals", with no role gate, so a manager sees
--     the link
--   · its empty state reads "No Pipelines"
--
-- Nav and app gate agree the surface is for any operator. The DB is the outlier,
-- so the DB is what changes. Same for asset_depreciation_schedule, read at
-- studio/assets/[id]/page.tsx:89 on a requireSession-gated page (it uses
-- isManagerPlus only to decide whether to render the *write* affordance —
-- further evidence managers are meant to see the panel).
--
-- ## Why the band is staff, and NOT is_org_member
--
-- The handoff proposed `FOR SELECT USING is_org_member(org_id)`, mirroring the
-- approval_policies fix in 20260714120000. Deliberately not doing that here.
-- Portal personas are ordinary `memberships` rows, so `is_org_member` includes
-- `client`, `contractor`, `guest`, `viewer` and `community` — and the (platform)
-- shell has no role gate of its own. Widening to is_org_member would hand
-- external contractors and guests the org's CRM deal pipeline and its asset
-- depreciation schedules. That is the exposure this ADR spent seven amendments
-- closing, re-introduced as a fix.
--
-- The proven defect is narrow: the **manager band is locked out of an operator
-- console surface**. So the fix is narrow — the staff band this amendment
-- already established for time_entries SELECT (owner|admin|manager roles +
-- collaborator persona). Nobody who was not demonstrably locked out gains a row.
--
-- Permissive policies OR together, so adding a FOR SELECT policy widens reads
-- while the existing FOR ALL keeps every WRITE admin-only. The FOR ALL policies
-- are left exactly as they are: this is additive, and reversible by dropping
-- three policies.

-- Deals board: the pipeline itself…
create policy pipeline_definitions_staff_read on public.pipeline_definitions
  for select using (private.has_org_role(org_id, array['owner', 'admin', 'manager', 'collaborator']));

-- …and its stages, scoped through the parent exactly as urm_ps_org does (the
-- table has no org_id of its own).
create policy pipeline_stages_staff_read on public.pipeline_stages
  for select using (
    exists (
      select 1
      from public.pipeline_definitions p
      where p.id = pipeline_stages.pipeline_id
        and private.has_org_role(p.org_id, array['owner', 'admin', 'manager', 'collaborator'])
    )
  );

-- Depreciation schedule, scoped through assets as ual_dep_org does.
create policy asset_depreciation_schedule_staff_read on public.asset_depreciation_schedule
  for select using (
    exists (
      select 1
      from public.assets a
      where a.id = asset_depreciation_schedule.asset_id
        and private.has_org_role(a.org_id, array['owner', 'admin', 'manager', 'collaborator'])
    )
  );
