-- 4 small org-scoped registers that previously rendered as RoadmapStubs:
-- safety/threats, safety/playbooks, safety/guard-tours, marketing/campaigns.
-- Each follows the canonical pattern: org-scoped, RLS via is_org_member +
-- has_org_role, sane indexes, soft-delete via active flag for the
-- reference-data ones (threats, playbooks). Minimal MVP scope — additional
-- columns can land in later migrations as workflows mature.

------------------------------------------------------------------
-- 1. threats — security threat register (intel + assessment)
------------------------------------------------------------------
create table if not exists threats (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  code text not null,                                       -- THR-001
  title text not null,
  description text,
  severity text not null check (severity in ('low','medium','high','critical')),
  likelihood text not null check (likelihood in ('rare','unlikely','possible','likely','almost_certain')),
  treatment text not null check (treatment in ('mitigate','accept','transfer','avoid')) default 'mitigate',
  classification text not null default 'internal',          -- public|internal|confidential|restricted
  owner_id uuid references users(id),
  status text not null check (status in ('draft','active','closed','superseded')) default 'active',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, code)
);
create index if not exists idx_threats_org_status on threats (org_id, status);
alter table threats enable row level security;
create policy threats_select on threats for select using (is_org_member(org_id));
create policy threats_insert on threats for insert with check (has_org_role(org_id, array['owner','admin','controller']));
create policy threats_update on threats for update using (has_org_role(org_id, array['owner','admin','controller']));
create policy threats_delete on threats for delete using (has_org_role(org_id, array['owner','admin']));

------------------------------------------------------------------
-- 2. playbooks — ConOps playbook library (markdown content)
------------------------------------------------------------------
create table if not exists playbooks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  slug text not null,
  title text not null,
  summary text,
  kind text not null default 'general',                     -- crisis|safety|onboarding|conops|general
  content jsonb not null default '{}'::jsonb,               -- structured blocks; markdown allowed in nodes
  version integer not null default 1,
  status text not null check (status in ('draft','published','archived')) default 'draft',
  owner_id uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, slug)
);
create index if not exists idx_playbooks_org_status on playbooks (org_id, status);
alter table playbooks enable row level security;
create policy playbooks_select on playbooks for select using (is_org_member(org_id));
create policy playbooks_insert on playbooks for insert with check (has_org_role(org_id, array['owner','admin','controller']));
create policy playbooks_update on playbooks for update using (has_org_role(org_id, array['owner','admin','controller']));
create policy playbooks_delete on playbooks for delete using (has_org_role(org_id, array['owner','admin']));

------------------------------------------------------------------
-- 3. guard_tours — patrol plans + executed tours
------------------------------------------------------------------
create table if not exists guard_tours (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  name text not null,
  description text,
  venue_id uuid references venues(id),
  route jsonb not null default '[]'::jsonb,                 -- ordered list of {checkpoint_id, label, lat, lng}
  cadence_minutes integer,                                  -- if recurring
  next_run_at timestamptz,
  status text not null check (status in ('scheduled','in_progress','completed','cancelled','overdue')) default 'scheduled',
  guard_id uuid references users(id),                       -- assigned guard
  started_at timestamptz,
  completed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_guard_tours_org_status on guard_tours (org_id, status);
create index if not exists idx_guard_tours_next_run on guard_tours (org_id, next_run_at);
alter table guard_tours enable row level security;
create policy guard_tours_select on guard_tours for select using (is_org_member(org_id));
create policy guard_tours_insert on guard_tours for insert with check (has_org_role(org_id, array['owner','admin','controller','collaborator']));
create policy guard_tours_update on guard_tours for update using (has_org_role(org_id, array['owner','admin','controller','collaborator']));
create policy guard_tours_delete on guard_tours for delete using (has_org_role(org_id, array['owner','admin']));

------------------------------------------------------------------
-- 4. campaigns — marketing & comms campaigns
------------------------------------------------------------------
create table if not exists campaigns (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  name text not null,
  description text,
  channel text not null default 'multi',                    -- email|social|paid|owned|earned|multi
  kind text not null default 'awareness',                   -- awareness|conversion|loyalty|recruitment|launch
  status text not null check (status in ('draft','scheduled','live','paused','complete','cancelled')) default 'draft',
  starts_on date,
  ends_on date,
  budget_cents integer not null default 0,
  spent_cents integer not null default 0,
  owner_id uuid references users(id),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_campaigns_org_status on campaigns (org_id, status);
create index if not exists idx_campaigns_org_window on campaigns (org_id, starts_on, ends_on);
alter table campaigns enable row level security;
create policy campaigns_select on campaigns for select using (is_org_member(org_id));
create policy campaigns_insert on campaigns for insert with check (has_org_role(org_id, array['owner','admin','controller']));
create policy campaigns_update on campaigns for update using (has_org_role(org_id, array['owner','admin','controller']));
create policy campaigns_delete on campaigns for delete using (has_org_role(org_id, array['owner','admin']));
