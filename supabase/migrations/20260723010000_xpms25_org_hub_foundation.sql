-- XPMS 2.5 organization-hub foundation (marketing/onboarding rebuild P3).
--
-- Grounded in the XPMS 2.5 SSOT Bible (01 · Department Classes): the standard
-- has TEN classes, 0000 Executive through 9000 Technology — the same canon the
-- cost_centers seed already carries. kit-34's dim_department shipped only
-- 1000-9000 with a divergent field vocabulary (1000:Production vs the Bible's
-- 1000:Creative, etc.). Relabeling is NOT done here: live project_tasks/events
-- coordinates embed the kit-34 codes, so reconciliation is an atomic data
-- migration scheduled in P4 of the rebuild plan (mapping documented there).
-- This migration is ADDITIVE ONLY:
--
--  1. dim_department admits 0000 (the Bible's Executive class) so the
--     coordinate matrix can reach its canonical 10 x 9 = 90 coordinates.
--  2. `positions` — the LEG3ND Organization pillar's position library
--     (org-scoped, department-classed).
--  3. `seed_org_xpms_defaults(org)` — the /start "base kit install" step:
--     idempotently seeds the 10 canonical cost centers and a starter position
--     per department class for a new organization.

-- 1 ── dim_department: admit the Executive class ─────────────────────────────
ALTER TABLE "public"."dim_department" DROP CONSTRAINT IF EXISTS "dim_department_code_check";
ALTER TABLE "public"."dim_department"
  ADD CONSTRAINT "dim_department_code_check" CHECK ("code" ~ '^\d000$');

INSERT INTO "public"."dim_department" ("code", "label")
VALUES ('0000', 'Executive')
ON CONFLICT ("code") DO NOTHING;

-- 2 ── positions: the org position library ───────────────────────────────────
CREATE TABLE IF NOT EXISTS "public"."positions" (
  "id"              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "org_id"          uuid NOT NULL REFERENCES "public"."orgs"("id") ON DELETE CASCADE,
  "title"           text NOT NULL,
  "department_code" text REFERENCES "public"."dim_department"("code"),
  "summary"         text,
  -- facet flag, not a lifecycle (LDP: no status columns)
  "active"          boolean NOT NULL DEFAULT true,
  "created_at"      timestamptz NOT NULL DEFAULT now(),
  "updated_at"      timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "positions_org_title_key"
  ON "public"."positions" ("org_id", lower("title"));
CREATE INDEX IF NOT EXISTS "positions_org_idx" ON "public"."positions" ("org_id");
CREATE INDEX IF NOT EXISTS "positions_department_idx" ON "public"."positions" ("department_code");

ALTER TABLE "public"."positions" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "positions_select" ON "public"."positions"
  FOR SELECT USING ("private"."is_org_member"("org_id"));
CREATE POLICY "positions_insert" ON "public"."positions"
  FOR INSERT WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner','admin','manager']));
CREATE POLICY "positions_update" ON "public"."positions"
  FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner','admin','manager']))
  WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner','admin','manager']));
CREATE POLICY "positions_delete" ON "public"."positions"
  FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner','admin']));

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "public"."positions" TO "authenticated";

COMMENT ON TABLE "public"."positions" IS
  'LEG3ND Organization pillar: the org position library (titles classed by XPMS department). Seeded by seed_org_xpms_defaults; the org chart and role assignment read from here.';

-- 3 ── seed_org_xpms_defaults: the /start base-kit install ───────────────────
CREATE OR REPLACE FUNCTION "public"."seed_org_xpms_defaults"("p_org_id" uuid)
RETURNS void
LANGUAGE "plpgsql"
SECURITY DEFINER
SET "search_path" TO 'public', 'private', 'pg_temp'
AS $$
BEGIN
  -- Only the org's owner/admin (or a JWT-less trusted server path) may seed.
  IF (SELECT auth.uid()) IS NOT NULL
     AND NOT private.has_org_role(p_org_id, ARRAY['owner','admin']) THEN
    RAISE EXCEPTION 'Only an owner or admin can install the base kit'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- 10 canonical cost centers (XPMS 2.5 SSOT Bible, 01 · Department Classes).
  INSERT INTO public.cost_centers (org_id, code, name, active)
  SELECT p_org_id, v.code, v.name, true
  FROM (VALUES
    ('0000','Executive'), ('1000','Creative'), ('2000','Talent'),
    ('3000','Marketing'), ('4000','Build'),    ('5000','Production'),
    ('6000','Operations'),('7000','Experience'),('8000','Hospitality'),
    ('9000','Technology')
  ) AS v(code, name)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.cost_centers c
    WHERE c.org_id = p_org_id AND c.code = v.code
  );

  -- Starter position per department class (editable, deletable — a seed, not
  -- a cage). Codes reference dim_department, whose kit-34 field labels are
  -- reconciled to the Bible in the P4 data migration; the POSITION titles
  -- below already follow the Bible canon.
  INSERT INTO public.positions (org_id, title, department_code)
  SELECT p_org_id, v.title, v.dept
  FROM (VALUES
    ('Executive Producer','0000'), ('Creative Director','1000'),
    ('Talent Director','2000'),    ('Marketing Director','3000'),
    ('Head Of Build','4000'),      ('Production Director','5000'),
    ('Operations Director','6000'),('Experience Director','7000'),
    ('Hospitality Director','8000'),('Technology Director','9000')
  ) AS v(title, dept)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.positions p
    WHERE p.org_id = p_org_id AND lower(p.title) = lower(v.title)
  );
END;
$$;

ALTER FUNCTION "public"."seed_org_xpms_defaults"(uuid) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."seed_org_xpms_defaults"(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."seed_org_xpms_defaults"(uuid) TO "authenticated";

COMMENT ON FUNCTION "public"."seed_org_xpms_defaults"(uuid) IS
  'LEG3ND /start base-kit install: idempotently seeds the 10 XPMS 2.5 cost centers and a starter position per department class. Owner/admin only (service paths bypass via null auth.uid()).';
