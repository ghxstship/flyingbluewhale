-- flyingbluewhale · Procore/HeyPros parity additions
--
-- Adds Daily Logs, Site Plans, Inspections, RFIs, Submittals, Punch Lists,
-- Pay Apps, Vendor COs, Bid Leveling, Prequalification, Safety Briefings,
-- Project Photos, Cost Codes, WO Broadcasts, PO Checklists, Conversations,
-- plus extensions to budgets / incidents / time_entries.
--
-- Design rules:
--   1. Every tenant table has org_id (so SSOT triggers from migration 10
--      auto-attach updated_at + audit_rows).
--   2. 3NF: facts live in one table, line items separated, enums via check
--      constraints, no redundant denormalization.
--   3. RLS on every tenant table: select/insert/update/delete policies via
--      is_org_member(org_id) and has_org_role(org_id, roles[]) helpers.
--   4. Foreign keys point at canonical owners; ON DELETE chosen so we never
--      orphan child rows that need their parent (cascade) versus rows that
--      can outlive the link (set null).

------------------------------------------------------------------
-- 1. conversations + conversation_messages — universal threads
------------------------------------------------------------------
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  record_type text not null check (record_type in (
    'project','purchase_order','requisition','rfq','rfi','submittal',
    'punch_item','inspection','daily_log','site_plan','vendor','client',
    'proposal','deliverable','incident','task','event','ticket','invoice',
    'payment_application','po_change_order','work_order_broadcast',
    'safety_briefing','prequalification'
  )),
  record_id uuid not null,
  created_at timestamptz not null default now(),
  unique (org_id, record_type, record_id)
);
create index if not exists idx_conversations_org on conversations (org_id);
alter table conversations enable row level security;
create policy conversations_select on conversations for select using (is_org_member(org_id));
create policy conversations_insert on conversations for insert with check (is_org_member(org_id));
create policy conversations_update on conversations for update using (has_org_role(org_id, array['owner','admin','controller','collaborator']));
create policy conversations_delete on conversations for delete using (has_org_role(org_id, array['owner','admin']));

create table if not exists conversation_messages (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  conversation_id uuid not null references conversations(id) on delete cascade,
  author_id uuid references users(id) on delete set null,
  body text not null check (length(body) > 0),
  attachments jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_conv_msg_thread on conversation_messages (conversation_id, created_at);
alter table conversation_messages enable row level security;
create policy conv_msg_select on conversation_messages for select using (is_org_member(org_id));
create policy conv_msg_insert on conversation_messages for insert with check (is_org_member(org_id) and author_id = auth.uid());
create policy conv_msg_update on conversation_messages for update using (author_id = auth.uid());
create policy conv_msg_delete on conversation_messages for delete using (author_id = auth.uid() or has_org_role(org_id, array['owner','admin']));

------------------------------------------------------------------
-- 2. daily_logs + sub-tables (manpower, equipment, deliveries,
--    visitors, photos)
------------------------------------------------------------------
create table if not exists daily_logs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  log_date date not null,
  weather_summary text,
  weather_temp_high_f numeric,
  weather_temp_low_f numeric,
  weather_precip_in numeric,
  weather_wind_mph numeric,
  weather_source text,
  notes text,
  status text not null check (status in ('draft','submitted','approved')) default 'draft',
  submitted_by uuid references users(id) on delete set null,
  submitted_at timestamptz,
  approved_by uuid references users(id) on delete set null,
  approved_at timestamptz,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (org_id, project_id, log_date)
);
create index if not exists idx_daily_logs_project_date on daily_logs (project_id, log_date desc);
alter table daily_logs enable row level security;
create policy daily_logs_select on daily_logs for select using (is_org_member(org_id));
create policy daily_logs_insert on daily_logs for insert with check (has_org_role(org_id, array['owner','admin','controller','collaborator','crew']));
create policy daily_logs_update on daily_logs for update using (has_org_role(org_id, array['owner','admin','controller','collaborator','crew']));
create policy daily_logs_delete on daily_logs for delete using (has_org_role(org_id, array['owner','admin']));

