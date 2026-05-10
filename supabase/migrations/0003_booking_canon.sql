-- ────────────────────────────────────────────────────────────────────────
-- 0003 — Booking canon (Prism.fm parity, all 4 phases in one migration).
--
-- Phase 1 — Booking lifecycle: multi-tier holds, deal types, settlements,
--           ticketing connections + sales snapshots, break-even.
-- Phase 2 — Agency + tour: agencies, agency_artists, tours.
-- Phase 3 — Marketing canon: event_milestones, co_pro_partnerships.
-- Phase 4 — Insights pool: opt-in anonymized booking aggregates view.
--
-- Builds directly on the marketplace canon (0002) — extends `talent_offers`
-- with deal-type fields, links them via `tours.id` for tour P&L, and adds
-- `settlements` as the keystone post-show reconciliation object.
-- ────────────────────────────────────────────────────────────────────────

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_min_messages = warning;
SET search_path = public, private, extensions;

-- ─── 1. Enum types ──────────────────────────────────────────────────────

DO $$ BEGIN CREATE TYPE "public"."deal_type" AS ENUM (
  'flat', 'door', 'versus', 'tiered', 'flat_plus', 'vs_plus_walk'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE "public"."settlement_status" AS ENUM (
  'draft', 'reconciling', 'final', 'disputed'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE "public"."ticketing_provider" AS ENUM (
  'etix', 'dice', 'tixr', 'eventbrite', 'seetickets', 'axs', 'manual'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE "public"."tour_status" AS ENUM (
  'planning', 'routing', 'confirmed', 'complete', 'cancelled'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE "public"."event_milestone_kind" AS ENUM (
  'announce', 'presale_start', 'presale_end', 'onsale', 'sold_out', 'press_embargo'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE "public"."milestone_visibility" AS ENUM (
  'public', 'partners', 'internal'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── 2. Extend availability_slots: multi-tier holds ─────────────────────

ALTER TABLE "public"."availability_slots"
  ADD COLUMN IF NOT EXISTS "tier" smallint DEFAULT 1 NOT NULL,
  ADD COLUMN IF NOT EXISTS "auto_release_on" timestamp with time zone,
  ADD COLUMN IF NOT EXISTS "granted_to_org_id" "uuid",
  ADD COLUMN IF NOT EXISTS "venue_id" "uuid",
  ADD COLUMN IF NOT EXISTS "talent_profile_id" "uuid";

ALTER TABLE "public"."availability_slots" DROP CONSTRAINT IF EXISTS "availability_slots_tier_check";
ALTER TABLE "public"."availability_slots" ADD CONSTRAINT "availability_slots_tier_check"
  CHECK ("tier" BETWEEN 1 AND 5);

CREATE INDEX IF NOT EXISTS "availability_slots_tier_idx"
  ON "public"."availability_slots" ("kind", "tier", "starts_at")
  WHERE "kind" = 'hold';

CREATE INDEX IF NOT EXISTS "availability_slots_auto_release_idx"
  ON "public"."availability_slots" ("auto_release_on")
  WHERE "auto_release_on" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "availability_slots_venue_idx"
  ON "public"."availability_slots" ("venue_id", "starts_at")
  WHERE "venue_id" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "availability_slots_talent_idx"
  ON "public"."availability_slots" ("talent_profile_id", "starts_at")
  WHERE "talent_profile_id" IS NOT NULL;

-- ─── 3. Extend talent_offers: Prism deal types ──────────────────────────

ALTER TABLE "public"."talent_offers"
  ADD COLUMN IF NOT EXISTS "deal_type" "public"."deal_type" DEFAULT 'flat' NOT NULL,
  ADD COLUMN IF NOT EXISTS "guarantee_cents" bigint,
  ADD COLUMN IF NOT EXISTS "door_pct" smallint,
  ADD COLUMN IF NOT EXISTS "walkout_threshold_cents" bigint,
  ADD COLUMN IF NOT EXISTS "ticket_scaling" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
  ADD COLUMN IF NOT EXISTS "break_even_attendance" integer,
  ADD COLUMN IF NOT EXISTS "expense_estimate" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
  ADD COLUMN IF NOT EXISTS "co_pro_partners" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
  ADD COLUMN IF NOT EXISTS "tour_id" "uuid",
  ADD COLUMN IF NOT EXISTS "tour_leg_index" integer,
  ADD COLUMN IF NOT EXISTS "venue_id" "uuid",
  ADD COLUMN IF NOT EXISTS "agency_id" "uuid",
  ADD COLUMN IF NOT EXISTS "agent_commission_bps" integer DEFAULT 1000;

ALTER TABLE "public"."talent_offers" DROP CONSTRAINT IF EXISTS "talent_offers_door_pct_check";
ALTER TABLE "public"."talent_offers" ADD CONSTRAINT "talent_offers_door_pct_check"
  CHECK ("door_pct" IS NULL OR "door_pct" BETWEEN 0 AND 100);

ALTER TABLE "public"."talent_offers" DROP CONSTRAINT IF EXISTS "talent_offers_commission_check";
ALTER TABLE "public"."talent_offers" ADD CONSTRAINT "talent_offers_commission_check"
  CHECK ("agent_commission_bps" >= 0 AND "agent_commission_bps" <= 5000);

CREATE INDEX IF NOT EXISTS "talent_offers_tour_idx"
  ON "public"."talent_offers" ("tour_id", "tour_leg_index")
  WHERE "tour_id" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "talent_offers_venue_idx"
  ON "public"."talent_offers" ("venue_id", "performance_date")
  WHERE "venue_id" IS NOT NULL;

-- ─── 4. Settlements (Phase 1 keystone) ──────────────────────────────────

CREATE TABLE IF NOT EXISTS "public"."settlements" (
  "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
  "org_id" "uuid" NOT NULL,
  "talent_offer_id" "uuid",
  "project_id" "uuid",
  "venue_id" "uuid",
  "show_date" "date" NOT NULL,
  "settlement_state" "public"."settlement_status" DEFAULT 'draft' NOT NULL,
  -- Revenue
  "gross_box_office_cents" bigint DEFAULT 0 NOT NULL,
  "sales_tax_cents" bigint DEFAULT 0 NOT NULL,
  "amusement_tax_cents" bigint DEFAULT 0 NOT NULL,
  "cc_fee_cents" bigint DEFAULT 0 NOT NULL,
  "comp_count" integer DEFAULT 0 NOT NULL,
  "walkout_count" integer DEFAULT 0 NOT NULL,
  "paid_attendance" integer DEFAULT 0 NOT NULL,
  "bar_revenue_cents" bigint DEFAULT 0 NOT NULL,
  "merch_revenue_cents" bigint DEFAULT 0 NOT NULL,
  "other_revenue_cents" bigint DEFAULT 0 NOT NULL,
  -- Computed NBOR
  "nbor_cents" bigint GENERATED ALWAYS AS (
    "gross_box_office_cents" - "sales_tax_cents" - "amusement_tax_cents" - "cc_fee_cents"
  ) STORED,
  -- Splits
  "artist_payout_cents" bigint DEFAULT 0 NOT NULL,
  "agent_commission_cents" bigint DEFAULT 0 NOT NULL,
  "support_act_payout_cents" bigint DEFAULT 0 NOT NULL,
  "co_pro_splits" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
  "deposit_received_cents" bigint DEFAULT 0 NOT NULL,
  "balance_due_cents" bigint DEFAULT 0 NOT NULL,
  -- Payout
  "payout_destination" "text",
  "stripe_transfer_id" "text",
  "currency" "text" DEFAULT 'USD' NOT NULL,
  "finalized_at" timestamp with time zone,
  "finalized_by" "uuid",
  "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
  CONSTRAINT "settlements_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "settlements_currency_check" CHECK ("currency" ~ '^[A-Z]{3}$')
);

ALTER TABLE "public"."settlements" OWNER TO "postgres";

CREATE INDEX IF NOT EXISTS "settlements_offer_idx"
  ON "public"."settlements" ("talent_offer_id") WHERE "talent_offer_id" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "settlements_org_show_idx"
  ON "public"."settlements" ("org_id", "show_date" DESC);
CREATE INDEX IF NOT EXISTS "settlements_state_idx"
  ON "public"."settlements" ("org_id", "settlement_state");

CREATE TABLE IF NOT EXISTS "public"."settlement_lines" (
  "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
  "settlement_id" "uuid" NOT NULL,
  "org_id" "uuid" NOT NULL,
  "kind" "text" NOT NULL,
  "category" "text",
  "description" "text",
  "amount_cents" bigint NOT NULL,
  "evidence_url" "text",
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
  CONSTRAINT "settlement_lines_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "settlement_lines_kind_check" CHECK ("kind" IN ('revenue','expense','adjustment','tax','fee','split')),
  CONSTRAINT "settlement_lines_settlement_fk" FOREIGN KEY ("settlement_id")
    REFERENCES "public"."settlements"("id") ON DELETE CASCADE
);

ALTER TABLE "public"."settlement_lines" OWNER TO "postgres";

CREATE INDEX IF NOT EXISTS "settlement_lines_settlement_idx"
  ON "public"."settlement_lines" ("settlement_id", "sort_order");

-- ─── 5. Ticketing connections + sales snapshots ─────────────────────────

CREATE TABLE IF NOT EXISTS "public"."ticketing_connections" (
  "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
  "org_id" "uuid" NOT NULL,
  "project_id" "uuid",
  "talent_offer_id" "uuid",
  "provider" "public"."ticketing_provider" NOT NULL,
  "external_event_id" "text",
  "label" "text",
  "api_credentials" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
  "last_synced_at" timestamp with time zone,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
  CONSTRAINT "ticketing_connections_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "public"."ticketing_connections" OWNER TO "postgres";

CREATE INDEX IF NOT EXISTS "ticketing_connections_org_provider_idx"
  ON "public"."ticketing_connections" ("org_id", "provider", "is_active");

CREATE TABLE IF NOT EXISTS "public"."ticketing_sales_snapshots" (
  "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
  "ticketing_connection_id" "uuid" NOT NULL,
  "org_id" "uuid" NOT NULL,
  "snapshot_at" timestamp with time zone DEFAULT "now"() NOT NULL,
  "tier_data" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
  "total_sold" integer DEFAULT 0 NOT NULL,
  "total_capacity" integer,
  "total_gross_cents" bigint DEFAULT 0 NOT NULL,
  "currency" "text" DEFAULT 'USD' NOT NULL,
  CONSTRAINT "ticketing_sales_snapshots_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ticketing_sales_snapshots_conn_fk" FOREIGN KEY ("ticketing_connection_id")
    REFERENCES "public"."ticketing_connections"("id") ON DELETE CASCADE
);

ALTER TABLE "public"."ticketing_sales_snapshots" OWNER TO "postgres";

CREATE INDEX IF NOT EXISTS "ticketing_sales_snapshots_conn_idx"
  ON "public"."ticketing_sales_snapshots" ("ticketing_connection_id", "snapshot_at" DESC);

-- ─── 6. Agencies + roster + tours (Phase 2) ─────────────────────────────

CREATE TABLE IF NOT EXISTS "public"."agencies" (
  "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
  "org_id" "uuid" NOT NULL,
  "display_name" "text" NOT NULL,
  "default_commission_bps" integer DEFAULT 1000 NOT NULL,
  "bio" "text",
  "logo_url" "text",
  "website_url" "text",
  "is_public" boolean DEFAULT false NOT NULL,
  "public_handle" "text",
  "verified_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
  "deleted_at" timestamp with time zone,
  CONSTRAINT "agencies_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "agencies_commission_check" CHECK ("default_commission_bps" BETWEEN 0 AND 5000)
);

ALTER TABLE "public"."agencies" OWNER TO "postgres";

CREATE UNIQUE INDEX IF NOT EXISTS "agencies_public_handle_unique"
  ON "public"."agencies" ("public_handle") WHERE "public_handle" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "agencies_org_idx"
  ON "public"."agencies" ("org_id") WHERE "deleted_at" IS NULL;

CREATE TABLE IF NOT EXISTS "public"."agency_artists" (
  "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
  "agency_id" "uuid" NOT NULL,
  "talent_profile_id" "uuid" NOT NULL,
  "org_id" "uuid" NOT NULL,
  "agent_user_id" "uuid",
  "commission_bps" integer,
  "exclusive" boolean DEFAULT true NOT NULL,
  "signed_at" "date",
  "ended_at" "date",
  "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
  CONSTRAINT "agency_artists_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "agency_artists_agency_fk" FOREIGN KEY ("agency_id")
    REFERENCES "public"."agencies"("id") ON DELETE CASCADE,
  CONSTRAINT "agency_artists_talent_fk" FOREIGN KEY ("talent_profile_id")
    REFERENCES "public"."talent_profiles"("id") ON DELETE CASCADE,
  CONSTRAINT "agency_artists_commission_check" CHECK (
    "commission_bps" IS NULL OR ("commission_bps" BETWEEN 0 AND 5000)
  )
);

ALTER TABLE "public"."agency_artists" OWNER TO "postgres";

CREATE UNIQUE INDEX IF NOT EXISTS "agency_artists_active_unique"
  ON "public"."agency_artists" ("talent_profile_id")
  WHERE "ended_at" IS NULL AND "exclusive" = true;
CREATE INDEX IF NOT EXISTS "agency_artists_agency_idx"
  ON "public"."agency_artists" ("agency_id") WHERE "ended_at" IS NULL;

CREATE TABLE IF NOT EXISTS "public"."tours" (
  "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
  "org_id" "uuid" NOT NULL,
  "talent_profile_id" "uuid" NOT NULL,
  "agency_id" "uuid",
  "name" "text" NOT NULL,
  "description" "text",
  "starts_on" "date",
  "ends_on" "date",
  "tour_phase" "public"."tour_status" DEFAULT 'planning' NOT NULL,
  "created_by" "uuid",
  "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
  "deleted_at" timestamp with time zone,
  CONSTRAINT "tours_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "tours_talent_fk" FOREIGN KEY ("talent_profile_id")
    REFERENCES "public"."talent_profiles"("id") ON DELETE RESTRICT
);

ALTER TABLE "public"."tours" OWNER TO "postgres";

CREATE INDEX IF NOT EXISTS "tours_talent_idx"
  ON "public"."tours" ("talent_profile_id", "starts_on");
CREATE INDEX IF NOT EXISTS "tours_org_phase_idx"
  ON "public"."tours" ("org_id", "tour_phase") WHERE "deleted_at" IS NULL;

-- ─── 7. Marketing canon: milestones + co-pro (Phase 3) ──────────────────

CREATE TABLE IF NOT EXISTS "public"."event_milestones" (
  "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
  "org_id" "uuid" NOT NULL,
  "project_id" "uuid",
  "talent_offer_id" "uuid",
  "kind" "public"."event_milestone_kind" NOT NULL,
  "occurs_at" timestamp with time zone NOT NULL,
  "label" "text",
  "visibility" "public"."milestone_visibility" DEFAULT 'public' NOT NULL,
  "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
  "created_by" "uuid",
  "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
  CONSTRAINT "event_milestones_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "public"."event_milestones" OWNER TO "postgres";

CREATE INDEX IF NOT EXISTS "event_milestones_offer_idx"
  ON "public"."event_milestones" ("talent_offer_id", "occurs_at")
  WHERE "talent_offer_id" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "event_milestones_project_idx"
  ON "public"."event_milestones" ("project_id", "occurs_at")
  WHERE "project_id" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "event_milestones_kind_when_idx"
  ON "public"."event_milestones" ("org_id", "kind", "occurs_at");

CREATE TABLE IF NOT EXISTS "public"."co_pro_partnerships" (
  "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
  "org_id" "uuid" NOT NULL,
  "talent_offer_id" "uuid" NOT NULL,
  "partner_org_id" "uuid",
  "partner_name" "text" NOT NULL,
  "split_pct" numeric(5,2) NOT NULL,
  "responsibility_split" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
  "bonus_terms" "text",
  "contact_email" "text",
  "settled_at" timestamp with time zone,
  "settled_amount_cents" bigint,
  "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
  CONSTRAINT "co_pro_partnerships_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "co_pro_partnerships_split_check" CHECK ("split_pct" >= 0 AND "split_pct" <= 100),
  CONSTRAINT "co_pro_partnerships_offer_fk" FOREIGN KEY ("talent_offer_id")
    REFERENCES "public"."talent_offers"("id") ON DELETE CASCADE
);

ALTER TABLE "public"."co_pro_partnerships" OWNER TO "postgres";

CREATE INDEX IF NOT EXISTS "co_pro_partnerships_offer_idx"
  ON "public"."co_pro_partnerships" ("talent_offer_id");

-- ─── 8. updated_at triggers ─────────────────────────────────────────────

CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."settlements"
  FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();
CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."ticketing_connections"
  FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();
CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."agencies"
  FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();
CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."agency_artists"
  FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();
CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."tours"
  FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();
CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."event_milestones"
  FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();
CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."co_pro_partnerships"
  FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();

-- Auto-promote hold tiers when a higher tier releases. When a hold row is
-- deleted (or its kind changes from 'hold'), promote tier N → N-1 within the
-- same overlapping window so the next-priority hold becomes effective.
CREATE OR REPLACE FUNCTION "public"."tg_holds_auto_promote"() RETURNS "trigger"
  LANGUAGE "plpgsql" SECURITY DEFINER SET "search_path" TO 'public'
AS $$
BEGIN
  IF (TG_OP = 'DELETE' AND OLD.kind = 'hold') OR
     (TG_OP = 'UPDATE' AND OLD.kind = 'hold' AND (NEW.kind IS DISTINCT FROM 'hold' OR NEW.tier > OLD.tier)) THEN
    UPDATE public.availability_slots SET tier = tier - 1
      WHERE kind = 'hold'
        AND tier > OLD.tier
        AND COALESCE(venue_id, '00000000-0000-0000-0000-000000000000') = COALESCE(OLD.venue_id, '00000000-0000-0000-0000-000000000000')
        AND COALESCE(talent_profile_id, '00000000-0000-0000-0000-000000000000') = COALESCE(OLD.talent_profile_id, '00000000-0000-0000-0000-000000000000')
        AND tstzrange(starts_at, ends_at, '[)') && tstzrange(OLD.starts_at, OLD.ends_at, '[)');
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

ALTER FUNCTION "public"."tg_holds_auto_promote"() OWNER TO "postgres";

CREATE OR REPLACE TRIGGER "trg_holds_auto_promote_del"
  AFTER DELETE ON "public"."availability_slots"
  FOR EACH ROW EXECUTE FUNCTION "public"."tg_holds_auto_promote"();
CREATE OR REPLACE TRIGGER "trg_holds_auto_promote_upd"
  AFTER UPDATE ON "public"."availability_slots"
  FOR EACH ROW EXECUTE FUNCTION "public"."tg_holds_auto_promote"();

-- Settlement balance computation — keep balance_due_cents in sync as the
-- artist payout, agent commission, and deposit fields move.
CREATE OR REPLACE FUNCTION "public"."tg_settlement_compute_balance"() RETURNS "trigger"
  LANGUAGE "plpgsql" SECURITY DEFINER SET "search_path" TO 'public'
AS $$
BEGIN
  NEW.balance_due_cents := GREATEST(0,
    NEW.artist_payout_cents + NEW.agent_commission_cents + NEW.support_act_payout_cents
    - NEW.deposit_received_cents
  );
  RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."tg_settlement_compute_balance"() OWNER TO "postgres";

CREATE OR REPLACE TRIGGER "trg_settlement_compute_balance"
  BEFORE INSERT OR UPDATE ON "public"."settlements"
  FOR EACH ROW EXECUTE FUNCTION "public"."tg_settlement_compute_balance"();

-- ─── 9. RLS — enable + policies ─────────────────────────────────────────

ALTER TABLE "public"."settlements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."settlement_lines" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ticketing_connections" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ticketing_sales_snapshots" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."agencies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."agency_artists" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."tours" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."event_milestones" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."co_pro_partnerships" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "settlements_org_rw" ON "public"."settlements";
CREATE POLICY "settlements_org_rw" ON "public"."settlements" TO "authenticated"
  USING ("private"."is_org_member"("org_id")) WITH CHECK ("private"."is_org_member"("org_id"));

DROP POLICY IF EXISTS "settlement_lines_org_rw" ON "public"."settlement_lines";
CREATE POLICY "settlement_lines_org_rw" ON "public"."settlement_lines" TO "authenticated"
  USING ("private"."is_org_member"("org_id")) WITH CHECK ("private"."is_org_member"("org_id"));

DROP POLICY IF EXISTS "ticketing_connections_org_rw" ON "public"."ticketing_connections";
CREATE POLICY "ticketing_connections_org_rw" ON "public"."ticketing_connections" TO "authenticated"
  USING ("private"."is_org_member"("org_id")) WITH CHECK ("private"."is_org_member"("org_id"));

DROP POLICY IF EXISTS "ticketing_sales_snapshots_org_rw" ON "public"."ticketing_sales_snapshots";
CREATE POLICY "ticketing_sales_snapshots_org_rw" ON "public"."ticketing_sales_snapshots" TO "authenticated"
  USING ("private"."is_org_member"("org_id")) WITH CHECK ("private"."is_org_member"("org_id"));

DROP POLICY IF EXISTS "agencies_org_rw" ON "public"."agencies";
CREATE POLICY "agencies_org_rw" ON "public"."agencies" TO "authenticated"
  USING ("private"."is_org_member"("org_id")) WITH CHECK ("private"."is_org_member"("org_id"));

DROP POLICY IF EXISTS "agencies_public_select" ON "public"."agencies";
CREATE POLICY "agencies_public_select" ON "public"."agencies" FOR SELECT TO "anon", "authenticated"
  USING ("is_public" = true AND "deleted_at" IS NULL);

DROP POLICY IF EXISTS "agency_artists_org_rw" ON "public"."agency_artists";
CREATE POLICY "agency_artists_org_rw" ON "public"."agency_artists" TO "authenticated"
  USING ("private"."is_org_member"("org_id")) WITH CHECK ("private"."is_org_member"("org_id"));

DROP POLICY IF EXISTS "tours_org_rw" ON "public"."tours";
CREATE POLICY "tours_org_rw" ON "public"."tours" TO "authenticated"
  USING ("private"."is_org_member"("org_id")) WITH CHECK ("private"."is_org_member"("org_id"));

DROP POLICY IF EXISTS "event_milestones_org_rw" ON "public"."event_milestones";
CREATE POLICY "event_milestones_org_rw" ON "public"."event_milestones" TO "authenticated"
  USING ("private"."is_org_member"("org_id")) WITH CHECK ("private"."is_org_member"("org_id"));

DROP POLICY IF EXISTS "event_milestones_public_select" ON "public"."event_milestones";
CREATE POLICY "event_milestones_public_select" ON "public"."event_milestones" FOR SELECT TO "anon", "authenticated"
  USING ("visibility" = 'public');

DROP POLICY IF EXISTS "co_pro_partnerships_org_rw" ON "public"."co_pro_partnerships";
CREATE POLICY "co_pro_partnerships_org_rw" ON "public"."co_pro_partnerships" TO "authenticated"
  USING ("private"."is_org_member"("org_id")) WITH CHECK ("private"."is_org_member"("org_id"));

-- ─── 10. Public discovery views ─────────────────────────────────────────

CREATE OR REPLACE VIEW "public"."public_agency_directory" AS
SELECT
  a.id, a.public_handle, a.display_name, a.bio, a.logo_url, a.website_url,
  a.default_commission_bps, a.verified_at IS NOT NULL AS is_verified,
  a.created_at,
  (SELECT COUNT(*) FROM public.agency_artists aa WHERE aa.agency_id = a.id AND aa.ended_at IS NULL) AS artist_count
FROM public.agencies a
WHERE a.is_public = true AND a.deleted_at IS NULL;

GRANT SELECT ON "public"."public_agency_directory" TO "anon", "authenticated";

CREATE OR REPLACE VIEW "public"."public_event_calendar" AS
SELECT
  em.id, em.kind, em.label, em.occurs_at, em.metadata,
  o.name AS org_name, o.slug AS org_slug
FROM public.event_milestones em
INNER JOIN public.orgs o ON o.id = em.org_id
WHERE em.visibility = 'public' AND em.occurs_at >= now() - interval '7 days';

GRANT SELECT ON "public"."public_event_calendar" TO "anon", "authenticated";

-- Tour P&L roll-up — sum of all linked offers + their settlements, exposed
-- to org members for tour-level dashboards.
CREATE OR REPLACE VIEW "public"."tour_p_and_l" AS
SELECT
  t.id AS tour_id,
  t.org_id,
  t.name,
  t.status,
  t.starts_on,
  t.ends_on,
  COUNT(DISTINCT o.id) AS leg_count,
  COUNT(DISTINCT s.id) AS settled_legs,
  COALESCE(SUM(s.gross_box_office_cents), 0) AS gross_box_office_cents,
  COALESCE(SUM(s.nbor_cents), 0) AS nbor_cents,
  COALESCE(SUM(s.artist_payout_cents), 0) AS artist_payout_cents,
  COALESCE(SUM(s.agent_commission_cents), 0) AS agent_commission_cents,
  COALESCE(SUM(s.bar_revenue_cents + s.merch_revenue_cents + s.other_revenue_cents), 0) AS ancillary_revenue_cents
FROM public.tours t
LEFT JOIN public.talent_offers o ON o.tour_id = t.id
LEFT JOIN public.settlements s ON s.talent_offer_id = o.id
WHERE t.deleted_at IS NULL
GROUP BY t.id, t.org_id, t.name, t.status, t.starts_on, t.ends_on;

GRANT SELECT ON "public"."tour_p_and_l" TO "authenticated";

-- ─── 11. Phase 4: Insights pool ─────────────────────────────────────────
-- Opt-in anonymized booking aggregates. Only orgs with
-- marketplace_settings->>'insights_opt_in' = 'true' contribute.

ALTER TABLE "public"."orgs"
  ADD COLUMN IF NOT EXISTS "insights_opt_in" boolean DEFAULT false NOT NULL;

-- k-anonymity floor of 3 — region grouping deferred until venues / projects
-- gain a stable region column. For now, month + genre is enough signal.
CREATE OR REPLACE VIEW "public"."public_insights_pool" AS
SELECT
  date_trunc('month', s.show_date)::date AS month,
  unnest(COALESCE(tp.genre_tags, ARRAY['unknown'])) AS genre,
  COUNT(*) AS show_count,
  AVG(s.gross_box_office_cents)::bigint AS avg_gross_cents,
  AVG(s.paid_attendance)::int AS avg_attendance,
  AVG(s.artist_payout_cents)::bigint AS avg_artist_payout_cents
FROM public.settlements s
INNER JOIN public.orgs o ON o.id = s.org_id AND o.insights_opt_in = true
LEFT JOIN public.talent_offers o2 ON o2.id = s.talent_offer_id
LEFT JOIN public.talent_profiles tp ON tp.id = o2.talent_profile_id
WHERE s.status = 'final'
GROUP BY 1, 2
HAVING COUNT(*) >= 3;

GRANT SELECT ON "public"."public_insights_pool" TO "authenticated";

-- ─── 12. Comments ───────────────────────────────────────────────────────

COMMENT ON TABLE "public"."settlements" IS '0003 — Post-show financial reconciliation. Generated NBOR column = gross - tax - cc fees. Trigger keeps balance_due_cents = artist + agent + support − deposit.';
COMMENT ON TABLE "public"."settlement_lines" IS '0003 — Itemized revenue / expense / adjustment lines for a settlement.';
COMMENT ON TABLE "public"."ticketing_connections" IS '0003 — Per-org connection to Etix / DICE / Tixr / Eventbrite / SeeTickets / AXS. api_credentials encrypted at rest in Supabase Vault.';
COMMENT ON TABLE "public"."ticketing_sales_snapshots" IS '0003 — Append-only sales-velocity snapshots ingested from the ticketing provider. Latest row drives live break-even on the deal page.';
COMMENT ON TABLE "public"."agencies" IS '0003 — Booking agency entity. is_public = true surfaces the agency in /marketplace/agencies via public_agency_directory.';
COMMENT ON TABLE "public"."agency_artists" IS '0003 — Roster row joining agency to talent_profile. Active row: ended_at IS NULL. Exclusive flag prevents two active exclusive agencies for the same artist.';
COMMENT ON TABLE "public"."tours" IS '0003 — Multi-date tour container. talent_offers.tour_id + tour_leg_index link offers into a tour for tour_p_and_l roll-up.';
COMMENT ON TABLE "public"."event_milestones" IS '0003 — Marketing calendar dates: announce, presale_start/end, onsale, sold_out, press_embargo. Visibility gates anon read.';
COMMENT ON TABLE "public"."co_pro_partnerships" IS '0003 — Co-promote splits per offer. Settlement uses split_pct + responsibility_split jsonb to compute partner payouts.';
