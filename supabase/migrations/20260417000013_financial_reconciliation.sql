-- ═══════════════════════════════════════════════════════
-- RED SEA LION Migration 013: Financial Reconciliation
-- Closes GAP-022 (3-way match), GAP-023 (budget actuals),
-- GAP-024 (tax documents), GAP-025 (performance reviews),
-- GAP-026 (document retention), GAP-028 (retrospectives)
-- ═══════════════════════════════════════════════════════

-- ===== 1. Invoice 3-Way Match (GAP-022) =================
-- PO → Receiving → Invoice match verification
create or replace view v_three_way_match as
select
  po.id as purchase_order_id,
  po.po_number,
  po.project_id,
  po.vendor_id,
  po.status as po_status,
  po.total as po_total,
  
  -- Receiving
  (select count(*) from receiving_records rr where rr.po_id = po.id) as receiving_count,
  (select bool_and(rr.status = 'completed') from receiving_records rr where rr.po_id = po.id) as all_received,
  
  -- Invoices
  (select coalesce(sum(i.total_amount), 0) from invoices i where i.purchase_order_id = po.id) as invoiced_total,
  (select coalesce(sum(i.amount_paid), 0) from invoices i where i.purchase_order_id = po.id) as paid_total,
  (select count(*) from invoices i where i.purchase_order_id = po.id) as invoice_count,
  
  -- Match status
  case
    when (select coalesce(sum(i.total_amount), 0) from invoices i where i.purchase_order_id = po.id) = 0
      then 'awaiting_invoice'
    when abs(po.total - (select coalesce(sum(i.total_amount), 0) from invoices i where i.purchase_order_id = po.id)) < 0.01
      and (select bool_and(rr.status = 'completed') from receiving_records rr where rr.po_id = po.id)
      then 'matched'
    when (select coalesce(sum(i.total_amount), 0) from invoices i where i.purchase_order_id = po.id) > po.total
      then 'over_invoiced'
    when not (select coalesce(bool_and(rr.status = 'completed'), false) from receiving_records rr where rr.po_id = po.id)
      then 'partial_receipt'
    else 'under_invoiced'
  end as match_status

from purchase_orders po;


-- ===== 2. Budget Actuals View (GAP-023) ==================
create or replace view v_project_budget_actuals as
select
  p.id as project_id,
  p.name as project_name,
  p.organization_id,
  
  -- PO commitments
  (select coalesce(sum(po.total), 0)
   from purchase_orders po where po.project_id = p.id
   and po.status not in ('cancelled', 'closed')) as committed_po_total,
  
  -- Invoiced amounts
  (select coalesce(sum(i.total_amount), 0)
   from invoices i where i.project_id = p.id
   and i.status not in ('void', 'disputed')) as invoiced_total,
  
  -- Paid amounts
  (select coalesce(sum(i.amount_paid), 0)
   from invoices i where i.project_id = p.id) as paid_total,
  
  -- Expense reports
  (select coalesce(sum(e.amount), 0)
   from expenses e where e.project_id = p.id
   and e.status in ('approved', 'reimbursed')) as expense_total,
  
  -- Timesheet labor cost
  (select coalesce(sum(t.total_pay), 0)
   from timesheets t where t.project_id = p.id
   and t.status in ('approved', 'paid')) as labor_total,
  
  -- Contract commitments
  (select coalesce(sum(c.total_value), 0)
   from contracts c where c.project_id = p.id
   and c.status in ('executed', 'amendment')
   and c.total_value is not null) as contract_commitment_total,
  
  -- Grand total actual spend
  (select coalesce(sum(i.amount_paid), 0)
   from invoices i where i.project_id = p.id)
  + (select coalesce(sum(e.amount), 0)
     from expenses e where e.project_id = p.id
     and e.status in ('approved', 'reimbursed'))
  + (select coalesce(sum(t.total_pay), 0)
     from timesheets t where t.project_id = p.id
     and t.status in ('approved', 'paid'))
  as total_actual_spend
  
from projects p;


-- ===== 3. Tax Documents (GAP-024) ========================
create type tax_document_type as enum (
  '1099_nec', '1099_misc', 'w2', 'w9_filed', 'w8_filed', 'other'
);

create table tax_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  recipient_user_id uuid references auth.users(id) on delete set null,
  recipient_vendor_id uuid references vendors(id) on delete set null,
  recipient_name text not null,
  
  type tax_document_type not null,
  fiscal_year int not null,
  
  -- Amounts
  total_amount_paid numeric(12,2) not null default 0,
  federal_tax_withheld numeric(12,2) not null default 0,
  state_tax_withheld numeric(12,2) not null default 0,
  
  -- Filing
  tin_last_four text,
  filed_at timestamptz,
  filed_by uuid references auth.users(id),
  document_id uuid references documents(id) on delete set null,
  
  -- Status
  status text not null default 'draft'
    check (status in ('draft', 'generated', 'reviewed', 'filed', 'corrected', 'void')),
  
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_tax_org on tax_documents(organization_id);
create index idx_tax_year on tax_documents(fiscal_year);
create index idx_tax_type on tax_documents(type);
create index idx_tax_recipient on tax_documents(recipient_user_id);
create index idx_tax_vendor on tax_documents(recipient_vendor_id);

alter table tax_documents enable row level security;

create policy "Recipients can view own tax docs" on tax_documents
  for select using (recipient_user_id = auth.uid());

