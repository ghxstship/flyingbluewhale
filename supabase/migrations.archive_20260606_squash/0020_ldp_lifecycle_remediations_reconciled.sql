-- LDP Phase 5 remediation — RECONCILED with USNP canon already on remote.
--
-- Discovery during pre-flight (2026-05-09): the prior 5 migration files
-- 20260509000001..000005 were authored before reading the live remote
-- schema. The remote already implements most of LDP via USNP canon
-- (shipped 2026-05-08):
--
--   - LDP §5 Engagement → uis_roles.lifecycle_state uis_lifecycle_state
--     (values: discovered..archived — exact LDP match) and uis_roles
--     keys per Party × Project × channel × role_class with 23 role
--     classes. Better than the engagement_state column on project_members
--     I had proposed.
--
--   - LDP §3 Asset → asset_movements (USNP version) keyed off ual_state
--     enum with all 9 LDP-canonical states (acquired..lost).
--
--   - LDP §7 Financial Period → accounting_periods (org_id, period_label,
--     starts_on, ends_on, status, closed_at, closed_by). Status is text
--     not enum but the lifecycle exists.
--
-- This migration applies only the additive bits that are NOT yet covered
-- by USNP canon. The earlier 5 files remain in repo as an archive of the
-- original audit's proposed remediations; they should NOT be applied.
--
-- Net-new in this migration:
--   1. subscription_state + subscription_kind enums
--   2. subscriptions table (HVRBOR-style recurring — LDP §8, not in USNP)
--   3. subscription_state_transitions append-only log
--   4. uis_role_state_transitions append-only log keyed to uis_roles.id
--      (USNP UIS has the lifecycle_state column but no transitions log)
--   5. accounting_period_state enum (typed) + accounting_periods.state
--      column population from existing text status (LDP-naming alignment;
--      keeps text status for back-compat)
--   6. production_phase enum + fabrication_orders.production_phase column
--      (LDP §2 — distinct from existing fabrication_orders.status text)
--   7. offer_letter_status +COUNTERSIGNED, ACTIVE, SUPERSEDED, VOIDED
--      values (LDP §6 — net-new on existing offer letter machine)
--   8. ALTER TYPE proposal_phase_status RENAME TO proposal_phase_state
--      (LDP-naming alignment cosmetic)
--
-- Skipped (USNP canon already covers):
--   - engagement_state enum / engagement_state_transitions / column on
--     project_members → use uis_roles.lifecycle_state instead
--   - period_kind enum → accounting_periods uses text period_label
--   - financial_periods table → accounting_periods is canonical
--   - period_state_transitions → would gate on financial_periods (skip)
--   - asset_movements table → USNP version exists with ual_state typing
--   - equipment_status +4 values → ual_state is the canonical UAL enum;
--     equipment_status legacy stays as-is to avoid breaking consumers
--
-- All operations use IF NOT EXISTS / EXCEPTION WHEN duplicate_object.
-- Re-running this migration is idempotent and safe.

