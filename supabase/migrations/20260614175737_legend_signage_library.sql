-- LEG3ND Knowledge — Signage Library.
--
-- An org-scoped catalog of life-safety / wayfinding signs built on
-- ISO 7010 / DOT-AIGA / ISA pictograms, plus a per-project placement
-- ledger (where each sign is planned/installed/removed). Mirrors an
-- asset-library browser: signs are reusable SKUs, placements are the
-- per-project instances.
--
-- Two org-scoped tables:
--   - signage_signs      : the reusable sign library (code, pictogram_key,
--                          standard, category, colorway)
--   - signage_placements : per-sign (optionally per-project) placement rows
--
-- LDP naming discipline: NO bare `status`. Both lifecycles are cyclical
-- operational states backed by NAMED postgres enum types →
-- `sign_state` (draft/published/archived) and
-- `placement_state` (planned/installed/removed). The descriptive
-- taxonomy columns (`standard`, `category`) are NOT lifecycle columns —
-- they classify the sign, they don't track its arc — so they keep plain
-- descriptive names backed by their own named enums.

-- ── enum types ──────────────────────────────────────────────────────────
do $$ begin
  create type public.signage_standard as enum ('iso7010', 'dot_aiga', 'isa', 'custom');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.signage_category as enum (
    'prohibition', 'warning', 'mandatory', 'safe_condition',
    'fire', 'wayfinding', 'accessibility'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.sign_state as enum ('draft', 'published', 'archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.placement_state as enum ('planned', 'installed', 'removed');
exception when duplicate_object then null; end $$;

-- ── signage_signs ───────────────────────────────────────────────────────
create table if not exists public.signage_signs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  code text not null,
  name text not null,
  standard public.signage_standard not null default 'iso7010',
  category public.signage_category not null default 'safe_condition',
  -- references the shared `public/brand/pictograms.svg` symbol id, rendered
  -- via <svg><use href="/brand/pictograms.svg#<pictogram_key>"/></svg>.
  pictogram_key text not null,
  -- e.g. "life-safety green", "prohibition red".
  colorway text,
  sign_state public.sign_state not null default 'draft',
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Code is unique per org (case-insensitive), ignoring soft-deleted rows.
create unique index if not exists signage_signs_org_code_uniq
  on public.signage_signs (org_id, lower(code))
  where deleted_at is null;

create index if not exists signage_signs_org_state_idx
  on public.signage_signs (org_id, sign_state)
  where deleted_at is null;

create index if not exists signage_signs_org_category_idx
  on public.signage_signs (org_id, category)
  where deleted_at is null;

alter table public.signage_signs enable row level security;

create policy signage_signs_org_select
  on public.signage_signs for select
  using (private.is_org_member(org_id));

create policy signage_signs_org_write
  on public.signage_signs
  using (private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller', 'collaborator']))
  with check (private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller', 'collaborator']));

create trigger signage_signs_touch_updated_at
  before update on public.signage_signs
  for each row execute function public.touch_updated_at();

-- ── signage_placements ──────────────────────────────────────────────────
-- One row per physical placement of a sign. `project_id` is optional — a
-- placement can be tied to a project or be org-level standing signage.
create table if not exists public.signage_placements (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  sign_id uuid not null references public.signage_signs(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  location text not null,
  quantity integer not null default 1 check (quantity >= 0),
  placement_state public.placement_state not null default 'planned',
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists signage_placements_sign_idx
  on public.signage_placements (org_id, sign_id, created_at desc)
  where deleted_at is null;

create index if not exists signage_placements_project_idx
  on public.signage_placements (org_id, project_id)
  where deleted_at is null;

create index if not exists signage_placements_state_idx
  on public.signage_placements (org_id, placement_state)
  where deleted_at is null;

alter table public.signage_placements enable row level security;

create policy signage_placements_org_select
  on public.signage_placements for select
  using (private.is_org_member(org_id));

create policy signage_placements_org_write
  on public.signage_placements
  using (private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller', 'collaborator']))
  with check (private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller', 'collaborator']));

create trigger signage_placements_touch_updated_at
  before update on public.signage_placements
  for each row execute function public.touch_updated_at();
