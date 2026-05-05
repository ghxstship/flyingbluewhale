-- ============================================================================
-- Slack integration (Phase 5.3)
-- ============================================================================
-- Per-org Slack workspace install (OAuth v2), event-pattern → channel
-- mappings, and per-user Slack identity links so notify() can deliver to
-- DMs. Native — no Zapier in the loop.
--
-- Three tables:
--   slack_workspaces        — one row per org × Slack team
--   slack_channel_mappings  — event glob → channel routing (M:N)
--   slack_user_links        — LYTEHAUS user → Slack user mapping
--
-- All write paths go through the service-role client during OAuth callback;
-- direct CRUD from the settings UI is RLS-gated to org admins (workspace +
-- mappings) or self (user links).
--
-- Bot token storage: TODO encrypt at rest. We rely on RLS + service-role
-- isolation for now; rotate `SLACK_CLIENT_SECRET` if a leak is suspected.

create table if not exists slack_workspaces (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references orgs(id) on delete cascade,
  /** Slack team ID (T-prefixed). */
  team_id         text not null,
  team_name       text not null,
  /** Bot user OAuth token (xoxb-...). TODO: encrypt at rest with pgcrypto. */
  bot_token       text not null,
  bot_user_id     text not null,
  /** Workspace icon URL (T_88 etc.). */
  icon_url        text,
  installed_by    uuid references users(id) on delete set null,
  enabled         boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (org_id),
  unique (team_id)
);

comment on table slack_workspaces is 'Per-org Slack workspace install (OAuth v2). One per org, one per Slack team.';
comment on column slack_workspaces.bot_token is 'Bot xoxb- token. TODO encrypt at rest (pgcrypto). RLS + service-role isolation today.';
comment on column slack_workspaces.enabled is 'Set false on app_uninstalled event so notify() skips this workspace.';

-- Channel mappings: send notifications matching X event-type pattern to channel Y.
create table if not exists slack_channel_mappings (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references slack_workspaces(id) on delete cascade,
  /** Slack channel ID (C-prefixed). */
  channel_id    text not null,
  channel_name  text not null,
  /** Event-type glob, e.g. 'incident.*' or 'invoice.paid'. */
  event_pattern text not null,
  /** Optional project filter — null = all projects. */
  project_id    uuid references projects(id) on delete cascade,
  enabled       boolean not null default true,
  created_at    timestamptz not null default now()
);

create index if not exists slack_channel_mappings_workspace_idx
  on slack_channel_mappings(workspace_id) where enabled = true;

comment on table slack_channel_mappings is 'Routes notify() events to Slack channels by event-type glob.';
comment on column slack_channel_mappings.event_pattern is 'Glob: exact match, prefix.* wildcard, or *. Matched in app code.';

-- User → Slack user mapping: which Slack user ID for which LYTEHAUS user.
-- Set during /lytehaus link command, OAuth user-flow, or "Auto-detect" via
-- users.lookupByEmail.
create table if not exists slack_user_links (
  user_id       uuid primary key references users(id) on delete cascade,
  workspace_id  uuid not null references slack_workspaces(id) on delete cascade,
  slack_user_id text not null,
  linked_at     timestamptz not null default now()
);

create index if not exists slack_user_links_workspace_idx
  on slack_user_links(workspace_id);

comment on table slack_user_links is 'LYTEHAUS user_id → Slack user_id mapping for DM delivery. One row per LYTEHAUS user.';

alter table slack_workspaces enable row level security;
alter table slack_channel_mappings enable row level security;
alter table slack_user_links enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'slack_workspaces' and policyname = 'slack_admin') then
    create policy "slack_admin" on slack_workspaces for all
      using (has_org_role(org_id, array['owner','admin']))
      with check (has_org_role(org_id, array['owner','admin']));
  end if;
  if not exists (select 1 from pg_policies where tablename = 'slack_channel_mappings' and policyname = 'slack_chan_admin') then
    create policy "slack_chan_admin" on slack_channel_mappings for all
      using (workspace_id in (select id from slack_workspaces where has_org_role(org_id, array['owner','admin','manager'])))
      with check (workspace_id in (select id from slack_workspaces where has_org_role(org_id, array['owner','admin','manager'])));
  end if;
  if not exists (select 1 from pg_policies where tablename = 'slack_user_links' and policyname = 'slack_user_self') then
    create policy "slack_user_self" on slack_user_links for all
      using (user_id = auth.uid())
      with check (user_id = auth.uid());
  end if;
end $$;
