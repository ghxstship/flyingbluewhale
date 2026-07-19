-- Kit 34 v3.2/v3.6 — XPMS-compliant COMPVSS field project surfaces.
-- Project Tasks / Project Calendar / Milestones are the field expression of the
-- ATLVS Coordinate Matrix. Every project record carries the XPMS spine
-- (xpms_atom_id · urid → department/discipline/category · 9-gate phase ·
-- coordinate) with closed enums as CHECK/FK constraints. My Tasks/My Calendar
-- stay on the existing `tasks`/`events` tables (the personal slice).

-- ── Reference: the 9 gated XPMS phases (dim_phase) ──
create table if not exists public.dim_phase (
  code  text primary key check (code in ('DIS','DSN','ADV','PRC','BLD','INS','OPR','AMP','CLS')),
  gate  int  not null unique check (gate between 1 and 9),
  phase text not null unique,
  act   text not null check (act in ('DEPART','SAIL','RETURN'))
);
insert into public.dim_phase (code, gate, phase, act) values
  ('DIS',1,'Discover','DEPART'),('DSN',2,'Design','DEPART'),('ADV',3,'Advance','DEPART'),
  ('PRC',4,'Procure','SAIL'),('BLD',5,'Build','SAIL'),('INS',6,'Install','SAIL'),
  ('OPR',7,'Operate','RETURN'),('AMP',8,'Amplify','RETURN'),('CLS',9,'Close','RETURN')
on conflict (code) do nothing;

-- ── Reference: department class (latitude, 0000–9000) ──
create table if not exists public.dim_department (
  code  text primary key check (code ~ '^[1-9]000$'),
  label text not null
);
insert into public.dim_department (code, label) values
  ('1000','Production'),('2000','Technical'),('3000','Site & Ops'),('4000','Talent'),
  ('5000','Hospitality'),('6000','Safety'),('7000','Logistics'),('8000','Commercial'),('9000','Admin')
on conflict (code) do nothing;

