-- flyingbluewhale · sales, finance, procurement, production, ops

-- ──────── SALES / CRM ────────
create type lead_stage as enum ('new','qualified','contacted','proposal','won','lost');
create type proposal_status as enum ('draft','sent','approved','rejected','expired','signed');

create table clients (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references orgs(id) on delete cascade,
  name         text not null,
  contact_email text,
  contact_phone text,
  website      text,
  notes        text,
  created_by   uuid references users(id),
  created_at   timestamptz not null default now()
);
create index clients_org_idx on clients(org_id);

create table leads (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references orgs(id) on delete cascade,
  name         text not null,
  email        text,
  phone        text,
  source       text,
  stage        lead_stage not null default 'new',
  estimated_value_cents bigint,
  assigned_to  uuid references users(id),
  notes        text,
  created_by   uuid references users(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index leads_org_idx on leads(org_id);
create trigger leads_touch_updated_at before update on leads for each row execute function touch_updated_at();

create table proposals (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references orgs(id) on delete cascade,
  project_id   uuid references projects(id) on delete set null,
  client_id    uuid references clients(id) on delete set null,
  title        text not null,
  amount_cents bigint,
  status       proposal_status not null default 'draft',
  sent_at      timestamptz,
  signed_at    timestamptz,
  expires_at   timestamptz,
  notes        text,
  created_by   uuid references users(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index proposals_org_idx on proposals(org_id);
create trigger proposals_touch_updated_at before update on proposals for each row execute function touch_updated_at();

-- ──────── FINANCE ────────
create type invoice_status as enum ('draft','sent','paid','overdue','voided');
create type expense_status as enum ('pending','approved','rejected','reimbursed');

create table invoices (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references orgs(id) on delete cascade,
  project_id   uuid references projects(id) on delete set null,
  client_id    uuid references clients(id) on delete set null,
  number       text not null,
  title        text not null,
  amount_cents bigint not null default 0,
  currency     text not null default 'USD',
  status       invoice_status not null default 'draft',
  issued_at    date,
  due_at       date,
  paid_at      timestamptz,
  stripe_payment_intent text,
  notes        text,
  created_by   uuid references users(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (org_id, number)
);
create index invoices_org_idx on invoices(org_id);
create trigger invoices_touch_updated_at before update on invoices for each row execute function touch_updated_at();

create table invoice_line_items (
  id           uuid primary key default gen_random_uuid(),
  invoice_id   uuid not null references invoices(id) on delete cascade,
  description  text not null,
  quantity     numeric not null default 1,
  unit_price_cents bigint not null default 0,
  position     int not null default 0
);
create index invoice_line_items_invoice_idx on invoice_line_items(invoice_id);

create table expenses (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references orgs(id) on delete cascade,
  project_id   uuid references projects(id) on delete set null,
  submitter_id uuid not null references users(id),
  category     text,
  description  text not null,
  amount_cents bigint not null,
  currency     text not null default 'USD',
  status       expense_status not null default 'pending',
  receipt_path text,
  spent_at     date not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index expenses_org_idx on expenses(org_id);
create trigger expenses_touch_updated_at before update on expenses for each row execute function touch_updated_at();

create table budgets (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references orgs(id) on delete cascade,
  project_id   uuid references projects(id) on delete cascade,
  name         text not null,
  category     text,
  amount_cents bigint not null default 0,
  spent_cents  bigint not null default 0,
  created_at   timestamptz not null default now()
);
create index budgets_org_idx on budgets(org_id);

create table time_entries (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references orgs(id) on delete cascade,
  project_id   uuid references projects(id) on delete set null,
  user_id      uuid not null references users(id),
  description  text,
  started_at   timestamptz not null,
  ended_at     timestamptz,
  duration_minutes int,
  billable     boolean not null default true,
  created_at   timestamptz not null default now()
);
create index time_entries_org_idx on time_entries(org_id);

create table mileage_logs (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references orgs(id) on delete cascade,
  project_id   uuid references projects(id) on delete set null,
  user_id      uuid not null references users(id),
  origin       text not null,
  destination  text not null,
  miles        numeric not null,
  rate_cents   bigint not null default 67,
  logged_on    date not null,
  notes        text,
  created_at   timestamptz not null default now()
);
create index mileage_org_idx on mileage_logs(org_id);

create table advances (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references orgs(id) on delete cascade,
  project_id   uuid references projects(id) on delete set null,
  requester_id uuid not null references users(id),
  amount_cents bigint not null,
  currency     text not null default 'USD',
  reason       text,
  status       text not null default 'pending' check (status in ('pending','approved','rejected','paid')),
  requested_at timestamptz not null default now(),
  decided_at   timestamptz
);
create index advances_org_idx on advances(org_id);

-- ──────── PROCUREMENT ────────
create type po_status as enum ('draft','sent','acknowledged','fulfilled','cancelled');
create type req_status as enum ('draft','submitted','approved','rejected','converted');

create table vendors (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references orgs(id) on delete cascade,
  name         text not null,
  contact_email text,
  contact_phone text,
  category     text,
  w9_on_file   boolean not null default false,
  coi_expires_at date,
  payout_account_id text,
  notes        text,
  created_at   timestamptz not null default now()
);
create index vendors_org_idx on vendors(org_id);

create table requisitions (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references orgs(id) on delete cascade,
  project_id   uuid references projects(id) on delete set null,
  requester_id uuid not null references users(id),
  title        text not null,
  description  text,
  estimated_cents bigint,
  status       req_status not null default 'draft',
  created_at   timestamptz not null default now()
);
create index requisitions_org_idx on requisitions(org_id);

create table purchase_orders (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references orgs(id) on delete cascade,
  project_id   uuid references projects(id) on delete set null,
  vendor_id    uuid references vendors(id) on delete set null,
  requisition_id uuid references requisitions(id) on delete set null,
  number       text not null,
  title        text not null,
  amount_cents bigint not null default 0,
  currency     text not null default 'USD',
  status       po_status not null default 'draft',
  created_by   uuid references users(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (org_id, number)
);
create index pos_org_idx on purchase_orders(org_id);
create trigger pos_touch_updated_at before update on purchase_orders for each row execute function touch_updated_at();

create table po_line_items (
  id             uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references purchase_orders(id) on delete cascade,
  description    text not null,
  quantity       numeric not null default 1,
  unit_price_cents bigint not null default 0,
  position       int not null default 0
);

-- ──────── PRODUCTION ────────
create type equipment_status as enum ('available','reserved','in_use','maintenance','retired');

create table equipment (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references orgs(id) on delete cascade,
  name         text not null,
  category     text,
  asset_tag    text,
  serial       text,
  status       equipment_status not null default 'available',
  location_id  uuid,
  daily_rate_cents bigint,
  notes        text,
  created_at   timestamptz not null default now()
);
create index equipment_org_idx on equipment(org_id);

create table rentals (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references orgs(id) on delete cascade,
  project_id   uuid references projects(id) on delete set null,
  equipment_id uuid not null references equipment(id),
  starts_at    timestamptz not null,
  ends_at      timestamptz not null,
  rate_cents   bigint,
  notes        text,
  created_at   timestamptz not null default now()
);
create index rentals_org_idx on rentals(org_id);

create table fabrication_orders (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references orgs(id) on delete cascade,
  project_id   uuid references projects(id) on delete set null,
  title        text not null,
  description  text,
  due_at       date,
  status       text not null default 'open' check (status in ('open','in_progress','blocked','complete')),
  created_at   timestamptz not null default now()
);
create index fabrication_org_idx on fabrication_orders(org_id);

-- ──────── OPS (tasks, schedule, events, locations, crew) ────────
create type task_status as enum ('todo','in_progress','blocked','review','done');
create type event_status as enum ('draft','scheduled','live','complete','cancelled');

create table tasks (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references orgs(id) on delete cascade,
  project_id   uuid references projects(id) on delete cascade,
  title        text not null,
  description  text,
  status       task_status not null default 'todo',
  priority     int not null default 2,
  due_at       date,
  assigned_to  uuid references users(id),
  created_by   uuid references users(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index tasks_org_idx on tasks(org_id);
create index tasks_project_idx on tasks(project_id);
create trigger tasks_touch_updated_at before update on tasks for each row execute function touch_updated_at();

create table events (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references orgs(id) on delete cascade,
  project_id   uuid references projects(id) on delete set null,
  name         text not null,
  starts_at    timestamptz not null,
  ends_at      timestamptz not null,
  location_id  uuid,
  status       event_status not null default 'draft',
  description  text,
  created_at   timestamptz not null default now()
);
create index events_org_idx on events(org_id);

create table locations (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references orgs(id) on delete cascade,
  name         text not null,
  address      text,
  city         text,
  region       text,
  country      text,
  postcode     text,
  lat          numeric,
  lng          numeric,
  notes        text,
  created_at   timestamptz not null default now()
);
create index locations_org_idx on locations(org_id);

create table crew_members (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references orgs(id) on delete cascade,
  user_id      uuid references users(id) on delete set null,
  name         text not null,
  role         text,
  phone        text,
  email        text,
  day_rate_cents bigint,
  notes        text,
  created_at   timestamptz not null default now()
);
create index crew_members_org_idx on crew_members(org_id);

create table credentials (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references orgs(id) on delete cascade,
  crew_member_id uuid references crew_members(id) on delete cascade,
  kind         text not null,
  number       text,
  issued_on    date,
  expires_on   date,
  file_path    text,
  created_at   timestamptz not null default now()
);
create index credentials_crew_idx on credentials(crew_member_id);

-- ──────── AI / audit ────────
create table ai_conversations (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references orgs(id) on delete cascade,
  user_id      uuid not null references users(id),
  title        text not null default 'New conversation',
  created_at   timestamptz not null default now()
);
create index ai_conversations_user_idx on ai_conversations(user_id);

create table ai_messages (
  id             uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references ai_conversations(id) on delete cascade,
  role           text not null check (role in ('user','assistant','system','tool')),
  content        text not null,
  created_at     timestamptz not null default now()
);
create index ai_messages_conversation_idx on ai_messages(conversation_id);

create table audit_log (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references orgs(id) on delete cascade,
  actor_id     uuid references users(id),
  action       text not null,
  target_table text,
  target_id    uuid,
  metadata     jsonb,
  at           timestamptz not null default now()
);
create index audit_log_org_idx on audit_log(org_id);

create table notifications (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references orgs(id) on delete cascade,
  user_id      uuid not null references users(id) on delete cascade,
  title        text not null,
  body         text,
  href         text,
  read_at      timestamptz,
  created_at   timestamptz not null default now()
);
create index notifications_user_idx on notifications(user_id);
