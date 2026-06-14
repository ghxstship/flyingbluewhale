-- P3.b — structured vendor onboarding / due-diligence checklist.
--
-- Each row is one onboarding requirement for a vendor (W-9, COI, NDA,
-- banking, references, …). Operators work the list from the vendor's
-- Onboarding tab; the rollup (required vs approved) gives a single
-- onboarding-complete signal that gates publishing / awarding work.
--
-- LDP: cyclical operational lifecycle → `item_state` (not `status`).

create table if not exists public.vendor_onboarding_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  label text not null,
  required boolean not null default true,
  item_state text not null default 'pending'
    check (item_state in ('pending', 'submitted', 'approved', 'waived')),
  doc_url text,
  notes text,
  sort_order integer not null default 0,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists vendor_onboarding_items_vendor_idx
  on public.vendor_onboarding_items (org_id, vendor_id, sort_order);

alter table public.vendor_onboarding_items enable row level security;

create policy vendor_onboarding_items_org_select
  on public.vendor_onboarding_items for select
  using (private.is_org_member(org_id));

create policy vendor_onboarding_items_org_write
  on public.vendor_onboarding_items
  using (private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller']))
  with check (private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller']));

create trigger vendor_onboarding_items_touch_updated_at
  before update on public.vendor_onboarding_items
  for each row execute function public.touch_updated_at();
