-- Geofence policy — turning a recorded classification into an enforceable one.
--
-- Phase 1 of docs/compvss/TIME_MANAGEMENT_LIFECYCLE_PLAN.md. Today
-- `geofence_state='outside'` is recorded and never acted on, and both
-- routes say so ("The geofence classification is informational — we don't
-- block check_in on an outside-the-zone punch").
--
-- Policy resolves zone -> org -> 'record_only':
--   record_only — accept, tag, move on. TODAY'S BEHAVIOUR, and the default,
--                 so this migration changes nothing until an org opts in.
--   warn        — accept, tag enforcement_state='warned', tell the worker.
--   block       — refuse the frictionless punch and offer the override path.
--
-- `block` blocks the self-service punch, NOT the record. Under FLSA an
-- employer owes wages for hours actually worked; a geofence is an employer
-- convenience, not a wage-eligibility test. A worker who is genuinely on
-- site with dead GPS, or genuinely working outside the fence, always lands
-- a row — quarantined for a manager, never discarded. See the plan's
-- "geofence block must never destroy a record of worked time".
--
-- LDP: `geofence_policy` is a configuration facet, not a lifecycle, so it
-- takes neither _phase nor _state. `pay_period_kind` / `ot_rule_set` are
-- likewise facets. Nothing here is named `status`.

-- Per-zone override. NULLABLE ON PURPOSE: null = inherit the org default.
-- A three-value column with a NOT NULL default couldn't express "inherit".
alter table public.time_clock_zones
  add column if not exists geofence_policy text
    check (geofence_policy is null or geofence_policy in ('block', 'warn', 'record_only')),
  add column if not exists accuracy_threshold_m integer
    check (accuracy_threshold_m is null or (accuracy_threshold_m between 10 and 1000)),
  add column if not exists grace_radius_m integer
    check (grace_radius_m is null or (grace_radius_m between 0 and 2000));

comment on column public.time_clock_zones.geofence_policy is
  'Per-zone override of org_time_settings.geofence_policy: block | warn | record_only. NULL inherits the org default — this is why the column is nullable.';
comment on column public.time_clock_zones.accuracy_threshold_m is
  'Per-zone override: a fix less accurate than this reclassifies outside -> unknown rather than blocking a worker for bad signal. NULL inherits the org default.';
comment on column public.time_clock_zones.grace_radius_m is
  'Per-zone override: metres of slack beyond radius_m that still count as inside (tagged warned), absorbing urban-canyon drift. NULL inherits the org default.';

create table if not exists public.org_time_settings (
  org_id uuid primary key references public.orgs(id) on delete cascade,

  -- record_only is deliberately the default: this table existing must not
  -- change any org's behaviour.
  geofence_policy text not null default 'record_only'
    check (geofence_policy in ('block', 'warn', 'record_only')),
  accuracy_threshold_m integer not null default 100
    check (accuracy_threshold_m between 10 and 1000),
  grace_radius_m integer not null default 50
    check (grace_radius_m between 0 and 2000),

  -- When true (the default), a punch that can't be verified offline is
  -- accepted and quarantined rather than refused. An org may turn this off
  -- only if it accepts that workers lose punches in dead zones.
  allow_offline_punch_when_blocking boolean not null default true,

  -- Pay-calendar seed for the Phase 3 compile step. Declared here so the
  -- settings surface has one home rather than sprouting a second table.
  pay_period_kind text not null default 'weekly'
    check (pay_period_kind in ('weekly', 'biweekly', 'semimonthly', 'monthly')),
  pay_period_anchor date not null default date '2026-01-04',

  -- Overtime is jurisdiction-specific and getting it wrong is a
  -- wage-and-hour liability, not a bug. Only two rule sets are claimed:
  --   flsa — >40/week.
  --   ca   — FLSA plus >8/day, >12/day at 2x, 7th-consecutive-day.
  --   none — emit raw hours; the org's HR system computes OT.
  -- Anything else (other states, union/CBA agreements) must use 'none'
  -- until its rules are actually implemented.
  ot_rule_set text not null default 'flsa'
    check (ot_rule_set in ('flsa', 'ca', 'none')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.org_time_settings is
  'Per-org time-management policy. One row per org, lazily created; absent row = every default below, which reproduces pre-Phase-1 behaviour exactly.';
comment on column public.org_time_settings.geofence_policy is
  'Org default, overridable per zone: block | warn | record_only. Resolution is zone -> org -> record_only. block refuses the frictionless punch and offers override-with-reason; it never discards worked time.';
comment on column public.org_time_settings.allow_offline_punch_when_blocking is
  'When true, a punch that cannot be verified server-side (offline replay, GPS denied) is accepted as quarantined rather than refused. Turning this off means workers can lose punches in dead zones.';
comment on column public.org_time_settings.ot_rule_set is
  'Overtime rules actually implemented: flsa (>40/wk) | ca (+ >8/day, >12/day 2x, 7th-day) | none (raw hours; HR system computes OT). Jurisdictions beyond these must use none rather than be silently mis-computed.';

alter table public.org_time_settings enable row level security;

-- Any member reads the policy — the mobile client caches it to run the
-- same check offline that the server runs online.
create policy org_time_settings_read on public.org_time_settings
  for select using (private.is_org_member(org_id));

-- Only owners/admins write it. Managers approve hours; they do not set the
-- rules that govern them (separation of duties).
create policy org_time_settings_admin_write on public.org_time_settings
  for all using (private.is_org_admin(org_id))
  with check (private.is_org_admin(org_id));

create or replace trigger org_time_settings_touch_updated_at
  before update on public.org_time_settings
  for each row execute function public.touch_updated_at();
