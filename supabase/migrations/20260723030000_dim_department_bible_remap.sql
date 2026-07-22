-- dim_department → XPMS 2.5 SSOT Bible remap (marketing/onboarding rebuild, P4 addendum).
--
-- kit-34 (20260719224440) shipped dim_department with a divergent field
-- vocabulary whose CODES collide with the Bible at different meanings
-- (1000 kit-34 "Production" vs Bible "Creative", etc.). The Bible canon —
-- exactly the cost-center canon already seeded by seed_org_xpms_defaults —
-- is authoritative:
--
--   0000 Executive · 1000 Creative · 2000 Talent · 3000 Marketing · 4000 Build
--   5000 Production · 6000 Operations · 7000 Experience · 8000 Hospitality
--   9000 Technology
--
-- OWNER NOTE (plan §2a): 7000 Experience / 8000 Hospitality stay as the Bible
-- has them NOW. A future XPMS version flips the two; do NOT pre-flip here.
--
-- This migration, atomically (one migration = one transaction):
--   1. adds the `app` ownership column to dim_department (plan §2a canon:
--      0000→legend · 1000-3000→atlvs · 4000-6000→compvss · 7000-9000→gvteway);
--   2. relabels dim_department to the Bible canon;
--   3. remaps the kit-34-seeded field data (project_tasks / project_events)
--      whose department labels, dept codes, coordinates, urids and
--      xpms_atom_ids embed the OLD code meanings;
--   4. verifies, raising on any residue.
--
-- Every UPDATE is guarded on the OLD vocabulary exactly (old label, and old
-- code where the label is shared between vocabularies), so already-canonical
-- rows are untouched and a re-run is a no-op.
--
-- ── Recon (expected state BEFORE this migration; run to verify after) ───────
--
--   SELECT code, label FROM public.dim_department ORDER BY code;
--     -- BEFORE (10 rows): 0000 Executive (added by 20260723010000),
--     --   1000 Production, 2000 Technical, 3000 Site & Ops, 4000 Talent,
--     --   5000 Hospitality, 6000 Safety, 7000 Logistics, 8000 Commercial,
--     --   9000 Admin.
--     -- AFTER (10 rows): the Bible canon above, each with `app` set.
--
--   SELECT department, count(*) FROM public.project_tasks GROUP BY 1 ORDER BY 1;
--     -- BEFORE (kit-34 demo seed, 6 rows): Hospitality 1 (PT-060),
--     --   Logistics 1 (PT-041), Safety 1 (PT-052), Site & Ops 1 (PT-033),
--     --   Technical 2 (PT-014, PT-021).
--     -- AFTER: Hospitality 1, Operations 3, Production 2.
--
--   SELECT department, dept_code, count(*) FROM public.project_events GROUP BY 1, 2 ORDER BY 2;
--     -- BEFORE (kit-34 demo seed, 5 rows): Production/1000 (PE-03),
--     --   Technical/2000 (PE-01), Site & Ops/3000 (PE-02),
--     --   Safety/6000 (PE-05), Logistics/7000 (PE-04).
--     -- AFTER: Production/5000 ×2, Operations/6000 ×3.
--
--   SELECT count(*) FROM public.project_milestones;  -- 7; carries NO
--     -- department data (field phases only) — untouched here.
--
-- Coordinate anatomy (kit-34 seed): '<dept code>×<phase code>' with the
-- multiplication sign U+00D7 (e.g. '2000×INS'); urid '<dept>.<disc>.<cat>'
-- (e.g. '2000.10.05'); xpms_atom_id '<urid>-<seq>' (e.g. '2000.10.05-014').
-- The dept segment is always the first 4 characters of all three.

-- 1 ── dim_department.app: app-ownership canon (plan §2a) ────────────────────

ALTER TABLE "public"."dim_department" ADD COLUMN IF NOT EXISTS "app" text;

