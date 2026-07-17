ALTER TABLE "public"."spaces" DROP COLUMN IF EXISTS "gated_credential";

ALTER TABLE "public"."spaces"
  ADD COLUMN IF NOT EXISTS "gated_catalog_item_id" uuid
    REFERENCES "public"."master_catalog_items"("id") ON DELETE RESTRICT;

COMMENT ON COLUMN "public"."spaces"."gated_catalog_item_id" IS
  'Kit 28 credential gate: the catalog credential a member must hold to join. NULL = open to the org. References the SKU by id, never by name — a renamed SKU must not silently open the gate.';

CREATE INDEX IF NOT EXISTS "spaces_gated_catalog_item_id_idx"
  ON "public"."spaces" ("gated_catalog_item_id");
