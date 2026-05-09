-- LDP Phase 5 remediation, batch 3: new lifecycle tables.
--
-- Adds tables required by LDP §3, §5, §7, §8 that did not previously exist:
--   - asset_movements: append-only ledger for asset state transitions
--   - financial_periods + transition log
--   - subscriptions + transition log
--   - engagement_state_transitions: append-only log keyed to project_members
--
-- All new tables have RLS enabled. Policies follow the existing pattern:
--   SELECT: any org member
--   INSERT/UPDATE/DELETE: owner/admin via has_org_role helper
--
-- Subscriptions table is org-scoped via org_id (the org operating the
-- subscription program), with party_id pointing at the subscriber user.

------------------------------------------------------------------------------
-- LDP §3 Asset — append-only movements ledger
------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "public"."asset_movements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "equipment_id" "uuid" NOT NULL,
    "from_state" "public"."equipment_status",
    "to_state" "public"."equipment_status" NOT NULL,
    "moved_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "moved_by" "uuid",
    "project_id" "uuid",
    "rental_id" "uuid",
    "reason" "text",
    "correlation_id" "uuid",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    CONSTRAINT "asset_movements_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "asset_movements_equipment_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id") ON DELETE CASCADE,
    CONSTRAINT "asset_movements_org_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE
);

ALTER TABLE "public"."asset_movements" OWNER TO "postgres";

CREATE INDEX "asset_movements_equipment_idx" ON "public"."asset_movements" USING "btree" ("equipment_id", "moved_at" DESC);
CREATE INDEX "asset_movements_org_idx" ON "public"."asset_movements" USING "btree" ("org_id", "moved_at" DESC);
CREATE INDEX "asset_movements_project_idx" ON "public"."asset_movements" USING "btree" ("project_id") WHERE "project_id" IS NOT NULL;

ALTER TABLE "public"."asset_movements" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "asset_movements_select_org_member" ON "public"."asset_movements"
    FOR SELECT
    USING ("private"."is_org_member"("org_id"));

CREATE POLICY "asset_movements_insert_admin" ON "public"."asset_movements"
    FOR INSERT
    WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]));

-- Append-only by RLS — no UPDATE / DELETE policy granted.

------------------------------------------------------------------------------
-- LDP §7 Financial Period
------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "public"."financial_periods" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "kind" "public"."period_kind" NOT NULL,
    "period_start" "date" NOT NULL,
    "period_end" "date" NOT NULL,
    "state" "public"."period_state" DEFAULT 'OPEN'::"public"."period_state" NOT NULL,
    "opened_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "closing_at" timestamp with time zone,
    "closed_at" timestamp with time zone,
    "audited_at" timestamp with time zone,
    "archived_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    CONSTRAINT "financial_periods_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "financial_periods_org_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE,
    CONSTRAINT "financial_periods_unique_per_org" UNIQUE ("org_id", "kind", "period_start"),
    CONSTRAINT "financial_periods_dates_ordered" CHECK ("period_end" >= "period_start")
);

ALTER TABLE "public"."financial_periods" OWNER TO "postgres";

CREATE INDEX "financial_periods_org_state_idx" ON "public"."financial_periods" USING "btree" ("org_id", "state");
CREATE INDEX "financial_periods_org_dates_idx" ON "public"."financial_periods" USING "btree" ("org_id", "period_end" DESC);

ALTER TABLE "public"."financial_periods" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "financial_periods_select_org_member" ON "public"."financial_periods"
    FOR SELECT
    USING ("private"."is_org_member"("org_id"));

CREATE POLICY "financial_periods_write_controller" ON "public"."financial_periods"
    FOR ALL
    USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]))
    WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]));

CREATE TABLE IF NOT EXISTS "public"."period_state_transitions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "period_id" "uuid" NOT NULL,
    "from_state" "public"."period_state",
    "to_state" "public"."period_state" NOT NULL,
    "transitioned_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "transitioned_by" "uuid",
    "reason" "text",
    "correlation_id" "uuid",
    CONSTRAINT "period_state_transitions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "period_state_transitions_period_fk" FOREIGN KEY ("period_id") REFERENCES "public"."financial_periods"("id") ON DELETE CASCADE,
    CONSTRAINT "period_state_transitions_org_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE
);

ALTER TABLE "public"."period_state_transitions" OWNER TO "postgres";

CREATE INDEX "period_state_transitions_period_idx" ON "public"."period_state_transitions" USING "btree" ("period_id", "transitioned_at" DESC);

