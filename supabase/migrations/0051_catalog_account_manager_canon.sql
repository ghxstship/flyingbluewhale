-- Final hardening migration. Adds three concept tables that close the
-- last operational gaps in the Connecteam-parity + advancing system:
--
--   1. master_catalog_items — the org's catalog of assignable items
--      (credentials, uniforms, equipment, vehicles, etc.) with optional
--      pricing + inventory + supplier hints. Deliverables.data{} keeps
--      freeform payload, but new assignments can now reference a
--      catalog row so admins type once and reuse forever.
--
--   2. account_manager_assignments — link between a portal recipient
--      (vendor, sponsor, delegation contact) and their primary
--      account-manager on the org side. Drives the new
--      /p/[slug]/messages surface that opens a direct chat thread
--      with the assigned AM.
--
--   3. notification_preferences existed (Phase 2.3) but didn't have a
--      canonical kind taxonomy. This migration writes a default
--      matrix scaffold + adds a `kinds` view so the /m/settings UI
--      can render a per-kind toggle grid against a known list.
--
-- All idempotent.

-- ============================================================
-- 1. master_catalog_items
-- ============================================================

DO $$ BEGIN
  CREATE TYPE public.catalog_kind AS ENUM (
    'credential', 'catering', 'radio', 'tool', 'equipment',
    'uniform', 'travel', 'lodging', 'vehicle'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "public"."master_catalog_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "org_id" uuid NOT NULL REFERENCES "public"."orgs"("id") ON DELETE CASCADE,
  "kind" public.catalog_kind NOT NULL,
  "code" text NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "unit_cost_cents" bigint,
  "currency" text DEFAULT 'USD',
  "inventory_qty" integer,
  "supplier_id" uuid REFERENCES "public"."vendors"("id") ON DELETE SET NULL,
  "active" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz,
  UNIQUE (org_id, code)
);

CREATE INDEX IF NOT EXISTS idx_master_catalog_items_org_kind
  ON "public"."master_catalog_items"(org_id, kind)
  WHERE deleted_at IS NULL AND active = true;

CREATE INDEX IF NOT EXISTS idx_master_catalog_items_supplier
  ON "public"."master_catalog_items"(supplier_id)
  WHERE supplier_id IS NOT NULL;

ALTER TABLE "public"."master_catalog_items" ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "master_catalog_items_org_rw" ON "public"."master_catalog_items"
    TO authenticated
    USING (private.is_org_member(org_id))
    WITH CHECK (private.is_org_member(org_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Link deliverables (per-individual assignments) back to the catalog
-- row they originated from, so reporting can roll up "how many comp
-- catering meals issued this show" cheaply.
ALTER TABLE "public"."deliverables"
  ADD COLUMN IF NOT EXISTS "catalog_item_id" uuid REFERENCES "public"."master_catalog_items"("id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_deliverables_catalog_item_id
  ON "public"."deliverables"(catalog_item_id) WHERE catalog_item_id IS NOT NULL;

-- ============================================================
-- 2. account_manager_assignments
-- ============================================================

CREATE TABLE IF NOT EXISTS "public"."account_manager_assignments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "org_id" uuid NOT NULL REFERENCES "public"."orgs"("id") ON DELETE CASCADE,
  "project_id" uuid REFERENCES "public"."projects"("id") ON DELETE CASCADE,
  -- The portal recipient (external user reachable through GVTEWAY).
  "portal_user_id" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- The account manager on the internal org side.
  "manager_user_id" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Persona context — same portal user could have different AMs for
  -- different relationships ("their vendor AM" vs "their sponsor AM").
  "persona" text NOT NULL CHECK (persona IN (
    'artist','athlete','client','crew','delegation','guest','hospitality',
    'media','producer','promoter','sponsor','stakeholder','vendor','vip','volunteer'
  )),
  -- A chat_rooms row owned by this pairing. NULL until first message.
  "chat_room_id" uuid REFERENCES "public"."chat_rooms"("id") ON DELETE SET NULL,
  "active" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, portal_user_id, persona, project_id)
);

CREATE INDEX IF NOT EXISTS idx_am_assignments_portal_user
  ON "public"."account_manager_assignments"(portal_user_id, persona) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_am_assignments_manager_user
  ON "public"."account_manager_assignments"(manager_user_id) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_am_assignments_org_id
  ON "public"."account_manager_assignments"(org_id);

ALTER TABLE "public"."account_manager_assignments" ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "am_assignments_self_or_org" ON "public"."account_manager_assignments"
    TO authenticated
    USING (portal_user_id = (SELECT auth.uid()) OR manager_user_id = (SELECT auth.uid()) OR private.is_org_member(org_id))
    WITH CHECK (private.is_org_member(org_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- 3. Canonical notification kinds (read-side view)
-- ============================================================

-- A static view + comment that tooling can read to produce the toggle
-- grid on /m/settings/notifications. The values mirror the event tags
-- pushed by the application (see src/lib/push/send.ts callers).
CREATE OR REPLACE VIEW public.notification_kind_catalog AS
SELECT * FROM (VALUES
  ('announcement',    'Updates',     'Org-wide announcements'),
  ('chat',            'Chat',        'Direct messages and channels'),
  ('kudos',           'Kudos',       'Recognition posts'),
  ('badge',           'Badges',      'Awards from your org'),
  ('advancing',       'Advancing',   'New catalog items assigned to you'),
  ('advancing_state', 'Advancing state', 'State changes on items you own'),
  ('shift_swap',      'Shift Swap',  'Swap request decisions'),
  ('time_off',        'Time Off',    'Time-off request decisions'),
  ('course',          'Courses',     'Course assignments + pass results'),
  ('incident',        'Incidents',   'Field incident updates (manager+ only)')
) AS t(kind, label, description);

COMMENT ON VIEW public.notification_kind_catalog IS
  'Canonical event-kind list rendered as toggles on /m/settings/notifications. Keep in sync with the push tag prefixes in src/lib/push/send.ts callers.';

GRANT SELECT ON public.notification_kind_catalog TO authenticated;
