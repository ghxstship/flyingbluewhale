-- Two data-point lifecycle closures found by the dead-write / dropped-input
-- audit (docs/compvss/SURFACE_AUDIT_2026-07-21.md):
--
-- 1. incidents.reporter_id goes NULLABLE. The kit incident form has always
--    offered a "Submit Anonymously" switch — and the action parsed it, dropped
--    it, and stamped reporter_id with the session user anyway. The UI promised
--    anonymity the database made impossible (NOT NULL). The INSERT policy is
--    `is_org_member(org_id)` (it never pinned reporter_id), and no RLS/trigger
--    depends on reporter_id being present, so the column can honestly hold
--    NULL for an anonymous filing.
ALTER TABLE "public"."incidents" ALTER COLUMN "reporter_id" DROP NOT NULL;

COMMENT ON COLUMN "public"."incidents"."reporter_id" IS
  'Filer, when the report is not anonymous. NULL = filed via the "Submit Anonymously" switch — the identity is deliberately not recorded anywhere on the row.';

-- 2. expenses.billable. The kit expense form carries a "Billable To Client"
--    switch; the action parsed it and dropped it — no column existed. Finance
--    loses the one flag that decides whether the spend is passed through.
ALTER TABLE "public"."expenses"
  ADD COLUMN IF NOT EXISTS "billable" boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN "public"."expenses"."billable" IS
  'The filer''s "Billable To Client" declaration from the field expense form. A facet flag (not a lifecycle) — finance can recode on approval.';
