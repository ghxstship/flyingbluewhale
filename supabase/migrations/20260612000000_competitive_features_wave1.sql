-- Competitive Features Wave 1 — canonical implementations of the top P0/P1
-- gaps identified in the June 2026 competitive analysis:
--
--   1. scheduling_policies         — Policy Builder (Teambridge analog)
--   2. shift_phases                — Micro-scheduling segments (Deputy analog)
--   3. ai_intelligence_sessions    — ATLVS Intelligence Ask/Act log (LASSO analog)
--   4. ai_alert_rules              — Proactive operational monitoring (LASSO Alert analog)
--   5. crew_performance_scores     — Talent Intelligence ranking (Nowsta analog)
--   6. induction_requirements +    — Accredit Induct / briefing-gated credentials
--      induction_completions          (Accredit Solutions analog)
--   7. time_entries.clock_out_method  — NFC/geofence auto clock-out (Connecteam analog)
--   8. time_clock_zones.auto_checkout — Geofence auto clock-out zone flag
--   9. course_ai_generations        — AI course content builder (Connecteam analog)
--  10. workforce_sales_targets      — Projected sales vs labour % (Connecteam analog)
--  11. v_marketplace_lead_insights  — Per-listing competitive inquiry view (GigSalad analog)
--
-- Naming discipline: every new lifecycle/state column uses *_phase or *_state.
-- Zero bare `status` columns introduced.

-- ─────────────────────────────────────────────────────────────────────────────
-- 0.  Enums
-- ─────────────────────────────────────────────────────────────────────────────

create type public.scheduling_policy_kind as enum (
  'shift_limit',
  'min_rest',
  'credential_required',
  'union_rule',
  'max_consecutive_days',
  'overtime_threshold',
  'custom'
);

create type public.scheduling_policy_scope as enum (
  'org',
  'project',
  'role',
  'location'
);

create type public.policy_enforcement_mode as enum (
  'warn',
  'block'
);

create type public.shift_phase_label as enum (
  'load_in',
  'setup',
  'show',
  'changeover',
  'load_out',
  'wrap',
  'rehearsal',
  'break',
  'other'
);

create type public.ai_intelligence_mode as enum (
  'ask',
  'act',
  'alert_setup'
);

create type public.alert_cadence as enum (
  'realtime',
  'hourly',
  'daily',
  'weekly'
);

create type public.crew_score_kind as enum (
  'reliability',
  'quality',
  'safety',
  'communication',
  'composite'
);

create type public.induction_scope as enum (
  'org',
  'role',
  'zone',
  'project'
);

create type public.induction_completed_via as enum (
  'platform',
  'external',
  'manual_override'
);

create type public.clock_out_method_kind as enum (
  'manual',
  'geofence_exit',
  'nfc_tap',
  'supervisor',
  'auto_end_of_shift'
);

