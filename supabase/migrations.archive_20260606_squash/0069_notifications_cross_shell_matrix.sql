-- ADR-0010 Move 1 — promote `public.notifications` from "ATLVS in-app
-- inbox" to the canonical user event log across all three shells
-- (ATLVS console, GVTEWAY portal, COMPVSS mobile).
--
-- The chrome bell shipped in ADR-0007 needs one source of truth to
-- read from; without these columns the bell can only render the
-- caller's events at "scope=all" granularity. Adding `scope`,
-- `project_id`, and `org_id` lets shells filter to scope-relevant
-- events without per-shell special-casing.

-- Add shell + scope columns. All default to NULL or 'all' so existing
-- rows stay backwards-compatible — the bell's default query is
-- `scope IN ('all', :currentShell)` which picks up legacy rows
-- unconditionally.
alter table public.notifications
  add column if not exists scope text not null default 'all'
    check (scope in ('platform', 'portal', 'mobile', 'all')),
  add column if not exists project_id uuid references public.projects(id) on delete cascade,
  add column if not exists org_id uuid references public.orgs(id) on delete cascade;

comment on column public.notifications.scope is
  'ADR-0010: which shell''s bell surfaces this notification. ''all'' = every shell; ''platform''/''portal''/''mobile'' = scoped to that shell.';
comment on column public.notifications.project_id is
  'ADR-0010: optional project scope. The portal bell filters here so a /p/[slug] visit only shows that project''s notifications.';
comment on column public.notifications.org_id is
  'ADR-0010: optional org scope. The ATLVS bell filters here so multi-org users only see the active org''s notifications.';

-- Bell popover query pattern: unread for caller, newest first.
-- Covers /me/notifications and the chrome bell's recent-rows fetch.
create index if not exists notifications_user_recent_idx
  on public.notifications (user_id, read_at, created_at desc);

-- Per-shell filter accelerator. With default 'all' + filter
-- `scope IN ('all', :shell)` the planner uses this for predicate
-- pushdown on heavy notifications producers (announcements, kudos).
create index if not exists notifications_user_scope_idx
  on public.notifications (user_id, scope);

-- Portal-scope query pattern: bell on /p/[slug] filters by project.
create index if not exists notifications_user_project_idx
  on public.notifications (user_id, project_id)
  where project_id is not null;