create table if not exists daily_log_manpower (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  daily_log_id uuid not null references daily_logs(id) on delete cascade,
  trade text not null,
  vendor_id uuid references vendors(id) on delete set null,
  headcount int not null check (headcount >= 0),
  hours_worked numeric not null default 0 check (hours_worked >= 0),
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists idx_dl_manpower_log on daily_log_manpower (daily_log_id);
alter table daily_log_manpower enable row level security;
create policy dl_manpower_select on daily_log_manpower for select using (is_org_member(org_id));
create policy dl_manpower_write on daily_log_manpower for all
  using (has_org_role(org_id, array['owner','admin','controller','collaborator','crew']))
  with check (has_org_role(org_id, array['owner','admin','controller','collaborator','crew']));

create table if not exists daily_log_equipment (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  daily_log_id uuid not null references daily_logs(id) on delete cascade,
  equipment_id uuid references equipment(id) on delete set null,
  description text,
  hours_used numeric not null default 0 check (hours_used >= 0),
  hours_idle numeric not null default 0 check (hours_idle >= 0),
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists idx_dl_equipment_log on daily_log_equipment (daily_log_id);
alter table daily_log_equipment enable row level security;
create policy dl_equipment_select on daily_log_equipment for select using (is_org_member(org_id));
create policy dl_equipment_write on daily_log_equipment for all
  using (has_org_role(org_id, array['owner','admin','controller','collaborator','crew']))
  with check (has_org_role(org_id, array['owner','admin','controller','collaborator','crew']));

create table if not exists daily_log_deliveries (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  daily_log_id uuid not null references daily_logs(id) on delete cascade,
  vendor_id uuid references vendors(id) on delete set null,
  description text not null,
  arrived_at timestamptz,
  received_by uuid references users(id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists idx_dl_deliveries_log on daily_log_deliveries (daily_log_id);
alter table daily_log_deliveries enable row level security;
create policy dl_deliveries_select on daily_log_deliveries for select using (is_org_member(org_id));
create policy dl_deliveries_write on daily_log_deliveries for all
  using (has_org_role(org_id, array['owner','admin','controller','collaborator','crew']))
  with check (has_org_role(org_id, array['owner','admin','controller','collaborator','crew']));

create table if not exists daily_log_visitors (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  daily_log_id uuid not null references daily_logs(id) on delete cascade,
  name text not null,
  organization text,
  purpose text,
  arrived_at timestamptz,
  departed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_dl_visitors_log on daily_log_visitors (daily_log_id);
alter table daily_log_visitors enable row level security;
create policy dl_visitors_select on daily_log_visitors for select using (is_org_member(org_id));
create policy dl_visitors_write on daily_log_visitors for all
  using (has_org_role(org_id, array['owner','admin','controller','collaborator','crew']))
  with check (has_org_role(org_id, array['owner','admin','controller','collaborator','crew']));

create table if not exists daily_log_photos (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  daily_log_id uuid not null references daily_logs(id) on delete cascade,
  file_path text not null,
  caption text,
  taken_at timestamptz not null default now(),
  taken_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists idx_dl_photos_log on daily_log_photos (daily_log_id);
alter table daily_log_photos enable row level security;
create policy dl_photos_select on daily_log_photos for select using (is_org_member(org_id));
create policy dl_photos_write on daily_log_photos for all
  using (has_org_role(org_id, array['owner','admin','controller','collaborator','crew']))
  with check (has_org_role(org_id, array['owner','admin','controller','collaborator','crew']));

------------------------------------------------------------------
-- 3. site_plans + revisions + pins
------------------------------------------------------------------
create table if not exists site_plans (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  venue_id uuid references venues(id) on delete set null,
  code text not null,
  title text not null,
  discipline text not null check (discipline in (
    'site','rigging','power','audio','video','lighting','comms',
    'evacuation','hospitality','accessibility','sustainability','other'
  )) default 'site',
  current_revision_id uuid,
  notes text,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (org_id, project_id, code)
);
create index if not exists idx_site_plans_project on site_plans (project_id);
alter table site_plans enable row level security;
create policy site_plans_select on site_plans for select using (is_org_member(org_id));
create policy site_plans_insert on site_plans for insert with check (has_org_role(org_id, array['owner','admin','controller','collaborator']));
create policy site_plans_update on site_plans for update using (has_org_role(org_id, array['owner','admin','controller','collaborator']));
create policy site_plans_delete on site_plans for delete using (has_org_role(org_id, array['owner','admin']));

create table if not exists site_plan_revisions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  site_plan_id uuid not null references site_plans(id) on delete cascade,
  revision_label text not null,
  file_path text not null,
  notes text,
  uploaded_by uuid references users(id) on delete set null,
  uploaded_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (site_plan_id, revision_label)
);
create index if not exists idx_site_plan_rev_plan on site_plan_revisions (site_plan_id);
alter table site_plan_revisions enable row level security;
create policy site_plan_rev_select on site_plan_revisions for select using (is_org_member(org_id));
create policy site_plan_rev_write on site_plan_revisions for all
  using (has_org_role(org_id, array['owner','admin','controller','collaborator']))
  with check (has_org_role(org_id, array['owner','admin','controller','collaborator']));

-- Now that revisions exist, wire the FK from site_plans.current_revision_id
alter table site_plans
  add constraint site_plans_current_revision_fk
  foreign key (current_revision_id) references site_plan_revisions(id) on delete set null
  not valid;

create table if not exists site_plan_pins (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  site_plan_id uuid not null references site_plans(id) on delete cascade,
  x_pct numeric not null check (x_pct >= 0 and x_pct <= 100),
  y_pct numeric not null check (y_pct >= 0 and y_pct <= 100),
  pin_type text not null check (pin_type in ('issue','note','rfi','punch','inspection','rigging','power','equipment','zone')),
  link_record_type text,
  link_record_id uuid,
  label text,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists idx_site_plan_pins_plan on site_plan_pins (site_plan_id);
alter table site_plan_pins enable row level security;
create policy site_plan_pins_select on site_plan_pins for select using (is_org_member(org_id));
create policy site_plan_pins_write on site_plan_pins for all
  using (has_org_role(org_id, array['owner','admin','controller','collaborator','crew']))
  with check (has_org_role(org_id, array['owner','admin','controller','collaborator','crew']));

------------------------------------------------------------------
-- 4. inspections (templates + instances + items)
------------------------------------------------------------------
create table if not exists inspection_templates (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  code text not null,
  name text not null,
  category text not null check (category in (
    'rigging','fire','electrical','ada','food_safety','security','foh','medical','sustainability','custom'
  )) default 'custom',
  description text,
  active boolean not null default true,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (org_id, code)
);
alter table inspection_templates enable row level security;
create policy insp_tpl_select on inspection_templates for select using (is_org_member(org_id));
create policy insp_tpl_insert on inspection_templates for insert with check (has_org_role(org_id, array['owner','admin','controller','collaborator']));
create policy insp_tpl_update on inspection_templates for update using (has_org_role(org_id, array['owner','admin','controller','collaborator']));
create policy insp_tpl_delete on inspection_templates for delete using (has_org_role(org_id, array['owner','admin']));

create table if not exists inspection_template_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  template_id uuid not null references inspection_templates(id) on delete cascade,
  position int not null default 0,
  prompt text not null,
  requires_photo boolean not null default false,
  requires_note_on_fail boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_insp_tpl_items_tpl on inspection_template_items (template_id, position);
alter table inspection_template_items enable row level security;
create policy insp_tpl_items_select on inspection_template_items for select using (is_org_member(org_id));
create policy insp_tpl_items_write on inspection_template_items for all
  using (has_org_role(org_id, array['owner','admin','controller','collaborator']))
  with check (has_org_role(org_id, array['owner','admin','controller','collaborator']));

create table if not exists inspections (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  template_id uuid references inspection_templates(id) on delete set null,
  code text not null,
  name text not null,
  category text,
  status text not null check (status in ('scheduled','in_progress','passed','failed','cancelled')) default 'scheduled',
  inspector_id uuid references users(id) on delete set null,
  scheduled_for timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  signature_path text,
  signed_at timestamptz,
  signed_by uuid references users(id) on delete set null,
  notes text,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (org_id, code)
);
create index if not exists idx_inspections_project on inspections (project_id, status);
alter table inspections enable row level security;
create policy inspections_select on inspections for select using (is_org_member(org_id));
create policy inspections_insert on inspections for insert with check (has_org_role(org_id, array['owner','admin','controller','collaborator','crew']));
create policy inspections_update on inspections for update using (has_org_role(org_id, array['owner','admin','controller','collaborator','crew']));
create policy inspections_delete on inspections for delete using (has_org_role(org_id, array['owner','admin']));

create table if not exists inspection_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  inspection_id uuid not null references inspections(id) on delete cascade,
  template_item_id uuid references inspection_template_items(id) on delete set null,
  position int not null default 0,
  prompt text not null,
  result text not null check (result in ('pending','pass','fail','na')) default 'pending',
  photo_path text,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists idx_insp_items_inspection on inspection_items (inspection_id, position);
alter table inspection_items enable row level security;
create policy insp_items_select on inspection_items for select using (is_org_member(org_id));
create policy insp_items_write on inspection_items for all
  using (has_org_role(org_id, array['owner','admin','controller','collaborator','crew']))
  with check (has_org_role(org_id, array['owner','admin','controller','collaborator','crew']));

------------------------------------------------------------------
-- 5. rfis — production queries with ball-in-court routing
------------------------------------------------------------------
create table if not exists rfis (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  code text not null,
  subject text not null,
  question text not null,
  category text,
  asked_by uuid references users(id) on delete set null,
  ball_in_court_id uuid references users(id) on delete set null,
  status text not null check (status in ('open','answered','closed','void')) default 'open',
  priority text not null check (priority in ('low','normal','high','urgent')) default 'normal',
  due_at date,
  asked_at timestamptz not null default now(),
  answered_at timestamptz,
  closed_at timestamptz,
  official_answer text,
  answered_by uuid references users(id) on delete set null,
  linked_deliverable_id uuid references deliverables(id) on delete set null,
  linked_po_id uuid references purchase_orders(id) on delete set null,
  linked_site_plan_id uuid references site_plans(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (org_id, code)
);
create index if not exists idx_rfis_project_status on rfis (project_id, status);
create index if not exists idx_rfis_ball_in_court on rfis (ball_in_court_id) where status = 'open';
alter table rfis enable row level security;
create policy rfis_select on rfis for select using (is_org_member(org_id));
create policy rfis_insert on rfis for insert with check (is_org_member(org_id));
create policy rfis_update on rfis for update using (has_org_role(org_id, array['owner','admin','controller','collaborator','crew','contractor']));
create policy rfis_delete on rfis for delete using (has_org_role(org_id, array['owner','admin']));

------------------------------------------------------------------
-- 6. submittals — formal stamp/revision-round register
------------------------------------------------------------------
create table if not exists submittals (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  code text not null,
  title text not null,
  spec_section text,
  vendor_id uuid references vendors(id) on delete set null,
  ball_in_court_id uuid references users(id) on delete set null,
  status text not null check (status in (
    'draft','submitted','in_review','approved','approved_with_comments','revise_resubmit','rejected','void','closed'
  )) default 'draft',
  current_round int not null default 1,
  due_at date,
  submitted_at timestamptz,
  closed_at timestamptz,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (org_id, code)
);
create index if not exists idx_submittals_project_status on submittals (project_id, status);
alter table submittals enable row level security;
create policy submittals_select on submittals for select using (is_org_member(org_id));
create policy submittals_insert on submittals for insert with check (is_org_member(org_id));
create policy submittals_update on submittals for update using (has_org_role(org_id, array['owner','admin','controller','collaborator','contractor']));
create policy submittals_delete on submittals for delete using (has_org_role(org_id, array['owner','admin']));

create table if not exists submittal_revisions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  submittal_id uuid not null references submittals(id) on delete cascade,
  round int not null check (round > 0),
  file_path text,
  submitted_by uuid references users(id) on delete set null,
  submitted_at timestamptz not null default now(),
  stamp text not null check (stamp in (
    'no_stamp','approved','approved_with_comments','revise_resubmit','rejected'
  )) default 'no_stamp',
  stamp_notes text,
  stamped_by uuid references users(id) on delete set null,
  stamped_at timestamptz,
  created_at timestamptz not null default now(),
  unique (submittal_id, round)
);
alter table submittal_revisions enable row level security;
create policy submittal_rev_select on submittal_revisions for select using (is_org_member(org_id));
create policy submittal_rev_write on submittal_revisions for all
  using (has_org_role(org_id, array['owner','admin','controller','collaborator','contractor']))
  with check (has_org_role(org_id, array['owner','admin','controller','collaborator','contractor']));

------------------------------------------------------------------
-- 7. punch_lists + punch_items
------------------------------------------------------------------
create table if not exists punch_lists (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  category text,
  status text not null check (status in ('open','closed')) default 'open',
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists idx_punch_lists_project on punch_lists (project_id, status);
alter table punch_lists enable row level security;
create policy punch_lists_select on punch_lists for select using (is_org_member(org_id));
create policy punch_lists_write on punch_lists for all
  using (has_org_role(org_id, array['owner','admin','controller','collaborator']))
  with check (has_org_role(org_id, array['owner','admin','controller','collaborator']));

create table if not exists punch_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  punch_list_id uuid references punch_lists(id) on delete set null,
  code text not null,
  title text not null,
  description text,
  status text not null check (status in ('open','in_progress','ready_for_review','complete','void')) default 'open',
  priority text not null check (priority in ('low','normal','high','urgent')) default 'normal',
  assignee_id uuid references users(id) on delete set null,
  vendor_id uuid references vendors(id) on delete set null,
  due_at date,
  closed_at timestamptz,
  closed_by uuid references users(id) on delete set null,
  site_plan_id uuid references site_plans(id) on delete set null,
  pin_x numeric,
  pin_y numeric,
  photo_path text,
  show_ready_gate boolean not null default false,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (org_id, code)
);
create index if not exists idx_punch_items_project_status on punch_items (project_id, status);
create index if not exists idx_punch_items_assignee on punch_items (assignee_id) where status in ('open','in_progress','ready_for_review');
alter table punch_items enable row level security;
create policy punch_items_select on punch_items for select using (is_org_member(org_id));
create policy punch_items_insert on punch_items for insert with check (is_org_member(org_id));
create policy punch_items_update on punch_items for update using (has_org_role(org_id, array['owner','admin','controller','collaborator','crew','contractor']));
create policy punch_items_delete on punch_items for delete using (has_org_role(org_id, array['owner','admin']));

------------------------------------------------------------------
-- 8. payment_applications + lines (G702/G703 analogue)
------------------------------------------------------------------
create table if not exists payment_applications (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  purchase_order_id uuid not null references purchase_orders(id) on delete cascade,
  vendor_id uuid references vendors(id) on delete set null,
  application_number int not null,
  period_start date not null,
  period_end date not null,
  status text not null check (status in (
    'draft','submitted','in_review','approved','rejected','paid'
  )) default 'draft',
  retention_pct numeric not null default 10 check (retention_pct >= 0 and retention_pct <= 100),
  total_completed_cents bigint not null default 0,
  total_retention_cents bigint not null default 0,
  total_previously_paid_cents bigint not null default 0,
  total_due_cents bigint not null default 0,
  submitted_at timestamptz,
  approved_at timestamptz,
  approved_by uuid references users(id) on delete set null,
  paid_at timestamptz,
  notes text,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (org_id, purchase_order_id, application_number)
);
create index if not exists idx_pay_apps_po on payment_applications (purchase_order_id);
create index if not exists idx_pay_apps_status on payment_applications (org_id, status);
alter table payment_applications enable row level security;
create policy pay_apps_select on payment_applications for select using (is_org_member(org_id));
create policy pay_apps_insert on payment_applications for insert with check (is_org_member(org_id));
create policy pay_apps_update on payment_applications for update using (has_org_role(org_id, array['owner','admin','controller','collaborator','contractor']));
create policy pay_apps_delete on payment_applications for delete using (has_org_role(org_id, array['owner','admin','controller']));

create table if not exists payment_application_lines (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  payment_application_id uuid not null references payment_applications(id) on delete cascade,
  po_line_item_id uuid not null references po_line_items(id) on delete cascade,
  scheduled_value_cents bigint not null default 0,
  pct_complete_to_date numeric not null default 0 check (pct_complete_to_date >= 0 and pct_complete_to_date <= 100),
  pct_complete_this_period numeric not null default 0 check (pct_complete_this_period >= 0 and pct_complete_this_period <= 100),
  completed_to_date_cents bigint not null default 0,
  this_period_cents bigint not null default 0,
  retention_cents bigint not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  unique (payment_application_id, po_line_item_id)
);
alter table payment_application_lines enable row level security;
create policy pay_app_lines_select on payment_application_lines for select using (is_org_member(org_id));
create policy pay_app_lines_write on payment_application_lines for all
  using (has_org_role(org_id, array['owner','admin','controller','collaborator','contractor']))
  with check (has_org_role(org_id, array['owner','admin','controller','collaborator','contractor']));

------------------------------------------------------------------
-- 9. po_change_orders + lines
------------------------------------------------------------------
create table if not exists po_change_orders (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  purchase_order_id uuid not null references purchase_orders(id) on delete cascade,
  number int not null,
  title text not null,
  description text,
  reason text,
  status text not null check (status in ('proposed','submitted','in_review','approved','rejected','void')) default 'proposed',
  amount_cents bigint not null default 0,
  schedule_impact_days int not null default 0,
  proposed_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid references users(id) on delete set null,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (org_id, purchase_order_id, number)
);
create index if not exists idx_po_co_po on po_change_orders (purchase_order_id);
create index if not exists idx_po_co_status on po_change_orders (org_id, status);
alter table po_change_orders enable row level security;
create policy po_co_select on po_change_orders for select using (is_org_member(org_id));
create policy po_co_insert on po_change_orders for insert with check (is_org_member(org_id));
create policy po_co_update on po_change_orders for update using (has_org_role(org_id, array['owner','admin','controller','collaborator','contractor']));
create policy po_co_delete on po_change_orders for delete using (has_org_role(org_id, array['owner','admin']));

create table if not exists po_change_order_lines (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  po_change_order_id uuid not null references po_change_orders(id) on delete cascade,
  description text not null,
  quantity numeric not null default 1,
  unit_price_cents bigint not null default 0,
  position int not null default 0,
  created_at timestamptz not null default now()
);
alter table po_change_order_lines enable row level security;
create policy po_co_lines_select on po_change_order_lines for select using (is_org_member(org_id));
create policy po_co_lines_write on po_change_order_lines for all
  using (has_org_role(org_id, array['owner','admin','controller','collaborator','contractor']))
  with check (has_org_role(org_id, array['owner','admin','controller','collaborator','contractor']));

------------------------------------------------------------------
-- 10. budgets — forecast / committed / EAC columns + view
------------------------------------------------------------------
alter table budgets
  add column if not exists code text,
  add column if not exists committed_cents bigint not null default 0,
  add column if not exists forecast_cents bigint not null default 0,
  add column if not exists eac_cents bigint not null default 0,
  add column if not exists notes text;
create index if not exists idx_budgets_project on budgets (project_id);

create or replace view v_budget_health as
select
  b.id,
  b.org_id,
  b.project_id,
  b.name,
  b.code,
  b.amount_cents     as budget_cents,
  b.committed_cents,
  b.spent_cents,
  b.forecast_cents,
  greatest(b.forecast_cents, b.committed_cents + b.spent_cents) as eac_cents,
  b.amount_cents - greatest(b.forecast_cents, b.committed_cents + b.spent_cents) as variance_cents,
  case
    when b.amount_cents = 0 then 0
    else round(100.0 * b.spent_cents / b.amount_cents, 2)
  end as pct_spent
from budgets b;

------------------------------------------------------------------
-- 11. COI / W-9 gating on PO transitions
--   Only enforces when the PO transitions to a binding status
--   (sent / acknowledged / fulfilled). Drafts can be saved freely.
------------------------------------------------------------------
create or replace function tg_check_vendor_compliance()
returns trigger
language plpgsql
as $$
declare
  v_vendor vendors%rowtype;
begin
  -- Skip when no vendor attached or staying in non-binding state
  if new.vendor_id is null then return new; end if;
  if new.status not in ('sent','acknowledged','fulfilled') then return new; end if;
  if tg_op = 'UPDATE' and old.status = new.status and old.vendor_id is not distinct from new.vendor_id then
    return new;
  end if;

  select * into v_vendor from vendors where id = new.vendor_id;
  if not found then return new; end if;

  if not coalesce(v_vendor.w9_on_file, false) then
    raise exception 'Vendor "%" missing W-9; PO blocked. Update vendor record before binding.', v_vendor.name
      using errcode = 'check_violation';
  end if;

  if v_vendor.coi_expires_at is null or v_vendor.coi_expires_at < current_date then
    raise exception 'Vendor "%" COI expired or missing; PO blocked. Refresh insurance certificate.', v_vendor.name
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists check_vendor_compliance on purchase_orders;
create trigger check_vendor_compliance
  before insert or update on purchase_orders
  for each row execute function tg_check_vendor_compliance();

comment on function tg_check_vendor_compliance is
  'Blocks binding PO transitions when the vendor lacks W-9 on file or has an expired/missing COI. Soft-fails on draft state.';

------------------------------------------------------------------
-- 12. RFQ bid responses (extends existing requisitions table)
------------------------------------------------------------------
create table if not exists rfq_responses (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  requisition_id uuid not null references requisitions(id) on delete cascade,
  vendor_id uuid references vendors(id) on delete set null,
  status text not null check (status in (
    'invited','viewed','responded','no_bid','withdrawn','awarded','declined'
  )) default 'invited',
  total_cents bigint,
  notes text,
  submitted_at timestamptz,
  awarded_at timestamptz,
  awarded_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (org_id, requisition_id, vendor_id)
);
create index if not exists idx_rfq_responses_req on rfq_responses (requisition_id);
alter table rfq_responses enable row level security;
create policy rfq_resp_select on rfq_responses for select using (is_org_member(org_id));
create policy rfq_resp_insert on rfq_responses for insert with check (is_org_member(org_id));
create policy rfq_resp_update on rfq_responses for update using (has_org_role(org_id, array['owner','admin','controller','collaborator','contractor']));
create policy rfq_resp_delete on rfq_responses for delete using (has_org_role(org_id, array['owner','admin','controller']));

create table if not exists rfq_response_lines (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  rfq_response_id uuid not null references rfq_responses(id) on delete cascade,
  position int not null default 0,
  description text not null,
  quantity numeric not null default 1,
  unit_price_cents bigint not null default 0,
  notes text,
  created_at timestamptz not null default now()
);
alter table rfq_response_lines enable row level security;
create policy rfq_resp_lines_select on rfq_response_lines for select using (is_org_member(org_id));
create policy rfq_resp_lines_write on rfq_response_lines for all
  using (has_org_role(org_id, array['owner','admin','controller','collaborator','contractor']))
  with check (has_org_role(org_id, array['owner','admin','controller','collaborator','contractor']));

------------------------------------------------------------------
-- 13. Vendor prequalification
------------------------------------------------------------------
create table if not exists prequalification_questionnaires (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  code text not null,
  name text not null,
  description text,
  active boolean not null default true,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (org_id, code)
);
alter table prequalification_questionnaires enable row level security;
create policy prequal_q_select on prequalification_questionnaires for select using (is_org_member(org_id));
create policy prequal_q_write on prequalification_questionnaires for all
  using (has_org_role(org_id, array['owner','admin','controller']))
  with check (has_org_role(org_id, array['owner','admin','controller']));

create table if not exists prequalification_questions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  questionnaire_id uuid not null references prequalification_questionnaires(id) on delete cascade,
  position int not null default 0,
  category text not null check (category in (
    'insurance','safety','financial','references','licenses','experience','other'
  )) default 'other',
  prompt text not null,
  required boolean not null default true,
  scoring_weight numeric not null default 1,
  created_at timestamptz not null default now()
);
create index if not exists idx_prequal_q_questionnaire on prequalification_questions (questionnaire_id, position);
alter table prequalification_questions enable row level security;
create policy prequal_questions_select on prequalification_questions for select using (is_org_member(org_id));
create policy prequal_questions_write on prequalification_questions for all
  using (has_org_role(org_id, array['owner','admin','controller']))
  with check (has_org_role(org_id, array['owner','admin','controller']));

create table if not exists vendor_prequalifications (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  vendor_id uuid not null references vendors(id) on delete cascade,
  questionnaire_id uuid not null references prequalification_questionnaires(id) on delete restrict,
  status text not null check (status in (
    'invited','in_progress','submitted','approved','approved_conditional','rejected','expired'
  )) default 'invited',
  score numeric,
  approved_at timestamptz,
  approved_by uuid references users(id) on delete set null,
  expires_at date,
  notes text,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (org_id, vendor_id, questionnaire_id)
);
create index if not exists idx_vendor_prequal_vendor on vendor_prequalifications (vendor_id);
alter table vendor_prequalifications enable row level security;
create policy vp_select on vendor_prequalifications for select using (is_org_member(org_id));
create policy vp_insert on vendor_prequalifications for insert with check (has_org_role(org_id, array['owner','admin','controller','collaborator']));
create policy vp_update on vendor_prequalifications for update using (has_org_role(org_id, array['owner','admin','controller','collaborator','contractor']));
create policy vp_delete on vendor_prequalifications for delete using (has_org_role(org_id, array['owner','admin']));

create table if not exists vendor_prequalification_answers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  vendor_prequalification_id uuid not null references vendor_prequalifications(id) on delete cascade,
  question_id uuid not null references prequalification_questions(id) on delete cascade,
  answer text,
  attachment_path text,
  score numeric,
  created_at timestamptz not null default now(),
  unique (vendor_prequalification_id, question_id)
);
alter table vendor_prequalification_answers enable row level security;
create policy vp_ans_select on vendor_prequalification_answers for select using (is_org_member(org_id));
create policy vp_ans_write on vendor_prequalification_answers for all
  using (has_org_role(org_id, array['owner','admin','controller','collaborator','contractor']))
  with check (has_org_role(org_id, array['owner','admin','controller','collaborator','contractor']));

------------------------------------------------------------------
-- 14. OSHA classification on incidents (extension only)
------------------------------------------------------------------
alter table incidents
  add column if not exists osha_classification text check (osha_classification in (
    'none','near_miss','first_aid','medical_treatment','restricted_duty','days_away','fatality'
  )) default 'none',
  add column if not exists osha_recordable boolean not null default false,
  add column if not exists days_away int not null default 0 check (days_away >= 0),
  add column if not exists days_restricted int not null default 0 check (days_restricted >= 0),
  add column if not exists body_part text,
  add column if not exists injury_type text,
  add column if not exists injury_source text;
create index if not exists idx_incidents_osha_recordable on incidents (org_id, occurred_at) where osha_recordable = true;

------------------------------------------------------------------
-- 15. Safety briefings + attendees
------------------------------------------------------------------
create table if not exists safety_briefings (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  shift_id uuid references shifts(id) on delete set null,
  topic text not null,
  briefer_id uuid references users(id) on delete set null,
  scheduled_for timestamptz not null,
  conducted_at timestamptz,
  notes text,
  attachment_path text,
  status text not null check (status in ('scheduled','conducted','cancelled')) default 'scheduled',
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists idx_safety_briefings_project on safety_briefings (project_id, scheduled_for desc);
alter table safety_briefings enable row level security;
create policy briefings_select on safety_briefings for select using (is_org_member(org_id));
create policy briefings_insert on safety_briefings for insert with check (has_org_role(org_id, array['owner','admin','controller','collaborator','crew']));
create policy briefings_update on safety_briefings for update using (has_org_role(org_id, array['owner','admin','controller','collaborator','crew']));
create policy briefings_delete on safety_briefings for delete using (has_org_role(org_id, array['owner','admin']));

create table if not exists safety_briefing_attendees (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  briefing_id uuid not null references safety_briefings(id) on delete cascade,
  user_id uuid references users(id) on delete set null,
  crew_member_id uuid references crew_members(id) on delete set null,
  acknowledged_at timestamptz,
  signature_path text,
  notes text,
  created_at timestamptz not null default now(),
  check (user_id is not null or crew_member_id is not null)
);
create index if not exists idx_briefing_attendees_briefing on safety_briefing_attendees (briefing_id);
alter table safety_briefing_attendees enable row level security;
create policy briefing_att_select on safety_briefing_attendees for select using (is_org_member(org_id));
create policy briefing_att_write on safety_briefing_attendees for all
  using (is_org_member(org_id))
  with check (is_org_member(org_id));

------------------------------------------------------------------
-- 16. project_photos — first-class gallery
------------------------------------------------------------------
create table if not exists project_photos (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  album text,
  file_path text not null,
  caption text,
  taken_at timestamptz not null default now(),
  taken_by uuid references users(id) on delete set null,
  location_id uuid references locations(id) on delete set null,
  lat numeric,
  lng numeric,
  created_at timestamptz not null default now()
);
create index if not exists idx_project_photos_project_taken on project_photos (project_id, taken_at desc);
create index if not exists idx_project_photos_album on project_photos (project_id, album);
alter table project_photos enable row level security;
create policy proj_photos_select on project_photos for select using (is_org_member(org_id));
create policy proj_photos_write on project_photos for all
  using (has_org_role(org_id, array['owner','admin','controller','collaborator','crew','contractor']))
  with check (has_org_role(org_id, array['owner','admin','controller','collaborator','crew','contractor']));

------------------------------------------------------------------
-- 17. Action items rollup view
------------------------------------------------------------------
create or replace view v_action_items as
select
  'rfi'::text as kind,
  r.id        as record_id,
  r.org_id,
  r.project_id,
  r.subject   as title,
  r.ball_in_court_id as owner_id,
  r.due_at,
  r.status,
  r.priority,
  r.created_at
from rfis r
where r.status = 'open'
union all
select
  'submittal',
  s.id,
  s.org_id,
  s.project_id,
  s.title,
  s.ball_in_court_id,
  s.due_at,
  s.status,
  'normal'::text,
  s.created_at
from submittals s
where s.status in ('submitted','in_review','revise_resubmit')
union all
select
  'punch',
  p.id,
  p.org_id,
  p.project_id,
  p.title,
  p.assignee_id,
  p.due_at,
  p.status,
  p.priority,
  p.created_at
from punch_items p
where p.status in ('open','in_progress','ready_for_review')
union all
select
  'inspection',
  i.id,
  i.org_id,
  i.project_id,
  i.name,
  i.inspector_id,
  i.scheduled_for::date,
  i.status,
  'normal'::text,
  i.created_at
from inspections i
where i.status in ('scheduled','in_progress')
union all
select
  'task',
  t.id,
  t.org_id,
  t.project_id,
  t.title,
  t.assigned_to,
  t.due_at,
  t.status::text,
  'normal'::text,
  t.created_at
from tasks t
where t.status in ('todo','in_progress','blocked','review');

------------------------------------------------------------------
-- 18. cost_codes + time_entries linkage
------------------------------------------------------------------
create table if not exists cost_codes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  code text not null,
  name text not null,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (org_id, code)
);
alter table cost_codes enable row level security;
create policy cost_codes_select on cost_codes for select using (is_org_member(org_id));
create policy cost_codes_write on cost_codes for all
  using (has_org_role(org_id, array['owner','admin','controller']))
  with check (has_org_role(org_id, array['owner','admin','controller']));

alter table time_entries
  add column if not exists cost_code_id uuid references cost_codes(id) on delete set null,
  add column if not exists rate_cents bigint;
create index if not exists idx_time_entries_cost_code on time_entries (cost_code_id) where cost_code_id is not null;

------------------------------------------------------------------
-- 19. work_order_broadcasts + invites
------------------------------------------------------------------
create table if not exists work_order_broadcasts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  requisition_id uuid references requisitions(id) on delete set null,
  code text not null,
  title text not null,
  description text,
  category text,
  budget_cents bigint,
  needed_by timestamptz,
  status text not null check (status in ('draft','open','closed','awarded','cancelled')) default 'draft',
  awarded_to_vendor_id uuid references vendors(id) on delete set null,
  awarded_at timestamptz,
  awarded_by uuid references users(id) on delete set null,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (org_id, code)
);
create index if not exists idx_wob_status on work_order_broadcasts (org_id, status);
alter table work_order_broadcasts enable row level security;
create policy wob_select on work_order_broadcasts for select using (is_org_member(org_id));
create policy wob_insert on work_order_broadcasts for insert with check (has_org_role(org_id, array['owner','admin','controller','collaborator']));
create policy wob_update on work_order_broadcasts for update using (has_org_role(org_id, array['owner','admin','controller','collaborator']));
create policy wob_delete on work_order_broadcasts for delete using (has_org_role(org_id, array['owner','admin']));

create table if not exists work_order_broadcast_invites (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  broadcast_id uuid not null references work_order_broadcasts(id) on delete cascade,
  vendor_id uuid not null references vendors(id) on delete cascade,
  status text not null check (status in ('invited','viewed','accepted','declined')) default 'invited',
  responded_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  unique (broadcast_id, vendor_id)
);
create index if not exists idx_wob_invites_broadcast on work_order_broadcast_invites (broadcast_id);
alter table work_order_broadcast_invites enable row level security;
create policy wob_inv_select on work_order_broadcast_invites for select using (is_org_member(org_id));
create policy wob_inv_write on work_order_broadcast_invites for all
  using (is_org_member(org_id))
  with check (is_org_member(org_id));

------------------------------------------------------------------
-- 20. po_checklist_items — per-PO required steps with photo proof
------------------------------------------------------------------
create table if not exists po_checklist_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  purchase_order_id uuid not null references purchase_orders(id) on delete cascade,
  position int not null default 0,
  prompt text not null,
  requires_photo boolean not null default false,
  status text not null check (status in ('pending','complete','skipped')) default 'pending',
  completed_at timestamptz,
  completed_by uuid references users(id) on delete set null,
  photo_path text,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists idx_po_chk_po on po_checklist_items (purchase_order_id, position);
alter table po_checklist_items enable row level security;
create policy po_chk_select on po_checklist_items for select using (is_org_member(org_id));
create policy po_chk_write on po_checklist_items for all
  using (is_org_member(org_id))
  with check (is_org_member(org_id));

------------------------------------------------------------------
-- 21. Storage bucket for procore-parity uploads
------------------------------------------------------------------
insert into storage.buckets (id, name, public)
  values ('procore-parity', 'procore-parity', false)
  on conflict (id) do nothing;

------------------------------------------------------------------
-- 22. Comments
------------------------------------------------------------------
comment on table conversations is 'Universal threaded comments. Polymorphic by (record_type, record_id); one row per record.';
comment on table daily_logs is 'Procore-style daily production log. One row per project per day.';
comment on table site_plans is 'Venue floor plans / site drawings. Versioned via site_plan_revisions.';
comment on table inspections is 'Template-driven inspections (rigging, fire, electrical, ADA, etc.) with pass/fail/NA per item.';
comment on table rfis is 'Production RFIs — official questions with ball-in-court routing and authoritative answer.';
comment on table submittals is 'Procore-style submittal log with stamps + revision rounds.';
comment on table punch_items is 'Punch list (show-ready checklist). Pinnable to site plans, gates doors-open when show_ready_gate=true.';
comment on table payment_applications is 'Production pay app — % completion against PO line items with retention, G702/G703-style.';
comment on table po_change_orders is 'Vendor-side change orders against existing POs. Adjusts commitment value and schedule.';
comment on view v_budget_health is 'Computed budget health: budget vs committed + spent vs forecast/EAC + variance.';
comment on view v_action_items is 'Cross-module ball-in-court rollup: open RFIs, in-flight submittals, open punch, scheduled inspections, active tasks.';
comment on table cost_codes is 'Cost-code master. time_entries.cost_code_id rolls labor cost up to budget cost codes.';
comment on table work_order_broadcasts is 'HeyPros-style open WO broadcast to a vendor pool. First qualified responder accepts.';
comment on table po_checklist_items is 'Per-PO required steps with optional photo proof. Used for vendor work-order completion checklists.';
