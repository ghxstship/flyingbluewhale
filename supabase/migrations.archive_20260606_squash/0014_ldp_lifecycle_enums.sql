-- SUPERSEDED 2026-05-09 by 20260509060000_ldp_lifecycle_remediations_reconciled.sql.
-- Pre-flight against the live remote schema (xrovijzjbyssajhtwvas) showed
-- USNP canon (shipped 2026-05-08) already implements most of LDP §3/§5/§7:
--   - LDP §5 Engagement → uis_roles.lifecycle_state uis_lifecycle_state
--   - LDP §3 Asset → asset_movements (ual_state-typed)
--   - LDP §7 Financial Period → accounting_periods
-- The reconciled migration ships only the genuinely net-new bits and
-- skips work USNP canon already covers. THIS FILE IS NOT APPLIED.
-- Kept in repo as an audit artifact of the original LDP-naive proposal.

-- LDP Phase 5 remediation, batch 1: new lifecycle enums.
--
-- Adds the canonical state-machine enums for LDP §5 Engagement, §2 Production,
-- §7 Financial Period, and §8 Subscription lifecycles. New tables and columns
-- that depend on these enums land in 20260509000003 and 20260509000004.
--
-- Naming follows LDP discipline: `*_state` for cyclical lifecycles, `*_phase`
-- for sequential macro arcs.

DO $$ BEGIN
    CREATE TYPE "public"."engagement_state" AS ENUM (
        'DISCOVERED',
        'INTERESTED',
        'VETTED',
        'COMMITTED',
        'ENABLED',
        'CONFIRMED',
        'ACTIVE',
        'CLOSED',
        'ARCHIVED'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TYPE "public"."engagement_state" OWNER TO "postgres";

DO $$ BEGIN
    CREATE TYPE "public"."production_phase" AS ENUM (
        'DISCOVERY',
        'CONCEPT',
        'ENGINEERING',
        'PRE_PRO',
        'FAB',
        'LOGISTICS',
        'INSTALL',
        'STRIKE',
        'ARCHIVED'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TYPE "public"."production_phase" OWNER TO "postgres";

DO $$ BEGIN
    CREATE TYPE "public"."period_state" AS ENUM (
        'OPEN',
        'IN_PERIOD',
        'CLOSING',
        'CLOSED',
        'AUDITED',
        'ARCHIVED'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TYPE "public"."period_state" OWNER TO "postgres";

DO $$ BEGIN
    CREATE TYPE "public"."period_kind" AS ENUM (
        'MONTH',
        'QUARTER',
        'YEAR',
        'CUSTOM'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TYPE "public"."period_kind" OWNER TO "postgres";

DO $$ BEGIN
    CREATE TYPE "public"."subscription_state" AS ENUM (
        'PROSPECT',
        'TRIAL',
        'ACTIVE',
        'RENEWED',
        'LAPSED',
        'REACTIVATED',
        'CHURNED',
        'ARCHIVED'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TYPE "public"."subscription_state" OWNER TO "postgres";

DO $$ BEGIN
    CREATE TYPE "public"."subscription_kind" AS ENUM (
        'MEMBER',
        'RETAINER',
        'RECURRING_SPONSOR',
        'PLATFORM_PLAN'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TYPE "public"."subscription_kind" OWNER TO "postgres";