-- Defensive: 20260723010000 already inserts 0000; harmless if present.
INSERT INTO "public"."dim_department" ("code", "label", "app")
VALUES ('0000', 'Executive', 'legend')
ON CONFLICT ("code") DO NOTHING;

UPDATE "public"."dim_department" SET "app" = CASE "code"
  WHEN '0000' THEN 'legend'   -- the org tier IS the Organization Hub
  WHEN '1000' THEN 'atlvs'
  WHEN '2000' THEN 'atlvs'
  WHEN '3000' THEN 'atlvs'
  WHEN '4000' THEN 'compvss'
  WHEN '5000' THEN 'compvss'
  WHEN '6000' THEN 'compvss'
  WHEN '7000' THEN 'gvteway'
  WHEN '8000' THEN 'gvteway'
  WHEN '9000' THEN 'gvteway'
END
WHERE "app" IS DISTINCT FROM CASE "code"
  WHEN '0000' THEN 'legend'
  WHEN '1000' THEN 'atlvs'
  WHEN '2000' THEN 'atlvs'
  WHEN '3000' THEN 'atlvs'
  WHEN '4000' THEN 'compvss'
  WHEN '5000' THEN 'compvss'
  WHEN '6000' THEN 'compvss'
  WHEN '7000' THEN 'gvteway'
  WHEN '8000' THEN 'gvteway'
  WHEN '9000' THEN 'gvteway'
END;

ALTER TABLE "public"."dim_department" DROP CONSTRAINT IF EXISTS "dim_department_app_check";
ALTER TABLE "public"."dim_department"
  ADD CONSTRAINT "dim_department_app_check"
  CHECK ("app" IN ('legend', 'atlvs', 'compvss', 'gvteway'));
ALTER TABLE "public"."dim_department" ALTER COLUMN "app" SET NOT NULL;

COMMENT ON COLUMN "public"."dim_department"."app" IS
  'App ownership of the department class (rebuild plan §2a, 2026-07-22): legend=0000 (the org tier), atlvs=1000-3000, compvss=4000-6000, gvteway=7000-9000.';

-- 2 ── Relabel dim_department to the Bible canon ─────────────────────────────
-- Guarded on the kit-34 label so a re-run (or an already-canonical row) is a
-- no-op. dim_department.label carries no unique constraint, so the transient
-- coexistence of e.g. 'Talent' at 2000 and 4000 mid-sequence is legal.

UPDATE "public"."dim_department" SET "label" = 'Creative'    WHERE "code" = '1000' AND "label" = 'Production';
UPDATE "public"."dim_department" SET "label" = 'Talent'      WHERE "code" = '2000' AND "label" = 'Technical';
UPDATE "public"."dim_department" SET "label" = 'Marketing'   WHERE "code" = '3000' AND "label" = 'Site & Ops';
UPDATE "public"."dim_department" SET "label" = 'Build'       WHERE "code" = '4000' AND "label" = 'Talent';
UPDATE "public"."dim_department" SET "label" = 'Production'  WHERE "code" = '5000' AND "label" = 'Hospitality';
UPDATE "public"."dim_department" SET "label" = 'Operations'  WHERE "code" = '6000' AND "label" = 'Safety';
UPDATE "public"."dim_department" SET "label" = 'Experience'  WHERE "code" = '7000' AND "label" = 'Logistics';
UPDATE "public"."dim_department" SET "label" = 'Hospitality' WHERE "code" = '8000' AND "label" = 'Commercial';
UPDATE "public"."dim_department" SET "label" = 'Technology'  WHERE "code" = '9000' AND "label" = 'Admin';

