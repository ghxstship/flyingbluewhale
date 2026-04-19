-- fbw_024 · Four architectural tables for Opportunities #11, #12, #18, #21.
-- See MCP-applied migration for inline commentary.

create table if not exists deliverable_templates (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  type deliverable_type not null,
  name text not null,
  description text,
  data jsonb not null default '{}'::jsonb,
  is_global boolean not null default false,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists deliverable_templates_org_type_idx on deliverable_templates (org_id, type);
alter table deliverable_templates enable row level security;
create policy deliverable_templates_select on deliverable_templates for select to authenticated using (is_org_member(org_id) or is_global = true);
create policy deliverable_templates_insert on deliverable_templates for insert to authenticated with check (has_org_role(org_id, array['owner','admin','controller','collaborator']));
create policy deliverable_templates_update on deliverable_templates for update to authenticated using (has_org_role(org_id, array['owner','admin','controller','collaborator'])) with check (has_org_role(org_id, array['owner','admin','controller','collaborator']));
create policy deliverable_templates_delete on deliverable_templates for delete to authenticated using (has_org_role(org_id, array['owner','admin']));

create table if not exists stage_plots (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  project_id uuid not null,
  name text not null,
  width_ft numeric,
  depth_ft numeric,
  elements jsonb not null default '[]'::jsonb,
  svg_url text,
  notes text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists stage_plots_project_idx on stage_plots (project_id);
alter table stage_plots enable row level security;
create policy stage_plots_select on stage_plots for select to authenticated using (is_org_member(org_id));
create policy stage_plots_insert on stage_plots for insert to authenticated with check (has_org_role(org_id, array['owner','admin','controller','collaborator']));
create policy stage_plots_update on stage_plots for update to authenticated using (has_org_role(org_id, array['owner','admin','controller','collaborator'])) with check (has_org_role(org_id, array['owner','admin','controller','collaborator']));
create policy stage_plots_delete on stage_plots for delete to authenticated using (has_org_role(org_id, array['owner','admin']));

do $$ begin create type incident_severity as enum ('near_miss','minor','major','critical'); exception when duplicate_object then null; end $$;
do $$ begin create type incident_status as enum ('open','investigating','resolved','closed'); exception when duplicate_object then null; end $$;

create table if not exists incidents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  project_id uuid,
  reporter_id uuid not null,
  summary text not null,
  description text,
  severity incident_severity not null default 'minor',
  status incident_status not null default 'open',
  location text,
  occurred_at timestamptz not null default now(),
  photos jsonb not null default '[]'::jsonb,
  ai_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists incidents_project_idx on incidents (project_id);
create index if not exists incidents_org_status_idx on incidents (org_id, status);
alter table incidents enable row level security;
create policy incidents_select on incidents for select to authenticated using (is_org_member(org_id));
create policy incidents_insert on incidents for insert to authenticated with check (is_org_member(org_id));
create policy incidents_update on incidents for update to authenticated using (has_org_role(org_id, array['owner','admin','controller','collaborator'])) with check (has_org_role(org_id, array['owner','admin','controller','collaborator']));

create table if not exists email_templates (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  slug text not null,
  name text not null,
  subject text not null,
  body_html text not null,
  body_text text,
  merge_tags jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (org_id, slug)
);
alter table email_templates enable row level security;
create policy email_templates_select on email_templates for select to authenticated using (is_org_member(org_id));
create policy email_templates_insert on email_templates for insert to authenticated with check (has_org_role(org_id, array['owner','admin']));
create policy email_templates_update on email_templates for update to authenticated using (has_org_role(org_id, array['owner','admin'])) with check (has_org_role(org_id, array['owner','admin']));
create policy email_templates_delete on email_templates for delete to authenticated using (has_org_role(org_id, array['owner','admin']));
