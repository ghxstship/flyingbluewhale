-- D1 follow-up (HIGH, authorization): manager RLS grant on the proposal
-- CONVERT-SEED downstream tables. The sibling fix
-- `20260612180000_proposal_rls_manager_grant.sql` aligned the hard-blocking
-- surfaces of the create/convert path (proposals, projects,
-- proposal_share_links) so a real manager (membership role='manager',
-- persona NOT in owner/admin/controller/collaborator) can create a proposal,
-- advance its state, and INSERT the project on convert. It deliberately left
-- the downstream convert seeds as a separate follow-up — this is it.
--
-- The problem: `convertProposalToProjectAction`
-- (src/app/(platform)/console/proposals/actions.ts) is guarded by
-- `isManagerPlus()` (admits role='manager'), and after D1 a manager CAN
-- create the project + update the proposal. But the same action then seeds:
--   · invoices            — deposit + balance rows (60/40 convention)
--   · deliverables        — via seedFromBlocks() (src/lib/proposals/seed.ts)
--   · master_catalog_items— via seedFromBlocks() (upsert)
--   · budgets             — via seedFromBlocks()
-- The invoice seed and seedFromBlocks SOFT-FAIL (log a warning, never abort),
-- so a real manager gets a project created but SILENTLY no deposit/balance
-- invoices and no seeded deliverables/catalog/budgets — a half-converted
-- project. Masked in the demo org only because every seeded membership
-- carries persona='owner', which satisfies the band via the persona branch
-- of `private.has_org_role` (`role::text = any(required) OR persona = any(required)`).
--
-- Intended behavior (confirmed by the app guard + capability matrix —
-- CAPABILITIES.manager includes "proposals:*" / "projects:*", and convert is
-- one indivisible operator action): a manager's convert is FULLY seeded, not
-- half. The RLS band is the side that's wrong; this migration aligns it.
--
-- Audit of the four downstream tables' *_insert / *_update bands in
-- 20260606230000_baseline.sql:
--   · invoices_insert / invoices_update             → 4-role band (BLOCKS manager) → grant
--   · budgets_insert / budgets_update               → 4-role band (BLOCKS manager) → grant
--   · deliverables_update_consolidated              → 4-role band in operator branch → grant
--   · deliverables_insert                           → is_org_member (already admits manager) — NO CHANGE
--   · master_catalog_items_org_rw                   → is_org_member (already admits manager) — NO CHANGE
--
-- Each policy below is recreated with its ORIGINAL expression verbatim, the
-- sole change being 'manager' appended (after 'admin', matching the D1
-- ordering) to the `private.has_org_role(...)` role array. No access is
-- introduced beyond making the app's already-shipped manager convert
-- capability fully executable at the data layer. Both insert AND update are
-- granted on invoices/budgets so a manager who seeds a row can also amend it
-- (the finance surfaces are manager-gated) — same insert+update coherence D1
-- applied to proposals/projects.
--
-- Scope notes (deliberately NOT touched):
--   · invoices_delete / budgets_delete stay ['owner','admin'] — deletes are a
--     narrower, more destructive band by design; no manager-delete path exists.
--   · deliverables_insert + master_catalog_items_org_rw gate on
--     private.is_org_member, which already admits a manager — recreating them
--     would be a no-op.
--   · The deliverables_update self-service branch (a row's submitter may edit
--     it while draft/revision_requested) is preserved verbatim; only the
--     operator (has_org_role) branch gains 'manager'.

begin;

-- invoices ---------------------------------------------------------------
drop policy if exists "invoices_insert" on "public"."invoices";
create policy "invoices_insert" on "public"."invoices"
  for insert
  with check ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text", 'controller'::"text", 'collaborator'::"text"]));

drop policy if exists "invoices_update" on "public"."invoices";
create policy "invoices_update" on "public"."invoices"
  for update
  using ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text", 'controller'::"text", 'collaborator'::"text"]))
  with check ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text", 'controller'::"text", 'collaborator'::"text"]));

-- budgets ----------------------------------------------------------------
drop policy if exists "budgets_insert" on "public"."budgets";
create policy "budgets_insert" on "public"."budgets"
  for insert
  with check ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text", 'controller'::"text", 'collaborator'::"text"]));

drop policy if exists "budgets_update" on "public"."budgets";
create policy "budgets_update" on "public"."budgets"
  for update
  using ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text", 'controller'::"text", 'collaborator'::"text"]))
  with check ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text", 'controller'::"text", 'collaborator'::"text"]));

-- deliverables -----------------------------------------------------------
-- INSERT (deliverables_insert) already gates on private.is_org_member, which
-- admits a manager — not recreated here. Only the UPDATE operator branch is
-- widened; the submitter self-service branch is preserved verbatim.
drop policy if exists "deliverables_update_consolidated" on "public"."deliverables";
create policy "deliverables_update_consolidated" on "public"."deliverables"
  for update
  using (("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text", 'controller'::"text", 'collaborator'::"text"]) OR (("submitted_by" = ( SELECT "auth"."uid"() AS "uid")) AND ("fulfillment_state" = ANY (ARRAY['draft'::"public"."fulfillment_state", 'revision_requested'::"public"."fulfillment_state"])))))
  with check (("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text", 'controller'::"text", 'collaborator'::"text"]) OR ("submitted_by" = ( SELECT "auth"."uid"() AS "uid"))));

commit;
