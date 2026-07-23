-- L-P2 · Unified Template Library + Configurator v1 (LEG3ND program,
-- reports/LEGEND_READINESS_2026-07/PROGRAM.md).
--
-- The 29-type document registry is CODE (src/lib/documents/registry.ts) — orgs
-- cannot fork it, but they need org-level control over which doc types their
-- operators are offered and which white-label brand mode a type defaults to.
-- One row per (org, doc_type) OVERRIDE; absence of a row means the registry
-- default (enabled, no default brand).
--
-- Enforcement rule (documented here and at every consumer): a DISABLED doc
-- type is hidden from creation pickers (the /studio/documents hub grid and the
-- LEG3ND library doc section) but STAYS renderable for existing records — the
-- /studio/documents/[docType]?recordId= route and the documents API keep
-- working so history never breaks.
--
-- LDP: no lifecycle here — `enabled` is a configuration boolean (like
-- project_templates.enabled), not a cyclical state machine; no *_state/*_phase
-- column is warranted and no bare `status` column exists.
CREATE TABLE IF NOT EXISTS "public"."org_doc_template_settings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "org_id" uuid NOT NULL REFERENCES "public"."orgs"("id") ON DELETE CASCADE,
  -- Matches a registry template id (e.g. 'proposal', 'invoice', 'callSheet').
  -- Text on purpose: the registry is app-code SSOT; the app validates ids
  -- against DOC_TEMPLATES at the action boundary. Rows for retired ids are
  -- inert (the registry no longer offers them at all).
  "doc_type" text NOT NULL CHECK (char_length("doc_type") BETWEEN 1 AND 64),
  "enabled" boolean NOT NULL DEFAULT true,
  -- The org's default white-label mode for this doc type, per the kit's
  -- data-brand modes. NULL = the viewer's own default (ATLVS for samples,
  -- co-brand for bound records).
  "default_brand" text CHECK ("default_brand" IN ('atlvs', 'co', 'white')),
  "notes" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "org_doc_template_settings_org_doc_type_uq" UNIQUE ("org_id", "doc_type")
);

CREATE INDEX IF NOT EXISTS "org_doc_template_settings_org_idx"
  ON "public"."org_doc_template_settings" ("org_id");

ALTER TABLE "public"."org_doc_template_settings" ENABLE ROW LEVEL SECURITY;

-- Reads: any org member (pickers must filter for everyone). Writes: the
-- manager band — shaping the org's offered document library is library
-- configuration, same band as org_advance_presets / field_templates.
CREATE POLICY "org_doc_template_settings_select" ON "public"."org_doc_template_settings"
  FOR SELECT TO "authenticated" USING ("private"."is_org_member"("org_id"));

CREATE POLICY "org_doc_template_settings_iud" ON "public"."org_doc_template_settings"
  TO "authenticated"
  USING ("private"."has_org_role"("org_id", ARRAY['owner'::text,'admin'::text,'manager'::text,'controller'::text,'collaborator'::text]))
  WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::text,'admin'::text,'manager'::text,'controller'::text,'collaborator'::text]));

-- pg default ACL grants anon SELECT on every new table — revoke explicitly.
REVOKE ALL ON TABLE "public"."org_doc_template_settings" FROM "anon";
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "public"."org_doc_template_settings" TO "authenticated";

CREATE TRIGGER "tg_touch_org_doc_template_settings"
  BEFORE UPDATE ON "public"."org_doc_template_settings"
  FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();
