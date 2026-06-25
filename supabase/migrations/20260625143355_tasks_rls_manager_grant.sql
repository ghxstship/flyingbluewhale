-- D1-class (authorization): app-vs-RLS role-band mismatch on `tasks`.
-- Found during the ATLVS console per-persona e2e suite on 2026-06-25
-- (e2e/atlvs-console-personas.spec.ts "Task: create" failed for the
-- role=manager fixtures test+manager@ / test+controller@).
--
-- createTaskAction (src/app/(platform)/studio/tasks/actions.ts) gates only
-- on `requireSession` (no role gate at all — any operator may create a task)
-- and runs on the RLS-enforced USER client. But the write policies on
-- `tasks` grant the band ['owner','admin','controller','collaborator'].
-- `manager` is absent from BOTH the role list and the persona list that
-- `private.has_org_role(org_id, required[])` matches against
-- (`role::text = any(required) OR persona = any(required)`).
--
-- Net effect: a real manager (membership role=manager, persona NOT one of
-- owner/admin/controller/collaborator) passes the (empty) app check, fills
-- the form, submits, and the DB rejects the INSERT with "new row violates
-- row-level security policy". The action returns the error and the form
-- stays on /studio/tasks/new. Masked in the demo org because seeded
-- memberships carry persona='owner', which matches via the persona branch;
-- the band is also inverted — it admits `collaborator` (a LOWER band than
-- manager) while rejecting `manager`.
--
-- This is the same defect class fixed for the proposal lifecycle in
-- 20260612180000_proposal_rls_manager_grant.sql and the convert seeds in
-- 20260613182535_convert_seed_rls_manager_grant.sql.
--
-- Fix: add 'manager' to the INSERT and UPDATE policy bands on `tasks`,
-- recreating each with its original expression verbatim, the sole change
-- being 'manager' appended to the role array.
--
-- Scope notes (deliberately NOT touched):
--   · tasks_delete stays ['owner','admin'] — deletes are a narrower band by
--     design; there is no manager hard-delete path for tasks.
--   · tasks_select gates on private.is_org_member, which already admits a
--     manager — no change needed.

begin;

drop policy if exists "tasks_insert" on "public"."tasks";
create policy "tasks_insert" on "public"."tasks"
  for insert
  with check ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text", 'controller'::"text", 'collaborator'::"text"]));

drop policy if exists "tasks_update" on "public"."tasks";
create policy "tasks_update" on "public"."tasks"
  for update
  using ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text", 'controller'::"text", 'collaborator'::"text"]))
  with check ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text", 'controller'::"text", 'collaborator'::"text"]));

commit;
