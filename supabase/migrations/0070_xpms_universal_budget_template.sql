-- ============================================================================
-- 0070 — XPMS Universal Budget Template v08 (8-Gate Lifecycle)
-- ============================================================================
--
-- Migrates `public.budgets` from the legacy single-category model to the
-- canonical XPMS taxonomy locked Jun 2026. The template (see
-- XPMS_Universal_Budget_Template.xlsx) defines:
--
--   • 8-Gate Lifecycle (Discovery / Design / Advance / Procurement / Build /
--     Install / Operate / Close)
--   • Fee & Contingency are NOT phases — they are LINE TYPE values that roll
--     up separately from the phase curve
--   • Department/Team/Class/Item taxonomy via the XPMS Master Registry
--   • Discipline (Live Entertainment / Experiential / Fabrication / etc.)
--   • Tier (01 Social / 02 Digital / 03 Virtual / 04 Physical / 05
--     Experiential / 06 Theatrical)
--   • XYZ cost-behaviour axis (X-Constant / Y-Variable / Z-Timeline/Phase)
--   • ESTIMATE = QUANTITY × RATE (derived via trigger)
--   • Project billing / draw schedule (% of total contract at gated milestones)
--
-- ============================================================================

-- Enums ---------------------------------------------------------------------

do $$
begin
  if not exists (select 1 from pg_type where typname = 'budget_line_type') then
    create type public.budget_line_type as enum (
      'Scope', 'Fee', 'Contingency', 'Allowance', 'Markup'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'budget_xyz') then
    create type public.budget_xyz as enum (
      'X — Constant', 'Y — Variable', 'Z — Timeline/Phase'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'budget_tier') then
    create type public.budget_tier as enum (
      '01 Social', '02 Digital', '03 Virtual',
      '04 Physical', '05 Experiential', '06 Theatrical'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'budget_discipline') then
    create type public.budget_discipline as enum (
      'Live Entertainment', 'Experiential', 'Fabrication',
      'Construction', 'Interior Design', 'Procurement',
      'Broadcast & Content', 'Corporate & Brand',
      'Hospitality & F&B', 'Festival & Touring'
    );
  end if;
end$$;

-- Extend `budgets` ----------------------------------------------------------

alter table public.budgets
  add column if not exists event text,
  add column if not exists location text,
  add column if not exists activation text,
  add column if not exists department text,
  add column if not exists team text,
  add column if not exists class text,
  add column if not exists item text,
  add column if not exists discipline budget_discipline,
  add column if not exists xpms_phase text,
  add column if not exists tier budget_tier,
  add column if not exists xyz budget_xyz,
  add column if not exists line_type budget_line_type not null default 'Scope',
  add column if not exists quantity numeric(18, 4),
  add column if not exists rate_cents bigint,
  add column if not exists estimate_cents bigint,
  add column if not exists actual_cents bigint,
  add column if not exists vendor text,
  add column if not exists budget_status text,
  add column if not exists flag boolean not null default false,
  add column if not exists external_notes text,
  add column if not exists internal_notes text;

-- 8-gate xpms_phase check constraint
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'budgets_xpms_phase_check'
  ) then
    alter table public.budgets
      add constraint budgets_xpms_phase_check
      check (xpms_phase is null or xpms_phase in (
        'Discovery', 'Design', 'Advance', 'Procurement',
        'Build', 'Install', 'Operate', 'Close'
      ));
  end if;
end$$;

-- ESTIMATE = QUANTITY × RATE_CENTS, computed on insert/update --------------

create schema if not exists private;

create or replace function private.budgets_compute_estimate()
returns trigger
language plpgsql
as $$
begin
  if new.quantity is not null and new.rate_cents is not null then
    new.estimate_cents := round(new.quantity * new.rate_cents);
  end if;
  return new;
end;
$$;

drop trigger if exists tg_budgets_compute_estimate on public.budgets;
create trigger tg_budgets_compute_estimate
  before insert or update of quantity, rate_cents on public.budgets
  for each row execute function private.budgets_compute_estimate();

-- Indexes for the Summary rollups -------------------------------------------

