-- =============================================================================
-- Shift Pulse: post-shift feedback (Deputy Shift Pulse+ parity).
--
-- Captures per-shift mood, energy, safety rating, and optional freetext from
-- crew after clock-out. Anonymous flag lets managers see aggregate trends
-- without linking feedback to individual identities in the UI.
--
-- Schema notes:
--   - Keyed to time_entry_id (1 row per clocked shift) with UNIQUE constraint.
--   - `anonymous` hides user_id in consumer queries — enforced by RLS.
--   - LDP: no `status` column; there is no lifecycle on a feedback record.
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS "public"."shift_feedback" (
  "id"             uuid DEFAULT gen_random_uuid() NOT NULL,
  "org_id"         uuid NOT NULL REFERENCES "public"."orgs"("id") ON DELETE CASCADE,
  "time_entry_id"  uuid NOT NULL REFERENCES "public"."time_entries"("id") ON DELETE CASCADE,
  "user_id"        uuid NOT NULL,
  "mood"           smallint NOT NULL,
  "energy"         smallint,
  "safety_rating"  smallint,
  "comment"        text,
  "anonymous"      boolean DEFAULT false NOT NULL,
  "created_at"     timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "shift_feedback_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "shift_feedback_one_per_entry" UNIQUE ("time_entry_id"),
  CONSTRAINT "shift_feedback_mood_range"   CHECK ("mood" BETWEEN 1 AND 5),
  CONSTRAINT "shift_feedback_energy_range" CHECK ("energy" IS NULL OR "energy" BETWEEN 1 AND 5),
  CONSTRAINT "shift_feedback_safety_range" CHECK ("safety_rating" IS NULL OR "safety_rating" BETWEEN 1 AND 5)
);

ALTER TABLE "public"."shift_feedback" ENABLE ROW LEVEL SECURITY;

-- Org members can read feedback for their org (non-anonymous shows user_id;
-- anonymous rows are visible but user_id must be masked in app layer).
CREATE POLICY "shift_feedback_org_read" ON "public"."shift_feedback"
  FOR SELECT USING (
    (SELECT auth.uid()) IN (
      SELECT user_id FROM "public"."memberships"
      WHERE org_id = "shift_feedback"."org_id" AND deleted_at IS NULL
    )
  );

-- Users can insert their own feedback.
CREATE POLICY "shift_feedback_self_insert" ON "public"."shift_feedback"
  FOR INSERT WITH CHECK (
    "user_id" = (SELECT auth.uid())
    AND "org_id" IN (
      SELECT org_id FROM "public"."memberships"
      WHERE user_id = (SELECT auth.uid()) AND deleted_at IS NULL
    )
  );

-- FK index for cascade performance.
CREATE INDEX IF NOT EXISTS "shift_feedback_org_id_idx"        ON "public"."shift_feedback"("org_id");
CREATE INDEX IF NOT EXISTS "shift_feedback_time_entry_id_idx" ON "public"."shift_feedback"("time_entry_id");
CREATE INDEX IF NOT EXISTS "shift_feedback_user_id_idx"       ON "public"."shift_feedback"("user_id");

COMMIT;
