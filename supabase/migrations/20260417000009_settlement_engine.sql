-- =====================================================
-- RED SEA LION Migration 009: Settlement Engine
-- Closes GAP-009, GAP-020, GAP-021, GAP-022, GAP-036
-- Shifts, timesheets, invoices, expenses -- the full
-- financial lifecycle for stages 5 and 10-11.
-- =====================================================

-- ===== 1. Shifts (GAP-009) ==============================

create type shift_status as enum (
  'draft', 'published', 'acknowledged', 'in_progress',
  'completed', 'cancelled', 'no_show'
);

create table shifts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  role platform_role,

  -- Temporal
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  break_minutes int not null default 0,

  -- Location
  location_id uuid references locations(id) on delete set null,
  zone_id uuid references zones(id) on delete set null,

  -- Status
  status shift_status not null default 'draft',
  checked_in_at timestamptz,
  checked_out_at timestamptz,

  -- Pay
  pay_rate numeric(10,2),
  pay_rate_unit text check (pay_rate_unit in ('hourly', 'daily', 'flat')),

  -- Metadata
  title text,
  notes text,
  metadata jsonb not null default '{}',
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_shifts_project on shifts(project_id);
create index idx_shifts_user on shifts(user_id);
create index idx_shifts_status on shifts(status);
create index idx_shifts_window on shifts(starts_at, ends_at);
create index idx_shifts_location on shifts(location_id);

alter table shifts enable row level security;

create policy "Users can view own shifts"
  on shifts for select using (user_id = auth.uid());

create policy "Project members can view shifts"
  on shifts for select using (is_project_member(project_id));

create policy "Internal can manage shifts"
  on shifts for all using (is_internal_on_project(project_id));

create trigger shifts_updated_at
  before update on shifts
  for each row execute function update_updated_at();

-- Sync shifts to master schedule
create or replace function shift_to_schedule()
returns trigger as $$
begin
  if tg_op = 'DELETE' then
    delete from schedule_entries where source_type = 'manual' and source_id = old.id and source_field = 'shift_window';
    return old;
  end if;

  insert into schedule_entries (
    project_id, source_type, source_id, source_field,
    starts_at, ends_at, category,
    title, assigned_to, location_id, status, is_cancelled
  ) values (
    new.project_id, 'manual', new.id, 'shift_window',
    new.starts_at, new.ends_at, 'shift',
    coalesce(new.title, 'Shift'), new.user_id, new.location_id,
    new.status::text, new.status in ('cancelled', 'no_show')
  )
  on conflict (source_type, source_id, source_field) do update set
    starts_at = excluded.starts_at,
    ends_at = excluded.ends_at,
    title = excluded.title,
    assigned_to = excluded.assigned_to,
    location_id = excluded.location_id,
    status = excluded.status,
    is_cancelled = excluded.is_cancelled,
    updated_at = now();

  return new;
end;
$$ language plpgsql;

create trigger sync_shift_to_schedule
  after insert or update or delete on shifts
  for each row execute function shift_to_schedule();

-- ===== 2. Timesheets (GAP-021) ==========================

create type timesheet_status as enum (
  'draft', 'submitted', 'approved', 'rejected', 'paid'
);

create table timesheets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  shift_id uuid references shifts(id) on delete set null,

  -- Hours
  date date not null,
  hours_regular numeric(5,2) not null default 0,
  hours_overtime numeric(5,2) not null default 0,
  hours_double_time numeric(5,2) not null default 0,
  break_minutes int not null default 0,

  -- Pay
  rate_regular numeric(10,2),
  rate_overtime numeric(10,2),
  rate_double_time numeric(10,2),
  total_pay numeric(12,2) generated always as (
    hours_regular * coalesce(rate_regular, 0)
    + hours_overtime * coalesce(rate_overtime, 0)
    + hours_double_time * coalesce(rate_double_time, 0)
  ) stored,

  -- Status
  status timesheet_status not null default 'draft',
  submitted_at timestamptz,
  approved_by uuid references auth.users(id),
  approved_at timestamptz,

  notes text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(shift_id) -- one timesheet per shift
);

create index idx_timesheets_project on timesheets(project_id);
create index idx_timesheets_user on timesheets(user_id);
create index idx_timesheets_status on timesheets(status);
create index idx_timesheets_date on timesheets(date);

alter table timesheets enable row level security;

create policy "Users can view own timesheets"
  on timesheets for select using (user_id = auth.uid());

create policy "Users can manage own draft timesheets"
  on timesheets for update using (user_id = auth.uid() and status = 'draft');

create policy "Users can submit own timesheets"
  on timesheets for insert with check (user_id = auth.uid() and is_project_member(project_id));

create policy "Project members can view timesheets"
  on timesheets for select using (is_project_member(project_id));

create policy "Internal can manage timesheets"
  on timesheets for all using (is_internal_on_project(project_id));

create trigger timesheets_updated_at
  before update on timesheets
  for each row execute function update_updated_at();

