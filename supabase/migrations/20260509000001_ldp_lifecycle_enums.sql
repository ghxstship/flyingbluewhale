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
