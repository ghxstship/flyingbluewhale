-- ============================================================================
-- view_configs — first-class saved views (private | org | public)
-- ============================================================================
-- Phase 3.1 of the SmartSuite parity roadmap. Promotes the per-user
-- `user_preferences.table_views[tableId]` JSONB blob into a table with
-- visibility scope, ownership, and named addressability.
--
-- Per https://help.smartsuite.com/en/articles/6493633-creating-a-saved-view
--
-- Scope semantics:
--   private — only `created_by` sees it; appears under "My Views"
--   org     — every member of `org_id` sees it; appears under "Shared"
--   public  — accessible via /share/[token] (token issued from share_links;
--             view_configs row only stores the scope hint)
--
-- The existing `user_preferences.table_views[tableId]` JSON write path is
-- preserved as the "implicit / unsaved working copy" between named views;
-- this table is a NEW layer on top, not a replacement.
-- ============================================================================

-- ── Enums ──────────────────────────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_type where typname = 'view_scope') then
    create type view_scope as enum ('private', 'org', 'public');
  end if;
  if not exists (select 1 from pg_type where typname = 'view_type') then
    create type view_type as enum ('grid', 'kanban', 'calendar', 'timeline', 'chart', 'map', 'gantt', 'card', 'form');
  end if;
end $$;

-- ── Table ──────────────────────────────────────────────────────────────────
create table if not exists view_configs (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references orgs(id) on delete cascade,
  table_id    text not null,                        -- the DataTable's tableId (auto-derived from pathname)
  type        view_type not null default 'grid',
  scope       view_scope not null default 'private',
  name        text not null,
  description text,
  config      jsonb not null default '{}'::jsonb,    -- the SavedView shape: query, sort, filters, hidden, pinned, order, groupBy, collapsed, density, spotlight rules, viewConfig.
  is_default  boolean not null default false,
  is_locked   boolean not null default false,        -- when true, only owner/admins can edit
  created_by  uuid references users(id) on delete set null,
  updated_by  uuid references users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (org_id, table_id, scope, name)             -- per-table-per-scope name uniqueness
);

create index if not exists view_configs_org_table_idx on view_configs(org_id, table_id);
create index if not exists view_configs_creator_idx on view_configs(created_by) where scope = 'private';

alter table view_configs enable row level security;

-- ── RLS policies (idempotent gated creation) ──────────────────────────────
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'view_configs' and policyname = 'view_configs_select') then
    create policy "view_configs_select" on view_configs for select
      using (
        is_org_member(org_id)
        and (scope = 'org' or (scope = 'private' and created_by = auth.uid()) or scope = 'public')
      );
  end if;

  if not exists (select 1 from pg_policies where tablename = 'view_configs' and policyname = 'view_configs_insert') then
    create policy "view_configs_insert" on view_configs for insert
      with check (
        is_org_member(org_id)
        and (
          scope = 'private'
          or (scope in ('org','public') and has_org_role(org_id, array['owner','admin','manager']))
        )
      );
  end if;

  if not exists (select 1 from pg_policies where tablename = 'view_configs' and policyname = 'view_configs_update_own') then
    create policy "view_configs_update_own" on view_configs for update
      using (
        is_org_member(org_id)
        and (created_by = auth.uid() or has_org_role(org_id, array['owner','admin']))
        and (is_locked = false or has_org_role(org_id, array['owner','admin']))
      );
  end if;

  if not exists (select 1 from pg_policies where tablename = 'view_configs' and policyname = 'view_configs_delete_own') then
    create policy "view_configs_delete_own" on view_configs for delete
      using (
        is_org_member(org_id)
        and (created_by = auth.uid() or has_org_role(org_id, array['owner','admin']))
      );
  end if;
end $$;

-- ── updated_at trigger ────────────────────────────────────────────────────
create or replace function tg_view_configs_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists view_configs_updated_at_tg on view_configs;
create trigger view_configs_updated_at_tg
  before update on view_configs
  for each row execute function tg_view_configs_updated_at();