create policy "Org admins can manage tax docs" on tax_documents
  for all using (exists(
    select 1 from organization_members om
    where om.organization_id = tax_documents.organization_id
      and om.user_id = auth.uid()
      and om.role in ('developer', 'owner', 'admin')
  ));

create trigger tax_docs_updated_at
  before update on tax_documents
  for each row execute function update_updated_at();


-- ===== 4. Performance Reviews (GAP-025) ==================
create table member_performance_reviews (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reviewer_id uuid not null references auth.users(id),
  
  rating numeric(3,2) not null check (rating >= 0 and rating <= 5),
  
  -- Categorical ratings
  reliability_rating numeric(3,2) check (reliability_rating >= 0 and reliability_rating <= 5),
  quality_rating numeric(3,2) check (quality_rating >= 0 and quality_rating <= 5),
  communication_rating numeric(3,2) check (communication_rating >= 0 and communication_rating <= 5),
  
  strengths text,
  areas_for_improvement text,
  notes text,
  
  -- Recall
  would_rehire boolean not null default true,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(project_id, user_id, reviewer_id)
);

create index idx_reviews_project on member_performance_reviews(project_id);
create index idx_reviews_user on member_performance_reviews(user_id);
create index idx_reviews_rating on member_performance_reviews(rating);

alter table member_performance_reviews enable row level security;

create policy "Internal can view reviews" on member_performance_reviews
  for select using (is_internal_on_project(project_id));

create policy "Internal can manage reviews" on member_performance_reviews
  for all using (is_internal_on_project(project_id));

create trigger reviews_updated_at
  before update on member_performance_reviews
  for each row execute function update_updated_at();

-- Auto-sync recall pool status to people table
create or replace function sync_recall_pool()
returns trigger as $$
begin
  if new.would_rehire = false then
    update people set in_recall_pool = false
    where user_id = new.user_id;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger sync_recall_on_review
  after insert or update on member_performance_reviews
  for each row execute function sync_recall_pool();


-- ===== 5. Document Retention Policy (GAP-026) ============
alter table documents
  add column if not exists archived_at timestamptz,
  add column if not exists retention_until timestamptz;

create index if not exists idx_docs_retention on documents(retention_until)
  where retention_until is not null;

-- Prevent deletion of documents before retention period
create or replace function enforce_document_retention()
returns trigger as $$
begin
  if old.retention_until is not null and now() < old.retention_until then
    raise exception 'Cannot delete document % before retention date %',
      old.id, old.retention_until;
  end if;
  return old;
end;
$$ language plpgsql;

create trigger guard_document_retention
  before delete on documents
  for each row execute function enforce_document_retention();


-- ===== 6. Project Retrospectives (GAP-028) ===============
create table project_retrospectives (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  author_id uuid not null references auth.users(id),
  
  category text not null
    check (category in ('went_well', 'improvement', 'action_item', 'kudos', 'process', 'other')),
  
  content text not null,
  action_items text,
  assigned_to uuid references auth.users(id),
  
  -- Priority
  priority text not null default 'normal'
    check (priority in ('low', 'normal', 'high')),
  
  -- Resolution
  is_resolved boolean not null default false,
  resolved_at timestamptz,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_retro_project on project_retrospectives(project_id);
create index idx_retro_category on project_retrospectives(category);

alter table project_retrospectives enable row level security;

create policy "View retrospectives" on project_retrospectives
  for select using (is_project_member(project_id));

create policy "Create retrospectives" on project_retrospectives
  for insert with check (is_project_member(project_id));

create policy "Manage retrospectives" on project_retrospectives
  for all using (is_internal_on_project(project_id));

create trigger retro_updated_at
  before update on project_retrospectives
  for each row execute function update_updated_at();


-- ===== 7. Document Type Expansion (GAP-004 final) ========
alter table documents drop constraint if exists documents_type_check;
alter table documents add constraint documents_type_check
  check (type in (
    -- Original types
    'bol', 'pod', 'packing_slip', 'invoice', 'photo', 'receipt',
    'contract', 'manifest', 'inspection', 'other',
    -- Compliance types (from migration 007)
    'coi', 'w9', 'w8', 'insurance_cert', 'background_report',
    'union_card', 'work_authorization', 'nda', 'rider', 'release',
    -- Additional types
    'tax_form', 'timesheet', 'change_order', 'incident_report',
    'site_plan', 'floor_plan', 'permit', 'license', 'briefing',
    'damage_report', 'performance_review', 'retrospective'
  ));


-- ===== 8. Press Credential Advance (GAP-013) ============
-- Add press-specific credential flow via data modeling
-- (media pool assignment, photo pass types)
insert into advance_category_groups (id, name, slug, description, sort_order)
values ('a0000001-0000-0000-0000-000000000015', 'Media & Press', 'media-press',
  'Press credentials, media pool assignments, photo passes', 15)
on conflict (id) do nothing;

insert into advance_categories (id, group_id, name, slug, sort_order)
values
  ('b0000001-0000-0000-0000-000000000040', 'a0000001-0000-0000-0000-000000000015', 'Photo Passes', 'photo-passes', 1),
  ('b0000001-0000-0000-0000-000000000041', 'a0000001-0000-0000-0000-000000000015', 'Media Pool Access', 'media-pool', 2),
  ('b0000001-0000-0000-0000-000000000042', 'a0000001-0000-0000-0000-000000000015', 'Press Kits', 'press-kits', 3),
  ('b0000001-0000-0000-0000-000000000043', 'a0000001-0000-0000-0000-000000000015', 'Interview Scheduling', 'interviews', 4)
on conflict (id) do nothing;
