-- Competitive features bundle — Round 80.
--
-- Six new surfaces sourced from a competitive analysis sweep (May 2026):
--
--   1. run_of_show_items   — AI-generated run-of-show cues (vs Propared / Cvent CventIQ).
--                            Console generator at /console/projects/[id]/run-of-show;
--                            mobile reader already lives at /m/ros.
--
--   2. event_snapshots     — Field crew "live bookmark" during events (vs Cvent Snapshots).
--                            COMPVSS quick-capture at /m/snapshot/new; aggregated into
--                            the AI post-event debrief at /console/projects/[id]/debrief.
--
--   3. approval_requests   — Dollar-threshold PO/Req approval routing (vs Coupa / SAP Joule).
--                            Console queue at /console/procurement/approvals.
--
--   4. schedule_share_tokens — Public live-schedule share links (vs Propared one-click share).
--                              Token-gated read at /share/schedule/[token].
--
--   5. project_debriefs    — AI post-event report rows (vs Bizzabo / Momentus Analytics).
--                            One row per project; body generated via /api/v1/projects/[id]/debrief/generate.
--
--   6. open_call_submissions.match_score — AI talent match scoring (vs Bizzabo sponsor ROI
--                            engine / Superfiliate Meta APIs). Column added to existing table.
--
-- Naming discipline: no `status` columns — uses `*_state` (cyclical) per LDP §NAMING.

-- ─── 1. run_of_show_items ────────────────────────────────────────────────────

create table if not exists public.run_of_show_items (
    id                  uuid primary key default gen_random_uuid(),
    org_id              uuid not null references public.orgs(id) on delete cascade,
    project_id          uuid not null references public.projects(id) on delete cascade,
    -- cue_number is display-only sortable string (e.g. "1", "1A", "2.3")
    cue_number          text not null default '',
    label               text not null,
    notes               text,
    department          text check (
        department is null or department in (
            'foh', 'boh', 'talent', 'production', 'security', 'medical',
            'logistics', 'media', 'sponsor', 'other'
        )
    ),
    assignee_id         uuid references auth.users(id) on delete set null,
    starts_at           timestamptz,
    duration_seconds    int check (duration_seconds is null or duration_seconds >= 0),
    source              text not null default 'manual' check (source in ('manual', 'ai_generated')),
    sort_order          int not null default 0,
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now(),
    deleted_at          timestamptz
);

create index if not exists run_of_show_items_project_idx
    on public.run_of_show_items (project_id, sort_order) where deleted_at is null;
create index if not exists run_of_show_items_starts_at_idx
    on public.run_of_show_items (project_id, starts_at) where deleted_at is null;

alter table public.run_of_show_items enable row level security;

create policy "run_of_show_items org member select" on public.run_of_show_items
    for select using (private.is_org_member(org_id));
create policy "run_of_show_items org member insert" on public.run_of_show_items
    for insert with check (private.is_org_member(org_id));
create policy "run_of_show_items org member update" on public.run_of_show_items
    for update using (private.is_org_member(org_id));
create policy "run_of_show_items org member delete" on public.run_of_show_items
    for delete using (private.is_org_member(org_id));

create trigger touch_run_of_show_items_updated_at
    before update on public.run_of_show_items
    for each row execute procedure extensions.moddatetime(updated_at);

-- ─── 2. event_snapshots ──────────────────────────────────────────────────────

create table if not exists public.event_snapshots (
    id          uuid primary key default gen_random_uuid(),
    org_id      uuid not null references public.orgs(id) on delete cascade,
    project_id  uuid not null references public.projects(id) on delete cascade,
    user_id     uuid not null references auth.users(id) on delete cascade,
    label       text not null,
    body        text,
    photo_url   text,
    latitude    double precision,
    longitude   double precision,
    pinned_at   timestamptz not null default now(),
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);

create index if not exists event_snapshots_project_idx
    on public.event_snapshots (project_id, pinned_at desc);
create index if not exists event_snapshots_user_idx
    on public.event_snapshots (user_id, pinned_at desc);

alter table public.event_snapshots enable row level security;

-- Field crew can only see their own snapshots; org admins/managers see all.
create policy "event_snapshots own select" on public.event_snapshots
    for select using (
        user_id = auth.uid()
        or private.has_org_role(org_id, array['owner', 'admin', 'manager'])
    );
create policy "event_snapshots own insert" on public.event_snapshots
    for insert with check (
        user_id = auth.uid()
        and private.is_org_member(org_id)
    );
create policy "event_snapshots own update" on public.event_snapshots
    for update using (user_id = auth.uid());
create policy "event_snapshots admin delete" on public.event_snapshots
    for delete using (
        user_id = auth.uid()
        or private.has_org_role(org_id, array['owner', 'admin'])
    );

create trigger touch_event_snapshots_updated_at
    before update on public.event_snapshots
    for each row execute procedure extensions.moddatetime(updated_at);

