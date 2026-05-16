-- Open Shifts: org-posted unfilled slots that any qualified crew member can claim.
-- Competitive parity: Deputy "claim during unavailability", LASSO Crew Marketplace,
-- GigFlex EventWorks auto-assign, Teambridge open shift board.
--
-- Schema: open_shifts (the posting) + open_shift_claims (individual claim per user).
-- An org admin posts an open shift; crew on COMPVSS /m/open-shifts browse + claim;
-- admin approves or declines each claim. On first approval, shift_state → 'filled'
-- and further claims are blocked unless max_claims > 1.

-- ============================================================
-- 1. open_shifts
-- ============================================================
CREATE TABLE IF NOT EXISTS "public"."open_shifts" (
    "id"                uuid        DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "org_id"            uuid        NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
    "project_id"        uuid        REFERENCES public.projects(id) ON DELETE SET NULL,
    "venue_id"          uuid        REFERENCES public.venues(id) ON DELETE SET NULL,
    "starts_at"         timestamptz NOT NULL,
    "ends_at"           timestamptz NOT NULL,
    "role"              text        NOT NULL,
    "role_taxonomy"     text[]      NOT NULL DEFAULT '{}',
    "hourly_rate_cents" bigint,
    "currency"          text        NOT NULL DEFAULT 'USD',
    "description"       text,
    "required_skills"   text[]      NOT NULL DEFAULT '{}',
    "max_claims"        integer     NOT NULL DEFAULT 1 CHECK (max_claims >= 1),
    "shift_state"       text        NOT NULL DEFAULT 'open'
                            CHECK (shift_state IN ('open', 'filled', 'cancelled', 'expired')),
    "notify_crew"       boolean     NOT NULL DEFAULT true,
    "created_by"        uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
    "created_at"        timestamptz NOT NULL DEFAULT now(),
    "updated_at"        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE "public"."open_shifts" OWNER TO "postgres";

COMMENT ON TABLE "public"."open_shifts" IS
  'Unfilled shift postings that crew can self-claim. Competitive parity: Deputy open shifts, LASSO Crew Marketplace.';

-- ============================================================
-- 2. open_shift_claims
-- ============================================================
CREATE TABLE IF NOT EXISTS "public"."open_shift_claims" (
    "id"             uuid        DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "open_shift_id"  uuid        NOT NULL REFERENCES public.open_shifts(id) ON DELETE CASCADE,
    "org_id"         uuid        NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
    "user_id"        uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "claim_state"    text        NOT NULL DEFAULT 'pending'
                         CHECK (claim_state IN ('pending', 'approved', 'declined', 'withdrawn')),
    "note"           text,
    "created_at"     timestamptz NOT NULL DEFAULT now(),
    UNIQUE (open_shift_id, user_id)
);

ALTER TABLE "public"."open_shift_claims" OWNER TO "postgres";

COMMENT ON TABLE "public"."open_shift_claims" IS
  'A crew member''s claim against an open_shift. One row per (shift × user). Duplicate claim attempts are rejected by the UNIQUE constraint.';

-- ============================================================
-- 3. RLS — open_shifts
-- ============================================================
ALTER TABLE "public"."open_shifts" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "open_shifts_org_member_select" ON "public"."open_shifts"
    FOR SELECT TO authenticated
    USING (private.is_org_member(org_id));

CREATE POLICY "open_shifts_admin_insert" ON "public"."open_shifts"
    FOR INSERT TO authenticated
    WITH CHECK (private.has_org_role(org_id, ARRAY['owner','admin','manager']));

CREATE POLICY "open_shifts_admin_update" ON "public"."open_shifts"
    FOR UPDATE TO authenticated
    USING (private.has_org_role(org_id, ARRAY['owner','admin','manager']))
    WITH CHECK (private.has_org_role(org_id, ARRAY['owner','admin','manager']));

CREATE POLICY "open_shifts_admin_delete" ON "public"."open_shifts"
    FOR DELETE TO authenticated
    USING (private.has_org_role(org_id, ARRAY['owner','admin','manager']));

-- ============================================================
-- 4. RLS — open_shift_claims
-- ============================================================
ALTER TABLE "public"."open_shift_claims" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "open_shift_claims_org_member_select" ON "public"."open_shift_claims"
    FOR SELECT TO authenticated
    USING (private.is_org_member(org_id));

-- Any org member can self-claim an open shift
CREATE POLICY "open_shift_claims_self_insert" ON "public"."open_shift_claims"
    FOR INSERT TO authenticated
    WITH CHECK (
        user_id = auth.uid()
        AND private.is_org_member(org_id)
    );

-- Admin approves / declines; self can withdraw
CREATE POLICY "open_shift_claims_admin_update" ON "public"."open_shift_claims"
    FOR UPDATE TO authenticated
    USING (
        private.has_org_role(org_id, ARRAY['owner','admin','manager'])
        OR user_id = auth.uid()
    )
    WITH CHECK (
        private.has_org_role(org_id, ARRAY['owner','admin','manager'])
        OR (user_id = auth.uid() AND claim_state = 'withdrawn')
    );

CREATE POLICY "open_shift_claims_self_delete" ON "public"."open_shift_claims"
    FOR DELETE TO authenticated
    USING (user_id = auth.uid());

-- ============================================================
-- 5. Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_open_shifts_org_id         ON "public"."open_shifts"(org_id);
CREATE INDEX IF NOT EXISTS idx_open_shifts_project_id     ON "public"."open_shifts"(project_id)
    WHERE project_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_open_shifts_starts_at      ON "public"."open_shifts"(starts_at);
CREATE INDEX IF NOT EXISTS idx_open_shifts_shift_state    ON "public"."open_shifts"(shift_state);

CREATE INDEX IF NOT EXISTS idx_open_shift_claims_shift    ON "public"."open_shift_claims"(open_shift_id);
CREATE INDEX IF NOT EXISTS idx_open_shift_claims_user     ON "public"."open_shift_claims"(user_id);
CREATE INDEX IF NOT EXISTS idx_open_shift_claims_org      ON "public"."open_shift_claims"(org_id);
CREATE INDEX IF NOT EXISTS idx_open_shift_claims_state    ON "public"."open_shift_claims"(claim_state);

-- ============================================================
-- 6. updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION public.tg_open_shifts_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$ BEGIN
  CREATE TRIGGER open_shifts_set_updated_at
    BEFORE UPDATE ON public.open_shifts
    FOR EACH ROW EXECUTE FUNCTION public.tg_open_shifts_set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- 7. Auto-fill trigger: when an approved claim count reaches max_claims,
--    flip shift_state to 'filled'.
-- ============================================================
CREATE OR REPLACE FUNCTION public.tg_open_shift_check_filled()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_approved integer;
  v_max      integer;
BEGIN
  IF NEW.claim_state = 'approved' AND (OLD IS NULL OR OLD.claim_state <> 'approved') THEN
    SELECT max_claims INTO v_max FROM public.open_shifts WHERE id = NEW.open_shift_id;
    SELECT count(*) INTO v_approved
      FROM public.open_shift_claims
      WHERE open_shift_id = NEW.open_shift_id AND claim_state = 'approved';
    IF v_approved >= v_max THEN
      UPDATE public.open_shifts SET shift_state = 'filled' WHERE id = NEW.open_shift_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DO $$ BEGIN
  CREATE TRIGGER open_shift_claims_check_filled
    AFTER INSERT OR UPDATE ON public.open_shift_claims
    FOR EACH ROW EXECUTE FUNCTION public.tg_open_shift_check_filled();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