create type public.ai_course_gen_phase as enum (
  'queued',
  'generating',
  'complete',
  'error'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 1.  scheduling_policies — Policy Builder
--     Org-scoped rules that the scheduling engine enforces before committing
--     a shift. Analogous to Teambridge's Policy Builder and Rosterfy's
--     compliance checkpoints.
-- ─────────────────────────────────────────────────────────────────────────────

create table public.scheduling_policies (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references public.orgs(id) on delete cascade,
  name            text not null,
  description     text,
  policy_kind     public.scheduling_policy_kind not null,
  scope           public.scheduling_policy_scope not null default 'org',
  -- scope_filter narrows which projects/roles/locations the policy applies to.
  -- e.g. {"project_ids": ["…"], "role_ids": ["…"]}
  scope_filter    jsonb not null default '{}',
  -- rules carries the kind-specific parameters.
  -- shift_limit:    {"max_hours_per_day": 10, "max_hours_per_week": 60}
  -- min_rest:       {"min_rest_hours": 8}
  -- credential_required: {"credential_type": "…", "expiry_buffer_days": 7}
  -- union_rule:     {"union_code": "IATSE", "rules": […]}
  rules           jsonb not null default '{}',
  enforcement_mode public.policy_enforcement_mode not null default 'warn',
  active          boolean not null default true,
  created_by      uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.scheduling_policies enable row level security;
create policy scheduling_policies_org_rls on public.scheduling_policies
  to authenticated
  using (private.is_org_member(org_id));
create policy scheduling_policies_manager_write on public.scheduling_policies
  for insert with check (private.has_org_role(org_id, array['owner','admin','manager']));

create index idx_scheduling_policies_org on public.scheduling_policies(org_id) where active;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2.  shift_phases — Micro-scheduling segments within a single shift
--     A shift can be divided into named phases (load_in → show → load_out).
--     Mirrors Deputy's Micro-Scheduling feature and LASSO's event timeline.
-- ─────────────────────────────────────────────────────────────────────────────

create table public.shift_phases (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.orgs(id) on delete cascade,
  shift_id    uuid not null references public.shifts(id) on delete cascade,
  label       public.shift_phase_label not null,
  custom_label text,                     -- overrides label when label='other'
  starts_at   timestamptz,               -- null = follows previous phase
  ends_at     timestamptz,               -- null = open / TBD
  sort_order  smallint not null default 0,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.shift_phases enable row level security;
create policy shift_phases_org_rls on public.shift_phases
  to authenticated
  using (private.is_org_member(org_id));

create index idx_shift_phases_shift on public.shift_phases(shift_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3.  ai_intelligence_sessions — ATLVS Intelligence log
--     Records every Ask / Act interaction with the AI operations agent.
--     Source-cited responses (ask mode) and action manifests (act mode)
--     are stored in response_json for audit and reproducibility.
-- ─────────────────────────────────────────────────────────────────────────────

create table public.ai_intelligence_sessions (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null references public.orgs(id) on delete cascade,
  user_id        uuid not null references auth.users(id) on delete cascade,
  mode           public.ai_intelligence_mode not null,
  query          text not null,
  -- response_json shape:
  --   ask:  { "answer": "…", "citations": [{"table":"…","id":"…","label":"…"}] }
  --   act:  { "plan": […actions…], "confirmed": bool, "executed_at": iso }
  response_json  jsonb,
  model          text not null default 'claude-sonnet-4-6',
  input_tokens   int,
  output_tokens  int,
  -- latency_ms helps surface slow queries for optimisation
  latency_ms     int,
  created_at     timestamptz not null default now()
);

alter table public.ai_intelligence_sessions enable row level security;
create policy ai_intelligence_sessions_own on public.ai_intelligence_sessions
  to authenticated
  using (
    user_id = (select auth.uid())
    or private.has_org_role(org_id, array['owner','admin'])
  );

create index idx_ai_intelligence_sessions_org on public.ai_intelligence_sessions(org_id, created_at desc);
create index idx_ai_intelligence_sessions_user on public.ai_intelligence_sessions(user_id, created_at desc);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4.  ai_alert_rules — Proactive operational monitoring subscriptions
--     Org admins define what to watch (crew coverage gaps, asset availability,
--     budget overruns, etc.) and at what cadence. Mirrors LASSO's Alert mode
--     and Teambridge's "Ponder" proactive analysis.
-- ─────────────────────────────────────────────────────────────────────────────

create table public.ai_alert_rules (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references public.orgs(id) on delete cascade,
  created_by      uuid references auth.users(id) on delete set null,
  name            text not null,
  description     text,
  -- condition_json describes WHAT to monitor.
  -- e.g. {"kind": "crew_coverage_gap", "threshold_pct": 80, "scope": "project"}
  -- e.g. {"kind": "budget_overrun", "threshold_pct": 90}
  -- e.g. {"kind": "credential_expiry", "lead_days": 14}
  condition_json  jsonb not null default '{}',
  -- scope_json narrows the monitored resources.
  -- e.g. {"project_ids": ["…"]} or {"all": true}
  scope_json      jsonb not null default '{"all": true}',
  cadence         public.alert_cadence not null default 'daily',
  notify_user_ids uuid[] not null default '{}',
  active          boolean not null default true,
  last_fired_at   timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.ai_alert_rules enable row level security;
create policy ai_alert_rules_org_rls on public.ai_alert_rules
  to authenticated
  using (private.is_org_member(org_id));
create policy ai_alert_rules_manager_write on public.ai_alert_rules
  for insert with check (private.has_org_role(org_id, array['owner','admin','manager']));

create index idx_ai_alert_rules_org on public.ai_alert_rules(org_id) where active;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5.  crew_performance_scores — Talent Intelligence ranking
--     Aggregated per-worker performance metrics computed from time_entries,
--     assignment completions, incidents, and peer ratings. Drives smart crew
--     recommendations when staffing a roster. Mirrors Nowsta's Talent
--     Intelligence and Rosterfy's automated ranking.
-- ─────────────────────────────────────────────────────────────────────────────

create table public.crew_performance_scores (
  id               uuid primary key default gen_random_uuid(),
  org_id           uuid not null references public.orgs(id) on delete cascade,
  crew_member_id   uuid not null references public.crew_members(id) on delete cascade,
  -- project_id is null for the org-wide composite score
  project_id       uuid references public.projects(id) on delete cascade,
  score_kind       public.crew_score_kind not null,
  -- score is 0.00–100.00
  score            numeric(5,2) not null check (score >= 0 and score <= 100),
  sample_count     int not null default 0,
  -- component_json stores the sub-signals that fed this score.
  -- e.g. {"on_time_pct": 0.95, "completion_rate": 0.98, "incident_count": 0}
  component_json   jsonb not null default '{}',
  last_scored_at   timestamptz not null default now(),
  created_at       timestamptz not null default now(),

  unique (org_id, crew_member_id, project_id, score_kind)
);

alter table public.crew_performance_scores enable row level security;
create policy crew_scores_manager_read on public.crew_performance_scores
  to authenticated
  using (private.has_org_role(org_id, array['owner','admin','manager','controller','collaborator']));

create index idx_crew_scores_org_member on public.crew_performance_scores(org_id, crew_member_id);
create index idx_crew_scores_composite on public.crew_performance_scores(org_id, score_kind, score desc)
  where score_kind = 'composite';

-- ─────────────────────────────────────────────────────────────────────────────
-- 6.  induction_requirements + induction_completions — Accredit Induct
--     Safety briefings and compliance inductions that must be completed before
--     a credential or assignment can be issued. Mirrors Accredit Solutions'
--     Accredit Induct module. Connects to assignments via prerequisite check
--     in the fulfillment state machine.
-- ─────────────────────────────────────────────────────────────────────────────

create table public.induction_requirements (
  id               uuid primary key default gen_random_uuid(),
  org_id           uuid not null references public.orgs(id) on delete cascade,
  name             text not null,
  description      text,
  content_url      text,               -- link to briefing material or video
  applies_to       public.induction_scope not null default 'org',
  scope_filter     jsonb not null default '{}',
  -- valid_for_days: how long a completion is valid before re-induction required.
  -- null = one-time (never expires).
  valid_for_days   int check (valid_for_days > 0),
  -- assignment_kinds lists which catalog_kind values this blocks.
  -- null/empty = applies to all assignments.
  assignment_kinds public.catalog_kind[],
  -- accreditation_categories it blocks (parallel to assignment_kinds)
  accreditation_category_ids uuid[],
  created_by       uuid references auth.users(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz
);

alter table public.induction_requirements enable row level security;
create policy induction_req_org_rls on public.induction_requirements
  to authenticated
  using (private.is_org_member(org_id) and deleted_at is null);

create index idx_induction_req_org on public.induction_requirements(org_id) where deleted_at is null;


create table public.induction_completions (
  id                  uuid primary key default gen_random_uuid(),
  org_id              uuid not null references public.orgs(id) on delete cascade,
  requirement_id      uuid not null references public.induction_requirements(id) on delete cascade,
  -- exactly one of user_id or crew_member_id must be set (external holders
  -- cannot self-complete inductions; they must be managed by an operator)
  user_id             uuid references auth.users(id) on delete cascade,
  crew_member_id      uuid references public.crew_members(id) on delete cascade,
  completed_at        timestamptz not null default now(),
  expires_at          timestamptz,     -- null if valid_for_days is null
  completed_via       public.induction_completed_via not null default 'platform',
  verified_by         uuid references auth.users(id) on delete set null,
  notes               text,
  created_at          timestamptz not null default now(),

  constraint induction_completions_party_chk check (
    (user_id is not null and crew_member_id is null)
    or
    (user_id is null and crew_member_id is not null)
  )
);

alter table public.induction_completions enable row level security;
create policy induction_completions_org_rls on public.induction_completions
  to authenticated
  using (private.is_org_member(org_id));
-- Allow users to read their own completions
create policy induction_completions_self on public.induction_completions
  to authenticated
  using (user_id = (select auth.uid()));

create index idx_induction_completions_req on public.induction_completions(requirement_id);
create index idx_induction_completions_user on public.induction_completions(user_id) where user_id is not null;
create index idx_induction_completions_crew on public.induction_completions(crew_member_id) where crew_member_id is not null;

-- ─────────────────────────────────────────────────────────────────────────────
-- 7.  time_entries — add clock_out_method
--     Tracks HOW a time entry was closed (manual, geofence exit, NFC tap,
--     supervisor override, auto end-of-shift). Mirrors Connecteam's NFC
--     geofence auto clock-out and Ubeya's ML clock validation.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.time_entries
  add column if not exists clock_out_method public.clock_out_method_kind,
  add column if not exists clock_out_lat     numeric(10,7),
  add column if not exists clock_out_lng     numeric(10,7);

-- ─────────────────────────────────────────────────────────────────────────────
-- 8.  time_clock_zones — add auto-checkout columns
--     When auto_checkout_enabled is true, leaving the geofence triggers an
--     automatic clock-out after auto_checkout_delay_min minutes of being
--     outside the zone.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.time_clock_zones
  add column if not exists auto_checkout_enabled    boolean not null default false,
  add column if not exists auto_checkout_delay_min  smallint not null default 5
    check (auto_checkout_delay_min >= 0 and auto_checkout_delay_min <= 60);

-- ─────────────────────────────────────────────────────────────────────────────
-- 9.  course_ai_generations — AI Course Content Builder
--     Records every AI-assisted course generation request and its output.
--     Mirrors Connecteam's AI Course/Training Builder (2025) and
--     Rosterfy's automated onboarding workflows.
-- ─────────────────────────────────────────────────────────────────────────────

create table public.course_ai_generations (
  id               uuid primary key default gen_random_uuid(),
  org_id           uuid not null references public.orgs(id) on delete cascade,
  -- course_id is null until the operator accepts + attaches the generated content
  course_id        uuid references public.courses(id) on delete set null,
  created_by       uuid not null references auth.users(id) on delete cascade,
  prompt           text not null,
  -- source_material: pasted text, URL, or extracted PDF content the AI uses
  source_material  text,
  -- generated_json shape:
  --   {
  --     "objectives": ["…"],
  --     "lessons": [{"title":"…","kind":"text","body":"…","duration_min":5}],
  --     "quiz_questions": [{"stem":"…","choices":[…],"correct_index":0}]
  --   }
  generated_json   jsonb,
  gen_phase        public.ai_course_gen_phase not null default 'queued',
  model            text not null default 'claude-sonnet-4-6',
  input_tokens     int,
  output_tokens    int,
  error_message    text,
  created_at       timestamptz not null default now(),
  completed_at     timestamptz
);

alter table public.course_ai_generations enable row level security;
create policy course_ai_gen_org_rls on public.course_ai_generations
  to authenticated
  using (private.is_org_member(org_id));
create policy course_ai_gen_write on public.course_ai_generations
  for insert with check (
    private.has_org_role(org_id, array['owner','admin','manager'])
    and created_by = (select auth.uid())
  );

create index idx_course_ai_gen_org on public.course_ai_generations(org_id, created_at desc);
create index idx_course_ai_gen_course on public.course_ai_generations(course_id) where course_id is not null;

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. workforce_sales_targets — Projected Sales vs Labour %
--     Org planners enter revenue targets per date so the scheduling interface
--     can overlay projected-labour-cost% against expected revenue. Mirrors
--     Connecteam's Projected Sales + Projected Labor % feature (Mar 2026).
-- ─────────────────────────────────────────────────────────────────────────────

create table public.workforce_sales_targets (
  id                 uuid primary key default gen_random_uuid(),
  org_id             uuid not null references public.orgs(id) on delete cascade,
  project_id         uuid references public.projects(id) on delete cascade,
  target_date        date not null,
  projected_revenue  numeric(14,2) not null check (projected_revenue >= 0),
  actual_revenue     numeric(14,2),
  -- labour_budget_pct: target labour spend as a percentage of projected revenue
  labour_budget_pct  numeric(5,2) not null default 30.00
    check (labour_budget_pct > 0 and labour_budget_pct <= 100),
  notes              text,
  created_by         uuid references auth.users(id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  unique (org_id, project_id, target_date)
);

alter table public.workforce_sales_targets enable row level security;
create policy workforce_sales_targets_rls on public.workforce_sales_targets
  to authenticated
  using (private.is_org_member(org_id));
create policy workforce_sales_targets_write on public.workforce_sales_targets
  for insert with check (private.has_org_role(org_id, array['owner','admin','manager','controller']));

create index idx_workforce_sales_targets_org on public.workforce_sales_targets(org_id, target_date);

-- ─────────────────────────────────────────────────────────────────────────────
-- 11. v_marketplace_lead_insights — per-listing competitive intelligence
--     Aggregates inquiry + booking signals per open_call or job_posting so
--     org operators can see how competitive their listing is in real time.
--     Mirrors GigSalad's Lead Insights feature (Mar 2025).
-- ─────────────────────────────────────────────────────────────────────────────

create or replace view public.v_marketplace_lead_insights as
select
  mi.subject_id                                          as listing_id,
  mi.subject_kind                                        as listing_kind,
  mi.org_id,
  count(distinct mi.id)                                  as inquiry_count,
  count(distinct mi.id) filter (where mi.inquiry_state != 'new') as responded_count,
  count(distinct mi.id) filter (where mi.inquiry_state = 'closed') as closed_count,
  -- competition_score: 0–100 relative heat signal
  -- formula: capped(responded_count / nullif(inquiry_count,0) * 100, 100)
  least(
    round(
      count(distinct mi.id) filter (where mi.inquiry_state != 'new')::numeric
      / nullif(count(distinct mi.id), 0) * 100,
      1
    ),
    100
  )                                                      as competition_score,
  max(mi.created_at)                                     as last_inquiry_at
from public.marketplace_inquiries mi
group by mi.subject_id, mi.subject_kind, mi.org_id;

-- Restrict view access to authenticated users via RLS on the underlying table
-- (marketplace_inquiries already has RLS). No additional policy needed.

-- ─────────────────────────────────────────────────────────────────────────────
-- 12. updated_at triggers for new tables
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function private.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

do $$ begin
  create trigger touch_scheduling_policies
    before update on public.scheduling_policies
    for each row execute procedure private.touch_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger touch_shift_phases
    before update on public.shift_phases
    for each row execute procedure private.touch_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger touch_ai_alert_rules
    before update on public.ai_alert_rules
    for each row execute procedure private.touch_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger touch_induction_requirements
    before update on public.induction_requirements
    for each row execute procedure private.touch_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger touch_workforce_sales_targets
    before update on public.workforce_sales_targets
    for each row execute procedure private.touch_updated_at();
exception when duplicate_object then null; end $$;
