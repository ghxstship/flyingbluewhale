-- Kit 30 — Employee Lifecycle Parity & UPC Scan-To-Fulfill (schema).
--
-- The gap report's §1 shrank on contact with the repo: the engagement row
-- ALREADY exists (offer_letters: crew_member × project × role_id(org_roles) ×
-- rate_card_item_id × reports_to_crew_member_id + onsite dates), the position
-- catalog is org_roles, the rate cards are rate_card_items, and the 4-doc
-- packet rides the existing onboarding_steps engine (code-side template, no
-- schema). What the schema genuinely lacked:

-- ── 1. Catering meal-period granularity ─────────────────────────────────────
-- Sibling of credential/lodging/travel/vehicle _assignment_details (1:1 PK on
-- assignments.id). "Lunch Only · 20 Days · 20 Meals" derives from these
-- columns; the derivation lives in code (src/lib/db/assignments.ts) and is
-- unit-tested, never stored.
CREATE TABLE IF NOT EXISTS "public"."catering_assignment_details" (
  "assignment_id" uuid PRIMARY KEY REFERENCES "public"."assignments"("id") ON DELETE CASCADE,
  "meal_periods" text[] NOT NULL DEFAULT '{}'::text[]
    CHECK ("meal_periods" <@ ARRAY['breakfast','lunch','dinner']::text[]),
  "starts_on" date,
  "ends_on" date,
  "every_contract_day" boolean NOT NULL DEFAULT false,
  "excluded_dates" date[] NOT NULL DEFAULT '{}'::date[],
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CHECK ("starts_on" IS NULL OR "ends_on" IS NULL OR "ends_on" >= "starts_on")
);

ALTER TABLE "public"."catering_assignment_details" ENABLE ROW LEVEL SECURITY;

-- Mirror the sibling policies exactly (manager band writes incl. 'manager'
-- per the 20260625144337 sweep; org member OR the assignee reads).
CREATE POLICY "catering_assignment_details_select" ON "public"."catering_assignment_details"
  FOR SELECT TO "authenticated"
  USING ((EXISTS ( SELECT 1 FROM "public"."assignments" "a"
    WHERE (("a"."id" = "catering_assignment_details"."assignment_id")
      AND ("private"."is_org_member"("a"."org_id") OR ("a"."party_user_id" = ( SELECT "auth"."uid"() )))))));

CREATE POLICY "catering_assignment_details_iud" ON "public"."catering_assignment_details"
  TO "authenticated"
  USING ((EXISTS ( SELECT 1 FROM "public"."assignments" "a"
    WHERE (("a"."id" = "catering_assignment_details"."assignment_id")
      AND "private"."has_org_role"("a"."org_id", ARRAY['owner'::text,'admin'::text,'manager'::text,'controller'::text,'collaborator'::text])))))
  WITH CHECK ((EXISTS ( SELECT 1 FROM "public"."assignments" "a"
    WHERE (("a"."id" = "catering_assignment_details"."assignment_id")
      AND "private"."has_org_role"("a"."org_id", ARRAY['owner'::text,'admin'::text,'manager'::text,'controller'::text,'collaborator'::text])))));

REVOKE ALL ON TABLE "public"."catering_assignment_details" FROM "anon";
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "public"."catering_assignment_details" TO "authenticated";

CREATE TRIGGER "tg_touch_catering_assignment_details"
  BEFORE UPDATE ON "public"."catering_assignment_details"
  FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();

-- ── 2. GTIN → catalog item binding ──────────────────────────────────────────
-- DOCUMENTED DIVERGENCE from the handoff's "gtin14 PRIMARY KEY, not
-- org-scoped": master_catalog_items ARE org-scoped, so a global first-writer-
-- wins binding would resolve org A's item names for org B's scans (a
-- cross-tenant read) and block org B from ever binding its own catalog. The
-- IDENTITY of a UPC is global; the BINDING is a tenant's claim about their
-- catalog — so the key is (org_id, gtin14), gtin14 stays the canonical
-- GTIN-14 from src/lib/scan/gtin.ts, and resolution scopes by the session
-- org. UPCs stay OUT of assignment_scan_codes per
-- docs/compvss/SCANNING_UNIVERSAL_CAPTURE_PLAN.md §2.1.
CREATE TABLE IF NOT EXISTS "public"."catalog_item_gtins" (
  "org_id" uuid NOT NULL REFERENCES "public"."orgs"("id") ON DELETE CASCADE,
  "gtin14" text NOT NULL CHECK ("gtin14" ~ '^[0-9]{14}$'),
  "catalog_item_id" uuid NOT NULL REFERENCES "public"."master_catalog_items"("id") ON DELETE CASCADE,
  "bound_by" uuid REFERENCES "auth"."users"("id") ON DELETE SET NULL,
  "bound_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("org_id", "gtin14")
);

CREATE INDEX IF NOT EXISTS "catalog_item_gtins_item_idx" ON "public"."catalog_item_gtins" ("catalog_item_id");

ALTER TABLE "public"."catalog_item_gtins" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "catalog_item_gtins_select" ON "public"."catalog_item_gtins"
  FOR SELECT TO "authenticated" USING ("private"."is_org_member"("org_id"));
-- Binding is a catalog-shaping act: manager band (the Bind To Catalog Item
-- flow is people:manage-gated app-side; RLS agrees at the band level).
CREATE POLICY "catalog_item_gtins_iud" ON "public"."catalog_item_gtins"
  TO "authenticated"
  USING ("private"."has_org_role"("org_id", ARRAY['owner'::text,'admin'::text,'manager'::text,'controller'::text,'collaborator'::text]))
  WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::text,'admin'::text,'manager'::text,'controller'::text,'collaborator'::text]));

REVOKE ALL ON TABLE "public"."catalog_item_gtins" FROM "anon";
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "public"."catalog_item_gtins" TO "authenticated";

-- ── 3. Fulfillment provenance on advance lines ──────────────────────────────
-- The requested → approved → fulfilled mini-track MAPS onto the existing
-- fulfillment_state FSM (submitted/in_review → "Requested", approved →
-- "Approved", delivered/issued → "Fulfilled") — no parallel state. What was
-- missing is provenance: WHO fulfilled the line, WHEN, and whether a scan or
-- a human did it. Written exactly once when the state first reaches
-- delivered/issued.
ALTER TABLE "public"."assignments"
  ADD COLUMN IF NOT EXISTS "fulfilled_at" timestamptz,
  ADD COLUMN IF NOT EXISTS "fulfilled_by" uuid REFERENCES "auth"."users"("id") ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS "fulfilled_via" text CHECK ("fulfilled_via" IN ('scan','manual'));

COMMENT ON COLUMN "public"."assignments"."fulfilled_via" IS
  'Kit 30: how the line reached delivered/issued — ''scan'' (POS GTIN resolution confirmed it) or ''manual'' (console/mobile action). NULL for lines fulfilled before this column existed.';

CREATE INDEX IF NOT EXISTS "assignments_fulfilled_by_idx" ON "public"."assignments" ("fulfilled_by") WHERE "fulfilled_by" IS NOT NULL;