-- 3 ── Remap the seeded field data (project_tasks / project_events) ──────────
--
-- Mapping canon: OLD label (OLD code) → NEW code (NEW Bible label), reasoned
-- per the WORK's actual nature, per distinct seeded value:
--
--   Technical (2000)   → 5000 Production   Seeded disciplines are Audio
--                        (PT-014 'Fly Main PA' rig/ring-out) and Lighting
--                        (PT-021 'Focus Front Truss'), plus the PE-01
--                        'All-Systems Soundcheck' event: show-system technical
--                        work, i.e. Production under the Bible. 9000
--                        Technology is IT/network/software — no seeded
--                        Technical row is IT, but a discipline branch below
--                        routes any such row to 9000 defensively.
--   Site & Ops (3000)  → 6000 Operations   PT-033 'Set FOS Barricade Line'
--                        (crowd/site infrastructure) and PE-02 'Doors · Show
--                        Day 1' (gate ops): site & venue operations work.
--   Talent (4000)      → 2000 Talent       Label identical; only the code
--                        moves. No seeded rows, guarded for user-created ones.
--   Hospitality (5000) → 8000 Hospitality  PT-060 'Crew Meal Push · Dinner'
--                        (catering): label identical, code moves.
--   Safety (6000)      → 6000 Operations   PT-052 'Fire Watch · Pyro Cue' and
--                        PE-05 'Site Safety Walk': the Bible carries no Safety
--                        class; safety/fire-watch field work is Operations.
--                        Code unchanged — label-only rewrite.
--   Logistics (7000)   → 6000 Operations   PT-041 'Count Load-Out Pallets'
--                        (dock/freight) and PE-04 'Load-Out Begins': freight &
--                        load-out is site operations work, NOT 7000 Experience
--                        (guest-facing) under the Bible.
--   Commercial (8000)  → 3000 Marketing    Sponsorship/commercial work is the
--                        Marketing class. No seeded rows, guarded anyway.
--   Admin (9000)       → 6000 Operations   Back-office/admin field work is
--                        general operations; 0000 Executive is the org tier
--                        and 9000 Technology would misclassify office admin.
--                        No seeded rows, guarded anyway.
--   Production (1000)  → 5000 Production   PE-03 'Headliner Set': label
--                        identical, code moves 1000→5000 (Bible 1000 is
--                        Creative — design/content authorship, not show ops).
--
-- Columns rewritten per table:
--   project_tasks:  department (label) · coordinate ('NNNN×PHS' dept segment)
--                   · urid ('NNNN.dd.cc' dept segment) · xpms_atom_id
--                   ('NNNN.dd.cc-seq' dept segment) · updated_at.
--                   `discipline`, `category`, `trade` are craft facets, not
--                   department labels — deliberately untouched (e.g. trade
--                   'Safety' remains a valid craft under Operations).
--   project_events: department (label) · dept_code (FK) · urid · xpms_atom_id
--                   · updated_at. (No coordinate column; the calendar view
--                   composes dept_code×phase at render.)
--   project_milestones: no department data — untouched.
--
-- WHERE guards: unambiguous OLD-only labels (Technical, Site & Ops, Safety,
-- Logistics, Commercial, Admin) match on label alone; labels shared between
-- vocabularies (Production, Talent, Hospitality) also require the OLD code in
-- the row's code carrier (coordinate/urid prefix for tasks, dept_code for
-- events) so canonical rows never match. Code-segment rewrites are CASE-
-- guarded on the OLD prefix so a mismatched carrier is left for the
-- verification block to flag rather than silently mangled.

-- 3a · project_tasks ─────────────────────────────────────────────────────────

-- Technical → 9000 Technology: defensive IT-discipline branch (zero seeded rows).
UPDATE "public"."project_tasks" SET
  "department"   = 'Technology',
  "coordinate"   = CASE WHEN "coordinate"   LIKE '2000×%' THEN '9000' || substr("coordinate", 5)   ELSE "coordinate"   END,
  "urid"         = CASE WHEN "urid"         LIKE '2000.%' THEN '9000' || substr("urid", 5)         ELSE "urid"         END,
  "xpms_atom_id" = CASE WHEN "xpms_atom_id" LIKE '2000.%' THEN '9000' || substr("xpms_atom_id", 5) ELSE "xpms_atom_id" END,
  "updated_at"   = now()
