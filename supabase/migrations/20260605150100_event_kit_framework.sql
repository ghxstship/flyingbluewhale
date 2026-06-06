-- ============================================================================
-- 20260605150100 — Event Kit Framework (configure-to-order venue kits)
-- ============================================================================
-- Event Kit Framework · Layer A (2 of 2).
--
-- A brand-agnostic, XPMS-compliant kit aggregate that turns
-- {org, event, artist, mood_board, tier, venue, budget_band} into a
-- zero-context-executable venue kit. Binds to existing canon — it introduces
-- NO new budget/department/tier/phase/discipline/line-type vocabulary:
--   • Department/Tier        → src/lib/ghxstship/{classes,tiers}.ts (0000–9000, 01–06)
--   • Budget axes            → migration 0070 enums (budget_discipline/tier/xyz/line_type)
--   • 8-gate phase           → same CHECK list as budgets.xpms_phase
--   • URID                   → public.xpms_registry (migration 20260605150000)
--   • Catalog SKUs           → public.master_catalog_items (0051)
--   • Run of Show            → public.cues (0001), extended here with role/kit/phase
--   • Atom IDs               → src/lib/siteplan/atom-id.ts
--
-- Naming discipline: lifecycle columns are *_state (never status). Append-only.
-- Multi-tenant: org-scoped + RLS via private.is_org_member / has_org_role.
-- External-example isolation: every table carries a `scope` column
-- (canonical | external_example); also added to budgets/deliverables/
-- master_catalog_items so Casa demo rows never pollute the canonical catalog.
-- ============================================================================

-- 0 · scope isolation on shared tables --------------------------------------
alter table public.budgets               add column if not exists scope text not null default 'canonical';
alter table public.deliverables          add column if not exists scope text not null default 'canonical';
alter table public.master_catalog_items  add column if not exists scope text not null default 'canonical';

do $$
begin
  if not exists (select 1 from pg_constraint where conname='budgets_scope_check') then
    alter table public.budgets add constraint budgets_scope_check
      check (scope in ('canonical','external_example'));
  end if;
  if not exists (select 1 from pg_constraint where conname='deliverables_scope_check') then
    alter table public.deliverables add constraint deliverables_scope_check
      check (scope in ('canonical','external_example'));
  end if;
  if not exists (select 1 from pg_constraint where conname='master_catalog_items_scope_check') then
    alter table public.master_catalog_items add constraint master_catalog_items_scope_check
      check (scope in ('canonical','external_example'));
  end if;
end$$;

create index if not exists budgets_scope_idx              on public.budgets (scope);
create index if not exists deliverables_scope_idx         on public.deliverables (scope);
create index if not exists master_catalog_items_scope_idx on public.master_catalog_items (scope);

