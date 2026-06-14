-- CV10 — Sprint management (sprints + stories + burndown).
--
-- Closes the kit-coverage gap CV10: agile sprint planning never existed in
-- the platform. Three org-scoped tables mirror the standard Scrum trio:
--
--   - sprints            : a time-box (planned → active → completed),
--                          optionally tied to a project.
--   - sprint_stories     : backlog items inside a sprint, each with a point
--                          estimate and a kanban state (todo → in_progress →
--                          done).
--   - burndown_snapshots : one daily reading of remaining_points per sprint,
--                          feeding the burndown chart + velocity rollups.
--
-- LDP naming discipline: NO bare `status`. Every lifecycle column is a NAMED
-- postgres enum:
--   `sprint_state` (planned/active/completed) — the sprint's cyclical arc.
--   `story_state`  (todo/in_progress/done)    — the story's kanban arc.
-- `points` / `remaining_points` are plain measures, not lifecycles, so they
-- keep descriptive names.
--
-- Standard org-scoping: org_id FK → public.orgs, RLS enabled,
-- private.is_org_member select + private.has_org_role write, deleted_at
-- soft-delete, public.touch_updated_at() trigger. DO NOT APPLY by hand —
-- this is a PENDING migration; promote + apply via the Supabase MCP, then
-- regenerate database.types.ts and drop the LooseSupabase casts.

-- ── enum types ──────────────────────────────────────────────────────────
do $$ begin
  create type public.sprint_state as enum ('planned', 'active', 'completed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.story_state as enum ('todo', 'in_progress', 'done');
exception when duplicate_object then null; end $$;

-- ── sprints ─────────────────────────────────────────────────────────────
create table if not exists public.sprints (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  name text not null,
  starts_on date,
  ends_on date,
  sprint_state public.sprint_state not null default 'planned',
  goal text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint sprints_dates_ordered check (
    starts_on is null or ends_on is null or ends_on >= starts_on
  )
);

create index if not exists sprints_org_project_idx
  on public.sprints (org_id, project_id, starts_on desc)
  where deleted_at is null;

create index if not exists sprints_org_state_idx
  on public.sprints (org_id, sprint_state)
  where deleted_at is null;

alter table public.sprints enable row level security;

create policy sprints_org_select
  on public.sprints for select
  using (private.is_org_member(org_id));

create policy sprints_org_write
  on public.sprints
  using (private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller', 'collaborator']))
  with check (private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller', 'collaborator']));

create trigger sprints_touch_updated_at
  before update on public.sprints
  for each row execute function public.touch_updated_at();

-- ── sprint_stories ──────────────────────────────────────────────────────
create table if not exists public.sprint_stories (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  sprint_id uuid not null references public.sprints(id) on delete cascade,
  title text not null,
  points integer not null default 0 check (points >= 0),
  story_state public.story_state not null default 'todo',
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists sprint_stories_sprint_idx
  on public.sprint_stories (org_id, sprint_id, created_at)
  where deleted_at is null;

create index if not exists sprint_stories_state_idx
  on public.sprint_stories (org_id, sprint_id, story_state)
  where deleted_at is null;

alter table public.sprint_stories enable row level security;

create policy sprint_stories_org_select
  on public.sprint_stories for select
  using (private.is_org_member(org_id));

create policy sprint_stories_org_write
  on public.sprint_stories
  using (private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller', 'collaborator']))
  with check (private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller', 'collaborator']));

create trigger sprint_stories_touch_updated_at
  before update on public.sprint_stories
  for each row execute function public.touch_updated_at();

-- ── burndown_snapshots ──────────────────────────────────────────────────
-- One reading per sprint per day. (org_id, sprint_id, snapshot_on) unique so
-- a re-snapshot on the same day upserts rather than duplicates.
create table if not exists public.burndown_snapshots (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  sprint_id uuid not null references public.sprints(id) on delete cascade,
  snapshot_on date not null default current_date,
  remaining_points integer not null default 0 check (remaining_points >= 0),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create unique index if not exists burndown_snapshots_sprint_day_uniq
  on public.burndown_snapshots (org_id, sprint_id, snapshot_on)
  where deleted_at is null;

create index if not exists burndown_snapshots_sprint_idx
  on public.burndown_snapshots (org_id, sprint_id, snapshot_on)
  where deleted_at is null;

alter table public.burndown_snapshots enable row level security;

create policy burndown_snapshots_org_select
  on public.burndown_snapshots for select
  using (private.is_org_member(org_id));

create policy burndown_snapshots_org_write
  on public.burndown_snapshots
  using (private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller', 'collaborator']))
  with check (private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller', 'collaborator']));

create trigger burndown_snapshots_touch_updated_at
  before update on public.burndown_snapshots
  for each row execute function public.touch_updated_at();
