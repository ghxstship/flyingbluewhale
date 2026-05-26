-- Round 49 — Unified contracts (extension) + change-order markup rules
--
-- Per construction-pm-parity matrix D24 + D26. The platform already has
-- `public.contracts` as the Universal Contract Tracker (uct_kind / uct_state)
-- covering engagement-side contracts: sponsor deals, vendor SOWs, MSAs,
-- talent bookings, NDAs, rentals, venues.
--
-- This migration extends that canonical table — additive only — with the
-- construction-PM columns needed for prime/sub/consultant contracts:
-- billing method, retainage, NTE, allowance, bond, AIA-style retention,
-- progress payment tracking. Keeps a single contracts surface across both
-- domains rather than forking.
--
-- Plus the new change_order_markup_rules table (Procore Change Management
-- pattern) so PCO → CO promotion can auto-compute markup.

-- NOTE: enum ALTER ADD VALUE cannot run in a transaction block, and the
-- existing `uct_kind` values (vendor_sow, master_services, rental_agreement,
-- vendor_prequal, other) absorb most construction contract types. Construction-
-- PM rows are identified by `billing_method IS NOT NULL`; the parent
-- uct_kind taxonomy is preserved for the engagement-side surfaces.

BEGIN;

-- =============================================================================
-- 1. NEW ENUM — billing_method
-- =============================================================================

DO $$ BEGIN
  CREATE TYPE public.contract_billing_method AS ENUM (
    'lump_sum',
    'time_and_materials',
    'cost_plus_fee',
    'cost_plus_gmp',         -- guaranteed maximum price
    'unit_price',
    'milestone'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =============================================================================
-- 3. Extend contracts with construction-PM columns (all nullable)
-- =============================================================================

ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS billing_method     public.contract_billing_method,
  ADD COLUMN IF NOT EXISTS description_md     text,
  ADD COLUMN IF NOT EXISTS counterparty_name  text,
  ADD COLUMN IF NOT EXISTS counterparty_email text,
  ADD COLUMN IF NOT EXISTS vendor_id          uuid REFERENCES public.vendors(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS client_id          uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  -- Money — store in minor units (cents) for parity with total_value_minor.
  ADD COLUMN IF NOT EXISTS original_amount_minor    bigint,
  ADD COLUMN IF NOT EXISTS approved_co_amount_minor bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS revised_amount_minor     bigint,
  ADD COLUMN IF NOT EXISTS paid_to_date_minor       bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS not_to_exceed_minor      bigint,
  ADD COLUMN IF NOT EXISTS allowance_amount_minor   bigint,
  ADD COLUMN IF NOT EXISTS retainage_pct            numeric(5,2),
  ADD COLUMN IF NOT EXISTS retention_held_minor     bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS insurance_required       boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS bond_required            boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS bond_amount_minor        bigint,
  ADD COLUMN IF NOT EXISTS document_path            text,
  ADD COLUMN IF NOT EXISTS signed_at                timestamptz,
  ADD COLUMN IF NOT EXISTS code                     text,
  ADD COLUMN IF NOT EXISTS start_date               date,
  ADD COLUMN IF NOT EXISTS end_date                 date,
  ADD COLUMN IF NOT EXISTS notes                    text,
  ADD COLUMN IF NOT EXISTS created_by               uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS deleted_at               timestamptz;

CREATE INDEX IF NOT EXISTS contracts_vendor_idx
  ON public.contracts (vendor_id) WHERE vendor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS contracts_client_idx
  ON public.contracts (client_id) WHERE client_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS contracts_end_date_idx
  ON public.contracts (end_date) WHERE end_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS contracts_created_by_idx ON public.contracts (created_by);
CREATE INDEX IF NOT EXISTS contracts_deleted_at_idx ON public.contracts (deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS contracts_billing_method_idx
  ON public.contracts (billing_method) WHERE billing_method IS NOT NULL;
CREATE INDEX IF NOT EXISTS contracts_code_idx
  ON public.contracts (org_id, code) WHERE code IS NOT NULL;

COMMENT ON COLUMN public.contracts.billing_method IS
  'Construction-PM contracts: lump_sum, T&M, cost_plus_fee, cost_plus_GMP, unit_price, milestone. NULL for engagement-side contracts that use the parent uct_kind taxonomy.';
COMMENT ON COLUMN public.contracts.retainage_pct IS
  'AIA-style withholding %. retention_held_minor accumulates the held amount across pay-apps.';

-- =============================================================================
-- 4. change_order_markup_rules
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.change_order_markup_rules (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  -- Scope precedence: contract > project > org-default.
  project_id      uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  contract_id     uuid REFERENCES public.contracts(id) ON DELETE CASCADE,
  cost_component  text NOT NULL CHECK (cost_component IN (
    'labor', 'material', 'equipment', 'sub', 'rental', 'bond', 'overhead', 'profit', 'fee', 'other'
  )),
  markup_pct      numeric(7,4) NOT NULL,
  -- Tiering: apply this rate up to applies_up_to_minor; above threshold use
  -- the next rule. Standard pattern: 15% on first $10K, 10% above.
  applies_up_to_minor bigint,
  priority        int NOT NULL DEFAULT 100,
  notes           text,
  effective_at    date NOT NULL DEFAULT current_date,
  expires_at      date,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS co_markup_rules_org_idx ON public.change_order_markup_rules (org_id);
CREATE INDEX IF NOT EXISTS co_markup_rules_project_idx
  ON public.change_order_markup_rules (project_id) WHERE project_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS co_markup_rules_contract_idx
  ON public.change_order_markup_rules (contract_id) WHERE contract_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS co_markup_rules_cost_component_idx
  ON public.change_order_markup_rules (cost_component);
CREATE INDEX IF NOT EXISTS co_markup_rules_active_idx
  ON public.change_order_markup_rules (effective_at, expires_at);

COMMENT ON TABLE public.change_order_markup_rules IS
  'Per-cost-component markup % rules. Scope precedence: contract > project > org-default. Optional applies_up_to_minor threshold for tiered markup.';

CREATE OR REPLACE FUNCTION public.touch_round49_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_co_markup_rules_touch ON public.change_order_markup_rules;
CREATE TRIGGER trg_co_markup_rules_touch BEFORE UPDATE ON public.change_order_markup_rules
  FOR EACH ROW EXECUTE FUNCTION public.touch_round49_updated_at();

ALTER TABLE public.change_order_markup_rules  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS co_markup_rules_org_select ON public.change_order_markup_rules;
CREATE POLICY co_markup_rules_org_select ON public.change_order_markup_rules
  FOR SELECT USING (private.is_org_member(org_id));
DROP POLICY IF EXISTS co_markup_rules_org_write ON public.change_order_markup_rules;
CREATE POLICY co_markup_rules_org_write ON public.change_order_markup_rules FOR ALL
  USING (private.has_org_role(org_id, ARRAY['owner','admin','manager']))
  WITH CHECK (private.has_org_role(org_id, ARRAY['owner','admin','manager']));

COMMIT;