create index if not exists budgets_org_department_idx on public.budgets (org_id, department);
create index if not exists budgets_org_xpms_phase_idx on public.budgets (org_id, xpms_phase);
create index if not exists budgets_org_discipline_idx on public.budgets (org_id, discipline);
create index if not exists budgets_org_line_type_idx on public.budgets (org_id, line_type);
create index if not exists budgets_org_xyz_idx on public.budgets (org_id, xyz);
create index if not exists budgets_project_idx on public.budgets (project_id);

-- Project billing / draw schedule -------------------------------------------

create table if not exists public.project_billing_draws (
  id uuid default gen_random_uuid() primary key,
  org_id uuid not null references public.orgs(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  draw_name text not null,
  trigger_label text,
  trigger_phase text check (trigger_phase is null or trigger_phase in (
    'Discovery', 'Design', 'Advance', 'Procurement',
    'Build', 'Install', 'Operate', 'Close'
  )),
  percentage numeric(5, 4) not null check (percentage >= 0 and percentage <= 1),
  amount_cents bigint default 0 not null,
  drawn boolean default false not null,
  drawn_at timestamptz,
  sort_order int default 0 not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists project_billing_draws_project_idx on public.project_billing_draws (project_id);
create index if not exists project_billing_draws_org_idx on public.project_billing_draws (org_id);

alter table public.project_billing_draws enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'project_billing_draws'
      and policyname = 'project_billing_draws_select_org_member'
  ) then
    create policy "project_billing_draws_select_org_member" on public.project_billing_draws
      for select using (private.is_org_member(org_id));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'project_billing_draws'
      and policyname = 'project_billing_draws_write_managers'
  ) then
    create policy "project_billing_draws_write_managers" on public.project_billing_draws
      for all
      using (private.has_org_role(org_id, array['owner', 'admin', 'manager']))
      with check (private.has_org_role(org_id, array['owner', 'admin', 'manager']));
  end if;
end$$;

-- Touch updated_at on write
create or replace function private.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists tg_project_billing_draws_updated_at on public.project_billing_draws;
create trigger tg_project_billing_draws_updated_at
  before update on public.project_billing_draws
  for each row execute function private.touch_updated_at();

-- Comments ------------------------------------------------------------------

comment on column public.budgets.line_type is
  'XPMS budget line classification (Scope/Fee/Contingency/Allowance/Markup). The phase curve sums LINE TYPE = Scope only — Fee & Contingency roll up separately and never inflate a phase total.';
comment on column public.budgets.xpms_phase is
  'XPMS 8-Gate Lifecycle phase: Discovery / Design / Advance / Procurement / Build / Install / Operate / Close. NULL for non-scope rows (Fee, Contingency) that don''t belong to a phase.';
comment on column public.budgets.xyz is
  'Cost behaviour axis: X (Constant fixed cost), Y (Variable per unit), Z (Timeline/Phase-dependent).';
comment on column public.budgets.discipline is
  'Multidisciplinary work axis (Live Entertainment / Experiential / Fabrication / Construction / Interior Design / Procurement / Broadcast & Content / Corporate & Brand / Hospitality & F&B / Festival & Touring).';
comment on column public.budgets.tier is
  'Experience tier (01 Social / 02 Digital / 03 Virtual / 04 Physical / 05 Experiential / 06 Theatrical).';
comment on column public.budgets.estimate_cents is
  'Computed: QUANTITY × RATE_CENTS via trigger. Null when quantity or rate are unset.';
comment on column public.budgets.amount_cents is
  'BUDGET column from XPMS template — the approved baseline.';
comment on column public.budgets.forecast_cents is
  'FORECAST column from XPMS template. VARIANCE = BUDGET - FORECAST is computed at read time (no column).';
comment on column public.budgets.actual_cents is
  'ACTUAL column from XPMS template — rolled up from the Expenses ledger.';
comment on table public.project_billing_draws is
  'XPMS Project Billing / Draw Schedule. % of total contract triggered at gated milestones. Template default: 50% Mobilization (Discovery), 30% Progress (Build start), 20% Final (Close).';
