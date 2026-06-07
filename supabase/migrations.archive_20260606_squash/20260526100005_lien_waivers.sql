-- Round 40 — Lien waivers + AIA pay-app extensions
--
-- Per construction-pm-parity Wave 3.1 + 3.2 (gaps G-003, G-004). Lien
-- waivers are statutory in 35+ US states — without them we cannot be the
-- pay-app system of record for a real GC.
--
-- Pay-app rows already exist (`payment_applications` + `payment_application_lines`);
-- this migration extends them with the AIA-form-specific columns
-- (retainage %, stored materials, prior periods, certification slot) and
-- adds a new `lien_waivers` table with the 4-quadrant statutory shape
-- (conditional/unconditional × partial/final).

BEGIN;

-- =============================================================================
-- 1. Extensions to payment_applications (AIA G702/G703 PDF export support)
-- =============================================================================

ALTER TABLE public.payment_applications
  ADD COLUMN IF NOT EXISTS aia_form_version       text,
  ADD COLUMN IF NOT EXISTS retainage_pct          numeric(5,2),
  ADD COLUMN IF NOT EXISTS stored_materials_amount numeric(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS prior_period_billed    numeric(14,2),
  ADD COLUMN IF NOT EXISTS architect_certification_at  timestamptz,
  ADD COLUMN IF NOT EXISTS architect_certification_by  uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS requires_lien_waiver_from_subs boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS payment_applications_arch_cert_by_idx
  ON public.payment_applications (architect_certification_by) WHERE architect_certification_by IS NOT NULL;

COMMENT ON COLUMN public.payment_applications.aia_form_version IS
  'Pixel-accurate PDF export targets — supports AIA 1992 + 2017 layouts.';
COMMENT ON COLUMN public.payment_applications.requires_lien_waiver_from_subs IS
  'Gate flag: when true, server-side enforcement requires signed lien waivers from every sub on this pay-app before payment can be released.';

-- =============================================================================
-- 2. ENUMS
-- =============================================================================

DO $$ BEGIN
  CREATE TYPE public.lien_waiver_type AS ENUM (
    'conditional',
    'unconditional'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.lien_waiver_scope AS ENUM (
    'partial',
    'final'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.lien_waiver_state AS ENUM (
    'drafted',
    'sent',
    'signed',
    'returned',
    'released',
    'voided'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMENT ON TYPE public.lien_waiver_state IS
  'Lifecycle. drafted → sent (via DocuSign) → signed (envelope completed) → returned (collected on the pay-app) → released (payment cleared). voided = abandoned with audit trail.';

-- =============================================================================
-- 3. lien_waivers
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.lien_waivers (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                   uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  project_id               uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  -- The sub or vendor signing the waiver.
  vendor_id                uuid REFERENCES public.vendors(id) ON DELETE SET NULL,
  -- Optional pay-app this waiver is collected against.
  payment_application_id   uuid REFERENCES public.payment_applications(id) ON DELETE SET NULL,
  -- 4-quadrant statutory shape.
  waiver_type              public.lien_waiver_type NOT NULL,
  waiver_scope             public.lien_waiver_scope NOT NULL,
  waiver_state             public.lien_waiver_state NOT NULL DEFAULT 'drafted',
  -- Amount of the waiver and the "through" date — the cutoff through which
  -- the sub is waiving lien rights.
  amount                   numeric(14,2) NOT NULL DEFAULT 0,
  through_date             date,
  -- US state determines the statutory form variant. Some states require
  -- specific notarized language (CA, NV, etc.). Stored for the PDF generator.
  state_jurisdiction       text,
  -- DocuSign envelope handle once sent. Populated by the contract envelope
  -- worker (Wave 3.6 in the parity roadmap).
  envelope_id              text,
  -- Captured at signature time.
  signed_at                timestamptz,
  signer_name              text,
  signer_title             text,
  signature_image          text,
  -- Lifecycle dates.
  sent_at                  timestamptz,
  returned_at              timestamptz,
  released_at              timestamptz,
  voided_at                timestamptz,
  voided_reason            text,
  notes                    text,
  created_by               uuid REFERENCES auth.users(id),
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now(),
  deleted_at               timestamptz
);

CREATE INDEX IF NOT EXISTS lien_waivers_org_idx
  ON public.lien_waivers (org_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS lien_waivers_project_idx
  ON public.lien_waivers (project_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS lien_waivers_vendor_idx
  ON public.lien_waivers (vendor_id) WHERE vendor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS lien_waivers_payment_app_idx
  ON public.lien_waivers (payment_application_id) WHERE payment_application_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS lien_waivers_state_idx
  ON public.lien_waivers (waiver_state) WHERE waiver_state IN ('drafted','sent','signed','returned');
CREATE INDEX IF NOT EXISTS lien_waivers_through_date_idx
  ON public.lien_waivers (through_date) WHERE through_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS lien_waivers_created_by_idx ON public.lien_waivers (created_by);

COMMENT ON TABLE public.lien_waivers IS
  'Statutory lien waivers — 4-quadrant matrix (conditional/unconditional × partial/final). Signed waivers gate payment release on AIA pay-apps.';

-- =============================================================================
-- 4. updated_at trigger
-- =============================================================================

CREATE OR REPLACE FUNCTION public.touch_lien_waiver_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lien_waivers_touch ON public.lien_waivers;
CREATE TRIGGER trg_lien_waivers_touch
  BEFORE UPDATE ON public.lien_waivers
  FOR EACH ROW EXECUTE FUNCTION public.touch_lien_waiver_updated_at();

-- =============================================================================
-- 5. RLS
-- =============================================================================

ALTER TABLE public.lien_waivers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS lien_waivers_org_select ON public.lien_waivers;
CREATE POLICY lien_waivers_org_select ON public.lien_waivers
  FOR SELECT USING (private.is_org_member(org_id));
DROP POLICY IF EXISTS lien_waivers_org_write ON public.lien_waivers;
CREATE POLICY lien_waivers_org_write ON public.lien_waivers
  FOR ALL
  USING (private.has_org_role(org_id, ARRAY['owner','admin','manager']))
  WITH CHECK (private.has_org_role(org_id, ARRAY['owner','admin','manager']));

COMMIT;
