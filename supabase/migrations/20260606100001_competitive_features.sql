-- ============================================================
-- Competitive feature gap closure — four areas derived from analysis
-- of WorkJam, FestivalPro, KonfHub, Instawork, and Deputy (June 2026).
--
--   1. Open Shift Marketplace  — internal gig pool (WorkJam parity)
--   2. Meal Tickets            — per-category catering redemption (FestivalPro)
--   3. Digital Credentials     — QR-backed auto-issued on delivery (KonfHub)
--   4. AI Match Score columns  — fit scoring on open_call_submissions
--
-- Each section is idempotent (IF NOT EXISTS, ADD COLUMN IF NOT EXISTS,
-- DO $$ BEGIN … EXCEPTION WHEN duplicate_object THEN NULL; END $$).
-- ============================================================

-- ============================================================
-- 1. OPEN SHIFT MARKETPLACE (WorkJam parity)
--
-- open_shift_listings  — manager posts an open slot before falling
--                        back to the external marketplace.
-- open_shift_claims    — crew members claim; manager approves/declines.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.open_shift_listings (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid        NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  project_id    uuid        REFERENCES public.projects(id) ON DELETE SET NULL,
  title         text        NOT NULL,
  role          text        NOT NULL,
  venue         text,
  event_date    date,
  starts_at     timestamptz NOT NULL,
  ends_at       timestamptz NOT NULL,
  pay_rate_cents integer,
  currency      text        NOT NULL DEFAULT 'USD',
  skills_required text[]    NOT NULL DEFAULT '{}',
  max_claims    integer     NOT NULL DEFAULT 1 CHECK (max_claims >= 1),
  notes         text,
  listing_state text        NOT NULL DEFAULT 'open'
    CONSTRAINT open_shift_listings_state_check
      CHECK (listing_state IN ('open','filled','cancelled')),
  created_by    uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_open_shift_listings_org_state
  ON public.open_shift_listings(org_id, listing_state);
CREATE INDEX IF NOT EXISTS idx_open_shift_listings_project
  ON public.open_shift_listings(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_open_shift_listings_starts_at
  ON public.open_shift_listings(org_id, starts_at);

CREATE OR REPLACE TRIGGER open_shift_listings_touch_updated_at
  BEFORE UPDATE ON public.open_shift_listings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.open_shift_listings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY open_shift_listings_select ON public.open_shift_listings
    FOR SELECT TO authenticated
    USING (private.is_org_member(org_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY open_shift_listings_insert ON public.open_shift_listings
    FOR INSERT TO authenticated
    WITH CHECK (private.has_org_role(org_id, ARRAY['owner','admin','manager']::text[]));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY open_shift_listings_update ON public.open_shift_listings
    FOR UPDATE TO authenticated
    USING  (private.has_org_role(org_id, ARRAY['owner','admin','manager']::text[]))
    WITH CHECK (private.has_org_role(org_id, ARRAY['owner','admin','manager']::text[]));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMENT ON TABLE public.open_shift_listings IS
  'Internal open-shift pool. Managers post unfilled slots here before the external marketplace. listing_state: open → filled | cancelled.';

-- Claims table
CREATE TABLE IF NOT EXISTS public.open_shift_claims (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id   uuid        NOT NULL REFERENCES public.open_shift_listings(id) ON DELETE CASCADE,
  org_id       uuid        NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  claim_state  text        NOT NULL DEFAULT 'pending'
    CONSTRAINT open_shift_claims_state_check
      CHECK (claim_state IN ('pending','approved','declined','withdrawn')),
  decided_by   uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  decided_at   timestamptz,
  notes        text,
  claimed_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (listing_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_open_shift_claims_listing
  ON public.open_shift_claims(listing_id);
CREATE INDEX IF NOT EXISTS idx_open_shift_claims_user
  ON public.open_shift_claims(user_id);

ALTER TABLE public.open_shift_claims ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY open_shift_claims_select ON public.open_shift_claims
    FOR SELECT TO authenticated
    USING (private.is_org_member(org_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Members insert their own claims only
DO $$ BEGIN
  CREATE POLICY open_shift_claims_insert ON public.open_shift_claims
    FOR INSERT TO authenticated
    WITH CHECK (private.is_org_member(org_id) AND user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Managers decide; members may withdraw their own
DO $$ BEGIN
  CREATE POLICY open_shift_claims_update ON public.open_shift_claims
    FOR UPDATE TO authenticated
    USING (
      private.has_org_role(org_id, ARRAY['owner','admin','manager']::text[])
      OR user_id = auth.uid()
    )
    WITH CHECK (
      private.has_org_role(org_id, ARRAY['owner','admin','manager']::text[])
      OR user_id = auth.uid()
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMENT ON TABLE public.open_shift_claims IS
  'Per-member claims against an open_shift_listing. Unique per (listing, user). Manager approves/declines; member may withdraw.';

-- ============================================================
-- 2. MEAL TICKETS (FestivalPro parity)
--
-- Per-person, per-category, per-date catering entitlements. Each row
-- carries a unique qr_token printed on a physical or digital ticket.
-- Catering staff scan the token to redeem. Kitchen staff view the
-- report at /console/projects/[id]/advancing/catering.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.meal_tickets (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         uuid        NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  project_id     uuid        NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  holder_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meal_category  text        NOT NULL DEFAULT 'lunch'
    CONSTRAINT meal_tickets_category_check
      CHECK (meal_category IN ('breakfast','lunch','dinner','afternoon_tea','snack','all_day')),
  meal_date      date        NOT NULL DEFAULT CURRENT_DATE,
  is_redeemed    boolean     NOT NULL DEFAULT false,
  redeemed_at    timestamptz,
  redeemed_by    uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  qr_token       text        UNIQUE DEFAULT encode(gen_random_bytes(12), 'hex'),
  notes          text,
  created_by     uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meal_tickets_org_project_date
  ON public.meal_tickets(org_id, project_id, meal_date);
CREATE INDEX IF NOT EXISTS idx_meal_tickets_holder
  ON public.meal_tickets(holder_id);
CREATE INDEX IF NOT EXISTS idx_meal_tickets_qr_token
  ON public.meal_tickets(qr_token) WHERE qr_token IS NOT NULL;

ALTER TABLE public.meal_tickets ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY meal_tickets_select ON public.meal_tickets
    FOR SELECT TO authenticated
    USING (private.is_org_member(org_id) OR holder_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY meal_tickets_insert ON public.meal_tickets
    FOR INSERT TO authenticated
    WITH CHECK (private.has_org_role(org_id, ARRAY['owner','admin','manager']::text[]));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY meal_tickets_update ON public.meal_tickets
    FOR UPDATE TO authenticated
    USING  (private.has_org_role(org_id, ARRAY['owner','admin','manager']::text[]))
    WITH CHECK (private.has_org_role(org_id, ARRAY['owner','admin','manager']::text[]));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMENT ON TABLE public.meal_tickets IS
  'Catering entitlements. qr_token is printed/displayed; redeemed_at stamps the scan. Category breakdown drives the kitchen report at /console/projects/[id]/advancing/catering.';

-- ============================================================
-- 3. DIGITAL CREDENTIALS (KonfHub parity)
--
-- Auto-generated when a credential_assignment deliverable transitions
-- to delivered state. qr_token is the verifiable identifier — scanned
-- at access control points or shared as a digital card.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.digital_credentials (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id             uuid        NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  project_id         uuid        REFERENCES public.projects(id) ON DELETE SET NULL,
  deliverable_id     uuid        REFERENCES public.deliverables(id) ON DELETE SET NULL,
  holder_id          uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credential_title   text        NOT NULL,
  credential_type    text        NOT NULL DEFAULT 'general'
    CONSTRAINT digital_credentials_type_check
      CHECK (credential_type IN (
        'credential_assignment','access_pass',
        'training_completion','certification','general'
      )),
  description        text,
  issued_at          timestamptz NOT NULL DEFAULT now(),
  expires_at         timestamptz,
  qr_token           text        NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  is_revoked         boolean     NOT NULL DEFAULT false,
  revoked_at         timestamptz,
  revoked_by         uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  revocation_reason  text,
  metadata           jsonb       NOT NULL DEFAULT '{}'::jsonb,
  created_by         uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_digital_credentials_org_project
  ON public.digital_credentials(org_id, project_id) WHERE project_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_digital_credentials_holder
  ON public.digital_credentials(holder_id);
CREATE INDEX IF NOT EXISTS idx_digital_credentials_qr_token
  ON public.digital_credentials(qr_token);
CREATE INDEX IF NOT EXISTS idx_digital_credentials_deliverable
  ON public.digital_credentials(deliverable_id) WHERE deliverable_id IS NOT NULL;

CREATE OR REPLACE TRIGGER digital_credentials_touch_updated_at
  BEFORE UPDATE ON public.digital_credentials
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.digital_credentials ENABLE ROW LEVEL SECURITY;

-- Holder reads their own; org members see the full set
DO $$ BEGIN
  CREATE POLICY digital_credentials_select ON public.digital_credentials
    FOR SELECT TO authenticated
    USING (holder_id = auth.uid() OR private.is_org_member(org_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY digital_credentials_insert ON public.digital_credentials
    FOR INSERT TO authenticated
    WITH CHECK (private.has_org_role(org_id, ARRAY['owner','admin','manager']::text[]));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY digital_credentials_update ON public.digital_credentials
    FOR UPDATE TO authenticated
    USING  (private.has_org_role(org_id, ARRAY['owner','admin','manager']::text[]))
    WITH CHECK (private.has_org_role(org_id, ARRAY['owner','admin','manager']::text[]));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMENT ON TABLE public.digital_credentials IS
  'QR-backed digital credentials auto-issued when credential_assignment deliverables reach delivered state. qr_token is the verifiable identifier. See /console/projects/[id]/advancing/credentials.';

-- ============================================================
-- 4. AI MATCH SCORE — open_call_submissions extension
--
-- open_call_submissions already has a `score` integer (0-100).
-- Add the reasoning text and timestamp so the UI can show when
-- AI scored it and surface the rationale inline.
-- ============================================================
ALTER TABLE public.open_call_submissions
  ADD COLUMN IF NOT EXISTS match_reasoning text,
  ADD COLUMN IF NOT EXISTS scored_at       timestamptz;

COMMENT ON COLUMN public.open_call_submissions.match_reasoning IS
  'AI rationale for the match_score — talent profile vs open call requirements.';
COMMENT ON COLUMN public.open_call_submissions.scored_at IS
  'When the AI match score was last computed. NULL until scored.';