WHERE "department" = 'Technical'
  AND "discipline" IN ('IT', 'Network', 'Networking', 'Software', 'Telecom', 'Comms & IT');

-- Technical → 5000 Production (all remaining: Audio, Lighting, … show systems).
UPDATE "public"."project_tasks" SET
  "department"   = 'Production',
  "coordinate"   = CASE WHEN "coordinate"   LIKE '2000×%' THEN '5000' || substr("coordinate", 5)   ELSE "coordinate"   END,
  "urid"         = CASE WHEN "urid"         LIKE '2000.%' THEN '5000' || substr("urid", 5)         ELSE "urid"         END,
  "xpms_atom_id" = CASE WHEN "xpms_atom_id" LIKE '2000.%' THEN '5000' || substr("xpms_atom_id", 5) ELSE "xpms_atom_id" END,
  "updated_at"   = now()
WHERE "department" = 'Technical';

-- Site & Ops → 6000 Operations.
UPDATE "public"."project_tasks" SET
  "department"   = 'Operations',
  "coordinate"   = CASE WHEN "coordinate"   LIKE '3000×%' THEN '6000' || substr("coordinate", 5)   ELSE "coordinate"   END,
  "urid"         = CASE WHEN "urid"         LIKE '3000.%' THEN '6000' || substr("urid", 5)         ELSE "urid"         END,
  "xpms_atom_id" = CASE WHEN "xpms_atom_id" LIKE '3000.%' THEN '6000' || substr("xpms_atom_id", 5) ELSE "xpms_atom_id" END,
  "updated_at"   = now()
WHERE "department" = 'Site & Ops';

-- Safety → 6000 Operations (code unchanged; label-only rewrite).
UPDATE "public"."project_tasks" SET
  "department" = 'Operations',
  "updated_at" = now()
WHERE "department" = 'Safety';

-- Logistics → 6000 Operations.
UPDATE "public"."project_tasks" SET
  "department"   = 'Operations',
  "coordinate"   = CASE WHEN "coordinate"   LIKE '7000×%' THEN '6000' || substr("coordinate", 5)   ELSE "coordinate"   END,
  "urid"         = CASE WHEN "urid"         LIKE '7000.%' THEN '6000' || substr("urid", 5)         ELSE "urid"         END,
  "xpms_atom_id" = CASE WHEN "xpms_atom_id" LIKE '7000.%' THEN '6000' || substr("xpms_atom_id", 5) ELSE "xpms_atom_id" END,
  "updated_at"   = now()
WHERE "department" = 'Logistics';

-- Commercial → 3000 Marketing.
UPDATE "public"."project_tasks" SET
  "department"   = 'Marketing',
  "coordinate"   = CASE WHEN "coordinate"   LIKE '8000×%' THEN '3000' || substr("coordinate", 5)   ELSE "coordinate"   END,
  "urid"         = CASE WHEN "urid"         LIKE '8000.%' THEN '3000' || substr("urid", 5)         ELSE "urid"         END,
  "xpms_atom_id" = CASE WHEN "xpms_atom_id" LIKE '8000.%' THEN '3000' || substr("xpms_atom_id", 5) ELSE "xpms_atom_id" END,
  "updated_at"   = now()
WHERE "department" = 'Commercial';

-- Admin → 6000 Operations.
UPDATE "public"."project_tasks" SET
  "department"   = 'Operations',
  "coordinate"   = CASE WHEN "coordinate"   LIKE '9000×%' THEN '6000' || substr("coordinate", 5)   ELSE "coordinate"   END,
  "urid"         = CASE WHEN "urid"         LIKE '9000.%' THEN '6000' || substr("urid", 5)         ELSE "urid"         END,
  "xpms_atom_id" = CASE WHEN "xpms_atom_id" LIKE '9000.%' THEN '6000' || substr("xpms_atom_id", 5) ELSE "xpms_atom_id" END,
  "updated_at"   = now()
