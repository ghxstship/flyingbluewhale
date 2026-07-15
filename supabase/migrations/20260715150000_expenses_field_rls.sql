-- expenses RLS — let the field file its own receipt.
--
-- The same defect as tasks (migration 20260715140000): the policies were
-- written for the console's authoring model — manager band writes,
-- everyone reads — and never reconciled with who actually incurs an
-- expense. `expenses_insert` excludes the `member` band outright, so a
-- crew member could not file one at all.
--
-- That is the flagship gap in the COMPVSS parity audit (G1, 20/20): the
-- device with the camera is the one that cannot record a receipt, while
-- the laptop that can has no camera. `expenses.receipt_path` has existed
-- the whole time and NO surface in the repo populates it — not even the
-- console's own create action.
--
-- Narrow by construction. A member may:
--   • file an expense ONLY as themselves (submitter_id = self);
--   • update it ONLY while it is still theirs AND still pending — once a
--     manager has approved or rejected it, it is settled and editing it
--     would let a submitter alter an approved amount after the fact.
-- Approval stays with the manager band, untouched.

-- ── INSERT ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "expenses_insert" ON "public"."expenses";

CREATE POLICY "expenses_insert" ON "public"."expenses"
  FOR INSERT
  WITH CHECK (
    "private"."has_org_role"("org_id", ARRAY['owner', 'admin', 'manager', 'controller', 'collaborator'])
    OR (
      -- Field self-filing: my org, my name.
      "private"."is_org_member"("org_id")
      AND "submitter_id" = ( SELECT "auth"."uid"() )
    )
  );

-- ── UPDATE ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "expenses_update" ON "public"."expenses";

CREATE POLICY "expenses_update" ON "public"."expenses"
  FOR UPDATE
  USING (
    "private"."has_org_role"("org_id", ARRAY['owner', 'admin', 'manager', 'controller', 'collaborator'])
    OR (
      -- Mine, and not yet decided.
      "private"."is_org_member"("org_id")
      AND "submitter_id" = ( SELECT "auth"."uid"() )
      AND "expense_state" = 'pending'::"public"."expense_status"
    )
  )
  WITH CHECK (
    "private"."has_org_role"("org_id", ARRAY['owner', 'admin', 'manager', 'controller', 'collaborator'])
    OR (
      -- Still mine, still pending afterwards: a submitter cannot approve
      -- their own expense by flipping the state, nor reassign it.
      "private"."is_org_member"("org_id")
      AND "submitter_id" = ( SELECT "auth"."uid"() )
      AND "expense_state" = 'pending'::"public"."expense_status"
    )
  );
