-- Round 43 — Formal ITB (Invitation to Bid)
--
-- Per construction-pm-parity Wave 2.5 (gap G-023). Extends the existing
-- `rfqs` table with an itb_phase enum + two new tables for ITB-specific
-- workflow:
--   - itb_packages: trade-specific bundles (sheet sets + spec sections + scope
--     of work) sent to invited subs in one envelope.
--   - itb_invitations: per-sub invitation rows with deadline, decline reason,
--     and ack state. Outbound invites can target marketplace-prequalified
--     subs in addition to the manual sub list.

BEGIN;

-- =============================================================================
-- 1. ENUMS
-- =============================================================================

DO $$ BEGIN
  CREATE TYPE public.itb_phase AS ENUM (
    'planning',     -- assembling packages, drafting scope
    'inviting',     -- invitations going out
    'bidding',      -- bid window open
    'leveling',     -- closed; reviewing bids
    'awarded',      -- subcontract issued
    'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.itb_invite_state AS ENUM (
    'pending',
    'sent',
    'viewed',
    'accepted',
    'declined',
    'bid_submitted',
    'no_bid'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =============================================================================
-- 2. Extend rfqs with itb_phase (additive — does not break existing RFQs)
-- =============================================================================

ALTER TABLE public.rfqs
  ADD COLUMN IF NOT EXISTS itb_phase public.itb_phase,
  ADD COLUMN IF NOT EXISTS itb_bid_due_at timestamptz,
  ADD COLUMN IF NOT EXISTS itb_q_and_a_due_at timestamptz,
  ADD COLUMN IF NOT EXISTS itb_award_target_at date,
  ADD COLUMN IF NOT EXISTS itb_minimum_bidders int;

CREATE INDEX IF NOT EXISTS rfqs_itb_phase_idx
  ON public.rfqs (itb_phase) WHERE itb_phase IS NOT NULL;
CREATE INDEX IF NOT EXISTS rfqs_itb_bid_due_idx
  ON public.rfqs (itb_bid_due_at) WHERE itb_bid_due_at IS NOT NULL;

COMMENT ON COLUMN public.rfqs.itb_phase IS
  'Set on RFQs that follow the formal ITB workflow. NULL = regular procurement RFQ. Independent from rfq_state so the existing lifecycle still applies.';

-- =============================================================================
-- 3. itb_packages — trade-specific bundles
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.itb_packages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  rfq_id          uuid NOT NULL REFERENCES public.rfqs(id) ON DELETE CASCADE,
  trade           text NOT NULL,            -- 'concrete', 'electrical', 'mechanical', ...
  cost_code_id    uuid REFERENCES public.cost_codes(id) ON DELETE SET NULL,
  scope_of_work_md text,
  -- References into the drawing + spec set published with this package.
  sheet_set_version_id uuid REFERENCES public.sheet_set_versions(id) ON DELETE SET NULL,
  -- Array of spec section UUIDs included in this package.
  spec_section_ids uuid[] NOT NULL DEFAULT '{}',
  base_bid_required boolean NOT NULL DEFAULT true,
  alternates_md   text,
  unit_prices_md  text,
  allowances_md   text,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (rfq_id, trade)
);

CREATE INDEX IF NOT EXISTS itb_packages_rfq_idx ON public.itb_packages (rfq_id);
CREATE INDEX IF NOT EXISTS itb_packages_org_idx ON public.itb_packages (org_id);
CREATE INDEX IF NOT EXISTS itb_packages_cost_code_idx ON public.itb_packages (cost_code_id) WHERE cost_code_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS itb_packages_sheet_set_idx ON public.itb_packages (sheet_set_version_id) WHERE sheet_set_version_id IS NOT NULL;

COMMENT ON TABLE public.itb_packages IS
  'Trade-specific bundles within an ITB. Each package is what a sub bids on; one RFQ can have many trade packages.';

