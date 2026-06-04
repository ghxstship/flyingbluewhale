-- ============================================================
-- Incident AI Triage (competitive: Momentus/WeTrack AI Risk Profiling)
-- ============================================================
-- Adds structured AI triage output to incidents. The ai_summary column
-- already exists (free-text); this adds a typed JSONB column for the
-- machine-readable triage: severity recommendation, categorisation,
-- similar incident refs, and suggested immediate actions.
-- ============================================================

ALTER TABLE "public"."incidents"
    ADD COLUMN IF NOT EXISTS "ai_triage"            jsonb,
    ADD COLUMN IF NOT EXISTS "ai_triage_at"         timestamptz,
    ADD COLUMN IF NOT EXISTS "ai_triage_model"      text;

COMMENT ON COLUMN "public"."incidents"."ai_triage"
    IS 'Structured AI triage output: {severity_rec, category, confidence, immediate_actions[], risk_factors[], similar_incident_ids[]}. See /api/v1/incidents/[id]/triage.';

COMMENT ON COLUMN "public"."incidents"."ai_triage_at"
    IS 'When the triage was last generated. Used to surface "stale triage" warnings.';

-- Index so the digest query can quickly find untriaged incidents
CREATE INDEX IF NOT EXISTS "incidents_ai_triage_null_idx"
    ON "public"."incidents" ("org_id", "created_at" DESC)
    WHERE "ai_triage" IS NULL AND "status" = 'open';
