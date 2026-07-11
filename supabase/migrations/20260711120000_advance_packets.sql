-- Advancing & Onboarding Merge Engine (kit 27) — Phase 1: packets & scoping.
--
-- One engine covers every advance campaign in the source record (Mochakk
-- Calling, III Joints, EDCLV26): a scoped information packet out, a
-- structured submission back, against a deadline, per counterparty.
--
--   advance_packets            — the project onboarding document (one live
--                                packet per project, versioned; voice setting
--                                alters email greeting/sign-off copy only).
--                                Joins the job/requisition record via job_id:
--                                the Job ID is the SSOT join key (created at
--                                RFP/initial requisition); Contract ID is a
--                                derived reference, never manually issued.
--   advance_packet_sections    — packet blocks (Overview … Tech, custom).
--                                `deliverable_types` links document sections
--                                to existing `deliverables` rows — doc-specs
--                                are never duplicated here.
--   advance_audiences          — counterparty groups (company × department ×
--                                team × role × scope) with contacts.
--   advance_section_assignments— section × audience matrix: requirement level,
--                                due date, and how it was assigned (org preset,
--                                project preset, manual, contract override).
--   org_advance_presets /      — default section × audience-type matrices
--   project_advance_presets      that seed advance_section_assignments.
--
-- LDP naming discipline: NO bare `status` — named enums on `*_state`
-- columns; append-only `*_state_transitions` ledgers mirror the
-- msa_state_transitions shape. RLS: org members read; manager+ writes.

