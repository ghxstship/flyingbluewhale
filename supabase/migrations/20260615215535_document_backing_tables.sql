-- Document backing tables — record-backs the remaining v6 document types so
-- EVERY one of the 27 supports internal ?recordId binding (not just external
-- POST {data}). Six org-scoped tables, one per document type that had no home:
--   change_orders            → ATLVS "Change Order"
--   show_recaps              → ATLVS "Show Recap"
--   run_of_shows             → COMPVSS "Run of Show"
--   rams_assessments         → COMPVSS "RAMS"
--   sops                     → COMPVSS "SOP"
--   emergency_response_plans → LEG3ND "Emergency Response Plan"
--
-- LDP naming discipline: NO bare `status`. Each lifecycle is a NAMED postgres
-- enum on a `*_state` column. Sub-items (CO lines, ROS cues, RAMS hazards, SOP
-- steps) live in `jsonb` until structured requirements emerge — same pattern as
-- assignments.data. RLS: org members read; manager+ writes (the canonical band).
-- The other unbound doc types bind to EXISTING tables via app-layer resolvers
-- (receipt→invoices, roster→rosters, schedule→schedule_activities,
-- pullsheet→rentals, ticket→assignments, transcript→course_completions,
-- agreement/vendoragreement→contracts) and need no new schema.

-- ── enum types ──────────────────────────────────────────────────────────
do $$ begin create type public.change_order_state as enum ('draft','submitted','approved','rejected','voided'); exception when duplicate_object then null; end $$;
do $$ begin create type public.recap_state as enum ('draft','published','archived'); exception when duplicate_object then null; end $$;
do $$ begin create type public.run_of_show_state as enum ('draft','locked','archived'); exception when duplicate_object then null; end $$;
do $$ begin create type public.rams_state as enum ('draft','submitted','approved','archived'); exception when duplicate_object then null; end $$;
do $$ begin create type public.sop_state as enum ('draft','published','archived'); exception when duplicate_object then null; end $$;
do $$ begin create type public.erp_state as enum ('draft','approved','archived'); exception when duplicate_object then null; end $$;

