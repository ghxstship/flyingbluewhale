-- Feature: Proposal View Tracking (Rentman quote engagement parity)
-- Logs every time an external party opens a proposal in the GVTEWAY portal.
-- Operators see view counts and timestamps on the ATLVS console proposal detail.

CREATE TABLE IF NOT EXISTS "public"."proposal_views" (
  "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
  "org_id" "uuid" NOT NULL REFERENCES "public"."orgs"("id") ON DELETE CASCADE,
  "proposal_id" "uuid" NOT NULL REFERENCES "public"."proposals"("id") ON DELETE CASCADE,
  -- auth.users FK nullable — covers both authenticated portal users and
  -- future guest-link access where the viewer isn't yet on platform.
  "viewer_user_id" "uuid" REFERENCES "auth"."users"("id") ON DELETE SET NULL,
  "viewer_persona" "text",
  "viewed_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "proposal_views_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "public"."proposal_views" OWNER TO "postgres";

COMMENT ON TABLE "public"."proposal_views" IS 'Append-only log of proposal opens. One row per (proposal × viewer × session) — the API inserts at most once per 15 min per viewer to avoid duplicate-open noise. Operators read via the console proposal detail; portal users write.';

CREATE INDEX "idx_proposal_views_proposal_id" ON "public"."proposal_views" ("proposal_id");
CREATE INDEX "idx_proposal_views_org_viewed" ON "public"."proposal_views" ("org_id", "viewed_at" DESC);

ALTER TABLE "public"."proposal_views" ENABLE ROW LEVEL SECURITY;

-- Org members can read all views for their org's proposals
CREATE POLICY "proposal_views_select_org_members"
  ON "public"."proposal_views"
  FOR SELECT
  TO authenticated
  USING ("private"."is_org_member"("org_id"));

-- Any authenticated user can insert a view (portal users are authed)
CREATE POLICY "proposal_views_insert_authenticated"
  ON "public"."proposal_views"
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
