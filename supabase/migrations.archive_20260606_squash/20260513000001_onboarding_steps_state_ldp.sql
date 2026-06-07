-- ============================================================================
-- LDP §NAMING DISCIPLINE remediation: onboarding_steps.status (text + CHECK)
-- → onboarding_steps.step_state (typed enum onboarding_step_state).
--
-- Background: 0007_onboarding_v2_industry_lead.sql predates the Lifecycle
-- Decomposition Protocol and shipped a `status text` column with an inline
-- CHECK against five canonical operational values. LDP §NAMING DISCIPLINE
-- bans new `status` columns; the canonical name for a cyclical operational
-- lifecycle is `*_state` typed as an enum.
--
-- This migration:
--   1. Creates the `onboarding_step_state` enum from the existing CHECK
--      values (pending / in_progress / done / waived / blocked).
--   2. Adds typed column `step_state` and backfills from `status`.
--   3. Drops legacy indexes that referenced `status` and rebuilds the
--      equivalents against `step_state`.
--   4. Drops the legacy `status` column (cascades the auto-named CHECK).
--   5. Adds the LDP-canonical append-only transition log table
--      `onboarding_step_state_transitions` with RLS, matching the pattern
--      established by `subscription_state_transitions` and
--      `uis_role_state_transitions` in 0020_ldp_lifecycle_remediations_
--      reconciled.sql.
--
-- Live state at apply (verified 2026-05-13 via execute_sql):
--   - 110 rows in public.onboarding_steps, all status='pending'
--   - no `onboarding_step_state` enum yet
--   - CHECK constraint name auto-generated (dropped via column-drop)
--   - 2 status-bound indexes: `onboarding_steps_letter_status_idx`
--     and `onboarding_steps_due_idx` (partial, filters status NOT IN done/waived)
-- ============================================================================

BEGIN;

-- 1. Enum.
DO $$ BEGIN
    CREATE TYPE "public"."onboarding_step_state" AS ENUM (
        'pending',
        'in_progress',
        'done',
        'waived',
        'blocked'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Typed column + backfill.
ALTER TABLE "public"."onboarding_steps"
    ADD COLUMN IF NOT EXISTS "step_state" "public"."onboarding_step_state"
        NOT NULL DEFAULT 'pending';

UPDATE "public"."onboarding_steps"
    SET "step_state" = "status"::"public"."onboarding_step_state"
    WHERE "step_state" = 'pending' AND "status" <> 'pending';

-- 3. Rebuild indexes against step_state.
DROP INDEX IF EXISTS "public"."onboarding_steps_letter_status_idx";
DROP INDEX IF EXISTS "public"."onboarding_steps_due_idx";

CREATE INDEX IF NOT EXISTS "onboarding_steps_letter_state_idx"
    ON "public"."onboarding_steps" ("offer_letter_id", "step_state");

CREATE INDEX IF NOT EXISTS "onboarding_steps_due_idx"
    ON "public"."onboarding_steps" ("due_at")
    WHERE "step_state" NOT IN ('done','waived');

-- 4. Drop the legacy text column (cascades the auto-named CHECK).
ALTER TABLE "public"."onboarding_steps" DROP COLUMN IF EXISTS "status";

-- 5. Append-only transition log.
CREATE TABLE IF NOT EXISTS "public"."onboarding_step_state_transitions" (
    "id"              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "org_id"          uuid NOT NULL REFERENCES "public"."orgs"("id") ON DELETE CASCADE,
    "step_id"         uuid NOT NULL REFERENCES "public"."onboarding_steps"("id") ON DELETE CASCADE,
    "from_state"      "public"."onboarding_step_state",
    "to_state"        "public"."onboarding_step_state" NOT NULL,
    "transitioned_at" timestamptz NOT NULL DEFAULT now(),
    "transitioned_by" uuid,
    "reason"          text,
    "correlation_id"  uuid
);

CREATE INDEX IF NOT EXISTS "onboarding_step_state_transitions_step_idx"
    ON "public"."onboarding_step_state_transitions" ("step_id", "transitioned_at" DESC);

CREATE INDEX IF NOT EXISTS "onboarding_step_state_transitions_org_idx"
    ON "public"."onboarding_step_state_transitions" ("org_id", "transitioned_at" DESC);

ALTER TABLE "public"."onboarding_step_state_transitions" ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "onboarding_step_state_transitions_select_org_member"
        ON "public"."onboarding_step_state_transitions"
        FOR SELECT USING ("private"."is_org_member"(org_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "onboarding_step_state_transitions_insert_collab"
        ON "public"."onboarding_step_state_transitions"
        FOR INSERT
        WITH CHECK ("private"."has_org_role"(org_id, ARRAY['owner','admin','controller','collaborator']));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMIT;
