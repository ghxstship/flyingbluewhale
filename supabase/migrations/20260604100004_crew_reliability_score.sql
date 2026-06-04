-- ============================================================
-- Crew Reliability Score (competitive: Nowsta intelligent shift matching)
-- ============================================================
-- Adds a computed reliability score to crew_members that feeds the AI
-- crew suggestion engine. Score is 0–100, null = not yet computed.
-- The application layer updates this via the /api/v1/crew/suggest
-- endpoint's side-effect path; a background job can batch-update it
-- for the full org roster.
-- ============================================================

ALTER TABLE "public"."crew_members"
    ADD COLUMN IF NOT EXISTS "reliability_score"      smallint
        CONSTRAINT "crew_reliability_score_range" CHECK (reliability_score BETWEEN 0 AND 100),
    ADD COLUMN IF NOT EXISTS "reliability_score_at"   timestamptz,
    -- last-known skills/specialties array for fast suggest queries
    ADD COLUMN IF NOT EXISTS "skill_tags"             text[] DEFAULT '{}'::text[] NOT NULL,
    -- preferred-roles captured during onboarding or from past assignments
    ADD COLUMN IF NOT EXISTS "preferred_roles"        text[] DEFAULT '{}'::text[] NOT NULL;

COMMENT ON COLUMN "public"."crew_members"."reliability_score"
    IS 'Computed 0-100 reliability score (Nowsta parity). Based on: show-rate, on-time punches, incident-free shifts, review ratings. Null = not yet scored.';

COMMENT ON COLUMN "public"."crew_members"."skill_tags"
    IS 'Free-form skill/cert tags (e.g. ["rigger", "forklift", "first_aid"]) surfaced in AI crew suggestions.';

-- Speed up the suggest query: crew by org + skill overlap
CREATE INDEX IF NOT EXISTS "crew_members_skill_tags_gin_idx"
    ON "public"."crew_members" USING gin ("skill_tags")
    WHERE "deleted_at" IS NULL;