-- ===== 3. Invoices (GAP-020, GAP-022, GAP-036) =========

create type invoice_status as enum (
  'draft', 'sent', 'paid', 'partially_paid', 'overdue', 'void', 'disputed'
);

create type invoice_direction as enum ('inbound', 'outbound');

create table invoices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  invoice_number text not null,
  direction invoice_direction not null default 'outbound',
  status invoice_status not null default 'draft',

  -- Counterparty
  vendor_id uuid references vendors(id) on delete set null,
  client_user_id uuid references auth.users(id) on delete set null,
  counterparty_name text,

  -- Dates
  issue_date date not null default current_date,
  due_date date,
  paid_at timestamptz,

  -- Amounts
  subtotal numeric(12,2) not null default 0,
  tax_total numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null default 0,
  amount_paid numeric(12,2) not null default 0,
  balance_due numeric(12,2) generated always as (total_amount - amount_paid) stored,
  currency text not null default 'USD',

  -- PO linkage for 3-way match
  purchase_order_id uuid references purchase_orders(id) on delete set null,

  notes text,
  terms text,
  metadata jsonb not null default '{}',
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_invoices_org on invoices(organization_id);
create index idx_invoices_project on invoices(project_id);
create index idx_invoices_vendor on invoices(vendor_id);
create index idx_invoices_status on invoices(status);
create index idx_invoices_direction on invoices(direction);
create index idx_invoices_po on invoices(purchase_order_id);

alter table invoices enable row level security;

create policy "Org members can view invoices"
  on invoices for select
  using (exists(
    select 1 from organization_members om
    where om.organization_id = invoices.organization_id and om.user_id = auth.uid()
  ));

create policy "Project members can view project invoices"
  on invoices for select
  using (project_id is not null and is_project_member(project_id));

create policy "Internal can manage invoices"
  on invoices for all
  using (
    exists(
      select 1 from organization_members om
      where om.organization_id = invoices.organization_id
        and om.user_id = auth.uid()
        and om.role in ('developer', 'owner', 'admin', 'team_member')
    )
  );

create trigger invoices_updated_at
  before update on invoices
  for each row execute function update_updated_at();

-- ===== 4. Expenses (GAP-020, GAP-036) ===================

create type expense_status as enum (
  'draft', 'submitted', 'approved', 'rejected', 'reimbursed'
);

create table expenses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,

  date date not null,
  amount numeric(12,2) not null,
  currency text not null default 'USD',
  category text not null,
  vendor_name text,
  description text,
  receipt_url text,

  status expense_status not null default 'draft',
  submitted_at timestamptz,
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  reimbursed_at timestamptz,

  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_expenses_org on expenses(organization_id);
create index idx_expenses_project on expenses(project_id);
create index idx_expenses_user on expenses(user_id);
create index idx_expenses_status on expenses(status);

alter table expenses enable row level security;

create policy "Users can view own expenses"
  on expenses for select using (user_id = auth.uid());

create policy "Users can manage own draft expenses"
  on expenses for all using (user_id = auth.uid() and status in ('draft', 'rejected'));

create policy "Project members can view project expenses"
  on expenses for select
  using (project_id is not null and is_project_member(project_id));

create policy "Internal can manage expenses"
  on expenses for all
  using (
    exists(
      select 1 from organization_members om
      where om.organization_id = expenses.organization_id
        and om.user_id = auth.uid()
        and om.role in ('developer', 'owner', 'admin', 'team_member')
    )
  );

create trigger expenses_updated_at
  before update on expenses
  for each row execute function update_updated_at();

-- ===== 5. People Directory (GAP-002, GAP-036) ===========

create type person_status as enum ('active', 'inactive', 'on_leave');
create type employment_type as enum ('w2', '1099', 'c2c', 'volunteer', 'salary');

create table people (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  manager_id uuid references people(id) on delete set null,

  first_name text not null,
  last_name text not null,
  full_name text generated always as (first_name || ' ' || last_name) stored,
  email text,
  phone text,
  title text,
  department text,

  employment_type employment_type not null default '1099',
  status person_status not null default 'active',
  hire_date date,

  -- Classification
  unspsc_code text,
  nigp_code text,
  naics_code text,

  -- Archival
  in_recall_pool boolean not null default false,
  performance_rating numeric(3,2) check (performance_rating >= 0 and performance_rating <= 5),

  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_people_org on people(organization_id);
create index idx_people_user on people(user_id);
create index idx_people_status on people(status);
create index idx_people_name on people(full_name);

alter table people enable row level security;

create policy "Org members can view people"
  on people for select
  using (exists(
    select 1 from organization_members om
    where om.organization_id = people.organization_id and om.user_id = auth.uid()
  ));

create policy "Admins can manage people"
  on people for all
  using (exists(
    select 1 from organization_members om
    where om.organization_id = people.organization_id
      and om.user_id = auth.uid()
      and om.role in ('developer', 'owner', 'admin', 'team_member')
  ));

create trigger people_updated_at
  before update on people
  for each row execute function update_updated_at();
