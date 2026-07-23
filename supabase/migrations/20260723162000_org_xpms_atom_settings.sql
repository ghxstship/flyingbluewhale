-- org_xpms_atom_settings — the org overlay on the XPMS 2.5 master catalog
-- (LEG3ND readiness program P4, reports/LEGEND_READINESS_2026-07/PROGRAM.md).
--
-- Positioning: LEG3ND ships the XPMS 2.5 base kit with ORG-LEVEL
-- customizations. The master catalog (public.xpms_catalog, global, RLS
-- read-only to authenticated) stays the immutable SSOT — orgs never edit
-- atoms. This table is settings-over-catalog: one row per (org × atom) that
-- an org has customized. Absence of a row means "catalog defaults" (enabled,
-- canonical label). Disable is a FLAG, never a delete or a mask — every hub
-- surface renders the full catalog and badges disabled atoms, guarded by
-- src/lib/xpms/atom-overlay.test.ts.
--
-- Key shape: xpms_catalog's PK is xpms_atom_id text ('{URID}-{SEQ}', e.g.
-- '5000.10.05-014'). ON DELETE CASCADE is nominal only — the catalog is
-- append-only, version-forward.

CREATE TABLE IF NOT EXISTS "public"."org_xpms_atom_settings" (
  "id"           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "org_id"       uuid NOT NULL REFERENCES "public"."orgs"("id") ON DELETE CASCADE,
  "xpms_atom_id" text NOT NULL REFERENCES "public"."xpms_catalog"("xpms_atom_id") ON DELETE CASCADE,
  -- Facet flag, not a lifecycle (LDP: no status columns). false = the org
  -- hides this atom from ITS pickers/intakes; the catalog row itself is
  -- untouched and still rendered (flagged) on the hub browse surface.
  "enabled"      boolean NOT NULL DEFAULT true,
  -- Org vocabulary override for the atom's display label. NULL = canonical
  -- catalog name. Never rewrites xpms_catalog.name.
  "org_label"    text,
  "notes"        text,
  "created_at"   timestamptz NOT NULL DEFAULT now(),
  "updated_at"   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "org_xpms_atom_settings_org_atom_key" UNIQUE ("org_id", "xpms_atom_id"),
  CONSTRAINT "org_xpms_atom_settings_org_label_len" CHECK ("org_label" IS NULL OR char_length("org_label") BETWEEN 1 AND 200)
);

CREATE INDEX IF NOT EXISTS "org_xpms_atom_settings_org_idx"
  ON "public"."org_xpms_atom_settings" ("org_id");
CREATE INDEX IF NOT EXISTS "org_xpms_atom_settings_atom_idx"
  ON "public"."org_xpms_atom_settings" ("xpms_atom_id");

CREATE OR REPLACE TRIGGER "tg_org_xpms_atom_settings_updated_at"
  BEFORE UPDATE ON "public"."org_xpms_atom_settings"
  FOR EACH ROW EXECUTE FUNCTION "private"."touch_updated_at"();

ALTER TABLE "public"."org_xpms_atom_settings" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_xpms_atom_settings_select" ON "public"."org_xpms_atom_settings"
  FOR SELECT USING ("private"."is_org_member"("org_id"));
CREATE POLICY "org_xpms_atom_settings_insert" ON "public"."org_xpms_atom_settings"
  FOR INSERT WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner','admin','manager']));
CREATE POLICY "org_xpms_atom_settings_update" ON "public"."org_xpms_atom_settings"
  FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner','admin','manager']))
  WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner','admin','manager']));
CREATE POLICY "org_xpms_atom_settings_delete" ON "public"."org_xpms_atom_settings"
  FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner','admin']));

-- pg_default_acl gotcha: strip default anon grants.
REVOKE ALL ON TABLE "public"."org_xpms_atom_settings" FROM "anon";

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "public"."org_xpms_atom_settings" TO "authenticated";

COMMENT ON TABLE "public"."org_xpms_atom_settings" IS
  'LEG3ND XPMS pillar: per-org settings overlay on the immutable xpms_catalog master (enable/disable flag + org label override). Absence of a row = catalog defaults. Disable is a flag, never a mask — surfaces render the full catalog.';
COMMENT ON COLUMN "public"."org_xpms_atom_settings"."enabled" IS
  'Facet flag (LDP). false hides the atom from the org''s pickers; the hub browse surface still lists it, badged Disabled.';
COMMENT ON COLUMN "public"."org_xpms_atom_settings"."org_label" IS
  'Org vocabulary override for display. NULL = canonical xpms_catalog.name.';
