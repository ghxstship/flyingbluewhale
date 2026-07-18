-- Kit 31 · COMPVSS Field conformance, resolution #20 — field PO Request.
-- The /m purchase-request flow writes requisitions; FORMS.po adds the
-- structured facets: vendor, qty, needed-by, budget coding (auto vs manual +
-- cost code), product link, purpose, and the attached quote (storage path in
-- the receipts bucket, service-client uploaded like expense receipts).

alter table public.requisitions
  add column if not exists vendor_name text,
  add column if not exists qty integer check (qty >= 1),
  add column if not exists needed_by date,
  add column if not exists cost_center_id uuid references public.cost_centers(id) on delete set null,
  add column if not exists auto_code boolean not null default true,
  add column if not exists product_url text,
  add column if not exists purpose text,
  add column if not exists quote_path text;

comment on column public.requisitions.auto_code is 'Kit 31 #20 — true = finance auto-codes on approval; false = manual cost_center_id supplied.';
comment on column public.requisitions.quote_path is 'Kit 31 #20 — storage path of the attached quote/screenshot (receipts bucket).';

create index if not exists requisitions_cost_center_id_idx on public.requisitions(cost_center_id);