WHERE "department" = 'Admin';

-- Production (OLD 1000) → 5000; label shared, so the OLD code is required.
UPDATE "public"."project_tasks" SET
  "coordinate"   = CASE WHEN "coordinate"   LIKE '1000×%' THEN '5000' || substr("coordinate", 5)   ELSE "coordinate"   END,
  "urid"         = CASE WHEN "urid"         LIKE '1000.%' THEN '5000' || substr("urid", 5)         ELSE "urid"         END,
  "xpms_atom_id" = CASE WHEN "xpms_atom_id" LIKE '1000.%' THEN '5000' || substr("xpms_atom_id", 5) ELSE "xpms_atom_id" END,
  "updated_at"   = now()
WHERE "department" = 'Production'
  AND ("coordinate" LIKE '1000×%' OR "urid" LIKE '1000.%');

-- Talent (OLD 4000) → 2000; label shared, so the OLD code is required.
UPDATE "public"."project_tasks" SET
  "coordinate"   = CASE WHEN "coordinate"   LIKE '4000×%' THEN '2000' || substr("coordinate", 5)   ELSE "coordinate"   END,
  "urid"         = CASE WHEN "urid"         LIKE '4000.%' THEN '2000' || substr("urid", 5)         ELSE "urid"         END,
  "xpms_atom_id" = CASE WHEN "xpms_atom_id" LIKE '4000.%' THEN '2000' || substr("xpms_atom_id", 5) ELSE "xpms_atom_id" END,
  "updated_at"   = now()
WHERE "department" = 'Talent'
  AND ("coordinate" LIKE '4000×%' OR "urid" LIKE '4000.%');

-- Hospitality (OLD 5000) → 8000; label shared, so the OLD code is required.
UPDATE "public"."project_tasks" SET
  "coordinate"   = CASE WHEN "coordinate"   LIKE '5000×%' THEN '8000' || substr("coordinate", 5)   ELSE "coordinate"   END,
  "urid"         = CASE WHEN "urid"         LIKE '5000.%' THEN '8000' || substr("urid", 5)         ELSE "urid"         END,
  "xpms_atom_id" = CASE WHEN "xpms_atom_id" LIKE '5000.%' THEN '8000' || substr("xpms_atom_id", 5) ELSE "xpms_atom_id" END,
  "updated_at"   = now()
WHERE "department" = 'Hospitality'
  AND ("coordinate" LIKE '5000×%' OR "urid" LIKE '5000.%');

-- 3b · project_events ────────────────────────────────────────────────────────

-- Technical → 5000 Production (PE-01 'All-Systems Soundcheck' is show-system
-- work; events carry no discipline column, so no 9000 branch applies).
UPDATE "public"."project_events" SET
  "department"   = 'Production',
  "dept_code"    = '5000',
  "urid"         = CASE WHEN "urid"         LIKE '2000.%' THEN '5000' || substr("urid", 5)         ELSE "urid"         END,
  "xpms_atom_id" = CASE WHEN "xpms_atom_id" LIKE '2000.%' THEN '5000' || substr("xpms_atom_id", 5) ELSE "xpms_atom_id" END,
  "updated_at"   = now()
WHERE "department" = 'Technical' AND "dept_code" = '2000';

-- Site & Ops → 6000 Operations (PE-02 doors/gate ops).
UPDATE "public"."project_events" SET
  "department"   = 'Operations',
  "dept_code"    = '6000',
  "urid"         = CASE WHEN "urid"         LIKE '3000.%' THEN '6000' || substr("urid", 5)         ELSE "urid"         END,
  "xpms_atom_id" = CASE WHEN "xpms_atom_id" LIKE '3000.%' THEN '6000' || substr("xpms_atom_id", 5) ELSE "xpms_atom_id" END,
  "updated_at"   = now()
