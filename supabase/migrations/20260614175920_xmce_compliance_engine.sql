-- XMCE Compliance Engine (LEG3ND) — author compliance rules and run checks
-- that produce findings. Three org-scoped tables forming an audit/compliance
-- dashboard:
--   - compliance_rules    : authored rules (severity, category, lifecycle)
--   - compliance_runs     : an execution of the rule set against a scope
--   - compliance_findings : per-rule results emitted by a run
--
-- LDP naming discipline: NO bare `status`. Every lifecycle column is a
-- cyclical operational `*_state` backed by a NAMED postgres enum type:
--   compliance_rules.rule_state        → public.compliance_rule_state
--   compliance_runs.run_state          → public.compliance_run_state
--   compliance_findings.finding_state  → public.compliance_finding_state
-- Severity is a fixed taxonomy, not a lifecycle → public.compliance_severity.

-- ── enum types ──────────────────────────────────────────────────────────
do $$ begin
  create type public.compliance_severity as enum ('info', 'low', 'medium', 'high', 'critical');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.compliance_rule_state as enum ('draft', 'active', 'retired');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.compliance_run_state as enum ('queued', 'running', 'passed', 'failed', 'error');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.compliance_finding_state as enum ('open', 'acknowledged', 'resolved', 'waived');
exception when duplicate_object then null; end $$;

-- ── compliance_rules ────────────────────────────────────────────────────
create table if not exists public.compliance_rules (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  code text not null,
  title text not null,
  description text,
  severity public.compliance_severity not null default 'medium',
  category text,
  rule_state public.compliance_rule_state not null default 'draft',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Code is unique per org (case-insensitive), ignoring soft-deleted rows.
create unique index if not exists compliance_rules_org_code_uniq
  on public.compliance_rules (org_id, lower(code))
  where deleted_at is null;

create index if not exists compliance_rules_org_state_idx
  on public.compliance_rules (org_id, rule_state)
  where deleted_at is null;

alter table public.compliance_rules enable row level security;

create policy compliance_rules_org_select
  on public.compliance_rules for select
  using (private.is_org_member(org_id));

create policy compliance_rules_org_write
  on public.compliance_rules
  using (private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller', 'collaborator']))
  with check (private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller', 'collaborator']));

create trigger compliance_rules_touch_updated_at
  before update on public.compliance_rules
  for each row execute function public.touch_updated_at();

-- ── compliance_runs ─────────────────────────────────────────────────────
-- One row per execution of the rule set against a scope. `scope_kind` is a
-- free-form discriminator (e.g. 'project' / 'org'); `scope_ref` optionally
-- points at the scoped entity. `summary` captures the engine's run report
-- (rule/finding counts by severity) as JSONB.
create table if not exists public.compliance_runs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  scope_kind text not null default 'org',
  scope_ref uuid,
  run_state public.compliance_run_state not null default 'queued',
  summary jsonb not null default '{}'::jsonb,
  started_at timestamptz,
  finished_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists compliance_runs_org_state_idx
  on public.compliance_runs (org_id, run_state);

create index if not exists compliance_runs_org_created_idx
  on public.compliance_runs (org_id, created_at desc);

alter table public.compliance_runs enable row level security;

create policy compliance_runs_org_select
  on public.compliance_runs for select
  using (private.is_org_member(org_id));

create policy compliance_runs_org_write
  on public.compliance_runs
  using (private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller', 'collaborator']))
  with check (private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller', 'collaborator']));

create trigger compliance_runs_touch_updated_at
  before update on public.compliance_runs
  for each row execute function public.touch_updated_at();

-- ── compliance_findings ─────────────────────────────────────────────────
-- One row per (run × rule) result. `entity_ref` is a free-form pointer to the
-- entity that tripped the rule; `detail` is the human-readable explanation.
create table if not exists public.compliance_findings (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  run_id uuid not null references public.compliance_runs(id) on delete cascade,
  rule_id uuid not null references public.compliance_rules(id) on delete restrict,
  finding_state public.compliance_finding_state not null default 'open',
  severity public.compliance_severity not null default 'medium',
  detail text,
  entity_ref text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists compliance_findings_run_idx
  on public.compliance_findings (org_id, run_id, created_at desc);

create index if not exists compliance_findings_rule_idx
  on public.compliance_findings (org_id, rule_id);

create index if not exists compliance_findings_state_idx
  on public.compliance_findings (org_id, finding_state);

alter table public.compliance_findings enable row level security;

create policy compliance_findings_org_select
  on public.compliance_findings for select
  using (private.is_org_member(org_id));

create policy compliance_findings_org_write
  on public.compliance_findings
  using (private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller', 'collaborator']))
  with check (private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller', 'collaborator']));

create trigger compliance_findings_touch_updated_at
  before update on public.compliance_findings
  for each row execute function public.touch_updated_at();
