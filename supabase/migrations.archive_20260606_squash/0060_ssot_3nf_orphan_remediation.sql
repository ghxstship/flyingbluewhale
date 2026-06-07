------------------------------------------------------------------------------
-- 0060_ssot_3nf_orphan_remediation
--
-- Follow-on to the Round 23 / 20260524000000_ssot_canonicality_comments
-- audit. Two findings the previous sweep did not address:
--
--   1. guide_comments stores both `author_user_id` AND denormalized
--      `author_name` + `author_email` (for anonymous guests who post via
--      a share link). The schema never enforced that one side or the
--      other had to be populated — an insert with all three columns NULL
--      would render as a comment from "—" with no contact path back.
--      Add a CHECK that forces every row to carry either a real user FK
--      or a guest identity (name + email pair).
--
--   2. financial_periods + period_state_transitions (0016) sit alongside
--      accounting_periods (0019) which is the table every app surface
--      actually queries (src/lib/accounting-periods.ts,
--      /console/finance/periods/*). financial_periods is the unused
--      side. Apply the codebase's standard deprecation pattern: mark
--      via COMMENT ON TABLE now, leave the drop for a follow-up
--      migration once row counts are confirmed in-prod.
--
-- Pairs with the dataset-coverage UI work in the same commit, which
-- exposes four previously-orphaned child tables (deliverable_comments,
-- deliverable_history, settlement_lines, safety_briefing_attendees,
-- rfq_response_lines) into their parent surfaces.
------------------------------------------------------------------------------

-- 1. guide_comments author identity XOR ----------------------------------------
ALTER TABLE "public"."guide_comments"
  DROP CONSTRAINT IF EXISTS "guide_comments_author_identity_check";

ALTER TABLE "public"."guide_comments"
  ADD CONSTRAINT "guide_comments_author_identity_check"
  CHECK (
    "author_user_id" IS NOT NULL
    OR ("author_name" IS NOT NULL AND "author_email" IS NOT NULL)
  ) NOT VALID;

-- Validate against existing data — fails loud if any historical comment
-- lacks both a user FK and a guest identity (data we couldn't render).
ALTER TABLE "public"."guide_comments"
  VALIDATE CONSTRAINT "guide_comments_author_identity_check";

COMMENT ON CONSTRAINT "guide_comments_author_identity_check" ON "public"."guide_comments" IS
  'Every comment must carry either author_user_id (logged-in commenter) or both author_name and author_email (anonymous guest via share link). The denormalized name/email columns exist only because anonymous guests have no user row to join to; this CHECK enforces that the denorm is populated whenever the FK side is empty.';

-- 2. Flag financial_periods + period_state_transitions as deprecated ----------
-- Matches the prior canonicality-comment sweep (forms, knowledge, tasks).
-- accounting_periods is the canonical side; drop these in a follow-up
-- once a row-count audit confirms they're safe to retire.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'financial_periods'
  ) THEN
    EXECUTE 'COMMENT ON TABLE public.financial_periods IS '
            '''DEPRECATED — superseded by accounting_periods (0019). 0 app refs '
            '(every period query goes through src/lib/accounting-periods.ts → '
            'accounting_periods). Slated for drop in a follow-up migration '
            'once row count is confirmed empty in prod. Do not add new code '
            'against this table.''';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'period_state_transitions'
  ) THEN
    EXECUTE 'COMMENT ON TABLE public.period_state_transitions IS '
            '''DEPRECATED — child of financial_periods. 0 app refs. Slated '
            'for drop with its parent in a follow-up migration.''';
  END IF;
END
$$;

-- 3. asset_movements sanity check (no-op if schema is canonical) ---------------
-- The 0019 file declares a parallel asset_movements with `asset_id` (no FK)
-- shadowed by 0016's canonical version. CREATE TABLE IF NOT EXISTS is
-- idempotent so the broken columns never get created — but a future
-- developer reading 0019 might "fix" it by changing IF NOT EXISTS to
-- CREATE OR REPLACE and quietly clobber the canonical schema. Assert the
-- canonical column set survives so any divergence raises loud.
DO $$
DECLARE
  has_equipment_id boolean;
  has_org_id       boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'asset_movements'
      AND column_name = 'equipment_id'
  ) INTO has_equipment_id;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'asset_movements'
      AND column_name = 'org_id'
  ) INTO has_org_id;

  IF NOT has_equipment_id OR NOT has_org_id THEN
    RAISE EXCEPTION
      'asset_movements canonical columns missing — expected the 0016 (equipment_id + org_id) schema. Got equipment_id=%, org_id=%. Investigate before adding new movements UI; do NOT silently revive the 0019 (asset_id) variant.',
      has_equipment_id, has_org_id;
  END IF;
END
$$;
