-- ITIL change + problem registers. Used by ops desk during live events
-- to track non-trivial changes (rigging swap, generator hot-swap, software
-- patch on the timing box) and the root-cause work that follows incidents.

------------------------------------------------------------------
-- 1. itil_changes — change register
------------------------------------------------------------------
create table if not exists itil_changes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  code text not null,
  title text not null,
  description text,
  type text not null check (type in ('standard','normal','emergency','major')) default 'normal',
  risk text not null check (risk in ('low','medium','high')) default 'medium',
  impact text not null check (impact in ('low','medium','high')) default 'medium',
  status text not null check (status in (
    'proposed','in_review','approved','rejected','scheduled','implementing','implemented','closed','failed'
  )) default 'proposed',
  requested_by uuid references users(id),
  assigned_to uuid references users(id),
  planned_start timestamptz,
  planned_end timestamptz,
  actual_start timestamptz,
  actual_end timestamptz,
  backout_plan text,
  service_request_id uuid references service_requests(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, code)
);
create index if not exists idx_itil_changes_org_status on itil_changes (org_id, status);
create index if not exists idx_itil_changes_planned on itil_changes (org_id, planned_start);
alter table itil_changes enable row level security;
create policy itil_changes_select on itil_changes for select using (is_org_member(org_id));
create policy itil_changes_insert on itil_changes for insert with check (has_org_role(org_id, array['owner','admin','controller','collaborator']));
create policy itil_changes_update on itil_changes for update using (has_org_role(org_id, array['owner','admin','controller','collaborator']));
create policy itil_changes_delete on itil_changes for delete using (has_org_role(org_id, array['owner','admin']));

------------------------------------------------------------------
-- 2. itil_problems — problem register (root cause + known errors)
------------------------------------------------------------------
create table if not exists itil_problems (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  code text not null,
  title text not null,
  description text,
  priority text not null check (priority in ('P1','P2','P3','P4')) default 'P3',
  status text not null check (status in ('new','investigating','known_error','resolved','closed')) default 'new',
  root_cause text,
  workaround text,
  reporter_id uuid references users(id),
  assigned_to uuid references users(id),
  linked_incident_id uuid references incidents(id) on delete set null,
  linked_change_id uuid references itil_changes(id) on delete set null,
  detected_at timestamptz not null default now(),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, code)
);
create index if not exists idx_itil_problems_org_status on itil_problems (org_id, status);
create index if not exists idx_itil_problems_priority on itil_problems (org_id, priority);
alter table itil_problems enable row level security;
create policy itil_problems_select on itil_problems for select using (is_org_member(org_id));
create policy itil_problems_insert on itil_problems for insert with check (has_org_role(org_id, array['owner','admin','controller','collaborator']));
create policy itil_problems_update on itil_problems for update using (has_org_role(org_id, array['owner','admin','controller','collaborator']));
create policy itil_problems_delete on itil_problems for delete using (has_org_role(org_id, array['owner','admin']));
