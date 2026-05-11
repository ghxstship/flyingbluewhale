-- LDP naming-discipline remediation for 0002 (marketplace_canon) and
-- 0003 (booking_canon) tables.
--
-- CLAUDE.md §LDP: new schema-bearing columns MUST be named `*_phase`
-- (sequential macro arc) or `*_state` (cyclical operational). The word
-- `status` is banned in new tables; every occurrence is a defect.
--
-- The seven columns below were introduced in 0002/0003 after the ban took
-- effect. This migration renames them atomically; PostgreSQL 14+ propagates
-- RENAME COLUMN into dependent view expressions automatically.
--
-- Naming rationale per column:
--   open_calls.status          → open_call_phase    (sequential: draft→published→closed→awarded)
--   open_call_submissions.status → submission_state (cyclical review: submitted↔shortlisted↔rejected)
--   talent_offers.status       → talent_offer_phase (sequential offer arc: draft→sent→accepted→contracted)
--   job_postings.status        → job_posting_phase  (sequential: draft→published→closed→archived)
--   job_applications.status    → job_application_state (review state machine: new↔reviewed↔booked…)
--   settlements.status         → settlement_phase   (sequential: draft→reconciling→final)
--   tours.status               → tour_phase         (sequential arc: planning→routing→confirmed→complete)
--
-- The tour_p_and_l view SELECT-s tours.status; after RENAME COLUMN the
-- expression auto-updates in PG14+ but the output column alias stays
-- "status" in the materialized view schema. We explicitly DROP + recreate
-- to guarantee the output column is named tour_phase and matches
-- application code. security_invoker is re-applied inline.
--
-- All operations are idempotent: IF NOT EXISTS / DO $$ … EXCEPTION guards
-- let this migration be re-run safely on a partially-migrated branch.

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_min_messages = warning;
SET search_path = public, private, extensions;

-- ─── 1. open_calls.status → open_call_phase ─────────────────────────────

DO $$ BEGIN
  ALTER TABLE "public"."open_calls" RENAME COLUMN "status" TO "open_call_phase";
EXCEPTION WHEN undefined_column THEN NULL;
         WHEN duplicate_column  THEN NULL;
END $$;

-- ─── 2. open_call_submissions.status → submission_state ─────────────────

DO $$ BEGIN
  ALTER TABLE "public"."open_call_submissions" RENAME COLUMN "status" TO "submission_state";
EXCEPTION WHEN undefined_column THEN NULL;
         WHEN duplicate_column  THEN NULL;
END $$;

-- ─── 3. talent_offers.status → talent_offer_phase ───────────────────────

DO $$ BEGIN
  ALTER TABLE "public"."talent_offers" RENAME COLUMN "status" TO "talent_offer_phase";
EXCEPTION WHEN undefined_column THEN NULL;
         WHEN duplicate_column  THEN NULL;
END $$;

-- ─── 4. job_postings.status → job_posting_phase ─────────────────────────

DO $$ BEGIN
  ALTER TABLE "public"."job_postings" RENAME COLUMN "status" TO "job_posting_phase";
EXCEPTION WHEN undefined_column THEN NULL;
         WHEN duplicate_column  THEN NULL;
END $$;

-- ─── 5. job_applications.status → job_application_state ─────────────────

DO $$ BEGIN
  ALTER TABLE "public"."job_applications" RENAME COLUMN "status" TO "job_application_state";
EXCEPTION WHEN undefined_column THEN NULL;
         WHEN duplicate_column  THEN NULL;
END $$;

-- ─── 6. settlements.status → settlement_phase ───────────────────────────

DO $$ BEGIN
  ALTER TABLE "public"."settlements" RENAME COLUMN "status" TO "settlement_phase";
EXCEPTION WHEN undefined_column THEN NULL;
         WHEN duplicate_column  THEN NULL;
END $$;

-- ─── 7. tours.status → tour_phase ───────────────────────────────────────

DO $$ BEGIN
  ALTER TABLE "public"."tours" RENAME COLUMN "status" TO "tour_phase";
EXCEPTION WHEN undefined_column THEN NULL;
         WHEN duplicate_column  THEN NULL;
END $$;

-- ─── 8. Recreate tour_p_and_l with tour_phase output column ─────────────
--
-- DROP + CREATE is required because PG14 auto-updates the expression but
-- keeps the original output column NAME from the view definition. Dropping
-- here also drops the security_invoker attribute added in
-- 20260509100003_security_invoker_on_public_views.sql; we re-apply it
-- inline after recreation.

DROP VIEW IF EXISTS "public"."tour_p_and_l";

CREATE VIEW "public"."tour_p_and_l"
  WITH (security_invoker = on)
AS
SELECT
  t.id AS tour_id,
  t.org_id,
  t.name,
  t.tour_phase,
  t.starts_on,
  t.ends_on,
  COUNT(DISTINCT o.id)::bigint                                                   AS leg_count,
  COUNT(DISTINCT s.id)::bigint                                                   AS settled_legs,
  COALESCE(SUM(s.gross_box_office_cents), 0)::bigint                             AS gross_box_office_cents,
  COALESCE(SUM(s.nbor_cents), 0)::bigint                                         AS nbor_cents,
  COALESCE(SUM(s.artist_payout_cents), 0)::bigint                                AS artist_payout_cents,
  COALESCE(SUM(s.agent_commission_cents), 0)::bigint                             AS agent_commission_cents,
  COALESCE(SUM(s.bar_revenue_cents + s.merch_revenue_cents + s.other_revenue_cents), 0)::bigint AS ancillary_revenue_cents
FROM "public"."tours" t
LEFT JOIN "public"."talent_offers" o ON o.tour_id = t.id
LEFT JOIN "public"."settlements" s ON s.talent_offer_id = o.id
WHERE t.deleted_at IS NULL
GROUP BY t.id, t.org_id, t.name, t.tour_phase, t.starts_on, t.ends_on;

GRANT SELECT ON "public"."tour_p_and_l" TO "authenticated";

COMMENT ON VIEW "public"."tour_p_and_l" IS
  '0003/LDP-renamed — Tour P&L roll-up keyed by tours.tour_phase (was .status before 20260511000001).';
