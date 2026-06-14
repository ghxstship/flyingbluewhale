-- Goals / OKRs (coverage gap CV9).
--
-- Org-scoped objectives with measurable key results — the classic OKR shape
-- (one objective → many key results). Two tables:
--   - goals       : the objective (title/description/owner/period + lifecycle)
--   - key_results : measurable outcomes under a goal (target/current/unit)
--
-- Progress rollup is computed app-side (avg of current/target per KR) — no
-- generated column here, so the formula can evolve without a migration.
--
-- LDP naming discipline: NO bare `status`. Two distinct lifecycles, each its
-- own postgres enum:
--   - goal_state  : the objective's macro lifecycle (cyclical operational)
--   - kr_state    : the key result's health signal (cyclical operational)
-- Both are lifecycle columns → `*_state`, never `status`.
--
-- NOT YET APPLIED — write-only PENDING migration. Code uses the LooseSupabase
-- cast until the typed Database is regenerated post-apply.

-- ── enum types ──────────────────────────────────────────────────────────
do $$ begin
  create type public.goal_state as enum ('draft', 'active', 'achieved', 'missed', 'archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.kr_state as enum ('on_track', 'at_risk', 'off_track', 'done');
exception when duplicate_object then null; end $$;

-- ── goals ─────────────────────────────────────────────────────────────────
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  title text not null,
  description text,
  -- The accountable owner. SET NULL on user removal so the goal survives.
  owner_id uuid references auth.users(id) on delete set null,
  -- Free-text planning period label, e.g. "Q3 2026", "FY26", "H1".
  period text,
  goal_state public.goal_state not null default 'draft',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists goals_org_state_idx
  on public.goals (org_id, goal_state)
  where deleted_at is null;

create index if not exists goals_owner_idx
  on public.goals (org_id, owner_id)
  where deleted_at is null;

alter table public.goals enable row level security;

create policy goals_org_select
  on public.goals for select
  using (private.is_org_member(org_id));

create policy goals_org_write
  on public.goals
  using (private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller', 'collaborator']))
  with check (private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller', 'collaborator']));

create trigger goals_touch_updated_at
  before update on public.goals
  for each row execute function public.touch_updated_at();

-- ── key_results ─────────────────────────────────────────────────────────────
-- org_id is denormalized onto the child so RLS + org-scoped reads don't have
-- to JOIN through goals. On goal delete the KRs cascade away.
create table if not exists public.key_results (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  goal_id uuid not null references public.goals(id) on delete cascade,
  title text not null,
  target_value numeric not null default 0,
  current_value numeric not null default 0,
  -- Unit label for display, e.g. "%", "$", "signups", "NPS".
  unit text,
  kr_state public.kr_state not null default 'on_track',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists key_results_goal_idx
  on public.key_results (org_id, goal_id)
  where deleted_at is null;

create index if not exists key_results_state_idx
  on public.key_results (org_id, kr_state)
  where deleted_at is null;

alter table public.key_results enable row level security;

create policy key_results_org_select
  on public.key_results for select
  using (private.is_org_member(org_id));

create policy key_results_org_write
  on public.key_results
  using (private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller', 'collaborator']))
  with check (private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller', 'collaborator']));

create trigger key_results_touch_updated_at
  before update on public.key_results
  for each row execute function public.touch_updated_at();
