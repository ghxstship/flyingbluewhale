-- Round 58 — AP invoice OCR extractions (G-029)
--
-- One row per uploaded invoice file. The AP OCR action ingests the file,
-- calls Anthropic Vision, and writes the extracted fields here for
-- review. On accept, the row is promoted into an `invoices` record.

BEGIN;

DO $$ BEGIN
  CREATE TYPE public.ap_extraction_state AS ENUM (
    'queued',
    'extracting',
    'extracted',
    'review',
    'matched',
    'promoted',
    'rejected',
    'failed'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.ap_invoice_extractions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  project_id      uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  -- The file is stored in the 'receipts' bucket; this row keeps the path.
  storage_path    text NOT NULL,
  file_name       text,
  size_bytes      bigint,
  state           public.ap_extraction_state NOT NULL DEFAULT 'queued',
  -- The structured extraction payload.
  vendor_name     text,
  vendor_tax_id   text,
  invoice_number  text,
  invoice_date    date,
  due_date        date,
  total_amount_cents bigint,
  tax_amount_cents bigint,
  currency        text DEFAULT 'USD',
  po_number       text,
  -- Per-line breakdown if extracted; JSONB to absorb variability.
  line_items      jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- Confidence + raw model output for audit.
  confidence      numeric(5,4),
  model_version   text,
  raw_response    jsonb,
  -- Matching: which existing PO and vendor row this maps to (if any).
  matched_vendor_id uuid REFERENCES public.vendors(id) ON DELETE SET NULL,
  matched_purchase_order_id uuid REFERENCES public.purchase_orders(id) ON DELETE SET NULL,
  -- Once promoted, the resulting invoices row.
  promoted_invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  uploaded_by     uuid REFERENCES auth.users(id),
  uploaded_at     timestamptz NOT NULL DEFAULT now(),
  extracted_at    timestamptz,
  promoted_at     timestamptz,
  error_message   text,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz
);

CREATE INDEX IF NOT EXISTS ap_extractions_org_idx
  ON public.ap_invoice_extractions (org_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS ap_extractions_project_idx
  ON public.ap_invoice_extractions (project_id) WHERE project_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ap_extractions_state_idx
  ON public.ap_invoice_extractions (state) WHERE state IN ('queued','extracting','extracted','review');
CREATE INDEX IF NOT EXISTS ap_extractions_matched_vendor_idx
  ON public.ap_invoice_extractions (matched_vendor_id) WHERE matched_vendor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ap_extractions_matched_po_idx
  ON public.ap_invoice_extractions (matched_purchase_order_id) WHERE matched_purchase_order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ap_extractions_promoted_invoice_idx
  ON public.ap_invoice_extractions (promoted_invoice_id) WHERE promoted_invoice_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ap_extractions_uploaded_at_idx
  ON public.ap_invoice_extractions (uploaded_at DESC);

COMMENT ON TABLE public.ap_invoice_extractions IS
  'Per-file AP invoice extractions via Anthropic Vision. State machine: queued → extracting → extracted → review → (matched → promoted) | rejected. Raw model response + confidence stored for audit.';

CREATE OR REPLACE FUNCTION public.touch_ap_extractions_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_ap_extractions_touch ON public.ap_invoice_extractions;
CREATE TRIGGER trg_ap_extractions_touch BEFORE UPDATE ON public.ap_invoice_extractions
  FOR EACH ROW EXECUTE FUNCTION public.touch_ap_extractions_updated_at();

ALTER TABLE public.ap_invoice_extractions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ap_extractions_org_select ON public.ap_invoice_extractions;
CREATE POLICY ap_extractions_org_select ON public.ap_invoice_extractions FOR SELECT USING (private.is_org_member(org_id));
DROP POLICY IF EXISTS ap_extractions_org_write ON public.ap_invoice_extractions;
CREATE POLICY ap_extractions_org_write ON public.ap_invoice_extractions FOR ALL
  USING (private.has_org_role(org_id, ARRAY['owner','admin','manager']))
  WITH CHECK (private.has_org_role(org_id, ARRAY['owner','admin','manager']));

COMMIT;
