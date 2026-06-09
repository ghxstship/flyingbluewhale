-- Migration: competitive feature parity
-- 1. Social links on talent profiles (Casting Networks parity — TikTok/YouTube/Instagram with follower metrics)
-- 2. Guest open-call submissions (Casting Networks Oct-2025 parity — no login required)
-- 3. Workforce demand forecast rows (Connecteam/Deputy labor-cost forecasting parity)

-- ─────────────────────────────────────────────────────────
-- 1. talent_profiles.social_links
-- ─────────────────────────────────────────────────────────
-- Schema: { instagram?: {handle,followers}, tiktok?: {handle,followers},
--           youtube?: {handle,subscribers}, spotify?: {handle,monthly_listeners},
--           twitter?: {handle,followers}, linkedin?: {handle} }
ALTER TABLE "public"."talent_profiles"
  ADD COLUMN IF NOT EXISTS "social_links" JSONB NOT NULL DEFAULT '{}';

COMMENT ON COLUMN "public"."talent_profiles"."social_links"
  IS 'Platform social handles + follower counts. Keys: instagram, tiktok, youtube, spotify, twitter, linkedin. Values: {handle:string, followers?:number, subscribers?:number, monthly_listeners?:number}';

-- ─────────────────────────────────────────────────────────
-- 2. Guest open-call submissions
-- ─────────────────────────────────────────────────────────
-- Allow unauthenticated submissions: make submitter_user_id optional and
-- capture name+email for guests (claimed when they eventually sign up).
ALTER TABLE "public"."open_call_submissions"
  ALTER COLUMN "submitter_user_id" DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS "guest_name"  TEXT,
  ADD COLUMN IF NOT EXISTS "guest_email" TEXT,
  ADD COLUMN IF NOT EXISTS "media_links" JSONB NOT NULL DEFAULT '[]';

-- CHECK: a submission must have either a logged-in user OR guest contact details.
ALTER TABLE "public"."open_call_submissions"
  ADD CONSTRAINT "open_call_submissions_identity_check"
  CHECK (
    submitter_user_id IS NOT NULL
    OR (guest_name IS NOT NULL AND guest_email IS NOT NULL)
  );

COMMENT ON COLUMN "public"."open_call_submissions"."guest_name"
  IS 'Name for unauthenticated (guest) submitters. Null when submitter_user_id is set.';
COMMENT ON COLUMN "public"."open_call_submissions"."guest_email"
  IS 'Email for unauthenticated submitters. Used for claim-on-signup matching.';
COMMENT ON COLUMN "public"."open_call_submissions"."media_links"
  IS 'Array of {url,label} objects — links to reel, portfolio, demo tracks, etc.';

-- Allow anonymous role to insert into open_call_submissions (guest flow).
-- RLS already requires open_call_id to reference a published open_call.
-- We add a narrow anon-insert policy: open call must be live (status='published').
CREATE POLICY "anon_submit_open_calls"
  ON "public"."open_call_submissions"
  AS PERMISSIVE
  FOR INSERT
  TO anon
  WITH CHECK (
    submitter_user_id IS NULL
    AND guest_name IS NOT NULL
    AND guest_email IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.open_calls oc
      WHERE oc.id = open_call_id
        AND oc.status = 'published'
    )
  );

-- ─────────────────────────────────────────────────────────
-- 3. workforce_demand_forecasts
-- ─────────────────────────────────────────────────────────
-- Lightweight demand-forecast rows: expected labor hours + cost by date
-- for each org/project. Feeds the /console/workforce/forecast UI
-- (Connecteam "Projected Sales + Labor %" parity).
CREATE TABLE IF NOT EXISTS "public"."workforce_demand_forecasts" (
  "id"              UUID DEFAULT gen_random_uuid() NOT NULL,
  "org_id"          UUID NOT NULL REFERENCES "public"."orgs"("id") ON DELETE CASCADE,
  "project_id"      UUID REFERENCES "public"."projects"("id") ON DELETE SET NULL,
  "forecast_date"   DATE NOT NULL,
  "role_tag"        TEXT,
  "expected_hours"  NUMERIC(8,2) NOT NULL DEFAULT 0,
  "expected_cost_cents" BIGINT NOT NULL DEFAULT 0,
  "actual_hours"    NUMERIC(8,2),
  "actual_cost_cents" BIGINT,
  "notes"           TEXT,
  "created_by"      UUID REFERENCES "auth"."users"("id") ON DELETE SET NULL,
  "created_at"      TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "workforce_demand_forecasts_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "public"."workforce_demand_forecasts" OWNER TO postgres;

CREATE UNIQUE INDEX IF NOT EXISTS "workforce_demand_forecasts_org_project_date_role_uidx"
  ON "public"."workforce_demand_forecasts" ("org_id", "project_id", "forecast_date", "role_tag")
  WHERE "role_tag" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "workforce_demand_forecasts_org_project_date_uidx"
  ON "public"."workforce_demand_forecasts" ("org_id", "project_id", "forecast_date")
  WHERE "role_tag" IS NULL;

CREATE INDEX IF NOT EXISTS "workforce_demand_forecasts_org_date_idx"
  ON "public"."workforce_demand_forecasts" ("org_id", "forecast_date");

-- touch updated_at on row change
CREATE TRIGGER "touch_workforce_demand_forecasts_updated_at"
  BEFORE UPDATE ON "public"."workforce_demand_forecasts"
  FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();

-- RLS
ALTER TABLE "public"."workforce_demand_forecasts" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_read_forecasts"
  ON "public"."workforce_demand_forecasts" AS PERMISSIVE FOR SELECT
  TO authenticated
  USING ("public"."is_org_member"("org_id"));

CREATE POLICY "managers_write_forecasts"
  ON "public"."workforce_demand_forecasts" AS PERMISSIVE FOR INSERT
  TO authenticated
  WITH CHECK ("public"."has_org_role"("org_id", ARRAY['owner','admin','manager']));

CREATE POLICY "managers_update_forecasts"
  ON "public"."workforce_demand_forecasts" AS PERMISSIVE FOR UPDATE
  TO authenticated
  USING ("public"."has_org_role"("org_id", ARRAY['owner','admin','manager']));

CREATE POLICY "managers_delete_forecasts"
  ON "public"."workforce_demand_forecasts" AS PERMISSIVE FOR DELETE
  TO authenticated
  USING ("public"."has_org_role"("org_id", ARRAY['owner','admin','manager']));