-- ── Project Tasks — the XPMS SSOT field task dataset (all crew) ──
create table if not exists public.project_tasks (
  id            text primary key,
  org_id        uuid not null references public.orgs(id) on delete cascade,
  project_id    uuid not null references public.projects(id) on delete cascade,
  xpms_atom_id  text not null,
  urid          text not null check (urid ~ '^\d{4}\.\d{2}\.\d{2}$'),
  department    text not null,
  discipline    text not null,
  category      text not null,
  phase         text not null references public.dim_phase(phase),
  coordinate    text not null,
  title         text not null,
  sub           text,
  priority      text not null check (priority in ('High','Medium','Low')),
  status        text not null default 'Open' check (status in ('Open','In progress','Blocked','Done')),
  assignee      text,
  assignee_id   uuid references auth.users(id) on delete set null,
  location      text,
  trade         text,
  company       text,
  vendor_id     uuid references public.vendors(id) on delete set null,
  due           text,
  logged        text default '0:00',
  archived      boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists project_tasks_org_idx on public.project_tasks(org_id);
create index if not exists project_tasks_project_idx on public.project_tasks(project_id);
create index if not exists project_tasks_assignee_idx on public.project_tasks(assignee_id);
alter table public.project_tasks enable row level security;
create policy project_tasks_select on public.project_tasks for select using (private.is_org_member(org_id));
create policy project_tasks_insert on public.project_tasks for insert with check (private.has_org_role(org_id, array['owner','admin','manager','controller','collaborator']));
create policy project_tasks_update on public.project_tasks for update using (private.has_org_role(org_id, array['owner','admin','manager','controller','collaborator'])) with check (private.has_org_role(org_id, array['owner','admin','manager','controller','collaborator']));
create policy project_tasks_delete on public.project_tasks for delete using (private.has_org_role(org_id, array['owner','admin']));

-- ── Project Calendar — XPMS-keyed events (field slice of the unified schedule) ──
create table if not exists public.project_events (
  id            text primary key,
  org_id        uuid not null references public.orgs(id) on delete cascade,
  project_id    uuid not null references public.projects(id) on delete cascade,
  xpms_atom_id  text not null,
  urid          text not null check (urid ~ '^\d{4}\.\d{2}\.\d{2}$'),
  department    text not null,
  dept_code     text not null references public.dim_department(code),
  phase         text not null references public.dim_phase(phase),
  title         text not null,
  sub           text,
  event_date    text not null,
  event_iso     date not null,
  owner         text,
  status        text not null default 'Scheduled' check (status in ('Scheduled','Upcoming','Done')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists project_events_org_idx on public.project_events(org_id);
create index if not exists project_events_project_idx on public.project_events(project_id);
alter table public.project_events enable row level security;
create policy project_events_select on public.project_events for select using (private.is_org_member(org_id));
create policy project_events_insert on public.project_events for insert with check (private.has_org_role(org_id, array['owner','admin','manager','controller','collaborator']));
create policy project_events_update on public.project_events for update using (private.has_org_role(org_id, array['owner','admin','manager','controller','collaborator'])) with check (private.has_org_role(org_id, array['owner','admin','manager','controller','collaborator']));
create policy project_events_delete on public.project_events for delete using (private.has_org_role(org_id, array['owner','admin']));

-- ── Milestones — deliverables that roll up to each field phase ──
create table if not exists public.project_milestones (
  id             text primary key,
  org_id         uuid not null references public.orgs(id) on delete cascade,
  project_id     uuid not null references public.projects(id) on delete cascade,
  title          text not null,
  phase          text not null check (phase in ('Advance','Load-In','Show Days','Load-Out')),
  milestone_date text not null,
  owner          text,
  status         text not null default 'Upcoming' check (status in ('Done','At Risk','On Track','Upcoming')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists project_milestones_org_idx on public.project_milestones(org_id);
create index if not exists project_milestones_project_idx on public.project_milestones(project_id);
alter table public.project_milestones enable row level security;
create policy project_milestones_select on public.project_milestones for select using (private.is_org_member(org_id));
create policy project_milestones_insert on public.project_milestones for insert with check (private.has_org_role(org_id, array['owner','admin','manager','controller','collaborator']));
create policy project_milestones_update on public.project_milestones for update using (private.has_org_role(org_id, array['owner','admin','manager','controller','collaborator'])) with check (private.has_org_role(org_id, array['owner','admin','manager','controller','collaborator']));
create policy project_milestones_delete on public.project_milestones for delete using (private.has_org_role(org_id, array['owner','admin']));

-- ── Seed the Pirates / Port Royal canon into the demo org's first project ──
do $$
declare v_org uuid; v_proj uuid;
begin
  select id into v_org from public.orgs where id = '68672cc3-0667-4234-ad77-49325e173175';
  if v_org is null then return; end if;
  select id into v_proj from public.projects where org_id = v_org order by created_at limit 1;
  if v_proj is null then return; end if;

  insert into public.project_tasks (id,org_id,project_id,xpms_atom_id,urid,department,discipline,category,phase,coordinate,title,sub,priority,status,assignee,location,trade,company,due,logged) values
   ('PT-014',v_org,v_proj,'2000.10.05-014','2000.10.05','Technical','Audio','Line Array','Install','2000×INS','Fly Main PA · House Left','Rig + ring-out before soundcheck','High','In progress','Will Turner','Stage L · SL Wing','Audio','Clair Global','14:00','1:20'),
   ('PT-021',v_org,v_proj,'2000.20.03-021','2000.20.03','Technical','Lighting','Moving Head','Install','2000×INS','Focus Front Truss','Channel check + focus positions','Medium','Open','Joshamee Gibbs','Stage L · FOH Truss','Lighting','PRG','16:30','0:00'),
   ('PT-033',v_org,v_proj,'3000.40.02-033','3000.40.02','Site & Ops','Barricade','Bike Rack','Build','3000×BLD','Set FOS Barricade Line','80 sections · mag runs to Gate 3','High','Blocked','Scrum','Front of Stage','Site','In-House','12:00','0:45'),
   ('PT-041',v_org,v_proj,'7000.10.01-041','7000.10.01','Logistics','Freight','Load-Out','Operate','7000×OPR','Count Load-Out Pallets','Reconcile against manifest · Dock B','Low','Open','Cotton','Dock B','Logistics','Dutchman Freight','23:45','0:00'),
   ('PT-052',v_org,v_proj,'6000.10.04-052','6000.10.04','Safety','Fire','Extinguisher','Operate','6000×OPR','Fire Watch · Pyro Cue','Stand-by SR during headliner set','High','Open','Joshamee Gibbs','Stage L · SR','Safety','In-House','21:30','0:00'),
   ('PT-060',v_org,v_proj,'5000.20.02-060','5000.20.02','Hospitality','Catering','Crew Meal','Operate','5000×OPR','Crew Meal Push · Dinner','Serve 320 · BOH tent','Medium','Done','Scarlett','Catering Tent','Hospitality','Faithful Bride','18:00','2:00')
  on conflict (id) do nothing;

  insert into public.project_events (id,org_id,project_id,xpms_atom_id,urid,department,dept_code,phase,title,sub,event_date,event_iso,owner,status) values
   ('PE-01',v_org,v_proj,'2000.00.00-901','2000.00.00','Technical','2000','Install','All-Systems Soundcheck','Full PA + LED + lighting','Jun 20 · 14:00','2026-06-20','Will Turner','Scheduled'),
   ('PE-02',v_org,v_proj,'3000.00.00-902','3000.00.00','Site & Ops','3000','Operate','Doors · Show Day 1','Gates open to public','Jun 20 · 18:00','2026-06-20','Scrum','Scheduled'),
   ('PE-03',v_org,v_proj,'1000.00.00-903','1000.00.00','Production','1000','Operate','Headliner Set','Black Pearl Stage','Jun 20 · 21:30','2026-06-20','Elizabeth Swann','Scheduled'),
   ('PE-04',v_org,v_proj,'7000.00.00-904','7000.00.00','Logistics','7000','Operate','Load-Out Begins','Strike + truck pack','Jun 22 · 00:30','2026-06-22','Cotton','Upcoming'),
   ('PE-05',v_org,v_proj,'6000.00.00-905','6000.00.00','Safety','6000','Advance','Site Safety Walk','AHJ joint inspection','Jun 19 · 09:00','2026-06-19','James Norrington','Done')
  on conflict (id) do nothing;

  insert into public.project_milestones (id,org_id,project_id,title,phase,milestone_date,owner,status) values
   ('MS-1',v_org,v_proj,'Advance Packet Locked','Advance','Jun 15','Elizabeth Swann','Done'),
   ('MS-2',v_org,v_proj,'Site Survey & CAD Sign-Off','Advance','Jun 16','James Norrington','Done'),
   ('MS-3',v_org,v_proj,'Stage L Structure Signed Off','Load-In','Jun 19','Will Turner','At Risk'),
   ('MS-4',v_org,v_proj,'LED Wall Commissioned','Load-In','Jun 19','Marty','On Track'),
   ('MS-5',v_org,v_proj,'Doors · Show Day 1','Show Days','Jun 20 · 18:00','Joshamee Gibbs','On Track'),
   ('MS-6',v_org,v_proj,'Headliner Set','Show Days','Jun 20 · 21:30','Scrum','On Track'),
   ('MS-7',v_org,v_proj,'Load-Out Complete · Trucks Sealed','Load-Out','Jun 22 · 06:00','Cotton','Upcoming')
  on conflict (id) do nothing;
end $$;
