-- ============================================================================
-- Teams + record_grants — SmartSuite-style team permissions + record-level roles
-- ============================================================================
-- Phase 5.1 of the SmartSuite parity roadmap (recommendations #8 + #9).
-- Per https://help.smartsuite.com/en/articles/4793454-introduction-to-teams
-- and https://help.smartsuite.com/en/articles/4770333-managing-solution-permissions
--
-- Three new primitives:
--   teams         — named, sluggable groups inside an org. `@team-<slug>`
--                   mentions resolve here. Max 100 per org by convention
--                   (not enforced at DB layer).
--   team_members  — user ↔ team join with intra-team admin/member role.
--   record_grants — polymorphic (resource_table, resource_id) → principal
--                   (user OR team) → record_role. Highest-priority role wins.
--
-- record_role enum is declared with implicit numeric ordering matching the
-- SmartSuite priority ladder so `max(role)` returns the highest grant:
--   viewer < commenter < assignee < contributor < editor < full
--
-- This migration layers BELOW existing org-admin bypass — owners/admins still
-- pass every RLS check via has_org_role(...). record_grants is opt-in;
-- downstream tables that want to honor record-level grants must update their
-- own RLS policies to call can_record(...).
--
-- Idempotent: re-running this migration is a no-op.
-- ============================================================================

-- ── Enum ────────────────────────────────────────────────────────────────────
do $$ begin
  if not exists (select 1 from pg_type where typname = 'record_role') then
    -- Order matters: Postgres enums sort by declaration order, so max()
    -- returns the highest-priority role granted. Lowest first.
    create type record_role as enum (
      'viewer',
      'commenter',
      'assignee',
      'contributor',
      'editor',
      'full'
    );
  end if;
end $$;

-- ── teams ───────────────────────────────────────────────────────────────────
create table if not exists teams (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references orgs(id) on delete cascade,
  -- Slug is the @-mention handle, e.g. `@team-prod`. Lowercase, hyphenated.
  slug        text not null,
  name        text not null,
  description text,
  -- Optional avatar URL for the directory + member chips.
  avatar_url  text,
  -- Owner is the team's primary admin; defaults to creator. Nulled on user
  -- delete so the team survives.
  owner_id    uuid references users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (org_id, slug)
);

create index if not exists teams_org_idx on teams(org_id);

-- ── team_members ────────────────────────────────────────────────────────────
create table if not exists team_members (
  team_id     uuid not null references teams(id) on delete cascade,
  user_id     uuid not null references users(id) on delete cascade,
  -- Within a team: 'admin' can add/remove others; 'member' is rank-and-file.
  role        text not null default 'member' check (role in ('admin','member')),
  added_at    timestamptz not null default now(),
  primary key (team_id, user_id)
);

create index if not exists team_members_user_idx on team_members(user_id);

-- ── record_grants ───────────────────────────────────────────────────────────
create table if not exists record_grants (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references orgs(id) on delete cascade,
  resource_table  text not null,
  resource_id     uuid not null,
  -- Either user_id OR team_id is set, never both. Enforced via xor check.
  user_id         uuid references users(id) on delete cascade,
  team_id         uuid references teams(id) on delete cascade,
  role            record_role not null,
  -- Optional grant expiry. record_role_for() filters expired rows out.
  expires_at      timestamptz,
  granted_by      uuid references users(id) on delete set null,
  granted_at      timestamptz not null default now(),
  -- Exactly one of user_id / team_id is set.
  constraint record_grants_principal_xor check (
    (user_id is not null and team_id is null)
    or (user_id is null and team_id is not null)
  ),
  -- Idempotent: same (table, id, principal, role) only inserts once.
  unique (resource_table, resource_id, user_id, team_id, role)
);

create index if not exists record_grants_resource_idx
  on record_grants(resource_table, resource_id);
create index if not exists record_grants_user_idx
  on record_grants(user_id) where user_id is not null;
create index if not exists record_grants_team_idx
  on record_grants(team_id) where team_id is not null;

-- ── Helpers ─────────────────────────────────────────────────────────────────

-- Caller is a member of the given team.
create or replace function is_team_member(p_team_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists(
    select 1 from team_members
     where team_id = p_team_id and user_id = auth.uid()
  );
$$;

-- Set of team_ids the caller belongs to. Convenient inside SQL/RLS.
create or replace function auth_team_ids()
returns setof uuid
language sql
stable
security invoker
set search_path = public
as $$
  select team_id from team_members where user_id = auth.uid();
$$;

-- Highest-priority record_role granted to the caller on the given record.
-- Considers direct user grants AND team grants the caller belongs to.
-- Returns NULL when no grant exists. Excludes expired grants.
create or replace function record_role_for(p_table text, p_id uuid)
returns record_role
language sql
stable
security invoker
set search_path = public
as $$
  select max(role)
    from record_grants
   where resource_table = p_table
     and resource_id = p_id
     and (expires_at is null or expires_at > now())
     and (
       user_id = auth.uid()
       or team_id in (select team_id from team_members where user_id = auth.uid())
     );
$$;

-- Capability check on a record. Returns true when the caller has a sufficient
-- record-level role for the requested op. Org-admin bypass is NOT in this
-- helper — callers compose it with has_org_role(...) at the policy site.
--
-- Op semantics (SmartSuite-aligned):
--   read         — viewer+      (any grant can read)
--   comment      — commenter+
--   edit         — contributor+ (contributor edits own / assigned only)
--   edit_others  — editor+      (edit any record)
--   delete       — editor+
--   admin        — full only
create or replace function can_record(p_table text, p_id uuid, p_op text)
returns boolean
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_role record_role;
begin
  v_role := record_role_for(p_table, p_id);
  if v_role is null then return false; end if;
  return case p_op
    when 'read'        then v_role >= 'viewer'
    when 'comment'     then v_role >= 'commenter'
    when 'edit'        then v_role >= 'contributor'
    when 'edit_others' then v_role >= 'editor'
    when 'delete'      then v_role >= 'editor'
    when 'admin'       then v_role  = 'full'
    else false
  end;
end $$;

-- ── RLS ─────────────────────────────────────────────────────────────────────
alter table teams enable row level security;
alter table team_members enable row level security;
alter table record_grants enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'teams' and policyname = 'teams_select') then
    create policy "teams_select" on teams for select
      using (is_org_member(org_id));
  end if;

  if not exists (select 1 from pg_policies where tablename = 'teams' and policyname = 'teams_admin_write') then
    create policy "teams_admin_write" on teams for all
      using (has_org_role(org_id, array['owner','admin','manager']))
      with check (has_org_role(org_id, array['owner','admin','manager']));
  end if;

  if not exists (select 1 from pg_policies where tablename = 'team_members' and policyname = 'team_members_select') then
    create policy "team_members_select" on team_members for select
      using (
        team_id in (select id from teams where is_org_member(org_id))
      );
  end if;

  if not exists (select 1 from pg_policies where tablename = 'team_members' and policyname = 'team_members_admin_write') then
    create policy "team_members_admin_write" on team_members for all
      using (
        team_id in (
          select id from teams where has_org_role(org_id, array['owner','admin','manager'])
        )
        or exists (
          select 1 from team_members tm
           where tm.team_id = team_members.team_id
             and tm.user_id = auth.uid()
             and tm.role = 'admin'
        )
      )
      with check (
        team_id in (
          select id from teams where has_org_role(org_id, array['owner','admin','manager'])
        )
        or exists (
          select 1 from team_members tm
           where tm.team_id = team_members.team_id
             and tm.user_id = auth.uid()
             and tm.role = 'admin'
        )
      );
  end if;

  if not exists (select 1 from pg_policies where tablename = 'record_grants' and policyname = 'record_grants_select') then
    create policy "record_grants_select" on record_grants for select
      using (is_org_member(org_id));
  end if;

  if not exists (select 1 from pg_policies where tablename = 'record_grants' and policyname = 'record_grants_admin_write') then
    create policy "record_grants_admin_write" on record_grants for all
      using (has_org_role(org_id, array['owner','admin','manager']))
      with check (has_org_role(org_id, array['owner','admin','manager']));
  end if;
end $$;

-- ── Triggers ────────────────────────────────────────────────────────────────
create or replace function tg_teams_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists teams_updated_at_tg on teams;
create trigger teams_updated_at_tg
  before update on teams
  for each row execute function tg_teams_updated_at();

-- ── Comments ────────────────────────────────────────────────────────────────
comment on type record_role is
  'Per-record SmartSuite-style role. Order matters — max() returns the highest-priority grant. viewer < commenter < assignee < contributor < editor < full.';
comment on table teams is
  'Org-scoped teams. Slug is the @-mention handle (e.g. @team-prod).';
comment on table team_members is
  'Membership in a team. role = admin | member.';
comment on table record_grants is
  'Polymorphic record-level permission grant. Layers BELOW org-admin bypass.';
comment on function record_role_for(text, uuid) is
  'Returns the highest-priority record_role granted to auth.uid() on (table, id), or NULL. Excludes expired grants. Considers direct + team grants.';
comment on function can_record(text, uuid, text) is
  'Op-level capability check on a record. Ops: read | comment | edit | edit_others | delete | admin. Compose with has_org_role for org-admin bypass.';
