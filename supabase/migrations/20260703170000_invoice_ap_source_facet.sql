-- Phase A §09 merge (kit v7.8/20 REPO_LANDING §1): sub_invoices → invoices.
-- Part 1 of 2 — enum values + facet columns. Postgres forbids USING an enum
-- value in the transaction that adds it, so the row migration + gates land
-- in the follow-up migration (20260703170100_merge_sub_invoices_three_way_match).
--
-- The `source` facet splits the one invoices store by fact direction:
--   'ar'     — outbound client billing (the original store; default)
--   'ap_sub' — inbound subcontractor payment applications (ex-sub_invoices)
-- LDP: `source` is a facet, not a lifecycle — the lifecycle stays
-- `invoice_state`, which gains the AP arc (submitted → approved|rejected → paid).

-- AP arc states for the shared lifecycle enum.
alter type public.invoice_status add value if not exists 'submitted';
alter type public.invoice_status add value if not exists 'approved';
alter type public.invoice_status add value if not exists 'rejected';

alter table public.invoices
  -- Fact-direction facet (AR outbound vs AP-sub inbound).
  add column source text not null default 'ar'
    constraint invoices_source_check check (source in ('ar', 'ap_sub')),
  -- AP party: the subcontractor being paid (AR keeps client_id).
  add column vendor_id uuid references public.vendors(id) on delete restrict,
  -- Work performed against (ex-sub_invoices.work_order_id). SET NULL — a
  -- financial record must survive its work order.
  add column work_order_id uuid references public.work_orders(id) on delete set null,
  -- The 3-way-match linkage: PO this invoice bills against.
  add column purchase_order_id uuid references public.purchase_orders(id) on delete set null,
  -- Retainage withheld from this payment application (percent, 0–100).
  add column retainage_pct numeric(5, 2) not null default 0
    constraint invoices_retainage_pct_check check (retainage_pct >= 0 and retainage_pct <= 100),
  -- The lien waiver covering this payment — the waiver gate reads its
  -- waiver_state (3NF: no denormalized waiver badge column).
  add column lien_waiver_id uuid references public.lien_waivers(id) on delete set null,
  -- AP approval stamp (ex-sub_invoices.approved_at).
  add column approved_at timestamptz;

-- An inbound sub invoice always names the sub being paid.
alter table public.invoices add constraint invoices_ap_sub_vendor_check
  check (source <> 'ap_sub' or vendor_id is not null);

create index invoices_org_source_idx on public.invoices (org_id, source) where deleted_at is null;
create index invoices_vendor_idx on public.invoices (vendor_id) where vendor_id is not null;
create index invoices_work_order_idx on public.invoices (work_order_id) where work_order_id is not null;
create index invoices_purchase_order_idx on public.invoices (purchase_order_id) where purchase_order_id is not null;
create index invoices_lien_waiver_idx on public.invoices (lien_waiver_id) where lien_waiver_id is not null;
