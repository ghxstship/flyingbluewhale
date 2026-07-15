-- requisitions + mileage_logs RLS — the field can raise its own intake.
--
-- Third and fourth instance of one pattern (after tasks 20260715140000 and
-- expenses 20260715150000): the policy lists the console's authoring bands
-- and omits the people who actually do the work.
--
-- WHY THE OMISSION IS EASY TO MISS. `private.has_org_role` matches
--   role::text = any(required) OR persona = any(required)
-- so these lists mix two vocabularies. 'owner'/'admin'/'manager' are ROLES;
-- 'crew'/'collaborator' are PERSONAS; 'controller' is neither and matches
-- nothing at all. `daily_logs_insert` gets this right — it includes 'crew',
-- which is why a field crew member can file a site diary. `requisitions`
-- and `mileage_logs` don't, so the same person cannot raise a purchase
-- requisition or log a drive.
--
-- The consequences are exactly the two surfaces the parity audit flags:
--   G19  the canonical "need it now from site" intake — the console's own
--        One Front Door lists Purchase Requisition as a Request.
--   G21  mileage. The GPS is in the crew member's pocket; the approval is
--        not, and neither was the ability to record the trip.
--
-- Adds the `crew` persona to both, matching daily_logs, and additionally
-- binds the row to the caller so a member can only raise intake in their
-- own name. Approval, costing and routing stay with the manager band.

-- ── requisitions ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "requisitions_insert" ON "public"."requisitions";

CREATE POLICY "requisitions_insert" ON "public"."requisitions"
  FOR INSERT
  WITH CHECK (
    "private"."has_org_role"("org_id", ARRAY['owner', 'admin', 'manager', 'controller', 'collaborator'])
    OR (
      -- Field intake: my org, my name.
      "private"."is_org_member"("org_id")
      AND "requester_id" = ( SELECT "auth"."uid"() )
    )
  );

-- ── mileage_logs ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "mileage_logs_insert" ON "public"."mileage_logs";

CREATE POLICY "mileage_logs_insert" ON "public"."mileage_logs"
  FOR INSERT
  WITH CHECK (
    "private"."has_org_role"("org_id", ARRAY['owner', 'admin', 'manager', 'controller', 'collaborator'])
    OR (
      "private"."is_org_member"("org_id")
      AND "user_id" = ( SELECT "auth"."uid"() )
    )
  );
