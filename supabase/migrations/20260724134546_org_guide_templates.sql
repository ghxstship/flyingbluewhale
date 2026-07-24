-- Org-level guide templates (template-management program, 2026-07-24).
--
-- Event guides (Boarding Pass) were the only repeated per-project artifact
-- with NO org-level template tier: every `event_guides` row is a one-off
-- (project, persona) config. This adds the org template layer following the
-- advance-preset precedent ("configure once, every project inherits"):
--
--   org_guide_templates          — the org's reusable guide configs
--   event_guides.template_id     — provenance: which template seeded a guide
--
-- Authoring flow: "Save as org template" from a project guide captures its
-- config here (state 'draft'); publish makes it seedable; "Start from
-- template" upserts a project guide from a published template and records
-- provenance. Managed in the LEG3ND unified template library
-- (/legend/hub/templates, `guide` family).
--
-- LDP: `template_state` is a cyclical operational state (draft → published →
-- archived, publish is reversible) — *_state per NAMING DISCIPLINE.
CREATE TYPE "public"."guide_template_state" AS ENUM ('draft', 'published', 'archived');

CREATE TABLE IF NOT EXISTS "public"."org_guide_templates" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "org_id" uuid NOT NULL REFERENCES "public"."orgs"("id") ON DELETE CASCADE,
  "persona" "public"."guide_persona" NOT NULL,
  "name" text NOT NULL CHECK (char_length("name") BETWEEN 1 AND 200),
  "description" text,
  -- The GuideConfig JSON (same shape event_guides.config carries).
  "config" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "template_state" "public"."guide_template_state" NOT NULL DEFAULT 'draft',
  -- Provenance: the project guide this template was captured from (if any).
  "source_project_id" uuid REFERENCES "public"."projects"("id") ON DELETE SET NULL,
  "created_by" uuid REFERENCES "auth"."users"("id") ON DELETE SET NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz
);

CREATE INDEX IF NOT EXISTS "org_guide_templates_org_idx"
  ON "public"."org_guide_templates" ("org_id") WHERE "deleted_at" IS NULL;
CREATE INDEX IF NOT EXISTS "org_guide_templates_source_project_idx"
  ON "public"."org_guide_templates" ("source_project_id");

ALTER TABLE "public"."org_guide_templates" ENABLE ROW LEVEL SECURITY;

-- Reads: any org member (the seeding picker must list for editors). Writes:
-- the manager band — same band as org_advance_presets / org_doc_template_settings.
CREATE POLICY "org_guide_templates_select" ON "public"."org_guide_templates"
  FOR SELECT TO "authenticated" USING ("private"."is_org_member"("org_id"));

CREATE POLICY "org_guide_templates_iud" ON "public"."org_guide_templates"
  TO "authenticated"
  USING ("private"."has_org_role"("org_id", ARRAY['owner'::text,'admin'::text,'manager'::text,'controller'::text,'collaborator'::text]))
  WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::text,'admin'::text,'manager'::text,'controller'::text,'collaborator'::text]));

-- pg default ACL grants anon SELECT on every new table — revoke explicitly.
REVOKE ALL ON TABLE "public"."org_guide_templates" FROM "anon";
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "public"."org_guide_templates" TO "authenticated";

CREATE TRIGGER "tg_touch_org_guide_templates"
  BEFORE UPDATE ON "public"."org_guide_templates"
  FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();

-- Provenance on the instance: which org template seeded this project guide.
ALTER TABLE "public"."event_guides"
  ADD COLUMN IF NOT EXISTS "template_id" uuid REFERENCES "public"."org_guide_templates"("id") ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS "event_guides_template_id_idx"
  ON "public"."event_guides" ("template_id");
