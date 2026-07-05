-- Subcontractor-Operations layer (v7.5) — Phase 1 SSOT.
-- The two gating contracts from REPO_UPDATE_SUBCONTRACTOR_OPS.md §4:
--   1. ComplianceRecord + eligibility (Compliance Vault) — gates dispatch.
--   2. WorkOrder + bids + change-orders (Work Order Dispatch).
-- 3NF, org-scoped, RLS on every table (private.is_org_member select /
-- private.has_org_role write). LDP naming: lifecycle columns are `*_state`.
-- The eligibility VERDICT is DERIVED (v_sub_eligibility), never stored.
-- Additive only — no existing table is altered; 100% of current URLs stay live.

-- ════════════════════════════════════════════════════════════════════
-- 1. COMPLIANCE — trade requirements + vendor documents (+ license states)
-- ════════════════════════════════════════════════════════════════════

-- Which document kinds a trade requires to be eligible (one row per kind → 3NF).
create table public.trade_requirements (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  trade text not null,
  doc_kind text not null,           -- 'coi' | 'w9' | 'license' | 'cert' | <custom>
  created_at timestamptz not null default now(),
  unique (org_id, trade, doc_kind)
);
create index trade_requirements_org_idx on public.trade_requirements (org_id, trade);

alter table public.trade_requirements enable row level security;
create policy trade_requirements_select on public.trade_requirements
  for select using (private.is_org_member(org_id));
create policy trade_requirements_write on public.trade_requirements
  for all using (private.has_org_role(org_id, array['owner', 'admin', 'controller']))
  with check (private.has_org_role(org_id, array['owner', 'admin', 'controller']));
grant select, insert, update, delete on public.trade_requirements to authenticated;

-- Actual compliance documents on file per vendor. `status` is NOT stored — it is
-- derived from expires_on + the alert window (see v_compliance_doc_status). The
-- absence of a required kind is the "missing" state, also derived.
create table public.compliance_documents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  doc_kind text not null,           -- 'coi' | 'w9' | 'license' | 'cert' | <custom>
  expires_on date,                  -- null = non-expiring (e.g. W-9)
  file_id uuid,                     -- storage object (advancing/credentials bucket)
  issued_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index compliance_documents_vendor_idx
  on public.compliance_documents (org_id, vendor_id, doc_kind) where deleted_at is null;

alter table public.compliance_documents enable row level security;
create policy compliance_documents_select on public.compliance_documents
  for select using (private.is_org_member(org_id));
create policy compliance_documents_write on public.compliance_documents
  for all using (private.has_org_role(org_id, array['owner', 'admin', 'controller', 'collaborator']))
  with check (private.has_org_role(org_id, array['owner', 'admin', 'controller', 'collaborator']));
create trigger trg_compliance_documents_updated before update on public.compliance_documents
  for each row execute function public.compvss_set_updated_at();
grant select, insert, update, delete on public.compliance_documents to authenticated;

-- A license may authorize work in several US states (3NF child of the document).
create table public.compliance_document_states (
  compliance_document_id uuid not null references public.compliance_documents(id) on delete cascade,
  state text not null,              -- 2-letter US state / region code
  primary key (compliance_document_id, state)
);

alter table public.compliance_document_states enable row level security;
create policy compliance_document_states_select on public.compliance_document_states
  for select using (exists (
    select 1 from public.compliance_documents d
    where d.id = compliance_document_id and private.is_org_member(d.org_id)));
create policy compliance_document_states_write on public.compliance_document_states
  for all using (exists (
    select 1 from public.compliance_documents d
    where d.id = compliance_document_id
      and private.has_org_role(d.org_id, array['owner', 'admin', 'controller', 'collaborator'])))
  with check (exists (
    select 1 from public.compliance_documents d
    where d.id = compliance_document_id
      and private.has_org_role(d.org_id, array['owner', 'admin', 'controller', 'collaborator'])));
grant select, insert, update, delete on public.compliance_document_states to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- 2. WORK ORDERS — the dispatch record everything attaches to
-- ════════════════════════════════════════════════════════════════════