-- 1 · event_kits — the aggregate --------------------------------------------
create table if not exists public.event_kits (
  id                   uuid primary key default gen_random_uuid(),
  org_id               uuid not null references public.orgs(id) on delete cascade,
  scope                text not null default 'canonical' check (scope in ('canonical','external_example')),
  project_id           uuid references public.projects(id) on delete set null,
  name                 text not null,
  kit_scale            text not null check (kit_scale in ('S','M','L','XL')),
  xpms_tier_default    public.budget_tier,
  venue_name           text,
  venue_address        text,
  budget_band_low_cents  bigint,
  budget_band_high_cents bigint,
  atom_namespace       text,          -- e.g. ORG-EVTYYVEN prefix for issued atom ids
  kit_version          text not null default 'v1.0',
  kit_state            text not null default 'draft'
                         check (kit_state in ('draft','configured','advanced','locked','archived')),
  params               jsonb not null default '{}'::jsonb,  -- {artist, mood_board, budget_band, ...}
  generated_from       text,
  created_by           uuid,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
comment on table public.event_kits is
  'Configure-to-order venue kit aggregate. Binds plug-and-play params (artist/mood_board/tier/venue/budget_band in params jsonb) to zones, 5-senses touchpoints, BOM lines, phase gates, and ROS cues. kit_state is the lifecycle (draft→configured→advanced→locked→archived).';
create index if not exists event_kits_org_idx     on public.event_kits (org_id);
create index if not exists event_kits_scope_idx   on public.event_kits (scope);
create index if not exists event_kits_project_idx on public.event_kits (project_id);

-- 2 · kit_zones — venue map + addressable XYZ spatial codes ------------------
create table if not exists public.kit_zones (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.orgs(id) on delete cascade,
  kit_id        uuid not null references public.event_kits(id) on delete cascade,
  scope         text not null default 'canonical' check (scope in ('canonical','external_example')),
  zone_code     text not null,            -- addressable e.g. ZON-LOBBY
  name          text not null,
  dimensions    text,
  capacity      integer,
  power_notes   text,
  av_notes      text,
  loadin_notes  text,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  unique (kit_id, zone_code)
);
create index if not exists kit_zones_kit_idx on public.kit_zones (kit_id);
create index if not exists kit_zones_org_idx on public.kit_zones (org_id);

-- 3 · kit_touchpoints — the 5-Senses experiential matrix --------------------
create table if not exists public.kit_touchpoints (
  id                 uuid primary key default gen_random_uuid(),
  org_id             uuid not null references public.orgs(id) on delete cascade,
  kit_id             uuid not null references public.event_kits(id) on delete cascade,
  zone_id            uuid references public.kit_zones(id) on delete cascade,
  scope              text not null default 'canonical' check (scope in ('canonical','external_example')),
  sense              text not null check (sense in ('sight','sound','scent','taste','touch')),
  design_intent      text not null,
  delivering_element text,               -- the FF&E/AV/F&B/decor element that delivers it
  sort_order         integer not null default 0,
  created_at         timestamptz not null default now()
);
create index if not exists kit_touchpoints_kit_idx  on public.kit_touchpoints (kit_id);
create index if not exists kit_touchpoints_zone_idx on public.kit_touchpoints (zone_id);

-- 4 · kit_lines — the Advance BOM, six-axis tagged --------------------------
create table if not exists public.kit_lines (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references public.orgs(id) on delete cascade,
  kit_id          uuid not null references public.event_kits(id) on delete cascade,
  scope           text not null default 'canonical' check (scope in ('canonical','external_example')),
  zone_id         uuid references public.kit_zones(id) on delete set null,
  touchpoint_id   uuid references public.kit_touchpoints(id) on delete set null,
  catalog_item_id uuid references public.master_catalog_items(id) on delete set null,
  -- Department × URID axis (URID maps to the canonical registry)
  urid            text references public.xpms_registry(urid) on delete set null,
  department      text,
  team            text,
  class           text,
  item            text not null,
  description     text,
  -- XPMS budget axes (bind to 0070 enums — no new vocabulary)
  discipline      public.budget_discipline,
  xpms_phase      text check (xpms_phase is null or xpms_phase in
                    ('Discovery','Design','Advance','Procurement','Build','Install','Operate','Close')),
  tier            public.budget_tier,
  xyz             public.budget_xyz,
  line_type       public.budget_line_type not null default 'Scope',
  quantity        numeric(18,4),
  rate_cents      bigint,
  estimate_cents  bigint,                -- computed = quantity × rate_cents (trigger)
  vendor          text,
  atom_id         text,                  -- issued via buildAtomId; append-only
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
comment on table public.kit_lines is
  'Configure-to-order Advance BOM. Every line carries all six XPMS axes (department/urid · discipline · xpms_phase · tier · xyz · line_type), ties to a zone + 5-senses touchpoint, and may reference a master_catalog_items SKU. Mirrors public.budgets axes 1:1.';
create index if not exists kit_lines_kit_idx        on public.kit_lines (kit_id);
create index if not exists kit_lines_org_idx        on public.kit_lines (org_id);
create index if not exists kit_lines_urid_idx       on public.kit_lines (urid);
create index if not exists kit_lines_department_idx on public.kit_lines (kit_id, department);
create index if not exists kit_lines_phase_idx      on public.kit_lines (kit_id, xpms_phase);
create index if not exists kit_lines_discipline_idx on public.kit_lines (kit_id, discipline);
create index if not exists kit_lines_line_type_idx  on public.kit_lines (kit_id, line_type);

create or replace function private.kit_lines_compute_estimate()
returns trigger language plpgsql as $$
begin
  if new.quantity is not null and new.rate_cents is not null then
    new.estimate_cents := round(new.quantity * new.rate_cents);
  end if;
  new.updated_at := now();
  return new;
end;$$;
drop trigger if exists tg_kit_lines_compute_estimate on public.kit_lines;
create trigger tg_kit_lines_compute_estimate
  before insert or update on public.kit_lines
  for each row execute function private.kit_lines_compute_estimate();

-- 5 · kit_phase_gates — the 8-gate plan with exit checklists -----------------
create table if not exists public.kit_phase_gates (
  id               uuid primary key default gen_random_uuid(),
  org_id           uuid not null references public.orgs(id) on delete cascade,
  kit_id           uuid not null references public.event_kits(id) on delete cascade,
  scope            text not null default 'canonical' check (scope in ('canonical','external_example')),
  xpms_phase       text not null check (xpms_phase in
                     ('Discovery','Design','Advance','Procurement','Build','Install','Operate','Close')),
  objective        text,
  exit_checklist   jsonb not null default '[]'::jsonb,   -- [{item, done_when}]
  owner_role       text,
  key_deliverables jsonb not null default '[]'::jsonb,
  gate_state       text not null default 'pending'
                     check (gate_state in ('pending','in_progress','passed','blocked')),
  sort_order       integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (kit_id, xpms_phase)
);
create index if not exists kit_phase_gates_kit_idx on public.kit_phase_gates (kit_id);

-- 6 · kit_packages — configure-to-order BASE package per scale ---------------
create table if not exists public.kit_packages (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.orgs(id) on delete cascade,
  scope        text not null default 'canonical' check (scope in ('canonical','external_example')),
  kit_scale    text not null check (kit_scale in ('S','M','L','XL')),
  code         text not null,
  name         text not null,
  description  text,
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (org_id, code)
);
create index if not exists kit_packages_org_idx on public.kit_packages (org_id);

-- 7 · kit_options — options / substitutions / upgrades / add-ons -------------
create table if not exists public.kit_options (
  id               uuid primary key default gen_random_uuid(),
  org_id           uuid not null references public.orgs(id) on delete cascade,
  package_id       uuid references public.kit_packages(id) on delete cascade,
  scope            text not null default 'canonical' check (scope in ('canonical','external_example')),
  option_type      text not null check (option_type in ('option','substitution','upgrade','addon')),
  code             text not null,
  name             text not null,
  description      text,
  cost_delta_cents bigint not null default 0,
  lead_time_days   integer,
  xpms_phase       text check (xpms_phase is null or xpms_phase in
                     ('Discovery','Design','Advance','Procurement','Build','Install','Operate','Close')),
  discipline       public.budget_discipline,
  department       text,
  urid             text references public.xpms_registry(urid) on delete set null,
  sense            text check (sense is null or sense in ('sight','sound','scent','taste','touch')),
  zone_ref         text,                    -- zone_code this option affects
  depends_on       text[] not null default '{}',  -- other option codes required first
  catalog_item_id  uuid references public.master_catalog_items(id) on delete set null,
  active           boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (org_id, code)
);
create index if not exists kit_options_org_idx     on public.kit_options (org_id);
create index if not exists kit_options_package_idx on public.kit_options (package_id);

-- 8 · cues — extend the existing Run-of-Show engine for role-based ROS -------
alter table public.cues
  add column if not exists kit_id uuid references public.event_kits(id) on delete cascade,
  add column if not exists scope text not null default 'canonical',
  add column if not exists owner_role text,            -- maps to org_roles JD (ROS persona)
  add column if not exists persona text,
  add column if not exists xpms_phase text,
  add column if not exists done_when text,
  add column if not exists depends_on_cue_id uuid references public.cues(id) on delete set null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname='cues_scope_check') then
    alter table public.cues add constraint cues_scope_check
      check (scope in ('canonical','external_example'));
  end if;
  if not exists (select 1 from pg_constraint where conname='cues_xpms_phase_check') then
    alter table public.cues add constraint cues_xpms_phase_check
      check (xpms_phase is null or xpms_phase in
        ('Discovery','Design','Advance','Procurement','Build','Install','Operate','Close'));
  end if;
end$$;
create index if not exists cues_kit_idx on public.cues (kit_id);
comment on column public.cues.owner_role is
  'Role-based ROS persona (maps to org_roles JD). With lane + scheduled_at + done_when, drives the per-role Run of Show. NB: legacy cues.status retained; cue lifecycle should migrate to cue_state in a later pass.';

-- 9 · RLS — org-scoped read; manager+ write (canonical helper pattern) -------
do $$
declare t text;
begin
  foreach t in array array[
    'event_kits','kit_zones','kit_touchpoints','kit_lines',
    'kit_phase_gates','kit_packages','kit_options'
  ] loop
    execute format('alter table public.%I enable row level security;', t);

    if not exists (select 1 from pg_policies where schemaname='public' and tablename=t
                   and policyname = t||'_select_org_member') then
      execute format($f$create policy "%s_select_org_member" on public.%I
        for select using (private.is_org_member(org_id));$f$, t, t);
    end if;

    if not exists (select 1 from pg_policies where schemaname='public' and tablename=t
                   and policyname = t||'_write_managers') then
      execute format($f$create policy "%s_write_managers" on public.%I
        for all
        using (private.has_org_role(org_id, array['owner','admin','manager']))
        with check (private.has_org_role(org_id, array['owner','admin','manager']));$f$, t, t);
    end if;
  end loop;
end$$;

-- 10 · touch updated_at on the tables that carry it --------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'event_kits','kit_lines','kit_phase_gates','kit_packages','kit_options'
  ] loop
    execute format('drop trigger if exists tg_%s_updated_at on public.%I;', t, t);
    execute format($f$create trigger tg_%s_updated_at before update on public.%I
      for each row execute function private.touch_updated_at();$f$, t, t);
  end loop;
end$$;