-- ── change_orders ─────────────────────────────────────────────────────────
create table if not exists public.change_orders (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  number text not null,
  summary text,
  currency text not null default 'USD',
  total_delta_cents bigint not null default 0,
  lines jsonb not null default '[]'::jsonb,
  change_order_state public.change_order_state not null default 'draft',
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create unique index if not exists change_orders_org_number_uniq on public.change_orders (org_id, lower(number)) where deleted_at is null;
create index if not exists change_orders_org_project_idx on public.change_orders (org_id, project_id) where deleted_at is null;
alter table public.change_orders enable row level security;
create policy change_orders_org_select on public.change_orders for select using (private.is_org_member(org_id));
create policy change_orders_org_write on public.change_orders using (private.has_org_role(org_id, array['owner','admin','manager','controller','collaborator'])) with check (private.has_org_role(org_id, array['owner','admin','manager','controller','collaborator']));
create trigger change_orders_touch_updated_at before update on public.change_orders for each row execute function public.touch_updated_at();

-- ── show_recaps ───────────────────────────────────────────────────────────
create table if not exists public.show_recaps (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  event_id uuid references public.events(id) on delete set null,
  event_name text not null,
  headline text,
  attendance integer,
  summary text,
  event_date date,
  site_name text,
  recap_state public.recap_state not null default 'draft',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists show_recaps_org_project_idx on public.show_recaps (org_id, project_id) where deleted_at is null;
alter table public.show_recaps enable row level security;
create policy show_recaps_org_select on public.show_recaps for select using (private.is_org_member(org_id));
create policy show_recaps_org_write on public.show_recaps using (private.has_org_role(org_id, array['owner','admin','manager','controller','collaborator'])) with check (private.has_org_role(org_id, array['owner','admin','manager','controller','collaborator']));
create trigger show_recaps_touch_updated_at before update on public.show_recaps for each row execute function public.touch_updated_at();

-- ── run_of_shows ──────────────────────────────────────────────────────────
create table if not exists public.run_of_shows (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  event_id uuid references public.events(id) on delete set null,
  name text not null,
  cues jsonb not null default '[]'::jsonb,
  run_of_show_state public.run_of_show_state not null default 'draft',
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists run_of_shows_org_project_idx on public.run_of_shows (org_id, project_id) where deleted_at is null;
alter table public.run_of_shows enable row level security;
create policy run_of_shows_org_select on public.run_of_shows for select using (private.is_org_member(org_id));
create policy run_of_shows_org_write on public.run_of_shows using (private.has_org_role(org_id, array['owner','admin','manager','controller','collaborator'])) with check (private.has_org_role(org_id, array['owner','admin','manager','controller','collaborator']));
create trigger run_of_shows_touch_updated_at before update on public.run_of_shows for each row execute function public.touch_updated_at();

-- ── rams_assessments ──────────────────────────────────────────────────────
create table if not exists public.rams_assessments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  title text not null,
  scope text,
  rev text,
  assessor text,
  assessed_on date,
  hazards jsonb not null default '[]'::jsonb,
  method text,
  rams_state public.rams_state not null default 'draft',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists rams_assessments_org_project_idx on public.rams_assessments (org_id, project_id) where deleted_at is null;
alter table public.rams_assessments enable row level security;
create policy rams_assessments_org_select on public.rams_assessments for select using (private.is_org_member(org_id));
create policy rams_assessments_org_write on public.rams_assessments using (private.has_org_role(org_id, array['owner','admin','manager','controller','collaborator'])) with check (private.has_org_role(org_id, array['owner','admin','manager','controller','collaborator']));
create trigger rams_assessments_touch_updated_at before update on public.rams_assessments for each row execute function public.touch_updated_at();

-- ── sops ──────────────────────────────────────────────────────────────────
create table if not exists public.sops (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  code text not null,
  title text not null,
  purpose text,
  steps jsonb not null default '[]'::jsonb,
  sop_state public.sop_state not null default 'draft',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create unique index if not exists sops_org_code_uniq on public.sops (org_id, lower(code)) where deleted_at is null;
alter table public.sops enable row level security;
create policy sops_org_select on public.sops for select using (private.is_org_member(org_id));
create policy sops_org_write on public.sops using (private.has_org_role(org_id, array['owner','admin','manager','controller','collaborator'])) with check (private.has_org_role(org_id, array['owner','admin','manager','controller','collaborator']));
create trigger sops_touch_updated_at before update on public.sops for each row execute function public.touch_updated_at();

-- ── emergency_response_plans ──────────────────────────────────────────────
create table if not exists public.emergency_response_plans (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  event_name text not null,
  scope text,
  rev text,
  approver text,
  approved_on date,
  evac text,
  ic_contact text,
  hospital text,
  erp_state public.erp_state not null default 'draft',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists erp_org_project_idx on public.emergency_response_plans (org_id, project_id) where deleted_at is null;
alter table public.emergency_response_plans enable row level security;
create policy erp_org_select on public.emergency_response_plans for select using (private.is_org_member(org_id));
create policy erp_org_write on public.emergency_response_plans using (private.has_org_role(org_id, array['owner','admin','manager','controller','collaborator'])) with check (private.has_org_role(org_id, array['owner','admin','manager','controller','collaborator']));
create trigger erp_touch_updated_at before update on public.emergency_response_plans for each row execute function public.touch_updated_at();

-- ── seed: one real row per new table + two contracts, demo org ────────────
insert into public.change_orders (id, org_id, project_id, number, summary, currency, total_delta_cents, lines, change_order_state, created_by)
values ('d0c00001-0000-4000-8000-000000000001','68672cc3-0667-4234-ad77-49325e173175','498a047e-bd2a-401e-9efb-f7fb796290d4','CO-12','Add a second delay tower and 40A distro.','USD',840000,'[{"desc":"Delay tower","amount":"+$8,400"}]'::jsonb,'approved','a9565617-90cf-4dd6-9a38-9e9d922fc633')
on conflict (id) do nothing;

insert into public.show_recaps (id, org_id, project_id, event_id, event_name, headline, attendance, summary, event_date, site_name, recap_state, created_by)
values ('d0c00002-0000-4000-8000-000000000002','68672cc3-0667-4234-ad77-49325e173175','498a047e-bd2a-401e-9efb-f7fb796290d4','5182ece0-5ee5-43ed-9d4f-2dcf74ec2f87','Miami Music Week','12,400 attendees · 0 lost-time incidents.',12400,'Doors on time, peak concurrency at 21:40, strike complete by 03:00.','2026-08-04','Bayfront Park','published','a9565617-90cf-4dd6-9a38-9e9d922fc633')
on conflict (id) do nothing;

insert into public.run_of_shows (id, org_id, project_id, event_id, name, cues, run_of_show_state, created_by)
values ('d0c00003-0000-4000-8000-000000000003','68672cc3-0667-4234-ad77-49325e173175','498a047e-bd2a-401e-9efb-f7fb796290d4','5182ece0-5ee5-43ed-9d4f-2dcf74ec2f87','MMW — Mainstage ROS','[{"cue":"Q1","time":"20:00","lane":"Show","action":"House to half","caller":"SM"},{"cue":"Q2","time":"20:02","lane":"Audio","action":"Walk-in music out","caller":"A1"}]'::jsonb,'locked','a9565617-90cf-4dd6-9a38-9e9d922fc633')
on conflict (id) do nothing;

insert into public.rams_assessments (id, org_id, project_id, title, scope, rev, assessor, assessed_on, hazards, method, rams_state, created_by)
values ('d0c00004-0000-4000-8000-000000000004','68672cc3-0667-4234-ad77-49325e173175','498a047e-bd2a-401e-9efb-f7fb796290d4','Rigging — Mainstage','Overhead rigging, motors, and ground support.','B','M. Soto','2026-07-28','[{"hazard":"Falling objects","risk":"High","control":"Exclusion zone + hard hats"}]'::jsonb,'Flown in sequence per the rig plot; competent persons only.','approved','a9565617-90cf-4dd6-9a38-9e9d922fc633')
on conflict (id) do nothing;

insert into public.sops (id, org_id, code, title, purpose, steps, sop_state, created_by)
values ('d0c00005-0000-4000-8000-000000000005','68672cc3-0667-4234-ad77-49325e173175','SOP-014','Crowd surge response','Detect and relieve dangerous crowd density.','[{"title":"Detect","body":"Spotters call density on the radio net."},{"title":"Hold","body":"Pause ingress; open relief gates."}]'::jsonb,'published','a9565617-90cf-4dd6-9a38-9e9d922fc633')
on conflict (id) do nothing;

insert into public.emergency_response_plans (id, org_id, project_id, event_name, scope, rev, approver, approved_on, evac, ic_contact, hospital, erp_state, created_by)
values ('d0c00006-0000-4000-8000-000000000006','68672cc3-0667-4234-ad77-49325e173175','498a047e-bd2a-401e-9efb-f7fb796290d4','Miami Music Week','Severe weather, medical, and evacuation procedures.','C','Safety Director','2026-07-30','Stop show, houselights up, PA announcement, route to muster points A–D.','555-0199','Jackson Memorial','approved','a9565617-90cf-4dd6-9a38-9e9d922fc633')
on conflict (id) do nothing;

insert into public.contracts (id, org_id, project_id, kind, number, title, state, counterparty_name, total_value_minor, total_value_currency, start_date, end_date, created_by)
values ('d0c00007-0000-4000-8000-000000000007','68672cc3-0667-4234-ad77-49325e173175','498a047e-bd2a-401e-9efb-f7fb796290d4','master_services','AGR-330','Master Services Agreement — Acme Live','active','Acme Live',34008000,'USD','2026-06-15','2027-06-15','a9565617-90cf-4dd6-9a38-9e9d922fc633')
on conflict (id) do nothing;

insert into public.contracts (id, org_id, project_id, kind, number, title, state, counterparty_name, vendor_id, total_value_minor, total_value_currency, start_date, end_date, created_by)
values ('d0c00008-0000-4000-8000-000000000008','68672cc3-0667-4234-ad77-49325e173175','498a047e-bd2a-401e-9efb-f7fb796290d4','vendor_sow','VA-118','Vendor SOW — Stagecraft Rentals','active','Stagecraft Rentals','f27eeeff-734f-49fe-9152-063557dd291a',3600000,'USD','2026-07-01','2026-09-01','a9565617-90cf-4dd6-9a38-9e9d922fc633')
on conflict (id) do nothing;
