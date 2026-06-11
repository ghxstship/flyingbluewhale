-- Recovered from supabase_migrations.schema_migrations (applied remotely via
-- MCP without a repo file — repo/remote alignment pass, 2026-06-11).
-- NOTE: the `oc.status = 'published'` predicate below predates the LDP
-- status-rename migration (20260609220000); Postgres rewrote the stored
-- policy to the renamed column automatically. Text kept verbatim as applied.

-- 1. talent_profiles.social_links
ALTER TABLE "public"."talent_profiles"
  ADD COLUMN IF NOT EXISTS "social_links" JSONB NOT NULL DEFAULT '{}';

COMMENT ON COLUMN "public"."talent_profiles"."social_links"
  IS 'Platform social handles + follower counts. Keys: instagram, tiktok, youtube, spotify, twitter, linkedin.';

-- 2. Guest open-call submissions
ALTER TABLE "public"."open_call_submissions"
  ALTER COLUMN "submitter_user_id" DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS "guest_name"  TEXT,
  ADD COLUMN IF NOT EXISTS "guest_email" TEXT,
  ADD COLUMN IF NOT EXISTS "media_links" JSONB NOT NULL DEFAULT '[]';

ALTER TABLE "public"."open_call_submissions"
  ADD CONSTRAINT "open_call_submissions_identity_check"
  CHECK (
    submitter_user_id IS NOT NULL
    OR (guest_name IS NOT NULL AND guest_email IS NOT NULL)
  );

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

-- 3. workforce_demand_forecasts
CREATE TABLE IF NOT EXISTS "public"."workforce_demand_forecasts" (
  "id"                  UUID DEFAULT gen_random_uuid() NOT NULL,
  "org_id"              UUID NOT NULL REFERENCES "public"."orgs"("id") ON DELETE CASCADE,
  "project_id"          UUID REFERENCES "public"."projects"("id") ON DELETE SET NULL,
  "forecast_date"       DATE NOT NULL,
  "role_tag"            TEXT,
  "expected_hours"      NUMERIC(8,2) NOT NULL DEFAULT 0,
  "expected_cost_cents" BIGINT NOT NULL DEFAULT 0,
  "actual_hours"        NUMERIC(8,2),
  "actual_cost_cents"   BIGINT,
  "notes"               TEXT,
  "created_by"          UUID REFERENCES "auth"."users"("id") ON DELETE SET NULL,
  "created_at"          TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "workforce_demand_forecasts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "wdf_org_project_date_role_uidx"
  ON "public"."workforce_demand_forecasts" ("org_id", "project_id", "forecast_date", "role_tag")
  WHERE "role_tag" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "wdf_org_project_date_uidx"
  ON "public"."workforce_demand_forecasts" ("org_id", "project_id", "forecast_date")
  WHERE "role_tag" IS NULL;

CREATE INDEX IF NOT EXISTS "wdf_org_date_idx"
  ON "public"."workforce_demand_forecasts" ("org_id", "forecast_date");

CREATE TRIGGER "touch_wdf_updated_at"
  BEFORE UPDATE ON "public"."workforce_demand_forecasts"
  FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();

ALTER TABLE "public"."workforce_demand_forecasts" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_read_forecasts"
  ON "public"."workforce_demand_forecasts" AS PERMISSIVE FOR SELECT
  TO authenticated
  USING (private.is_org_member("org_id"));

CREATE POLICY "managers_write_forecasts"
  ON "public"."workforce_demand_forecasts" AS PERMISSIVE FOR INSERT
  TO authenticated
  WITH CHECK (private.has_org_role("org_id", ARRAY['owner','admin','manager']));

CREATE POLICY "managers_update_forecasts"
  ON "public"."workforce_demand_forecasts" AS PERMISSIVE FOR UPDATE
  TO authenticated
  USING (private.has_org_role("org_id", ARRAY['owner','admin','manager']));

CREATE POLICY "managers_delete_forecasts"
  ON "public"."workforce_demand_forecasts" AS PERMISSIVE FOR DELETE
  TO authenticated
  USING (private.has_org_role("org_id", ARRAY['owner','admin','manager']));