create table public.work_orders (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  title text not null,
  trade text not null,
  site_address text,
  start_date date,
  end_date date,
  budget_guide_cents integer check (budget_guide_cents is null or budget_guide_cents >= 0),
  visibility text not null default 'private' check (visibility in ('private', 'public')),
  dispatch_mode text not null default 'allow-offers'
    check (dispatch_mode in ('allow-offers', 'firm-price', 'instant-book', 'assign')),
  -- LDP lifecycle: sequential operational arc of a dispatched work order.
  work_order_state text not null default 'draft'
    check (work_order_state in
      ('draft', 'posted', 'bids-in', 'awarded', 'in-progress',
       'complete', 'approved', 'invoiced', 'closed', 'cancelled')),
  awarded_vendor_id uuid references public.vendors(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (end_date is null or start_date is null or end_date >= start_date)
);
create index work_orders_org_state_idx
  on public.work_orders (org_id, work_order_state) where deleted_at is null;
create index work_orders_trade_idx on public.work_orders (org_id, trade) where deleted_at is null;
create index work_orders_project_idx on public.work_orders (project_id) where deleted_at is null;
create index work_orders_awarded_idx on public.work_orders (awarded_vendor_id) where deleted_at is null;
create index work_orders_public_idx on public.work_orders (visibility, work_order_state) where deleted_at is null;

alter table public.work_orders enable row level security;
-- Org members read their own; anyone may read a published public work order
-- (the Trades Marketplace public side, Phase 2).
create policy work_orders_select on public.work_orders
  for select using (
    private.is_org_member(org_id)
    or (visibility = 'public' and work_order_state in ('posted', 'bids-in')));
create policy work_orders_write on public.work_orders
  for all using (private.has_org_role(org_id, array['owner', 'admin', 'controller', 'collaborator']))
  with check (private.has_org_role(org_id, array['owner', 'admin', 'controller', 'collaborator']));
create trigger trg_work_orders_updated before update on public.work_orders
  for each row execute function public.compvss_set_updated_at();
grant select, insert, update, delete on public.work_orders to authenticated;

-- Bids on a work order. `eligible` is NOT stored — it is read from
-- v_sub_eligibility at bid/award time (the dispatch gate).
create table public.work_order_bids (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  work_order_id uuid not null references public.work_orders(id) on delete cascade,
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  amount_cents integer not null check (amount_cents >= 0),
  note text,
  created_at timestamptz not null default now(),
  unique (work_order_id, vendor_id)
);
create index work_order_bids_wo_idx on public.work_order_bids (work_order_id);
create index work_order_bids_vendor_idx on public.work_order_bids (org_id, vendor_id);

alter table public.work_order_bids enable row level security;
create policy work_order_bids_select on public.work_order_bids
  for select using (private.is_org_member(org_id));
create policy work_order_bids_write on public.work_order_bids
  for all using (private.has_org_role(org_id, array['owner', 'admin', 'controller', 'collaborator']))
  with check (private.has_org_role(org_id, array['owner', 'admin', 'controller', 'collaborator']));
grant select, insert, update, delete on public.work_order_bids to authenticated;

create table public.work_order_change_orders (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  work_order_id uuid not null references public.work_orders(id) on delete cascade,
  reason text not null,
  amount_cents integer not null,
  -- LDP lifecycle: cyclical approval state.
  change_order_state text not null default 'pending'
    check (change_order_state in ('pending', 'approved', 'declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index work_order_change_orders_wo_idx
  on public.work_order_change_orders (work_order_id, change_order_state);

alter table public.work_order_change_orders enable row level security;
create policy work_order_change_orders_select on public.work_order_change_orders
  for select using (private.is_org_member(org_id));
create policy work_order_change_orders_write on public.work_order_change_orders
  for all using (private.has_org_role(org_id, array['owner', 'admin', 'controller', 'collaborator']))
  with check (private.has_org_role(org_id, array['owner', 'admin', 'controller', 'collaborator']));
create trigger trg_work_order_change_orders_updated before update on public.work_order_change_orders
  for each row execute function public.compvss_set_updated_at();
grant select, insert, update, delete on public.work_order_change_orders to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- 3. DERIVED views — status + eligibility verdict (never stored)
-- ════════════════════════════════════════════════════════════════════

-- Per-document derived status: current / expiring (≤30d) / expired.
-- "missing" is not a row — it is computed at the requirement level below.
create or replace view public.v_compliance_doc_status
with (security_invoker = true) as
select
  d.id,
  d.org_id,
  d.vendor_id,
  d.doc_kind,
  d.expires_on,
  d.file_id,
  case
    when d.expires_on is null then 'current'
    when d.expires_on < current_date then 'expired'
    when d.expires_on <= current_date + interval '30 days' then 'expiring'
    else 'current'
  end as doc_status,
  case
    when d.expires_on is null then 100
    when d.expires_on < current_date then 0
    else greatest(0, least(100,
      round(((d.expires_on - current_date)::numeric / 30) * 100)))::int
  end as remaining_pct
from public.compliance_documents d
where d.deleted_at is null;

-- Eligibility verdict per (vendor × trade): derived from required kinds vs the
-- vendor's on-file documents. blocked = any required kind missing/expired;
-- expiring = any within the 30d window; else eligible. Dispatch reads this.
create or replace view public.v_sub_eligibility
with (security_invoker = true) as
with reqs as (
  select org_id, trade, doc_kind from public.trade_requirements
),
docs as (
  select org_id, vendor_id, doc_kind, doc_status from public.v_compliance_doc_status
),
pairs as (
  -- every (vendor that has any doc OR is awarded/bidding) × required kind
  select distinct r.org_id, v.vendor_id, r.trade, r.doc_kind
  from reqs r
  join (select distinct org_id, vendor_id from public.compliance_documents where deleted_at is null) v
    on v.org_id = r.org_id
),
evaluated as (
  select
    p.org_id, p.vendor_id, p.trade, p.doc_kind,
    coalesce(
      (select d.doc_status from docs d
        where d.org_id = p.org_id and d.vendor_id = p.vendor_id and d.doc_kind = p.doc_kind
        order by case d.doc_status when 'current' then 0 when 'expiring' then 1 else 2 end
        limit 1),
      'missing') as doc_status
  from pairs p
)
select
  org_id,
  vendor_id,
  trade,
  case
    when bool_or(doc_status in ('missing', 'expired')) then 'blocked'
    when bool_or(doc_status = 'expiring') then 'expiring'
    else 'eligible'
  end as verdict
from evaluated
group by org_id, vendor_id, trade;

grant select on public.v_compliance_doc_status to authenticated;
grant select on public.v_sub_eligibility to authenticated;