do $$ begin
  create type public.advance_packet_state as enum ('draft','live','archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.advance_section_key as enum (
    'overview','schedule_milestones','crew_list','production_advance',
    'travel_lodging','safety','parking_load_in','tech','catering',
    'credentials','custom'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.advance_requirement as enum ('required','optional','hidden');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.advance_assigned_via as enum ('org_preset','project_preset','manual','contract_override');
exception when duplicate_object then null; end $$;

create table if not exists public.advance_packets (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  job_id uuid references public.requisitions(id) on delete set null,
  version integer not null default 1,
  voice text not null default 'neutral',
  packet_state public.advance_packet_state not null default 'draft',
  support_contact jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists advance_packets_org_project_idx on public.advance_packets (org_id, project_id) where deleted_at is null;

create table if not exists public.advance_packet_state_transitions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  packet_id uuid not null references public.advance_packets(id) on delete cascade,
  from_state public.advance_packet_state,
  to_state public.advance_packet_state not null,
  transitioned_at timestamptz not null default now(),
  transitioned_by uuid,
  reason text
);

create index if not exists advance_packet_transitions_packet_idx on public.advance_packet_state_transitions (packet_id, transitioned_at desc);
create index if not exists advance_packet_transitions_org_idx on public.advance_packet_state_transitions (org_id, transitioned_at desc);

create table if not exists public.advance_packet_sections (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  packet_id uuid not null references public.advance_packets(id) on delete cascade,
  section_key public.advance_section_key not null,
  title text not null,
  body jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  -- Links a document section to existing doc-spec deliverables by type
  -- (e.g. '{technical_rider,stage_plot}') — the deliverables table stays SSOT.
  deliverable_types text[] not null default '{}',
  -- Key into src/lib/advancing/submission-schemas.ts for structured returns.
  submission_schema_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists advance_packet_sections_packet_idx on public.advance_packet_sections (packet_id, sort_order) where deleted_at is null;
create index if not exists advance_packet_sections_org_idx on public.advance_packet_sections (org_id) where deleted_at is null;

create table if not exists public.advance_audiences (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  packet_id uuid not null references public.advance_packets(id) on delete cascade,
  company text not null,
  department text,
  team text,
  role text,
  scope text,
  -- Derived from the packet's job_id (the SSOT); stored for merge rendering.
  contract_id text,
  -- Decision #2 v1: an external scheduler link per audience (bespoke
  -- scheduler becomes the default once live — see scheduler migration).
  external_scheduler_url text,
  -- Array of { name, email, phone } contact objects.
  contacts jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists advance_audiences_packet_idx on public.advance_audiences (packet_id) where deleted_at is null;
create index if not exists advance_audiences_org_idx on public.advance_audiences (org_id) where deleted_at is null;

create table if not exists public.advance_section_assignments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  audience_id uuid not null references public.advance_audiences(id) on delete cascade,
  section_id uuid not null references public.advance_packet_sections(id) on delete cascade,
  requirement public.advance_requirement not null default 'required',
  due_at timestamptz,
  assigned_via public.advance_assigned_via not null default 'manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create unique index if not exists advance_section_assignments_pair_uq on public.advance_section_assignments (audience_id, section_id) where deleted_at is null;
create index if not exists advance_section_assignments_org_idx on public.advance_section_assignments (org_id) where deleted_at is null;
create index if not exists advance_section_assignments_section_idx on public.advance_section_assignments (section_id) where deleted_at is null;

-- Preset matrices: which sections an audience type gets by default, at
-- which requirement level, with a relative due offset (days before the
-- packet deadline anchor). Org level seeds every project; project level
-- overrides org (assigned_via records the provenance on the seeded rows).
create table if not exists public.org_advance_presets (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  audience_type text not null,
  section_key public.advance_section_key not null,
  requirement public.advance_requirement not null default 'required',
  due_offset_days integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create unique index if not exists org_advance_presets_uq on public.org_advance_presets (org_id, audience_type, section_key) where deleted_at is null;

create table if not exists public.project_advance_presets (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  audience_type text not null,
  section_key public.advance_section_key not null,
  requirement public.advance_requirement not null default 'required',
  due_offset_days integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create unique index if not exists project_advance_presets_uq on public.project_advance_presets (project_id, audience_type, section_key) where deleted_at is null;
create index if not exists project_advance_presets_org_idx on public.project_advance_presets (org_id) where deleted_at is null;

-- RLS: the canonical band — org members read, manager+ writes.
alter table public.advance_packets enable row level security;
create policy advance_packets_org_select on public.advance_packets for select using (private.is_org_member(org_id));
create policy advance_packets_org_write on public.advance_packets using (private.has_org_role(org_id, array['owner','admin','manager','controller','collaborator'])) with check (private.has_org_role(org_id, array['owner','admin','manager','controller','collaborator']));
create trigger advance_packets_touch_updated_at before update on public.advance_packets for each row execute function public.touch_updated_at();

alter table public.advance_packet_state_transitions enable row level security;
create policy advance_packet_transitions_select on public.advance_packet_state_transitions for select using (private.is_org_member(org_id));
create policy advance_packet_transitions_insert on public.advance_packet_state_transitions for insert with check (private.has_org_role(org_id, array['owner','admin','manager','controller','collaborator']));

alter table public.advance_packet_sections enable row level security;
create policy advance_packet_sections_org_select on public.advance_packet_sections for select using (private.is_org_member(org_id));
create policy advance_packet_sections_org_write on public.advance_packet_sections using (private.has_org_role(org_id, array['owner','admin','manager','controller','collaborator'])) with check (private.has_org_role(org_id, array['owner','admin','manager','controller','collaborator']));
create trigger advance_packet_sections_touch_updated_at before update on public.advance_packet_sections for each row execute function public.touch_updated_at();

alter table public.advance_audiences enable row level security;
create policy advance_audiences_org_select on public.advance_audiences for select using (private.is_org_member(org_id));
create policy advance_audiences_org_write on public.advance_audiences using (private.has_org_role(org_id, array['owner','admin','manager','controller','collaborator'])) with check (private.has_org_role(org_id, array['owner','admin','manager','controller','collaborator']));
create trigger advance_audiences_touch_updated_at before update on public.advance_audiences for each row execute function public.touch_updated_at();

alter table public.advance_section_assignments enable row level security;
create policy advance_section_assignments_org_select on public.advance_section_assignments for select using (private.is_org_member(org_id));
create policy advance_section_assignments_org_write on public.advance_section_assignments using (private.has_org_role(org_id, array['owner','admin','manager','controller','collaborator'])) with check (private.has_org_role(org_id, array['owner','admin','manager','controller','collaborator']));
create trigger advance_section_assignments_touch_updated_at before update on public.advance_section_assignments for each row execute function public.touch_updated_at();

alter table public.org_advance_presets enable row level security;
create policy org_advance_presets_org_select on public.org_advance_presets for select using (private.is_org_member(org_id));
create policy org_advance_presets_org_write on public.org_advance_presets using (private.has_org_role(org_id, array['owner','admin','manager','controller','collaborator'])) with check (private.has_org_role(org_id, array['owner','admin','manager','controller','collaborator']));
create trigger org_advance_presets_touch_updated_at before update on public.org_advance_presets for each row execute function public.touch_updated_at();

alter table public.project_advance_presets enable row level security;
create policy project_advance_presets_org_select on public.project_advance_presets for select using (private.is_org_member(org_id));
create policy project_advance_presets_org_write on public.project_advance_presets using (private.has_org_role(org_id, array['owner','admin','manager','controller','collaborator'])) with check (private.has_org_role(org_id, array['owner','admin','manager','controller','collaborator']));
create trigger project_advance_presets_touch_updated_at before update on public.project_advance_presets for each row execute function public.touch_updated_at();