WHERE "department" = 'Site & Ops' AND "dept_code" = '3000';

-- Safety → 6000 Operations (PE-05 safety walk; code unchanged, label-only).
UPDATE "public"."project_events" SET
  "department" = 'Operations',
  "updated_at" = now()
WHERE "department" = 'Safety' AND "dept_code" = '6000';

-- Logistics → 6000 Operations (PE-04 load-out).
UPDATE "public"."project_events" SET
  "department"   = 'Operations',
  "dept_code"    = '6000',
  "urid"         = CASE WHEN "urid"         LIKE '7000.%' THEN '6000' || substr("urid", 5)         ELSE "urid"         END,
  "xpms_atom_id" = CASE WHEN "xpms_atom_id" LIKE '7000.%' THEN '6000' || substr("xpms_atom_id", 5) ELSE "xpms_atom_id" END,
  "updated_at"   = now()
WHERE "department" = 'Logistics' AND "dept_code" = '7000';

-- Commercial → 3000 Marketing (no seeded rows; guarded anyway).
UPDATE "public"."project_events" SET
  "department"   = 'Marketing',
  "dept_code"    = '3000',
  "urid"         = CASE WHEN "urid"         LIKE '8000.%' THEN '3000' || substr("urid", 5)         ELSE "urid"         END,
  "xpms_atom_id" = CASE WHEN "xpms_atom_id" LIKE '8000.%' THEN '3000' || substr("xpms_atom_id", 5) ELSE "xpms_atom_id" END,
  "updated_at"   = now()
WHERE "department" = 'Commercial' AND "dept_code" = '8000';

-- Admin → 6000 Operations (no seeded rows; guarded anyway).
UPDATE "public"."project_events" SET
  "department"   = 'Operations',
  "dept_code"    = '6000',
  "urid"         = CASE WHEN "urid"         LIKE '9000.%' THEN '6000' || substr("urid", 5)         ELSE "urid"         END,
  "xpms_atom_id" = CASE WHEN "xpms_atom_id" LIKE '9000.%' THEN '6000' || substr("xpms_atom_id", 5) ELSE "xpms_atom_id" END,
  "updated_at"   = now()
WHERE "department" = 'Admin' AND "dept_code" = '9000';

-- Production (OLD 1000) → 5000 (PE-03 headliner set; label shared, OLD code required).
UPDATE "public"."project_events" SET
  "dept_code"    = '5000',
  "urid"         = CASE WHEN "urid"         LIKE '1000.%' THEN '5000' || substr("urid", 5)         ELSE "urid"         END,
  "xpms_atom_id" = CASE WHEN "xpms_atom_id" LIKE '1000.%' THEN '5000' || substr("xpms_atom_id", 5) ELSE "xpms_atom_id" END,
  "updated_at"   = now()
WHERE "department" = 'Production' AND "dept_code" = '1000';

-- Talent (OLD 4000) → 2000 (no seeded rows; label shared, OLD code required).
UPDATE "public"."project_events" SET
  "dept_code"    = '2000',
  "urid"         = CASE WHEN "urid"         LIKE '4000.%' THEN '2000' || substr("urid", 5)         ELSE "urid"         END,
  "xpms_atom_id" = CASE WHEN "xpms_atom_id" LIKE '4000.%' THEN '2000' || substr("xpms_atom_id", 5) ELSE "xpms_atom_id" END,
  "updated_at"   = now()
WHERE "department" = 'Talent' AND "dept_code" = '4000';

-- Hospitality (OLD 5000) → 8000 (no seeded rows; label shared, OLD code required).
UPDATE "public"."project_events" SET
  "dept_code"    = '8000',
  "urid"         = CASE WHEN "urid"         LIKE '5000.%' THEN '8000' || substr("urid", 5)         ELSE "urid"         END,
  "xpms_atom_id" = CASE WHEN "xpms_atom_id" LIKE '5000.%' THEN '8000' || substr("xpms_atom_id", 5) ELSE "xpms_atom_id" END,
  "updated_at"   = now()