-- ─── 3. approval_requests ────────────────────────────────────────────────────

create type if not exists public.approval_request_entity_type as enum (
    'purchase_order', 'requisition', 'expense'
);

create type if not exists public.approval_request_state as enum (
    'pending', 'approved', 'rejected', 'withdrawn'
);

create table if not exists public.approval_requests (
    id                      uuid primary key default gen_random_uuid(),
    org_id                  uuid not null references public.orgs(id) on delete cascade,
    entity_type             public.approval_request_entity_type not null,
    entity_id               uuid not null,
    requested_by            uuid not null references auth.users(id) on delete cascade,
    approver_id             uuid references auth.users(id) on delete set null,
    approval_request_state  public.approval_request_state not null default 'pending',
    notes                   text,
    reviewer_notes          text,
    threshold_amount_cents  bigint,
    resolved_at             timestamptz,
    created_at              timestamptz not null default now(),
    updated_at              timestamptz not null default now()
);

create index if not exists approval_requests_org_state_idx
    on public.approval_requests (org_id, approval_request_state);
create index if not exists approval_requests_entity_idx
    on public.approval_requests (entity_type, entity_id);
create index if not exists approval_requests_approver_idx
    on public.approval_requests (approver_id, approval_request_state);

alter table public.approval_requests enable row level security;

create policy "approval_requests org member select" on public.approval_requests
    for select using (private.is_org_member(org_id));
create policy "approval_requests org member insert" on public.approval_requests
    for insert with check (private.is_org_member(org_id));
-- Only admins/managers may resolve approvals.
create policy "approval_requests admin update" on public.approval_requests
    for update using (
        private.has_org_role(org_id, array['owner', 'admin', 'manager'])
    );

create trigger touch_approval_requests_updated_at
    before update on public.approval_requests
    for each row execute procedure extensions.moddatetime(updated_at);

-- ─── 4. schedule_share_tokens ────────────────────────────────────────────────

create table if not exists public.schedule_share_tokens (
    id          uuid primary key default gen_random_uuid(),
    org_id      uuid not null references public.orgs(id) on delete cascade,
    project_id  uuid not null references public.projects(id) on delete cascade,
    token       text not null unique,
    created_by  uuid not null references auth.users(id) on delete cascade,
    expires_at  timestamptz,
    revoked_at  timestamptz,
    view_count  int not null default 0,
    created_at  timestamptz not null default now()
);

create index if not exists schedule_share_tokens_token_idx
    on public.schedule_share_tokens (token) where revoked_at is null;
create index if not exists schedule_share_tokens_project_idx
    on public.schedule_share_tokens (project_id);

alter table public.schedule_share_tokens enable row level security;

create policy "schedule_share_tokens org member select" on public.schedule_share_tokens
    for select using (private.is_org_member(org_id));
create policy "schedule_share_tokens org member insert" on public.schedule_share_tokens
    for insert with check (private.is_org_member(org_id));
create policy "schedule_share_tokens org member update" on public.schedule_share_tokens
    for update using (private.is_org_member(org_id));

-- Public read policy: anon callers can read a token row to validate it
-- (view count increment happens via service-role in the API, not client RLS).
create policy "schedule_share_tokens public token read" on public.schedule_share_tokens
    for select using (
        revoked_at is null
        and (expires_at is null or expires_at > now())
    );

-- ─── 5. project_debriefs ─────────────────────────────────────────────────────

create table if not exists public.project_debriefs (
    id              uuid primary key default gen_random_uuid(),
    org_id          uuid not null references public.orgs(id) on delete cascade,
    project_id      uuid not null references public.projects(id) on delete cascade,
    generated_by    uuid references auth.users(id) on delete set null,
    model           text not null default 'claude-sonnet-4-6',
    -- body is the markdown AI-generated report
    body            text,
    highlights      jsonb default '[]'::jsonb,
    generated_at    timestamptz,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now(),
    unique (project_id)
);

create index if not exists project_debriefs_project_idx
    on public.project_debriefs (project_id);

alter table public.project_debriefs enable row level security;

create policy "project_debriefs org member select" on public.project_debriefs
    for select using (private.is_org_member(org_id));
create policy "project_debriefs org member insert" on public.project_debriefs
    for insert with check (private.is_org_member(org_id));
create policy "project_debriefs org member update" on public.project_debriefs
    for update using (private.is_org_member(org_id));

create trigger touch_project_debriefs_updated_at
    before update on public.project_debriefs
    for each row execute procedure extensions.moddatetime(updated_at);

-- ─── 6. open_call_submissions match score ────────────────────────────────────

alter table public.open_call_submissions
    add column if not exists match_score        smallint check (match_score between 0 and 100),
    add column if not exists match_rationale    text,
    add column if not exists match_scored_at    timestamptz;

create index if not exists open_call_submissions_match_score_idx
    on public.open_call_submissions (open_call_id, match_score desc)
    where match_score is not null;
