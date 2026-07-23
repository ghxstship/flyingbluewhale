-- L-P1 · ORG CHART — hierarchy + person assignments on the position library.
--
-- The Organization pillar's `positions` table (20260723010000) is FLAT and
-- unlinked to people. This migration gives it the two halves the pillar
-- promises:
--
--  1. HIERARCHY — `positions.reports_to_position_id` (nullable self-FK) turns
--     the library into a reporting forest, with a DB-side no-cycle guard
--     (BEFORE trigger walking UP the parent chain with a depth cap, mirroring
--     the app-side kit-30 walker in the roster reporting surface) plus
--     `seat_count` so a position can hold more than one person.
--
--  2. SEATS — `position_assignments` records who holds each seat. The person
--     column is `party_id` -> `public.parties`, the canonical person layer
--     (covers users, crew, and external people; see src/lib/db/parties.ts —
--     every `*_party_id` column holds a parties.id, never an auth uid).
--
-- LDP: the seat lifecycle is `assignment_state` (cyclical operational,
-- enum `position_assignment_state`: active/ended) — no existing enum fits
-- (uis_lifecycle_state is the full engagement funnel; fulfillment_state is
-- the advancing arc), so a purpose-named two-value enum is minted.

-- 1 ── positions: reporting edge + seat count ────────────────────────────────
ALTER TABLE "public"."positions"
  ADD COLUMN IF NOT EXISTS "reports_to_position_id" uuid
    REFERENCES "public"."positions"("id") ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS "seat_count" integer NOT NULL DEFAULT 1
    CONSTRAINT "positions_seat_count_check" CHECK ("seat_count" >= 1 AND "seat_count" <= 500);

CREATE INDEX IF NOT EXISTS "positions_reports_to_idx"
  ON "public"."positions" ("reports_to_position_id");

COMMENT ON COLUMN "public"."positions"."reports_to_position_id" IS
  'The position this one reports to (nullable — top of the forest). Same-org only; cycles are refused by private.positions_no_reporting_cycle.';
COMMENT ON COLUMN "public"."positions"."seat_count" IS
  'How many people this position seats. Vacancy = seat_count minus active position_assignments.';

-- No-cycle guard: BEFORE trigger walking UP from the proposed parent. If the
-- chain reaches the row being written, the edge would close a loop. The depth
-- cap (100) bounds the walk so pre-existing bad data can never hang a write —
-- the same discipline as the kit-30 app-side walker (roster/reporting/cycle.ts).
-- SECURITY DEFINER + pinned search_path per the private-schema trigger
-- convention (see private.enforce_incident_close_signoff): the walk must see
-- the whole org chain regardless of the caller's RLS view.
CREATE OR REPLACE FUNCTION "private"."positions_no_reporting_cycle"()
RETURNS "trigger"
LANGUAGE "plpgsql"
SECURITY DEFINER
SET "search_path" TO 'public', 'private', 'pg_temp'
AS $$
DECLARE
  v_parent_org uuid;
  v_cursor uuid;
  v_depth integer := 0;
BEGIN
  IF NEW.reports_to_position_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Self-reporting is a cycle of length one.
  IF NEW.reports_to_position_id = NEW.id THEN
    RAISE EXCEPTION 'A position cannot report to itself'
      USING ERRCODE = 'check_violation';
  END IF;

  -- The parent must live in the same org — a cross-tenant edge would let one
  -- org's chart hang off another's.
  SELECT org_id INTO v_parent_org
  FROM public.positions WHERE id = NEW.reports_to_position_id;
  IF v_parent_org IS NULL OR v_parent_org <> NEW.org_id THEN
    RAISE EXCEPTION 'The reports-to position must belong to the same organization'
      USING ERRCODE = 'foreign_key_violation';
  END IF;

  -- Walk up from the proposed parent. Reaching NEW.id means the edge closes a
  -- loop; the depth cap bounds the walk against pre-existing bad data.
  v_cursor := NEW.reports_to_position_id;
  WHILE v_cursor IS NOT NULL AND v_depth < 100 LOOP
    IF v_cursor = NEW.id THEN
      RAISE EXCEPTION 'This reports-to would create a reporting cycle'
        USING ERRCODE = 'check_violation';
    END IF;
    SELECT reports_to_position_id INTO v_cursor
    FROM public.positions WHERE id = v_cursor;
    v_depth := v_depth + 1;
  END LOOP;

  RETURN NEW;
END;
$$;

ALTER FUNCTION "private"."positions_no_reporting_cycle"() OWNER TO "postgres";

COMMENT ON FUNCTION "private"."positions_no_reporting_cycle"() IS
  'BEFORE-trigger guard on positions.reports_to_position_id: refuses self-edges, cross-org parents, and reporting cycles (walks up with a 100-step depth cap). Mirrors the app-side walker in the org-chart lib.';

DROP TRIGGER IF EXISTS "positions_no_reporting_cycle" ON "public"."positions";
CREATE TRIGGER "positions_no_reporting_cycle"
  BEFORE INSERT OR UPDATE OF "reports_to_position_id" ON "public"."positions"
  FOR EACH ROW EXECUTE FUNCTION "private"."positions_no_reporting_cycle"();

-- The foundation migration shipped positions.updated_at without the SSOT
-- touch trigger — close that per the `<table>_touch_updated_at` convention.
DROP TRIGGER IF EXISTS "positions_touch_updated_at" ON "public"."positions";
CREATE TRIGGER "positions_touch_updated_at"
  BEFORE UPDATE ON "public"."positions"
  FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();

