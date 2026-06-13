-- D1 (HIGH, authorization): app-vs-RLS role-band mismatch on the proposal
-- lifecycle. Found during the proposal-lifecycle validation on 2026-06-12.
--
-- The app guard `isManagerPlus()` (src/lib/auth.ts) admits role `manager`,
-- and `createProposalAction` / `setProposalStatusAction` /
-- `convertProposalToProjectAction`
-- (src/app/(platform)/console/proposals/actions.ts) run on the RLS-enforced
-- USER client. But the write policies on `proposals`, `proposal_share_links`,
-- and `projects` only grant the band ['owner','admin','controller','collaborator'].
-- `manager` is absent from BOTH the role list and the persona list that
-- `private.has_org_role(org_id, required[])` matches against
-- (`role::text = any(required) OR persona = any(required)`).
--
-- Net effect: a real manager (membership role=manager whose persona is NOT
-- one of owner/admin/controller/collaborator) passes the app check, sees the
-- Create / Convert buttons, clicks, and the DB rejects the write with
-- "new row violates row-level security policy". It is masked in the demo org
-- only because every seeded membership carries persona='owner', which matches
-- the policy band via the persona branch of has_org_role.
--
-- Intended behavior (confirmed by the app guard + capability matrix —
-- CAPABILITIES.manager includes "proposals:*" and "projects:*"): managers
-- CAN create proposals, advance their state, and convert them to projects.
-- The RLS band is the side that's wrong; this migration aligns it.
--
-- Fix: add 'manager' to the INSERT and UPDATE policy bands on the three
-- hard-blocking surfaces of the create/convert path:
--   · proposals            — INSERT (create), UPDATE (state machine, backfill project_id)
--   · projects             — INSERT (convert), UPDATE (backfill proposal_id)
--   · proposal_share_links — INSERT (publish), UPDATE (revoke/consume)
--
-- Each policy below is recreated with its ORIGINAL expression verbatim, the
-- sole change being 'manager' appended to the role array. No new access is
-- introduced beyond making the app's already-shipped manager capability
-- actually executable at the data layer.
--
-- Scope notes (deliberately NOT touched):
--   · proposals_delete / projects_delete stay ['owner','admin'] — deletes are
--     a narrower, more destructive band by design; the app has no manager-delete path.
--   · proposal_share_links_modify__delete (hard-delete) stays at the 4-role band;
--     managers revoke links via the UPDATE path (revoked_at), not hard-delete.
--   · proposal_signatures / proposal_approvals / proposal_change_orders /
--     proposal_revision_rounds were audited and need NO change — their write
--     policies gate on `private.is_org_member(org_id)` (or a public share-link
--     EXISTS), both of which already admit a manager.
--   · The downstream convert seeds (invoices, deliverables, master_catalog_items,
--     budgets) sit behind their own 4-role bands and are intentionally soft-fail
--     in convertProposalToProjectAction; a manager's convert still completes the
--     project. Granting managers a fully-seeded convert is a separate follow-up.

begin;

-- proposals --------------------------------------------------------------
drop policy if exists "proposals_insert" on "public"."proposals";
create policy "proposals_insert" on "public"."proposals"
  for insert
  with check ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text", 'controller'::"text", 'collaborator'::"text"]));

drop policy if exists "proposals_update" on "public"."proposals";
create policy "proposals_update" on "public"."proposals"
  for update
  using ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text", 'controller'::"text", 'collaborator'::"text"]))
  with check ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text", 'controller'::"text", 'collaborator'::"text"]));

-- projects ---------------------------------------------------------------
drop policy if exists "projects_insert" on "public"."projects";
create policy "projects_insert" on "public"."projects"
  for insert
  with check ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text", 'controller'::"text", 'collaborator'::"text"]));

drop policy if exists "projects_update" on "public"."projects";
create policy "projects_update" on "public"."projects"
  for update
  using ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text", 'controller'::"text", 'collaborator'::"text"]))
  with check ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text", 'controller'::"text", 'collaborator'::"text"]));

-- proposal_share_links ---------------------------------------------------
-- The INSERT policy gates on the proposal's org via private.proposal_org_id.
drop policy if exists "proposal_share_links_modify__insert" on "public"."proposal_share_links";
create policy "proposal_share_links_modify__insert" on "public"."proposal_share_links"
  for insert
  with check ("private"."has_org_role"("private"."proposal_org_id"("proposal_id"), ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text", 'controller'::"text", 'collaborator'::"text"]));

-- The UPDATE policy preserves the recipient self-service branch (an
-- unrevoked, unexpired link can be consumed by its holder) and only adds
-- 'manager' to the operator (has_org_role) branch.
drop policy if exists "proposal_share_links_update_consolidated" on "public"."proposal_share_links";
create policy "proposal_share_links_update_consolidated" on "public"."proposal_share_links"
  for update
  using (("private"."has_org_role"("private"."proposal_org_id"("proposal_id"), ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text", 'controller'::"text", 'collaborator'::"text"]) OR (("revoked_at" IS NULL) AND (("expires_at" IS NULL) OR ("expires_at" > "now"())))))
  with check (("private"."has_org_role"("private"."proposal_org_id"("proposal_id"), ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text", 'controller'::"text", 'collaborator'::"text"]) OR (("revoked_at" IS NULL) AND (("expires_at" IS NULL) OR ("expires_at" > "now"())))));

commit;
