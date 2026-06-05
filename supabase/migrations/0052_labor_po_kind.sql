-- 0052 Labor Purchase Orders — Rentman parity
-- Adds po_kind to classify procurement vs labour POs, plus notes and
-- contractor fields so labour POs can reference the freelancer/agency
-- without a full HR record.

ALTER TABLE public.purchase_orders
  ADD COLUMN IF NOT EXISTS po_kind text NOT NULL DEFAULT 'goods'
    CHECK (po_kind IN ('goods', 'labor', 'services')),
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS contractor_name text,
  ADD COLUMN IF NOT EXISTS role_title text;

COMMENT ON COLUMN public.purchase_orders.po_kind IS
  'goods = equipment/supplies, labor = freelancer/staffing-agency fee, services = professional services';
COMMENT ON COLUMN public.purchase_orders.contractor_name IS
  'For labor POs: name of the freelancer or staffing agency being engaged.';
COMMENT ON COLUMN public.purchase_orders.role_title IS
  'For labor POs: role or position being filled (e.g. "Lighting Tech – A1").';
