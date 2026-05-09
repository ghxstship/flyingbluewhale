-- SUPERSEDED 2026-05-09 by 20260509060000_ldp_lifecycle_remediations_reconciled.sql.
-- Pre-flight against the live remote schema (xrovijzjbyssajhtwvas) showed
-- USNP canon (shipped 2026-05-08) already implements most of LDP §3/§5/§7:
--   - LDP §5 Engagement → uis_roles.lifecycle_state uis_lifecycle_state
--   - LDP §3 Asset → asset_movements (ual_state-typed)
--   - LDP §7 Financial Period → accounting_periods
-- The reconciled migration ships only the genuinely net-new bits and
-- skips work USNP canon already covers. THIS FILE IS NOT APPLIED.
-- Kept in repo as an audit artifact of the original LDP-naive proposal.

-- LDP Phase 5 remediation, batch 4: add lifecycle state columns to existing tables.
--
-- Adds:
--   - project_members.engagement_state (LDP §5) — defaults to COMMITTED so existing
--     records reflect their implicit state at migration time.
--   - fabrication_orders.production_phase (LDP §2) — adds phase machine alongside
--     the existing fabrication_orders.status text column. Both coexist for now;
--     status remains the workflow-execution column, production_phase is the
--     LDP-canonical lifecycle column. Future migration may deprecate status.
--
-- These columns are pure ADD operations. Existing reads/writes against
-- project_members and fabrication_orders are unaffected.

ALTER TABLE "public"."project_members"
    ADD COLUMN IF NOT EXISTS "engagement_state" "public"."engagement_state"
    NOT NULL
    DEFAULT 'COMMITTED'::"public"."engagement_state";

CREATE INDEX IF NOT EXISTS "project_members_engagement_state_idx"
    ON "public"."project_members" USING "btree" ("engagement_state");

ALTER TABLE "public"."fabrication_orders"
    ADD COLUMN IF NOT EXISTS "production_phase" "public"."production_phase"
    NOT NULL
    DEFAULT 'DISCOVERY'::"public"."production_phase";

CREATE INDEX IF NOT EXISTS "fabrication_orders_production_phase_idx"
    ON "public"."fabrication_orders" USING "btree" ("production_phase");

COMMENT ON COLUMN "public"."project_members"."engagement_state"
    IS 'LDP §5 Engagement Lifecycle. Per Party x Project. Replaces the implicit "record exists = engaged" semantics with an explicit state machine. Channel-specific status fields (talent_offers.status, job_applications.status, open_call_submissions.status) remain authoritative for channel-internal gates; engagement_state is the cross-channel summary.';

COMMENT ON COLUMN "public"."fabrication_orders"."production_phase"
    IS 'LDP §2 Production Lifecycle (fab-shop sequence: DISCOVERY/CONCEPT/ENGINEERING/PRE_PRO/FAB/LOGISTICS/INSTALL/STRIKE/ARCHIVED). Coexists with fabrication_orders.status (workflow-execution coarse states: open/in_progress/blocked/complete). Phase is the LDP-canonical lifecycle column; status is operational.';