-- =============================================================================
-- 4. itb_invitations — per-sub invitation records
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.itb_invitations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  itb_package_id  uuid NOT NULL REFERENCES public.itb_packages(id) ON DELETE CASCADE,
  -- Exactly one of vendor_id / external_email is non-null.
  vendor_id       uuid REFERENCES public.vendors(id) ON DELETE SET NULL,
  external_email  text,
  invite_state    public.itb_invite_state NOT NULL DEFAULT 'pending',
  invited_at      timestamptz,
  viewed_at       timestamptz,
  accepted_at     timestamptz,
  declined_at     timestamptz,
  decline_reason  text,
  bid_submitted_at timestamptz,
  -- Once a bid lands, the rfq_response row is the canonical bid record.
  rfq_response_id uuid REFERENCES public.rfq_responses(id) ON DELETE SET NULL,
  reminder_count  int NOT NULL DEFAULT 0,
  last_reminder_at timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT itb_invitation_exactly_one_target CHECK (
    (CASE WHEN vendor_id      IS NOT NULL THEN 1 ELSE 0 END)
  + (CASE WHEN external_email IS NOT NULL THEN 1 ELSE 0 END) = 1
  )
);

CREATE INDEX IF NOT EXISTS itb_invitations_package_idx ON public.itb_invitations (itb_package_id);
CREATE INDEX IF NOT EXISTS itb_invitations_org_idx ON public.itb_invitations (org_id);
CREATE INDEX IF NOT EXISTS itb_invitations_vendor_idx ON public.itb_invitations (vendor_id) WHERE vendor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS itb_invitations_state_idx
  ON public.itb_invitations (invite_state)
  WHERE invite_state IN ('pending','sent','viewed','accepted');
CREATE INDEX IF NOT EXISTS itb_invitations_rfq_response_idx
  ON public.itb_invitations (rfq_response_id) WHERE rfq_response_id IS NOT NULL;

COMMENT ON TABLE public.itb_invitations IS
  'Per-sub invitation. Linked to the eventual rfq_responses bid row once submitted. Decline rate is the leading indicator of package quality.';

-- =============================================================================
-- 5. updated_at triggers
-- =============================================================================

CREATE OR REPLACE FUNCTION public.touch_itb_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_itb_packages_touch ON public.itb_packages;
CREATE TRIGGER trg_itb_packages_touch BEFORE UPDATE ON public.itb_packages
  FOR EACH ROW EXECUTE FUNCTION public.touch_itb_updated_at();

DROP TRIGGER IF EXISTS trg_itb_invitations_touch ON public.itb_invitations;
CREATE TRIGGER trg_itb_invitations_touch BEFORE UPDATE ON public.itb_invitations
  FOR EACH ROW EXECUTE FUNCTION public.touch_itb_updated_at();

-- =============================================================================
-- 6. RLS
-- =============================================================================

ALTER TABLE public.itb_packages    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itb_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS itb_packages_org_select ON public.itb_packages;
CREATE POLICY itb_packages_org_select ON public.itb_packages FOR SELECT USING (private.is_org_member(org_id));
DROP POLICY IF EXISTS itb_packages_org_write ON public.itb_packages;
CREATE POLICY itb_packages_org_write ON public.itb_packages FOR ALL
  USING (private.has_org_role(org_id, ARRAY['owner','admin','manager']))
  WITH CHECK (private.has_org_role(org_id, ARRAY['owner','admin','manager']));

DROP POLICY IF EXISTS itb_invitations_org_select ON public.itb_invitations;
CREATE POLICY itb_invitations_org_select ON public.itb_invitations FOR SELECT USING (private.is_org_member(org_id));
DROP POLICY IF EXISTS itb_invitations_org_write ON public.itb_invitations;
CREATE POLICY itb_invitations_org_write ON public.itb_invitations FOR ALL
  USING (private.has_org_role(org_id, ARRAY['owner','admin','manager']))
  WITH CHECK (private.has_org_role(org_id, ARRAY['owner','admin','manager']));

COMMIT;