-- ============================================================================
-- 1 & 2. Subscription Lifecycle (LDP §8) — entirely net-new
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE "public"."subscription_state" AS ENUM (
        'PROSPECT','TRIAL','ACTIVE','RENEWED','LAPSED','REACTIVATED','CHURNED','ARCHIVED'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE "public"."subscription_kind" AS ENUM (
        'MEMBER','RETAINER','RECURRING_SPONSOR','PLATFORM_PLAN'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
    "id"                       uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "org_id"                   uuid NOT NULL REFERENCES "public"."orgs"("id") ON DELETE CASCADE,
    "party_id"                 uuid,
    "kind"                     subscription_kind NOT NULL,
    "state"                    subscription_state NOT NULL DEFAULT 'PROSPECT',
    "label"                    text NOT NULL,
    "started_at"               timestamptz,
    "trial_ends_at"            timestamptz,
    "renewed_at"               timestamptz,
    "lapsed_at"                timestamptz,
    "reactivated_at"           timestamptz,
    "churned_at"               timestamptz,
    "archived_at"              timestamptz,
    "renewal_cadence_months"   integer CHECK (renewal_cadence_months IS NULL OR renewal_cadence_months > 0),
    "stripe_subscription_id"   text,
    "metadata"                 jsonb NOT NULL DEFAULT '{}'::jsonb,
    "created_at"               timestamptz NOT NULL DEFAULT now(),
    "updated_at"               timestamptz NOT NULL DEFAULT now(),
    "deleted_at"               timestamptz
);

CREATE INDEX IF NOT EXISTS "subscriptions_org_state_idx"
    ON "public"."subscriptions" (org_id, state) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS "subscriptions_party_idx"
    ON "public"."subscriptions" (party_id) WHERE party_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS "subscriptions_stripe_idx"
    ON "public"."subscriptions" (stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;

ALTER TABLE "public"."subscriptions" ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "subscriptions_select_org_member" ON "public"."subscriptions"
        FOR SELECT USING ("private"."is_org_member"(org_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "subscriptions_write_admin" ON "public"."subscriptions"
        FOR ALL
        USING ("private"."has_org_role"(org_id, ARRAY['owner','admin','controller']))
        WITH CHECK ("private"."has_org_role"(org_id, ARRAY['owner','admin','controller']));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
-- 3. Subscription state transitions (append-only)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."subscription_state_transitions" (
    "id"               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "org_id"           uuid NOT NULL REFERENCES "public"."orgs"("id") ON DELETE CASCADE,
    "subscription_id"  uuid NOT NULL REFERENCES "public"."subscriptions"("id") ON DELETE CASCADE,
    "from_state"       subscription_state,
    "to_state"         subscription_state NOT NULL,
    "transitioned_at"  timestamptz NOT NULL DEFAULT now(),
    "transitioned_by"  uuid,
    "reason"           text,
    "correlation_id"   uuid,
    "stripe_event_id"  text
);

CREATE INDEX IF NOT EXISTS "subscription_state_transitions_sub_idx"
    ON "public"."subscription_state_transitions" (subscription_id, transitioned_at DESC);

ALTER TABLE "public"."subscription_state_transitions" ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "subscription_state_transitions_select_org_member"
        ON "public"."subscription_state_transitions"
        FOR SELECT USING ("private"."is_org_member"(org_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "subscription_state_transitions_insert_admin"
        ON "public"."subscription_state_transitions"
        FOR INSERT
        WITH CHECK ("private"."has_org_role"(org_id, ARRAY['owner','admin','controller']));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
-- 4. UIS role state transitions log (USNP UIS has the column, not the log)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."uis_role_state_transitions" (
    "id"              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "org_id"          uuid NOT NULL REFERENCES "public"."orgs"("id") ON DELETE CASCADE,
    "uis_role_id"     uuid NOT NULL REFERENCES "public"."uis_roles"("id") ON DELETE CASCADE,
    "from_state"      uis_lifecycle_state,
    "to_state"        uis_lifecycle_state NOT NULL,
    "transitioned_at" timestamptz NOT NULL DEFAULT now(),
    "transitioned_by" uuid,
    "reason"          text,
    "correlation_id"  uuid
);

CREATE INDEX IF NOT EXISTS "uis_role_state_transitions_role_idx"
    ON "public"."uis_role_state_transitions" (uis_role_id, transitioned_at DESC);

ALTER TABLE "public"."uis_role_state_transitions" ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "uis_role_state_transitions_select_org_member"
        ON "public"."uis_role_state_transitions"
        FOR SELECT USING ("private"."is_org_member"(org_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "uis_role_state_transitions_insert_collab"
        ON "public"."uis_role_state_transitions"
        FOR INSERT
        WITH CHECK ("private"."has_org_role"(org_id, ARRAY['owner','admin','controller','collaborator']));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
-- 5. Accounting period state — typed enum + state column (additive)
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE "public"."accounting_period_state" AS ENUM (
        'OPEN','IN_PERIOD','CLOSING','CLOSED','AUDITED','ARCHIVED'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "public"."accounting_periods"
    ADD COLUMN IF NOT EXISTS "state" "public"."accounting_period_state";

-- Backfill state from existing text status; default new rows to OPEN
UPDATE "public"."accounting_periods"
SET state = CASE
    WHEN lower(status) = 'open' THEN 'OPEN'::accounting_period_state
    WHEN lower(status) = 'closing' THEN 'CLOSING'::accounting_period_state
    WHEN lower(status) IN ('closed','locked') THEN 'CLOSED'::accounting_period_state
    WHEN lower(status) = 'audited' THEN 'AUDITED'::accounting_period_state
    WHEN lower(status) = 'archived' THEN 'ARCHIVED'::accounting_period_state
    ELSE 'OPEN'::accounting_period_state
END
WHERE state IS NULL;

ALTER TABLE "public"."accounting_periods"
    ALTER COLUMN "state" SET NOT NULL,
    ALTER COLUMN "state" SET DEFAULT 'OPEN'::accounting_period_state;

CREATE INDEX IF NOT EXISTS "accounting_periods_org_state_idx"
    ON "public"."accounting_periods" (org_id, state);

COMMENT ON COLUMN "public"."accounting_periods"."state"
    IS 'LDP §7 Financial Period Lifecycle. Typed mirror of the legacy text status column. Keep both during migration period; status is read-only legacy, state is the canonical lifecycle column.';

-- ============================================================================
-- 6. Production phase (LDP §2) — net-new on fabrication_orders
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE "public"."production_phase" AS ENUM (
        'DISCOVERY','CONCEPT','ENGINEERING','PRE_PRO','FAB','LOGISTICS','INSTALL','STRIKE','ARCHIVED'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "public"."fabrication_orders"
    ADD COLUMN IF NOT EXISTS "production_phase" "public"."production_phase"
    NOT NULL DEFAULT 'DISCOVERY'::production_phase;

CREATE INDEX IF NOT EXISTS "fabrication_orders_production_phase_idx"
    ON "public"."fabrication_orders" (production_phase);

COMMENT ON COLUMN "public"."fabrication_orders"."production_phase"
    IS 'LDP §2 Production Lifecycle. Coexists with fabrication_orders.status (workflow-execution coarse states). Phase is the LDP-canonical lifecycle column.';

-- ============================================================================
-- 7. Offer letter status — extend with LDP §6 missing values
-- ============================================================================

ALTER TYPE "public"."offer_letter_status" ADD VALUE IF NOT EXISTS 'COUNTERSIGNED' AFTER 'accepted';
ALTER TYPE "public"."offer_letter_status" ADD VALUE IF NOT EXISTS 'ACTIVE' AFTER 'COUNTERSIGNED';
ALTER TYPE "public"."offer_letter_status" ADD VALUE IF NOT EXISTS 'SUPERSEDED';
ALTER TYPE "public"."offer_letter_status" ADD VALUE IF NOT EXISTS 'VOIDED';

-- ============================================================================
-- 8. proposal_phase_status -> proposal_phase_state (cosmetic LDP rename)
-- ============================================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname='proposal_phase_status')
       AND NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='proposal_phase_state') THEN
        EXECUTE 'ALTER TYPE "public"."proposal_phase_status" RENAME TO "proposal_phase_state"';
    END IF;
END $$;