ALTER TABLE "public"."period_state_transitions" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "period_state_transitions_select_org_member" ON "public"."period_state_transitions"
    FOR SELECT
    USING ("private"."is_org_member"("org_id"));

CREATE POLICY "period_state_transitions_insert_controller" ON "public"."period_state_transitions"
    FOR INSERT
    WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]));

------------------------------------------------------------------------------
-- LDP §8 Subscription
------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "party_id" "uuid",
    "kind" "public"."subscription_kind" NOT NULL,
    "state" "public"."subscription_state" DEFAULT 'PROSPECT'::"public"."subscription_state" NOT NULL,
    "label" "text" NOT NULL,
    "started_at" timestamp with time zone,
    "trial_ends_at" timestamp with time zone,
    "renewed_at" timestamp with time zone,
    "lapsed_at" timestamp with time zone,
    "reactivated_at" timestamp with time zone,
    "churned_at" timestamp with time zone,
    "archived_at" timestamp with time zone,
    "renewal_cadence_months" integer,
    "stripe_subscription_id" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "subscriptions_org_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE,
    CONSTRAINT "subscriptions_renewal_positive" CHECK ("renewal_cadence_months" IS NULL OR "renewal_cadence_months" > 0)
);

ALTER TABLE "public"."subscriptions" OWNER TO "postgres";

CREATE INDEX "subscriptions_org_state_idx" ON "public"."subscriptions" USING "btree" ("org_id", "state") WHERE "deleted_at" IS NULL;
CREATE INDEX "subscriptions_party_idx" ON "public"."subscriptions" USING "btree" ("party_id") WHERE "party_id" IS NOT NULL AND "deleted_at" IS NULL;
CREATE INDEX "subscriptions_stripe_idx" ON "public"."subscriptions" USING "btree" ("stripe_subscription_id") WHERE "stripe_subscription_id" IS NOT NULL;

ALTER TABLE "public"."subscriptions" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscriptions_select_org_member" ON "public"."subscriptions"
    FOR SELECT
    USING ("private"."is_org_member"("org_id"));

CREATE POLICY "subscriptions_write_admin" ON "public"."subscriptions"
    FOR ALL
    USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]))
    WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]));

CREATE TABLE IF NOT EXISTS "public"."subscription_state_transitions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "subscription_id" "uuid" NOT NULL,
    "from_state" "public"."subscription_state",
    "to_state" "public"."subscription_state" NOT NULL,
    "transitioned_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "transitioned_by" "uuid",
    "reason" "text",
    "correlation_id" "uuid",
    "stripe_event_id" "text",
    CONSTRAINT "subscription_state_transitions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "subscription_state_transitions_subscription_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE CASCADE,
    CONSTRAINT "subscription_state_transitions_org_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE
);

ALTER TABLE "public"."subscription_state_transitions" OWNER TO "postgres";

CREATE INDEX "subscription_state_transitions_sub_idx" ON "public"."subscription_state_transitions" USING "btree" ("subscription_id", "transitioned_at" DESC);

ALTER TABLE "public"."subscription_state_transitions" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscription_state_transitions_select_org_member" ON "public"."subscription_state_transitions"
    FOR SELECT
    USING ("private"."is_org_member"("org_id"));

CREATE POLICY "subscription_state_transitions_insert_admin" ON "public"."subscription_state_transitions"
    FOR INSERT
    WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]));

------------------------------------------------------------------------------
-- LDP §5 Engagement — append-only state transitions log (column added in batch 4)
------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "public"."engagement_state_transitions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "project_member_id" "uuid" NOT NULL,
    "from_state" "public"."engagement_state",
    "to_state" "public"."engagement_state" NOT NULL,
    "transitioned_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "transitioned_by" "uuid",
    "reason" "text",
    "correlation_id" "uuid",
    "channel" "text",
    CONSTRAINT "engagement_state_transitions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "engagement_state_transitions_org_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE
);

ALTER TABLE "public"."engagement_state_transitions" OWNER TO "postgres";

CREATE INDEX "engagement_state_transitions_pm_idx" ON "public"."engagement_state_transitions" USING "btree" ("project_member_id", "transitioned_at" DESC);

ALTER TABLE "public"."engagement_state_transitions" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "engagement_state_transitions_select_org_member" ON "public"."engagement_state_transitions"
    FOR SELECT
    USING ("private"."is_org_member"("org_id"));

CREATE POLICY "engagement_state_transitions_insert_admin" ON "public"."engagement_state_transitions"
    FOR INSERT
    WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));
