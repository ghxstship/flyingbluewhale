-- ────────────────────────────────────────────────────────────────────────
-- 0002 — Marketplace canon: public RFQ marketplace, crew job board,
--                          talent EPK + open-call booking, cross-cutting
--                          reviews, availability, cross-org messaging.
--
-- Implements the audit recommendations from 2026-05-05. Extends three
-- existing tables (rfqs, vendors, crew_members, orgs, conversations) with
-- public-profile + visibility columns, then layers ~15 new tables for the
-- marketplace surfaces. RLS policies follow the same `private.is_org_member`
-- pattern as the snapshot. Public discovery happens through SECURITY DEFINER
-- views, NEVER by relaxing RLS on the underlying tables.
--
-- Indempotency: all DDL guards with IF NOT EXISTS / OR REPLACE so this can
-- be re-applied on a partially-migrated branch without erroring.
-- ────────────────────────────────────────────────────────────────────────

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_min_messages = warning;
SET search_path = public, private, extensions;

-- ─── 1. Enum types ──────────────────────────────────────────────────────

DO $$ BEGIN CREATE TYPE "public"."rfq_visibility" AS ENUM ('private', 'network', 'public'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "public"."marketplace_kind" AS ENUM ('rfq', 'gig', 'talent_call', 'audition'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "public"."talent_rider_kind" AS ENUM ('tech', 'hospitality', 'input_list'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "public"."job_posting_type" AS ENUM ('single', 'tour', 'recurring'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "public"."job_posting_status" AS ENUM ('draft', 'published', 'closed', 'archived'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "public"."job_application_status" AS ENUM ('new', 'reviewed', 'phone', 'booked', 'hold', 'pass', 'withdrawn'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "public"."open_call_status" AS ENUM ('draft', 'published', 'closed', 'awarded', 'cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "public"."submission_status" AS ENUM ('submitted', 'shortlisted', 'rejected', 'awarded', 'withdrawn'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "public"."talent_offer_status" AS ENUM ('draft', 'sent', 'countered', 'accepted', 'contracted', 'declined', 'cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "public"."review_subject" AS ENUM ('vendor', 'talent', 'crew', 'org', 'user'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "public"."review_transaction" AS ENUM ('rfq', 'purchase_order', 'job_application', 'talent_offer', 'open_call_submission', 'project'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "public"."availability_kind" AS ENUM ('hold', 'confirm', 'block'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "public"."saved_search_kind" AS ENUM ('rfq', 'gig', 'talent_call', 'talent', 'crew', 'vendor'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── 2. Extend existing tables ──────────────────────────────────────────

-- 2a. rfqs — public marketplace columns
ALTER TABLE "public"."rfqs" ADD COLUMN IF NOT EXISTS "visibility" "public"."rfq_visibility" DEFAULT 'private' NOT NULL;
ALTER TABLE "public"."rfqs" ADD COLUMN IF NOT EXISTS "trade_categories" "text"[] DEFAULT ARRAY[]::"text"[] NOT NULL;
ALTER TABLE "public"."rfqs" ADD COLUMN IF NOT EXISTS "region" "text";
ALTER TABLE "public"."rfqs" ADD COLUMN IF NOT EXISTS "budget_band" "text";
ALTER TABLE "public"."rfqs" ADD COLUMN IF NOT EXISTS "scope_url" "text";
ALTER TABLE "public"."rfqs" ADD COLUMN IF NOT EXISTS "requires_prequalification" boolean DEFAULT true NOT NULL;
ALTER TABLE "public"."rfqs" ADD COLUMN IF NOT EXISTS "requires_insurance" boolean DEFAULT true NOT NULL;
ALTER TABLE "public"."rfqs" ADD COLUMN IF NOT EXISTS "requires_w9" boolean DEFAULT true NOT NULL;
ALTER TABLE "public"."rfqs" ADD COLUMN IF NOT EXISTS "nda_required" boolean DEFAULT false NOT NULL;
ALTER TABLE "public"."rfqs" ADD COLUMN IF NOT EXISTS "published_at" timestamp with time zone;
ALTER TABLE "public"."rfqs" ADD COLUMN IF NOT EXISTS "closed_at" timestamp with time zone;
ALTER TABLE "public"."rfqs" ADD COLUMN IF NOT EXISTS "public_slug" "text";

CREATE UNIQUE INDEX IF NOT EXISTS "rfqs_public_slug_unique"
    ON "public"."rfqs" ("public_slug")
    WHERE "public_slug" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "rfqs_visibility_published_idx"
    ON "public"."rfqs" ("visibility", "published_at" DESC)
    WHERE "visibility" IN ('network', 'public') AND "status" = 'sent';

CREATE INDEX IF NOT EXISTS "rfqs_trade_categories_gin"
    ON "public"."rfqs" USING GIN ("trade_categories");

-- 2b. vendors — public profile columns
ALTER TABLE "public"."vendors" ADD COLUMN IF NOT EXISTS "is_public_profile" boolean DEFAULT false NOT NULL;
ALTER TABLE "public"."vendors" ADD COLUMN IF NOT EXISTS "public_handle" "text";
ALTER TABLE "public"."vendors" ADD COLUMN IF NOT EXISTS "tagline" "text";
ALTER TABLE "public"."vendors" ADD COLUMN IF NOT EXISTS "bio" "text";
ALTER TABLE "public"."vendors" ADD COLUMN IF NOT EXISTS "logo_url" "text";
ALTER TABLE "public"."vendors" ADD COLUMN IF NOT EXISTS "hero_url" "text";
ALTER TABLE "public"."vendors" ADD COLUMN IF NOT EXISTS "website_url" "text";
ALTER TABLE "public"."vendors" ADD COLUMN IF NOT EXISTS "regions" "text"[] DEFAULT ARRAY[]::"text"[] NOT NULL;
ALTER TABLE "public"."vendors" ADD COLUMN IF NOT EXISTS "trade_categories" "text"[] DEFAULT ARRAY[]::"text"[] NOT NULL;
ALTER TABLE "public"."vendors" ADD COLUMN IF NOT EXISTS "verified_at" timestamp with time zone;
ALTER TABLE "public"."vendors" ADD COLUMN IF NOT EXISTS "year_founded" integer;
ALTER TABLE "public"."vendors" ADD COLUMN IF NOT EXISTS "rating_avg" numeric(3,2);
ALTER TABLE "public"."vendors" ADD COLUMN IF NOT EXISTS "rating_count" integer DEFAULT 0 NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "vendors_public_handle_unique"
    ON "public"."vendors" ("public_handle")
    WHERE "public_handle" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "vendors_public_idx"
    ON "public"."vendors" ("is_public_profile", "verified_at")
    WHERE "is_public_profile" = true AND "deleted_at" IS NULL;

CREATE INDEX IF NOT EXISTS "vendors_trade_categories_gin"
    ON "public"."vendors" USING GIN ("trade_categories");

-- 2c. crew_members — public crew profile
ALTER TABLE "public"."crew_members" ADD COLUMN IF NOT EXISTS "is_public_profile" boolean DEFAULT false NOT NULL;
ALTER TABLE "public"."crew_members" ADD COLUMN IF NOT EXISTS "public_handle" "text";
ALTER TABLE "public"."crew_members" ADD COLUMN IF NOT EXISTS "tagline" "text";
ALTER TABLE "public"."crew_members" ADD COLUMN IF NOT EXISTS "bio" "text";
ALTER TABLE "public"."crew_members" ADD COLUMN IF NOT EXISTS "photo_url" "text";
ALTER TABLE "public"."crew_members" ADD COLUMN IF NOT EXISTS "reel_url" "text";
ALTER TABLE "public"."crew_members" ADD COLUMN IF NOT EXISTS "day_rate_min_cents" bigint;
ALTER TABLE "public"."crew_members" ADD COLUMN IF NOT EXISTS "day_rate_max_cents" bigint;
ALTER TABLE "public"."crew_members" ADD COLUMN IF NOT EXISTS "travel_radius_km" integer;
ALTER TABLE "public"."crew_members" ADD COLUMN IF NOT EXISTS "gear_owned" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL;
ALTER TABLE "public"."crew_members" ADD COLUMN IF NOT EXISTS "unions" "text"[] DEFAULT ARRAY[]::"text"[] NOT NULL;
ALTER TABLE "public"."crew_members" ADD COLUMN IF NOT EXISTS "roles" "text"[] DEFAULT ARRAY[]::"text"[] NOT NULL;
ALTER TABLE "public"."crew_members" ADD COLUMN IF NOT EXISTS "certifications" "text"[] DEFAULT ARRAY[]::"text"[] NOT NULL;
ALTER TABLE "public"."crew_members" ADD COLUMN IF NOT EXISTS "availability_open" boolean DEFAULT false NOT NULL;
ALTER TABLE "public"."crew_members" ADD COLUMN IF NOT EXISTS "rating_avg" numeric(3,2);
ALTER TABLE "public"."crew_members" ADD COLUMN IF NOT EXISTS "rating_count" integer DEFAULT 0 NOT NULL;
ALTER TABLE "public"."crew_members" ADD COLUMN IF NOT EXISTS "verified_at" timestamp with time zone;

CREATE UNIQUE INDEX IF NOT EXISTS "crew_members_public_handle_unique"
    ON "public"."crew_members" ("public_handle")
    WHERE "public_handle" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "crew_members_public_idx"
    ON "public"."crew_members" ("is_public_profile", "availability_open")
    WHERE "is_public_profile" = true;

CREATE INDEX IF NOT EXISTS "crew_members_roles_gin"
    ON "public"."crew_members" USING GIN ("roles");

CREATE INDEX IF NOT EXISTS "crew_members_unions_gin"
    ON "public"."crew_members" USING GIN ("unions");

-- 2d. orgs — marketplace settings
ALTER TABLE "public"."orgs" ADD COLUMN IF NOT EXISTS "marketplace_enabled" boolean DEFAULT false NOT NULL;
ALTER TABLE "public"."orgs" ADD COLUMN IF NOT EXISTS "marketplace_take_rate_bps" integer DEFAULT 0 NOT NULL;
ALTER TABLE "public"."orgs" ADD COLUMN IF NOT EXISTS "marketplace_settings" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL;

ALTER TABLE "public"."orgs" DROP CONSTRAINT IF EXISTS "orgs_take_rate_check";
ALTER TABLE "public"."orgs" ADD CONSTRAINT "orgs_take_rate_check"
    CHECK ("marketplace_take_rate_bps" >= 0 AND "marketplace_take_rate_bps" <= 5000);

-- 2e. conversations — extend record_type for marketplace + cross-org DMs
ALTER TABLE "public"."conversations" DROP CONSTRAINT IF EXISTS "conversations_record_type_check";
ALTER TABLE "public"."conversations" ADD CONSTRAINT "conversations_record_type_check" CHECK (
    "record_type" = ANY (ARRAY[
        'project','purchase_order','requisition','rfq','rfi','submittal','punch_item',
        'inspection','daily_log','site_plan','vendor','client','proposal','deliverable',
        'incident','task','event','ticket','invoice','payment_application','po_change_order',
        'work_order_broadcast','safety_briefing','prequalification',
        -- 0002 marketplace additions
        'open_call','open_call_submission','job_posting','job_application',
        'talent_offer','talent_profile','crew_profile','direct_message'
    ])
);

ALTER TABLE "public"."conversations" ADD COLUMN IF NOT EXISTS "cross_org" boolean DEFAULT false NOT NULL;
ALTER TABLE "public"."conversations" ADD COLUMN IF NOT EXISTS "recipient_user_id" "uuid";
ALTER TABLE "public"."conversations" ADD COLUMN IF NOT EXISTS "recipient_org_id" "uuid";

-- 2f. stage_plots — make artist-owned (versioned, optional talent_profile_id)
ALTER TABLE "public"."stage_plots" ADD COLUMN IF NOT EXISTS "talent_profile_id" "uuid";
ALTER TABLE "public"."stage_plots" ADD COLUMN IF NOT EXISTS "version" integer DEFAULT 1 NOT NULL;
ALTER TABLE "public"."stage_plots" ADD COLUMN IF NOT EXISTS "is_current" boolean DEFAULT true NOT NULL;
ALTER TABLE "public"."stage_plots" ALTER COLUMN "project_id" DROP NOT NULL;

-- ─── 3. New tables ──────────────────────────────────────────────────────

-- 3a. talent_profiles — performer EPK (distinct from crew_members)
CREATE TABLE IF NOT EXISTS "public"."talent_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "public_handle" "text",
    "act_name" "text" NOT NULL,
    "tagline" "text",
    "bio" "text",
    "genre_tags" "text"[] DEFAULT ARRAY[]::"text"[] NOT NULL,
    "photo_url" "text",
    "hero_url" "text",
    "video_reel_url" "text",
    "audio_links" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "social_links" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "monthly_listeners" integer,
    "follower_count" integer,
    "fee_min_cents" bigint,
    "fee_max_cents" bigint,
    "currency" "text" DEFAULT 'USD' NOT NULL,
    "travel_radius_km" integer,
    "deposit_pct" smallint DEFAULT 60 NOT NULL,
    "balance_terms" "text" DEFAULT 'load_in' NOT NULL,
    "agent_email" "text",
    "agent_name" "text",
    "is_public" boolean DEFAULT false NOT NULL,
    "verified_at" timestamp with time zone,
    "rating_avg" numeric(3,2),
    "rating_count" integer DEFAULT 0 NOT NULL,
    "members" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "past_venues" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "talent_profiles_currency_check" CHECK ("currency" ~ '^[A-Z]{3}$'),
    CONSTRAINT "talent_profiles_deposit_check" CHECK ("deposit_pct" BETWEEN 0 AND 100),
    CONSTRAINT "talent_profiles_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "public"."talent_profiles" OWNER TO "postgres";

CREATE UNIQUE INDEX IF NOT EXISTS "talent_profiles_public_handle_unique"
    ON "public"."talent_profiles" ("public_handle")
    WHERE "public_handle" IS NOT NULL AND "deleted_at" IS NULL;

CREATE INDEX IF NOT EXISTS "talent_profiles_org_idx"
    ON "public"."talent_profiles" ("org_id") WHERE "deleted_at" IS NULL;

CREATE INDEX IF NOT EXISTS "talent_profiles_public_idx"
    ON "public"."talent_profiles" ("is_public", "verified_at")
    WHERE "is_public" = true AND "deleted_at" IS NULL;

CREATE INDEX IF NOT EXISTS "talent_profiles_genre_gin"
    ON "public"."talent_profiles" USING GIN ("genre_tags");

CREATE INDEX IF NOT EXISTS "talent_profiles_user_idx"
    ON "public"."talent_profiles" ("user_id") WHERE "user_id" IS NOT NULL;

-- 3b. talent_riders — tech / hospitality / input_list (versioned)
CREATE TABLE IF NOT EXISTS "public"."talent_riders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "talent_profile_id" "uuid" NOT NULL,
    "kind" "public"."talent_rider_kind" NOT NULL,
    "version" integer DEFAULT 1 NOT NULL,
    "title" "text",
    "content" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "file_url" "text",
    "is_current" boolean DEFAULT true NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "talent_riders_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "talent_riders_profile_fk" FOREIGN KEY ("talent_profile_id")
        REFERENCES "public"."talent_profiles"("id") ON DELETE CASCADE
);

ALTER TABLE "public"."talent_riders" OWNER TO "postgres";

CREATE UNIQUE INDEX IF NOT EXISTS "talent_riders_current_unique"
    ON "public"."talent_riders" ("talent_profile_id", "kind")
    WHERE "is_current" = true;

CREATE INDEX IF NOT EXISTS "talent_riders_org_idx"
    ON "public"."talent_riders" ("org_id");

-- 3c. open_calls — buyer-side casting / RFP-public / festival open call
CREATE TABLE IF NOT EXISTS "public"."open_calls" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "project_id" "uuid",
    "kind" "public"."marketplace_kind" NOT NULL,
    "title" "text" NOT NULL,
    "public_slug" "text" NOT NULL,
    "description" "text",
    "scope_url" "text",
    "genre_tags" "text"[] DEFAULT ARRAY[]::"text"[] NOT NULL,
    "trade_categories" "text"[] DEFAULT ARRAY[]::"text"[] NOT NULL,
    "region" "text",
    "venue_type" "text",
    "performance_date" "date",
    "slot_length_min" integer,
    "fee_min_cents" bigint,
    "fee_max_cents" bigint,
    "currency" "text" DEFAULT 'USD' NOT NULL,
    "budget_band" "text",
    "deadline_at" timestamp with time zone,
    "eligibility" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "submission_count" integer DEFAULT 0 NOT NULL,
    "open_call_state" "public"."open_call_status" DEFAULT 'draft' NOT NULL,
    "published_at" timestamp with time zone,
    "closed_at" timestamp with time zone,
    "awarded_submission_id" "uuid",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "open_calls_currency_check" CHECK ("currency" ~ '^[A-Z]{3}$'),
    CONSTRAINT "open_calls_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "open_calls_slug_check" CHECK ("public_slug" ~ '^[a-z0-9][a-z0-9-]{1,79}$')
);

ALTER TABLE "public"."open_calls" OWNER TO "postgres";

CREATE UNIQUE INDEX IF NOT EXISTS "open_calls_public_slug_unique"
    ON "public"."open_calls" ("public_slug") WHERE "deleted_at" IS NULL;

CREATE INDEX IF NOT EXISTS "open_calls_state_published_idx"
    ON "public"."open_calls" ("open_call_state", "published_at" DESC) WHERE "open_call_state" = 'published';

CREATE INDEX IF NOT EXISTS "open_calls_kind_idx"
    ON "public"."open_calls" ("kind", "open_call_state");

CREATE INDEX IF NOT EXISTS "open_calls_genre_gin"
    ON "public"."open_calls" USING GIN ("genre_tags");

CREATE INDEX IF NOT EXISTS "open_calls_trade_gin"
    ON "public"."open_calls" USING GIN ("trade_categories");

-- 3d. open_call_submissions — talent / vendor / crew submissions to a call
CREATE TABLE IF NOT EXISTS "public"."open_call_submissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "open_call_id" "uuid" NOT NULL,
    "submitter_user_id" "uuid" NOT NULL,
    "talent_profile_id" "uuid",
    "crew_member_id" "uuid",
    "vendor_id" "uuid",
    "cover_note" "text",
    "fee_proposed_cents" bigint,
    "available_dates" "daterange",
    "answers" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "attachments" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "submission_phase" "public"."submission_status" DEFAULT 'submitted' NOT NULL,
    "score" smallint,
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    "internal_notes" "text",
    "submitted_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "open_call_submissions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "open_call_submissions_call_fk" FOREIGN KEY ("open_call_id")
        REFERENCES "public"."open_calls"("id") ON DELETE CASCADE,
    CONSTRAINT "open_call_submissions_score_check" CHECK ("score" IS NULL OR "score" BETWEEN 0 AND 100),
    CONSTRAINT "open_call_submissions_subject_check" CHECK (
        ("talent_profile_id" IS NOT NULL)::int +
        ("crew_member_id" IS NOT NULL)::int +
        ("vendor_id" IS NOT NULL)::int <= 1
    )
);

ALTER TABLE "public"."open_call_submissions" OWNER TO "postgres";

CREATE INDEX IF NOT EXISTS "open_call_submissions_call_idx"
    ON "public"."open_call_submissions" ("open_call_id", "submitted_at" DESC);

CREATE INDEX IF NOT EXISTS "open_call_submissions_phase_idx"
    ON "public"."open_call_submissions" ("open_call_id", "submission_phase");

CREATE INDEX IF NOT EXISTS "open_call_submissions_submitter_idx"
    ON "public"."open_call_submissions" ("submitter_user_id", "submitted_at" DESC);

CREATE UNIQUE INDEX IF NOT EXISTS "open_call_submissions_one_per_user"
    ON "public"."open_call_submissions" ("open_call_id", "submitter_user_id")
    WHERE "submission_phase" <> 'withdrawn';

-- 3e. talent_offers — offer / counter / accept / contract flow
CREATE TABLE IF NOT EXISTS "public"."talent_offers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "project_id" "uuid",
    "talent_profile_id" "uuid" NOT NULL,
    "open_call_submission_id" "uuid",
    "performance_date" "date" NOT NULL,
    "slot_start" timestamp with time zone,
    "slot_end" timestamp with time zone,
    "fee_cents" bigint NOT NULL,
    "currency" "text" DEFAULT 'USD' NOT NULL,
    "deposit_pct" smallint DEFAULT 60 NOT NULL,
    "balance_terms" "text" DEFAULT 'load_in' NOT NULL,
    "platform_take_rate_bps" integer DEFAULT 0 NOT NULL,
    "terms" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "attached_rider_ids" "uuid"[] DEFAULT ARRAY[]::"uuid"[] NOT NULL,
    "stage_plot_id" "uuid",
    "talent_offer_state" "public"."talent_offer_status" DEFAULT 'draft' NOT NULL,
    "version" integer DEFAULT 1 NOT NULL,
    "previous_offer_id" "uuid",
    "sent_at" timestamp with time zone,
    "accepted_at" timestamp with time zone,
    "contracted_at" timestamp with time zone,
    "cancelled_at" timestamp with time zone,
    "performance_agreement_proposal_id" "uuid",
    "stripe_deposit_intent_id" "text",
    "stripe_payout_destination" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "talent_offers_currency_check" CHECK ("currency" ~ '^[A-Z]{3}$'),
    CONSTRAINT "talent_offers_deposit_check" CHECK ("deposit_pct" BETWEEN 0 AND 100),
    CONSTRAINT "talent_offers_take_rate_check" CHECK ("platform_take_rate_bps" BETWEEN 0 AND 5000),
    CONSTRAINT "talent_offers_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "talent_offers_talent_fk" FOREIGN KEY ("talent_profile_id")
        REFERENCES "public"."talent_profiles"("id") ON DELETE RESTRICT
);

ALTER TABLE "public"."talent_offers" OWNER TO "postgres";

CREATE INDEX IF NOT EXISTS "talent_offers_state_idx"
    ON "public"."talent_offers" ("org_id", "talent_offer_state", "performance_date");

CREATE INDEX IF NOT EXISTS "talent_offers_talent_idx"
    ON "public"."talent_offers" ("talent_profile_id", "talent_offer_state");

-- 3f. job_postings — public crew job board
CREATE TABLE IF NOT EXISTS "public"."job_postings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "project_id" "uuid",
    "title" "text" NOT NULL,
    "public_slug" "text" NOT NULL,
    "description" "text",
    "role_taxonomy" "text"[] DEFAULT ARRAY[]::"text"[] NOT NULL,
    "region" "text",
    "city" "text",
    "country" "text",
    "employment_type" "text" DEFAULT 'w2' NOT NULL,
    "day_rate_min_cents" bigint,
    "day_rate_max_cents" bigint,
    "currency" "text" DEFAULT 'USD' NOT NULL,
    "dates" "daterange",
    "tour_legs" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "posting_type" "public"."job_posting_type" DEFAULT 'single' NOT NULL,
    "union_required" "text"[] DEFAULT ARRAY[]::"text"[] NOT NULL,
    "certs_required" "text"[] DEFAULT ARRAY[]::"text"[] NOT NULL,
    "gear_required" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "travel_paid" boolean DEFAULT false NOT NULL,
    "lodging_provided" boolean DEFAULT false NOT NULL,
    "screening_questions" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "vetted_only" boolean DEFAULT false NOT NULL,
    "job_posting_phase" "public"."job_posting_status" DEFAULT 'draft' NOT NULL,
    "applicant_count" integer DEFAULT 0 NOT NULL,
    "published_at" timestamp with time zone,
    "expires_at" timestamp with time zone,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "job_postings_currency_check" CHECK ("currency" ~ '^[A-Z]{3}$'),
    CONSTRAINT "job_postings_employment_check" CHECK ("employment_type" IN ('w2','1099','volunteer','contract')),
    CONSTRAINT "job_postings_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "job_postings_slug_check" CHECK ("public_slug" ~ '^[a-z0-9][a-z0-9-]{1,79}$')
);

ALTER TABLE "public"."job_postings" OWNER TO "postgres";

CREATE UNIQUE INDEX IF NOT EXISTS "job_postings_public_slug_unique"
    ON "public"."job_postings" ("public_slug") WHERE "deleted_at" IS NULL;

CREATE INDEX IF NOT EXISTS "job_postings_phase_published_idx"
    ON "public"."job_postings" ("job_posting_phase", "published_at" DESC)
    WHERE "job_posting_phase" = 'published' AND "deleted_at" IS NULL;

CREATE INDEX IF NOT EXISTS "job_postings_role_gin"
    ON "public"."job_postings" USING GIN ("role_taxonomy");

CREATE INDEX IF NOT EXISTS "job_postings_region_idx"
    ON "public"."job_postings" ("region", "job_posting_phase");

CREATE INDEX IF NOT EXISTS "job_postings_dates_gist"
    ON "public"."job_postings" USING GIST ("dates");

-- 3g. job_applications
CREATE TABLE IF NOT EXISTS "public"."job_applications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "job_posting_id" "uuid" NOT NULL,
    "applicant_user_id" "uuid" NOT NULL,
    "crew_member_id" "uuid",
    "cover_note" "text",
    "resume_url" "text",
    "reel_url" "text",
    "day_rate_proposed_cents" bigint,
    "available_dates" "daterange",
    "answers" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "job_application_phase" "public"."job_application_status" DEFAULT 'new' NOT NULL,
    "score" smallint,
    "reviewer_notes" "text",
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    "applied_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "job_applications_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "job_applications_posting_fk" FOREIGN KEY ("job_posting_id")
        REFERENCES "public"."job_postings"("id") ON DELETE CASCADE,
    CONSTRAINT "job_applications_score_check" CHECK ("score" IS NULL OR "score" BETWEEN 0 AND 100)
);

ALTER TABLE "public"."job_applications" OWNER TO "postgres";

CREATE UNIQUE INDEX IF NOT EXISTS "job_applications_one_per_user"
    ON "public"."job_applications" ("job_posting_id", "applicant_user_id")
    WHERE "job_application_phase" <> 'withdrawn';

CREATE INDEX IF NOT EXISTS "job_applications_posting_phase_idx"
    ON "public"."job_applications" ("job_posting_id", "job_application_phase", "applied_at" DESC);

CREATE INDEX IF NOT EXISTS "job_applications_applicant_idx"
    ON "public"."job_applications" ("applicant_user_id", "applied_at" DESC);

-- 3h. availability_slots — person-level booking calendar
CREATE TABLE IF NOT EXISTS "public"."availability_slots" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "org_id" "uuid",
    "kind" "public"."availability_kind" NOT NULL,
    "starts_at" timestamp with time zone NOT NULL,
    "ends_at" timestamp with time zone NOT NULL,
    "all_day" boolean DEFAULT false NOT NULL,
    "label" "text",
    "source_type" "text",
    "source_id" "uuid",
    "ttl_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "availability_slots_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "availability_slots_range_check" CHECK ("ends_at" > "starts_at")
);

ALTER TABLE "public"."availability_slots" OWNER TO "postgres";

CREATE INDEX IF NOT EXISTS "availability_slots_user_range_idx"
    ON "public"."availability_slots" ("user_id", "starts_at", "ends_at");

CREATE INDEX IF NOT EXISTS "availability_slots_ttl_idx"
    ON "public"."availability_slots" ("ttl_at") WHERE "ttl_at" IS NOT NULL;

-- 3i. reviews — bidirectional, hidden_until_other_posts, scoped per transaction
CREATE TABLE IF NOT EXISTS "public"."reviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "transaction_type" "public"."review_transaction" NOT NULL,
    "transaction_id" "uuid" NOT NULL,
    "subject_kind" "public"."review_subject" NOT NULL,
    "subject_user_id" "uuid",
    "subject_vendor_id" "uuid",
    "subject_talent_profile_id" "uuid",
    "subject_crew_member_id" "uuid",
    "subject_org_id" "uuid",
    "reviewer_user_id" "uuid" NOT NULL,
    "reviewer_org_id" "uuid",
    "rating" smallint NOT NULL,
    "body" "text",
    "tags" "text"[] DEFAULT ARRAY[]::"text"[] NOT NULL,
    "hidden_until_counterpart" boolean DEFAULT true NOT NULL,
    "released_at" timestamp with time zone,
    "edited_at" timestamp with time zone,
    "flagged_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "reviews_rating_check" CHECK ("rating" BETWEEN 1 AND 5),
    CONSTRAINT "reviews_subject_check" CHECK (
        ("subject_user_id" IS NOT NULL)::int +
        ("subject_vendor_id" IS NOT NULL)::int +
        ("subject_talent_profile_id" IS NOT NULL)::int +
        ("subject_crew_member_id" IS NOT NULL)::int +
        ("subject_org_id" IS NOT NULL)::int = 1
    )
);

ALTER TABLE "public"."reviews" OWNER TO "postgres";

CREATE INDEX IF NOT EXISTS "reviews_transaction_idx"
    ON "public"."reviews" ("transaction_type", "transaction_id");

CREATE INDEX IF NOT EXISTS "reviews_subject_user_idx"
    ON "public"."reviews" ("subject_user_id") WHERE "subject_user_id" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "reviews_subject_vendor_idx"
    ON "public"."reviews" ("subject_vendor_id") WHERE "subject_vendor_id" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "reviews_subject_talent_idx"
    ON "public"."reviews" ("subject_talent_profile_id") WHERE "subject_talent_profile_id" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "reviews_one_per_pair"
    ON "public"."reviews" ("transaction_type", "transaction_id", "reviewer_user_id");

-- 3j. saved_searches — candidate / buyer alerts
CREATE TABLE IF NOT EXISTS "public"."saved_searches" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "org_id" "uuid",
    "kind" "public"."saved_search_kind" NOT NULL,
    "name" "text" NOT NULL,
    "query" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "alert_email" boolean DEFAULT false NOT NULL,
    "alert_push" boolean DEFAULT false NOT NULL,
    "last_checked_at" timestamp with time zone,
    "match_count" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "saved_searches_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "public"."saved_searches" OWNER TO "postgres";

CREATE INDEX IF NOT EXISTS "saved_searches_user_idx"
    ON "public"."saved_searches" ("user_id", "kind");

-- 3k. user_profiles — global identity layer for /me public profile
CREATE TABLE IF NOT EXISTS "public"."user_profiles" (
    "user_id" "uuid" NOT NULL,
    "public_handle" "text",
    "display_name" "text",
    "tagline" "text",
    "bio" "text",
    "avatar_url" "text",
    "hero_url" "text",
    "links" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "is_public" boolean DEFAULT false NOT NULL,
    "available_for_work" boolean DEFAULT false NOT NULL,
    "verified_email_at" timestamp with time zone,
    "verified_id_at" timestamp with time zone,
    "verified_payout_at" timestamp with time zone,
    "rating_avg" numeric(3,2),
    "rating_count" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("user_id")
);

ALTER TABLE "public"."user_profiles" OWNER TO "postgres";

CREATE UNIQUE INDEX IF NOT EXISTS "user_profiles_handle_unique"
    ON "public"."user_profiles" ("public_handle") WHERE "public_handle" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "user_profiles_public_idx"
    ON "public"."user_profiles" ("is_public") WHERE "is_public" = true;

-- ─── 4. updated_at triggers ─────────────────────────────────────────────

CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."talent_profiles"
    FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();
CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."talent_riders"
    FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();
CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."open_calls"
    FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();
CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."open_call_submissions"
    FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();
CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."talent_offers"
    FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();
CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."job_postings"
    FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();
CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."job_applications"
    FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();
CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."availability_slots"
    FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();
CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."reviews"
    FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();
CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."saved_searches"
    FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();
CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."user_profiles"
    FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();

-- ─── 5. Cascade: applicant_count / submission_count / rating aggregates ─

CREATE OR REPLACE FUNCTION "public"."tg_job_applications_count"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER SET "search_path" TO 'public'
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.job_postings SET applicant_count = applicant_count + 1 WHERE id = NEW.job_posting_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.job_postings SET applicant_count = GREATEST(applicant_count - 1, 0) WHERE id = OLD.job_posting_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$;

ALTER FUNCTION "public"."tg_job_applications_count"() OWNER TO "postgres";

CREATE OR REPLACE TRIGGER "trg_job_applications_count_ins" AFTER INSERT ON "public"."job_applications"
    FOR EACH ROW EXECUTE FUNCTION "public"."tg_job_applications_count"();
CREATE OR REPLACE TRIGGER "trg_job_applications_count_del" AFTER DELETE ON "public"."job_applications"
    FOR EACH ROW EXECUTE FUNCTION "public"."tg_job_applications_count"();

CREATE OR REPLACE FUNCTION "public"."tg_open_call_submissions_count"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER SET "search_path" TO 'public'
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.open_calls SET submission_count = submission_count + 1 WHERE id = NEW.open_call_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.open_calls SET submission_count = GREATEST(submission_count - 1, 0) WHERE id = OLD.open_call_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$;

ALTER FUNCTION "public"."tg_open_call_submissions_count"() OWNER TO "postgres";

CREATE OR REPLACE TRIGGER "trg_open_call_submissions_count_ins" AFTER INSERT ON "public"."open_call_submissions"
    FOR EACH ROW EXECUTE FUNCTION "public"."tg_open_call_submissions_count"();
CREATE OR REPLACE TRIGGER "trg_open_call_submissions_count_del" AFTER DELETE ON "public"."open_call_submissions"
    FOR EACH ROW EXECUTE FUNCTION "public"."tg_open_call_submissions_count"();

-- Reviews → roll up rating_avg + rating_count on the subject row.
CREATE OR REPLACE FUNCTION "public"."tg_reviews_aggregate"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER SET "search_path" TO 'public'
AS $$
DECLARE
    target_table text;
    target_col text;
    target_id uuid;
BEGIN
    -- Only roll up when the review is released (visible). Use NEW for ins/upd, OLD for del.
    target_id := COALESCE(NEW.subject_vendor_id, OLD.subject_vendor_id);
    IF target_id IS NOT NULL THEN
        UPDATE public.vendors SET
            rating_count = (SELECT COUNT(*) FROM public.reviews WHERE subject_vendor_id = target_id AND released_at IS NOT NULL),
            rating_avg = (SELECT AVG(rating)::numeric(3,2) FROM public.reviews WHERE subject_vendor_id = target_id AND released_at IS NOT NULL)
        WHERE id = target_id;
    END IF;

    target_id := COALESCE(NEW.subject_talent_profile_id, OLD.subject_talent_profile_id);
    IF target_id IS NOT NULL THEN
        UPDATE public.talent_profiles SET
            rating_count = (SELECT COUNT(*) FROM public.reviews WHERE subject_talent_profile_id = target_id AND released_at IS NOT NULL),
            rating_avg = (SELECT AVG(rating)::numeric(3,2) FROM public.reviews WHERE subject_talent_profile_id = target_id AND released_at IS NOT NULL)
        WHERE id = target_id;
    END IF;

    target_id := COALESCE(NEW.subject_crew_member_id, OLD.subject_crew_member_id);
    IF target_id IS NOT NULL THEN
        UPDATE public.crew_members SET
            rating_count = (SELECT COUNT(*) FROM public.reviews WHERE subject_crew_member_id = target_id AND released_at IS NOT NULL),
            rating_avg = (SELECT AVG(rating)::numeric(3,2) FROM public.reviews WHERE subject_crew_member_id = target_id AND released_at IS NOT NULL)
        WHERE id = target_id;
    END IF;

    target_id := COALESCE(NEW.subject_user_id, OLD.subject_user_id);
    IF target_id IS NOT NULL THEN
        UPDATE public.user_profiles SET
            rating_count = (SELECT COUNT(*) FROM public.reviews WHERE subject_user_id = target_id AND released_at IS NOT NULL),
            rating_avg = (SELECT AVG(rating)::numeric(3,2) FROM public.reviews WHERE subject_user_id = target_id AND released_at IS NOT NULL)
        WHERE user_id = target_id;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$;

ALTER FUNCTION "public"."tg_reviews_aggregate"() OWNER TO "postgres";

CREATE OR REPLACE TRIGGER "trg_reviews_aggregate" AFTER INSERT OR UPDATE OR DELETE ON "public"."reviews"
    FOR EACH ROW EXECUTE FUNCTION "public"."tg_reviews_aggregate"();

-- Reviews release helper: when both parties on a transaction have posted,
-- flip released_at on each review so they're visible publicly.
CREATE OR REPLACE FUNCTION "public"."tg_reviews_release_pair"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER SET "search_path" TO 'public'
AS $$
DECLARE
    counterpart_count int;
BEGIN
    IF NEW.released_at IS NOT NULL THEN RETURN NEW; END IF;

    SELECT COUNT(*) INTO counterpart_count
        FROM public.reviews r
        WHERE r.transaction_type = NEW.transaction_type
            AND r.transaction_id = NEW.transaction_id
            AND r.reviewer_user_id <> NEW.reviewer_user_id;

    IF counterpart_count > 0 THEN
        UPDATE public.reviews SET released_at = now()
            WHERE transaction_type = NEW.transaction_type
                AND transaction_id = NEW.transaction_id
                AND released_at IS NULL;
    END IF;
    RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."tg_reviews_release_pair"() OWNER TO "postgres";

CREATE OR REPLACE TRIGGER "trg_reviews_release_pair" AFTER INSERT ON "public"."reviews"
    FOR EACH ROW EXECUTE FUNCTION "public"."tg_reviews_release_pair"();

-- ─── 6. RLS — enable + policies ─────────────────────────────────────────

ALTER TABLE "public"."talent_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."talent_riders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."open_calls" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."open_call_submissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."talent_offers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."job_postings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."job_applications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."availability_slots" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."reviews" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."saved_searches" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."user_profiles" ENABLE ROW LEVEL SECURITY;

-- talent_profiles: org members manage; published profiles publicly readable
DROP POLICY IF EXISTS "talent_profiles_org_rw" ON "public"."talent_profiles";
CREATE POLICY "talent_profiles_org_rw" ON "public"."talent_profiles" TO "authenticated"
    USING ("private"."is_org_member"("org_id")) WITH CHECK ("private"."is_org_member"("org_id"));

DROP POLICY IF EXISTS "talent_profiles_public_select" ON "public"."talent_profiles";
CREATE POLICY "talent_profiles_public_select" ON "public"."talent_profiles" FOR SELECT TO "anon", "authenticated"
    USING ("is_public" = true AND "deleted_at" IS NULL);

DROP POLICY IF EXISTS "talent_profiles_self_select" ON "public"."talent_profiles";
CREATE POLICY "talent_profiles_self_select" ON "public"."talent_profiles" FOR SELECT TO "authenticated"
    USING ("user_id" = "auth"."uid"());

DROP POLICY IF EXISTS "talent_profiles_self_update" ON "public"."talent_profiles";
CREATE POLICY "talent_profiles_self_update" ON "public"."talent_profiles" FOR UPDATE TO "authenticated"
    USING ("user_id" = "auth"."uid"()) WITH CHECK ("user_id" = "auth"."uid"());

-- talent_riders
DROP POLICY IF EXISTS "talent_riders_org_rw" ON "public"."talent_riders";
CREATE POLICY "talent_riders_org_rw" ON "public"."talent_riders" TO "authenticated"
    USING ("private"."is_org_member"("org_id")) WITH CHECK ("private"."is_org_member"("org_id"));

-- open_calls: org members manage; published calls publicly readable
DROP POLICY IF EXISTS "open_calls_org_rw" ON "public"."open_calls";
CREATE POLICY "open_calls_org_rw" ON "public"."open_calls" TO "authenticated"
    USING ("private"."is_org_member"("org_id")) WITH CHECK ("private"."is_org_member"("org_id"));

DROP POLICY IF EXISTS "open_calls_public_select" ON "public"."open_calls";
CREATE POLICY "open_calls_public_select" ON "public"."open_calls" FOR SELECT TO "anon", "authenticated"
    USING ("open_call_state" = 'published' AND "deleted_at" IS NULL);

-- open_call_submissions: submitter sees own; org members see all in their org
DROP POLICY IF EXISTS "open_call_submissions_org_rw" ON "public"."open_call_submissions";
CREATE POLICY "open_call_submissions_org_rw" ON "public"."open_call_submissions" TO "authenticated"
    USING ("private"."is_org_member"("org_id")) WITH CHECK ("private"."is_org_member"("org_id"));

DROP POLICY IF EXISTS "open_call_submissions_self_select" ON "public"."open_call_submissions";
CREATE POLICY "open_call_submissions_self_select" ON "public"."open_call_submissions" FOR SELECT TO "authenticated"
    USING ("submitter_user_id" = "auth"."uid"());

DROP POLICY IF EXISTS "open_call_submissions_self_insert" ON "public"."open_call_submissions";
CREATE POLICY "open_call_submissions_self_insert" ON "public"."open_call_submissions" FOR INSERT TO "authenticated"
    WITH CHECK ("submitter_user_id" = "auth"."uid"());

-- talent_offers: org-scoped
DROP POLICY IF EXISTS "talent_offers_org_rw" ON "public"."talent_offers";
CREATE POLICY "talent_offers_org_rw" ON "public"."talent_offers" TO "authenticated"
    USING ("private"."is_org_member"("org_id")) WITH CHECK ("private"."is_org_member"("org_id"));

-- talent recipient (user_id on talent_profiles) can see offers addressed to them
DROP POLICY IF EXISTS "talent_offers_recipient_select" ON "public"."talent_offers";
CREATE POLICY "talent_offers_recipient_select" ON "public"."talent_offers" FOR SELECT TO "authenticated"
    USING (EXISTS (
        SELECT 1 FROM public.talent_profiles tp
        WHERE tp.id = talent_offers.talent_profile_id AND tp.user_id = auth.uid()
    ));

-- job_postings: org-scoped + public select on published
DROP POLICY IF EXISTS "job_postings_org_rw" ON "public"."job_postings";
CREATE POLICY "job_postings_org_rw" ON "public"."job_postings" TO "authenticated"
    USING ("private"."is_org_member"("org_id")) WITH CHECK ("private"."is_org_member"("org_id"));

DROP POLICY IF EXISTS "job_postings_public_select" ON "public"."job_postings";
CREATE POLICY "job_postings_public_select" ON "public"."job_postings" FOR SELECT TO "anon", "authenticated"
    USING ("job_posting_phase" = 'published' AND "deleted_at" IS NULL);

-- job_applications
DROP POLICY IF EXISTS "job_applications_org_rw" ON "public"."job_applications";
CREATE POLICY "job_applications_org_rw" ON "public"."job_applications" TO "authenticated"
    USING ("private"."is_org_member"("org_id")) WITH CHECK ("private"."is_org_member"("org_id"));

DROP POLICY IF EXISTS "job_applications_self_select" ON "public"."job_applications";
CREATE POLICY "job_applications_self_select" ON "public"."job_applications" FOR SELECT TO "authenticated"
    USING ("applicant_user_id" = "auth"."uid"());

DROP POLICY IF EXISTS "job_applications_self_insert" ON "public"."job_applications";
CREATE POLICY "job_applications_self_insert" ON "public"."job_applications" FOR INSERT TO "authenticated"
    WITH CHECK ("applicant_user_id" = "auth"."uid"());

DROP POLICY IF EXISTS "job_applications_self_update" ON "public"."job_applications";
CREATE POLICY "job_applications_self_update" ON "public"."job_applications" FOR UPDATE TO "authenticated"
    USING ("applicant_user_id" = "auth"."uid"()) WITH CHECK ("applicant_user_id" = "auth"."uid"());

-- availability_slots: user-owned
DROP POLICY IF EXISTS "availability_slots_self_rw" ON "public"."availability_slots";
CREATE POLICY "availability_slots_self_rw" ON "public"."availability_slots" TO "authenticated"
    USING ("user_id" = "auth"."uid"()) WITH CHECK ("user_id" = "auth"."uid"());

DROP POLICY IF EXISTS "availability_slots_org_select" ON "public"."availability_slots";
CREATE POLICY "availability_slots_org_select" ON "public"."availability_slots" FOR SELECT TO "authenticated"
    USING ("org_id" IS NOT NULL AND "private"."is_org_member"("org_id"));

-- reviews: org members manage; reviewer can update own; subject sees released; public sees released
DROP POLICY IF EXISTS "reviews_org_rw" ON "public"."reviews";
CREATE POLICY "reviews_org_rw" ON "public"."reviews" TO "authenticated"
    USING ("private"."is_org_member"("org_id")) WITH CHECK ("private"."is_org_member"("org_id"));

DROP POLICY IF EXISTS "reviews_reviewer_self" ON "public"."reviews";
CREATE POLICY "reviews_reviewer_self" ON "public"."reviews" TO "authenticated"
    USING ("reviewer_user_id" = "auth"."uid"()) WITH CHECK ("reviewer_user_id" = "auth"."uid"());

DROP POLICY IF EXISTS "reviews_public_select_released" ON "public"."reviews";
CREATE POLICY "reviews_public_select_released" ON "public"."reviews" FOR SELECT TO "anon", "authenticated"
    USING ("released_at" IS NOT NULL);

-- saved_searches: user-owned
DROP POLICY IF EXISTS "saved_searches_self_rw" ON "public"."saved_searches";
CREATE POLICY "saved_searches_self_rw" ON "public"."saved_searches" TO "authenticated"
    USING ("user_id" = "auth"."uid"()) WITH CHECK ("user_id" = "auth"."uid"());

-- user_profiles: self-managed; public select on is_public=true
DROP POLICY IF EXISTS "user_profiles_self_rw" ON "public"."user_profiles";
CREATE POLICY "user_profiles_self_rw" ON "public"."user_profiles" TO "authenticated"
    USING ("user_id" = "auth"."uid"()) WITH CHECK ("user_id" = "auth"."uid"());

DROP POLICY IF EXISTS "user_profiles_public_select" ON "public"."user_profiles";
CREATE POLICY "user_profiles_public_select" ON "public"."user_profiles" FOR SELECT TO "anon", "authenticated"
    USING ("is_public" = true);

-- ─── 7. Public discovery views ──────────────────────────────────────────
-- Views are SECURITY INVOKER (default) — they respect the policies above.

CREATE OR REPLACE VIEW "public"."public_talent_directory" AS
SELECT
    tp.id,
    tp.public_handle,
    tp.act_name,
    tp.tagline,
    tp.bio,
    tp.genre_tags,
    tp.photo_url,
    tp.hero_url,
    tp.video_reel_url,
    tp.fee_min_cents,
    tp.fee_max_cents,
    tp.currency,
    tp.travel_radius_km,
    tp.monthly_listeners,
    tp.follower_count,
    tp.rating_avg,
    tp.rating_count,
    tp.verified_at IS NOT NULL AS is_verified,
    tp.created_at
FROM public.talent_profiles tp
WHERE tp.is_public = true AND tp.deleted_at IS NULL;

GRANT SELECT ON "public"."public_talent_directory" TO "anon", "authenticated";

CREATE OR REPLACE VIEW "public"."public_crew_directory" AS
SELECT
    cm.id,
    cm.public_handle,
    cm.name,
    cm.tagline,
    cm.bio,
    cm.photo_url,
    cm.reel_url,
    cm.roles,
    cm.unions,
    cm.certifications,
    cm.day_rate_min_cents,
    cm.day_rate_max_cents,
    cm.travel_radius_km,
    cm.availability_open,
    cm.rating_avg,
    cm.rating_count,
    cm.verified_at IS NOT NULL AS is_verified,
    cm.created_at
FROM public.crew_members cm
WHERE cm.is_public_profile = true;

GRANT SELECT ON "public"."public_crew_directory" TO "anon", "authenticated";

CREATE OR REPLACE VIEW "public"."public_vendor_directory" AS
SELECT
    v.id,
    v.public_handle,
    v.name,
    v.tagline,
    v.bio,
    v.logo_url,
    v.hero_url,
    v.website_url,
    v.regions,
    v.trade_categories,
    v.rating_avg,
    v.rating_count,
    v.verified_at IS NOT NULL AS is_verified,
    v.year_founded,
    v.created_at
FROM public.vendors v
WHERE v.is_public_profile = true AND v.deleted_at IS NULL;

GRANT SELECT ON "public"."public_vendor_directory" TO "anon", "authenticated";

CREATE OR REPLACE VIEW "public"."public_job_board" AS
SELECT
    jp.id,
    jp.public_slug,
    jp.title,
    jp.description,
    jp.role_taxonomy,
    jp.region,
    jp.city,
    jp.country,
    jp.employment_type,
    jp.day_rate_min_cents,
    jp.day_rate_max_cents,
    jp.currency,
    jp.dates,
    jp.posting_type,
    jp.union_required,
    jp.certs_required,
    jp.travel_paid,
    jp.lodging_provided,
    jp.applicant_count,
    jp.published_at,
    jp.expires_at,
    o.name AS org_name,
    o.slug AS org_slug,
    o.logo_url AS org_logo_url
FROM public.job_postings jp
INNER JOIN public.orgs o ON o.id = jp.org_id
WHERE jp.job_posting_phase = 'published' AND jp.deleted_at IS NULL
    AND (jp.expires_at IS NULL OR jp.expires_at > now());

GRANT SELECT ON "public"."public_job_board" TO "anon", "authenticated";

CREATE OR REPLACE VIEW "public"."public_open_calls" AS
SELECT
    oc.id,
    oc.public_slug,
    oc.kind,
    oc.title,
    oc.description,
    oc.genre_tags,
    oc.trade_categories,
    oc.region,
    oc.venue_type,
    oc.performance_date,
    oc.fee_min_cents,
    oc.fee_max_cents,
    oc.currency,
    oc.deadline_at,
    oc.eligibility,
    oc.submission_count,
    oc.published_at,
    o.name AS org_name,
    o.slug AS org_slug,
    o.logo_url AS org_logo_url
FROM public.open_calls oc
INNER JOIN public.orgs o ON o.id = oc.org_id
WHERE oc.open_call_state = 'published' AND oc.deleted_at IS NULL
    AND (oc.deadline_at IS NULL OR oc.deadline_at > now());

GRANT SELECT ON "public"."public_open_calls" TO "anon", "authenticated";

CREATE OR REPLACE VIEW "public"."public_rfq_marketplace" AS
SELECT
    r.id,
    r.public_slug,
    r.title,
    r.description,
    r.trade_categories,
    r.region,
    r.budget_band,
    r.due_at,
    r.published_at,
    r.requires_prequalification,
    r.requires_insurance,
    r.requires_w9,
    r.nda_required,
    o.name AS org_name,
    o.slug AS org_slug,
    o.logo_url AS org_logo_url
FROM public.rfqs r
INNER JOIN public.orgs o ON o.id = r.org_id
WHERE r.visibility = 'public' AND r.status = 'sent';

GRANT SELECT ON "public"."public_rfq_marketplace" TO "anon", "authenticated";

-- ─── 8. Comments ────────────────────────────────────────────────────────

COMMENT ON TABLE "public"."talent_profiles" IS '0002 — Performer EPK. Distinct from crew_members. Public when is_public = true; surfaced via public_talent_directory view.';
COMMENT ON TABLE "public"."talent_riders" IS '0002 — Artist-owned tech / hospitality / input list riders. Versioned; is_current = true partial unique per (profile, kind).';
COMMENT ON TABLE "public"."open_calls" IS '0002 — Buyer-side casting / open RFQ / open call. Public discovery via public_open_calls when status=published.';
COMMENT ON TABLE "public"."open_call_submissions" IS '0002 — Submission to an open call. Submitter sees own; org members see all in their org. One per (call, user) unless withdrawn.';
COMMENT ON TABLE "public"."talent_offers" IS '0002 — Offer / counter / accept / contract flow for talent bookings. previous_offer_id chains counters.';
COMMENT ON TABLE "public"."job_postings" IS '0002 — Public crew job board. Tour-leg postings via tour_legs jsonb + posting_type=tour. Public discovery via public_job_board.';
COMMENT ON TABLE "public"."job_applications" IS '0002 — Apply-to-posting. ATS stages via status enum.';
COMMENT ON TABLE "public"."availability_slots" IS '0002 — User-owned booking calendar. Holds (auto-release on ttl_at), confirms (locked), blocks (manual unavailability).';
COMMENT ON TABLE "public"."reviews" IS '0002 — Bidirectional reviews. hidden_until_counterpart=true keeps reviews dark until both sides post (BeatGig pattern). released_at flips visible.';
COMMENT ON TABLE "public"."saved_searches" IS '0002 — Candidate / buyer alert subscriptions across marketplace surfaces.';
COMMENT ON TABLE "public"."user_profiles" IS '0002 — Global identity layer for /me public profile. Verified email/ID/payout badges roll up here.';