-- 2 ── position_assignments: who holds each seat ─────────────────────────────
CREATE TYPE "public"."position_assignment_state" AS ENUM (
  'active',
  'ended'
);

CREATE TABLE IF NOT EXISTS "public"."position_assignments" (
  "id"               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "org_id"           uuid NOT NULL REFERENCES "public"."orgs"("id") ON DELETE CASCADE,
  "position_id"      uuid NOT NULL REFERENCES "public"."positions"("id") ON DELETE CASCADE,
  "party_id"         uuid NOT NULL REFERENCES "public"."parties"("id") ON DELETE CASCADE,
  "starts_on"        date,
  "ends_on"          date,
  -- LDP: cyclical operational state — a seat is held, then it ends.
  "assignment_state" "public"."position_assignment_state" NOT NULL DEFAULT 'active',
  "created_at"       timestamptz NOT NULL DEFAULT now(),
  "updated_at"       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "position_assignments_date_order_check"
    CHECK ("ends_on" IS NULL OR "starts_on" IS NULL OR "ends_on" >= "starts_on"),
  -- An ended seat records WHEN it ended; the end action stamps today when
  -- the operator leaves the date blank.
  CONSTRAINT "position_assignments_ended_has_date_check"
    CHECK ("assignment_state" = 'active' OR "ends_on" IS NOT NULL)
);

-- One ACTIVE seat per (position, party); history rows (ended) accumulate.
CREATE UNIQUE INDEX IF NOT EXISTS "position_assignments_active_key"
  ON "public"."position_assignments" ("position_id", "party_id")
  WHERE "assignment_state" = 'active';

CREATE INDEX IF NOT EXISTS "position_assignments_org_idx"
  ON "public"."position_assignments" ("org_id");
CREATE INDEX IF NOT EXISTS "position_assignments_position_idx"
  ON "public"."position_assignments" ("position_id");
CREATE INDEX IF NOT EXISTS "position_assignments_party_idx"
  ON "public"."position_assignments" ("party_id");

-- Org-consistency guard: the seat's position and party must both live in the
-- assignment's org. Both id spaces are bare uuids, so nothing about a value
-- betrays a cross-tenant mistake — the 2026-07-17 FK/3NF audit found exactly
-- this class live; refuse it at write time.
CREATE OR REPLACE FUNCTION "private"."position_assignments_org_consistency"()
RETURNS "trigger"
LANGUAGE "plpgsql"
SECURITY DEFINER
SET "search_path" TO 'public', 'private', 'pg_temp'
AS $$
DECLARE
  v_position_org uuid;
  v_party_org uuid;
BEGIN
  SELECT org_id INTO v_position_org FROM public.positions WHERE id = NEW.position_id;
  IF v_position_org IS NULL OR v_position_org <> NEW.org_id THEN
    RAISE EXCEPTION 'The position must belong to the same organization as the assignment'
      USING ERRCODE = 'foreign_key_violation';
  END IF;
  SELECT org_id INTO v_party_org FROM public.parties WHERE id = NEW.party_id;
  IF v_party_org IS NULL OR v_party_org <> NEW.org_id THEN
    RAISE EXCEPTION 'The person must belong to the same organization as the assignment'
      USING ERRCODE = 'foreign_key_violation';
  END IF;
  RETURN NEW;
END;
$$;

ALTER FUNCTION "private"."position_assignments_org_consistency"() OWNER TO "postgres";

COMMENT ON FUNCTION "private"."position_assignments_org_consistency"() IS
  'BEFORE-trigger guard on position_assignments: the referenced position and party must both belong to the assignment''s org (both id spaces are bare uuids — nothing about a value betrays a cross-tenant mistake).';

DROP TRIGGER IF EXISTS "position_assignments_org_consistency" ON "public"."position_assignments";
CREATE TRIGGER "position_assignments_org_consistency"
  BEFORE INSERT OR UPDATE OF "org_id", "position_id", "party_id" ON "public"."position_assignments"
  FOR EACH ROW EXECUTE FUNCTION "private"."position_assignments_org_consistency"();

DROP TRIGGER IF EXISTS "position_assignments_touch_updated_at" ON "public"."position_assignments";
CREATE TRIGGER "position_assignments_touch_updated_at"
  BEFORE UPDATE ON "public"."position_assignments"
  FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();

ALTER TABLE "public"."position_assignments" ENABLE ROW LEVEL SECURITY;

-- RLS mirrors positions: org members read; manager band writes; owner/admin
-- delete (history rows normally END rather than delete).
CREATE POLICY "position_assignments_select" ON "public"."position_assignments"
  FOR SELECT USING ("private"."is_org_member"("org_id"));
CREATE POLICY "position_assignments_insert" ON "public"."position_assignments"
  FOR INSERT WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner','admin','manager']));
CREATE POLICY "position_assignments_update" ON "public"."position_assignments"
  FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner','admin','manager']))
  WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner','admin','manager']));
CREATE POLICY "position_assignments_delete" ON "public"."position_assignments"
  FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner','admin']));

-- pg_default_acl gotcha: new tables inherit anon grants by default.
REVOKE ALL ON TABLE "public"."position_assignments" FROM "anon";

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "public"."position_assignments" TO "authenticated";

COMMENT ON TABLE "public"."position_assignments" IS
  'LEG3ND Organization pillar: who holds each position seat. party_id is the canonical person layer (parties — users, crew, external). One active row per (position, party); ended rows are history. Vacancy = positions.seat_count minus active rows.';
