-- =============================================================================
-- Open Shifts Board (Rentman Job Board / LASSO parity).
--
-- Org operators post available shifts; crew members and freelancers apply.
-- Public shifts are discoverable at /marketplace/shifts.
--
-- Two tables:
--   open_shifts            — the posting (one per slot group)
--   open_shift_applications — individual applications against a posting
--
-- LDP naming:
--   open_shifts.shift_state         — cyclical operational lifecycle
--   open_shift_applications.application_state — cyclical operational lifecycle
-- No `status` columns.
-- =============================================================================

BEGIN;

-- Lifecycle enums.
DO $$ BEGIN
  CREATE TYPE "public"."open_shift_state" AS ENUM (
    'draft', 'open', 'closed', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."open_shift_application_state" AS ENUM (
    'pending', 'accepted', 'rejected', 'withdrawn'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "public"."open_shifts" (
  "id"               uuid DEFAULT gen_random_uuid() NOT NULL,
  "org_id"           uuid NOT NULL REFERENCES "public"."orgs"("id") ON DELETE CASCADE,
  "project_id"       uuid REFERENCES "public"."projects"("id") ON DELETE CASCADE,
  "title"            text NOT NULL,
  "description"      text,
  "role"             text,
  "required_skills"  text[] DEFAULT '{}'::text[] NOT NULL,
  "starts_at"        timestamptz NOT NULL,
  "ends_at"          timestamptz NOT NULL,
  "location_id"      uuid REFERENCES "public"."locations"("id") ON DELETE SET NULL,
  "rate_cents"       integer,
  "rate_currency"    text DEFAULT 'USD' NOT NULL,
  "slots_total"      smallint DEFAULT 1 NOT NULL,
  "slots_filled"     smallint DEFAULT 0 NOT NULL,
  "is_public"        boolean DEFAULT false NOT NULL,
  "public_slug"      text UNIQUE,
  "shift_state"      "public"."open_shift_state" DEFAULT 'draft' NOT NULL,
  "created_by"       uuid REFERENCES "public"."users"("id") ON DELETE SET NULL,
  "created_at"       timestamptz DEFAULT now() NOT NULL,
  "updated_at"       timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "open_shifts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "open_shifts_dates_check" CHECK ("ends_at" > "starts_at"),
  CONSTRAINT "open_shifts_slots_check" CHECK ("slots_total" >= 1 AND "slots_filled" >= 0 AND "slots_filled" <= "slots_total"),
  CONSTRAINT "open_shifts_currency_check" CHECK ("rate_currency" ~ '^[A-Z]{3}$')
);

CREATE TABLE IF NOT EXISTS "public"."open_shift_applications" (
  "id"                  uuid DEFAULT gen_random_uuid() NOT NULL,
  "open_shift_id"       uuid NOT NULL REFERENCES "public"."open_shifts"("id") ON DELETE CASCADE,
  "user_id"             uuid NOT NULL,
  "org_id"              uuid NOT NULL,
  "cover_note"          text,
  "application_state"   "public"."open_shift_application_state" DEFAULT 'pending' NOT NULL,
  "created_at"          timestamptz DEFAULT now() NOT NULL,
  "updated_at"          timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "open_shift_applications_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "open_shift_applications_unique" UNIQUE ("open_shift_id", "user_id")
);

-- RLS — open_shifts
ALTER TABLE "public"."open_shifts" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "open_shifts_org_all" ON "public"."open_shifts"
  USING (
    (SELECT auth.uid()) IN (
      SELECT user_id FROM "public"."memberships"
      WHERE org_id = "open_shifts"."org_id" AND deleted_at IS NULL
    )
  );

CREATE POLICY "open_shifts_public_read" ON "public"."open_shifts"
  FOR SELECT USING ("is_public" = true AND "shift_state" = 'open');

-- RLS — open_shift_applications
ALTER TABLE "public"."open_shift_applications" ENABLE ROW LEVEL SECURITY;

-- Applicant can manage their own rows.
CREATE POLICY "open_shift_applications_self" ON "public"."open_shift_applications"
  USING ("user_id" = (SELECT auth.uid()));

-- Org members can read applications for their shifts.
CREATE POLICY "open_shift_applications_org_read" ON "public"."open_shift_applications"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "public"."open_shifts" s
      JOIN "public"."memberships" m ON m.org_id = s.org_id
      WHERE s.id = "open_shift_applications"."open_shift_id"
        AND m.user_id = (SELECT auth.uid())
        AND m.deleted_at IS NULL
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS "open_shifts_org_id_idx"     ON "public"."open_shifts"("org_id");
CREATE INDEX IF NOT EXISTS "open_shifts_project_id_idx" ON "public"."open_shifts"("project_id");
CREATE INDEX IF NOT EXISTS "open_shifts_state_public_idx" ON "public"."open_shifts"("shift_state", "is_public");
CREATE INDEX IF NOT EXISTS "open_shifts_starts_at_idx"  ON "public"."open_shifts"("starts_at");
CREATE INDEX IF NOT EXISTS "osa_shift_id_idx"  ON "public"."open_shift_applications"("open_shift_id");
CREATE INDEX IF NOT EXISTS "osa_user_id_idx"   ON "public"."open_shift_applications"("user_id");

-- Public view (security definer mirrors the marketplace public_* pattern).
CREATE OR REPLACE VIEW "public"."public_open_shifts" WITH ("security_invoker"='true') AS
  SELECT
    s.id, s.org_id, s.project_id, s.title, s.description, s.role,
    s.required_skills, s.starts_at, s.ends_at, s.rate_cents, s.rate_currency,
    s.slots_total, s.slots_filled, s.public_slug, s.created_at,
    o.name AS org_name
  FROM "public"."open_shifts" s
  JOIN "public"."orgs" o ON o.id = s.org_id
  WHERE s.is_public = true AND s.shift_state = 'open';

COMMIT;
