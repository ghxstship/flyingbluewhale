-- =============================================================
-- Competitive Features v2 — five parity features derived from
-- Deputy (Shift Pulse), Connecteam (compensation fields +
-- time-off policy controls), and Ubeya (labor P&L foundation).
-- =============================================================

-- ---------------------------------------------------------------
-- 1. SHIFT PULSE  (Deputy "Shift Pulse" parity)
--    Post-checkout per-shift sentiment + free-text comment.
--    RLS: org member reads; the submitting user (or admin) writes.
-- ---------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "public"."shift_pulses" (
  "id"                   uuid DEFAULT gen_random_uuid() NOT NULL,
  "org_id"               uuid NOT NULL REFERENCES "public"."orgs"("id") ON DELETE CASCADE,
  "shift_id"             uuid NOT NULL REFERENCES "public"."shifts"("id") ON DELETE CASCADE,
  "user_id"              uuid NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
  "workforce_member_id"  uuid REFERENCES "public"."workforce_members"("id") ON DELETE SET NULL,
  -- 1=very_bad, 2=bad, 3=neutral, 4=good, 5=great
  "score"                smallint NOT NULL,
  "comment"              text,
  "submitted_at"         timestamptz DEFAULT now() NOT NULL,
  "created_at"           timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "shift_pulses_pkey"  PRIMARY KEY ("id"),
  CONSTRAINT "shift_pulses_score_range" CHECK (score BETWEEN 1 AND 5),
  -- one pulse per user per shift
  CONSTRAINT "shift_pulses_one_per_user_shift" UNIQUE (shift_id, user_id)
);

ALTER TABLE "public"."shift_pulses" OWNER TO "postgres";

CREATE INDEX "idx_shift_pulses_org_submitted"  ON "public"."shift_pulses" ("org_id", "submitted_at" DESC);
CREATE INDEX "idx_shift_pulses_shift_id"        ON "public"."shift_pulses" ("shift_id");
CREATE INDEX "idx_shift_pulses_user_id"         ON "public"."shift_pulses" ("user_id");

ALTER TABLE "public"."shift_pulses" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shift_pulses_self_insert" ON "public"."shift_pulses"
  FOR INSERT TO "authenticated"
  WITH CHECK (user_id = auth.uid() AND "private"."is_org_member"(org_id));

CREATE POLICY "shift_pulses_self_read" ON "public"."shift_pulses"
  FOR SELECT TO "authenticated"
  USING (user_id = auth.uid() OR "private"."has_org_role"(org_id, ARRAY['owner','admin','manager']));

-- admins can update/delete (e.g. moderation)
CREATE POLICY "shift_pulses_admin_write" ON "public"."shift_pulses"
  FOR ALL TO "authenticated"
  USING ("private"."has_org_role"(org_id, ARRAY['owner','admin']))
  WITH CHECK ("private"."has_org_role"(org_id, ARRAY['owner','admin']));

GRANT SELECT ON TABLE "public"."shift_pulses" TO "anon";
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "public"."shift_pulses" TO "authenticated";
GRANT ALL ON TABLE "public"."shift_pulses" TO "service_role";

-- ---------------------------------------------------------------
-- 2. COMPENSATION FIELDS on workforce_members
--    (Connecteam "Compensation Fields" parity)
--    pay_rate_cents + interval, overtime eligibility,
--    employment type. Nulls mean "not yet configured".
-- ---------------------------------------------------------------

ALTER TABLE "public"."workforce_members"
  ADD COLUMN IF NOT EXISTS "pay_rate_cents"   bigint,
  ADD COLUMN IF NOT EXISTS "pay_rate_interval" text
    CONSTRAINT "wfm_pay_rate_interval_check"
    CHECK (pay_rate_interval IN ('hourly','daily','weekly','flat','per_show','per_diem')),
  ADD COLUMN IF NOT EXISTS "overtime_eligible" boolean DEFAULT true NOT NULL,
  ADD COLUMN IF NOT EXISTS "employment_type"  text DEFAULT 'w2'
    CONSTRAINT "wfm_employment_type_check"
    CHECK (employment_type IN ('w2','1099','volunteer','contract'));

-- ---------------------------------------------------------------
-- 3. TIME-OFF POLICY CONTROLS
--    (Connecteam "Negative Balance Limits" + "Per-Hour Accruals")
--    max_negative_hours  — floor on how far below zero a balance
--                          can go (null = no limit).
--    accrual_rate_per_hour — for per_hour_worked policies: hours
--                            of PTO earned per hour worked
--                            (null = defer to annual_hours / 2080).
-- ---------------------------------------------------------------

ALTER TABLE "public"."time_off_policies"
  ADD COLUMN IF NOT EXISTS "max_negative_hours"    numeric(8,2),
  ADD COLUMN IF NOT EXISTS "accrual_rate_per_hour" numeric(10,6);

-- Guard: negative-hours limit must be ≥ 0 when set
ALTER TABLE "public"."time_off_policies"
  ADD CONSTRAINT IF NOT EXISTS "top_max_negative_hours_positive"
  CHECK (max_negative_hours IS NULL OR max_negative_hours >= 0);

-- Guard: accrual rate must be positive when set
ALTER TABLE "public"."time_off_policies"
  ADD CONSTRAINT IF NOT EXISTS "top_accrual_rate_positive"
  CHECK (accrual_rate_per_hour IS NULL OR accrual_rate_per_hour > 0);

-- ---------------------------------------------------------------
-- 4. NOTIFICATION KIND — shift_pulse
--    Extends the push notification taxonomy so users can opt
--    in/out of shift pulse reminder pings in /m/settings/notifications.
-- ---------------------------------------------------------------

INSERT INTO "public"."notification_kind_catalog" (kind, label, description)
VALUES ('shift_pulse', 'Shift Feedback', 'Reminder to submit your shift pulse after clocking out')
ON CONFLICT (kind) DO NOTHING;