WHERE "department" = 'Hospitality' AND "dept_code" = '5000';

-- 4 ── Verification: fail the migration loudly on any residue ────────────────

DO $$
DECLARE
  v_dim_total      int;
  v_dim_canon      int;
  v_old_tasks      int;
  v_old_events     int;
  v_incoh_tasks    int;
  v_incoh_events   int;
BEGIN
  -- 4a · dim_department: exactly the 10 Bible rows, each with its §2a app.
  SELECT count(*) INTO v_dim_total FROM public.dim_department;
  SELECT count(*) INTO v_dim_canon
  FROM public.dim_department d
  JOIN (VALUES
    ('0000', 'Executive',   'legend'),
    ('1000', 'Creative',    'atlvs'),
    ('2000', 'Talent',      'atlvs'),
    ('3000', 'Marketing',   'atlvs'),
    ('4000', 'Build',       'compvss'),
    ('5000', 'Production',  'compvss'),
    ('6000', 'Operations',  'compvss'),
    ('7000', 'Experience',  'gvteway'),
    ('8000', 'Hospitality', 'gvteway'),
    ('9000', 'Technology',  'gvteway')
  ) AS canon(code, label, app)
    ON canon.code = d.code AND canon.label = d.label AND canon.app = d.app;
  IF v_dim_total <> 10 OR v_dim_canon <> 10 THEN
    RAISE EXCEPTION 'dim_department not on the Bible canon: % rows total, % matching canon (want 10/10)',
      v_dim_total, v_dim_canon;
  END IF;

  -- 4b · zero rows still carrying an OLD-only label. (Production / Talent /
  -- Hospitality exist in both vocabularies; their old-code residue is caught
  -- by the coherence check 4c.)
  SELECT count(*) INTO v_old_tasks
  FROM public.project_tasks
  WHERE department IN ('Technical', 'Site & Ops', 'Safety', 'Logistics', 'Commercial', 'Admin');
  SELECT count(*) INTO v_old_events
  FROM public.project_events
  WHERE department IN ('Technical', 'Site & Ops', 'Safety', 'Logistics', 'Commercial', 'Admin');
  IF v_old_tasks <> 0 OR v_old_events <> 0 THEN
    RAISE EXCEPTION 'kit-34 department labels survive the remap: % project_tasks, % project_events',
      v_old_tasks, v_old_events;
  END IF;

  -- 4c · code/label coherence: every row's embedded department code must
  -- resolve, via dim_department, to the row's own department label — and the
  -- code segment must agree across coordinate, urid and xpms_atom_id. Any old
  -- code carrying its old meaning (e.g. label Production with coordinate
  -- 1000×…) fails here, as does any carrier the guarded rewrites skipped.
  SELECT count(*) INTO v_incoh_tasks
  FROM public.project_tasks t
  WHERE NOT EXISTS (
          SELECT 1 FROM public.dim_department d
          WHERE d.code = split_part(t.coordinate, '×', 1)
            AND d.label = t.department)
     OR split_part(t.urid, '.', 1) <> split_part(t.coordinate, '×', 1)
     OR split_part(t.xpms_atom_id, '.', 1) <> split_part(t.coordinate, '×', 1);
  SELECT count(*) INTO v_incoh_events
  FROM public.project_events e
  WHERE NOT EXISTS (
          SELECT 1 FROM public.dim_department d
          WHERE d.code = e.dept_code
            AND d.label = e.department)
     OR split_part(e.urid, '.', 1) <> e.dept_code
     OR split_part(e.xpms_atom_id, '.', 1) <> e.dept_code;
  IF v_incoh_tasks <> 0 OR v_incoh_events <> 0 THEN
    RAISE EXCEPTION 'department code/label incoherence after remap: % project_tasks, % project_events',
      v_incoh_tasks, v_incoh_events;
  END IF;
END $$;
