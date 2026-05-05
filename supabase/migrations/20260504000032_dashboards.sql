-- ============================================================================
-- dashboards — composable dashboard canvas (Phase 3.6c of SmartSuite parity)
-- ============================================================================
-- A dashboard row owns a 12-column CSS grid `layout` whose `widgets[]` array
-- holds heterogeneous widget configs (KPI, Chart, Saved-View embed, Markdown).
-- Mirrors the SmartSuite "Dashboard creation" flow:
--   https://help.smartsuite.com/en/articles/5047123-how-to-create-a-dashboard
--
-- RLS shape mirrors `view_configs` (P3.1) — same `view_scope` enum is reused
-- so dashboards inherit the private/org/public visibility model.
-- ============================================================================

-- ── Table ──────────────────────────────────────────────────────────────────
create table if not exists dashboards (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references orgs(id) on delete cascade,
  name        text not null,
  description text,
  -- Default layout: 12 columns, 16px gap, no widgets. Caller (dashboard
  -- editor) writes the same JSON shape that <DashboardCanvas> consumes:
  --   { cols: number, gap: number, widgets: WidgetBase[] }
  layout      jsonb not null default '{"cols":12,"gap":16,"widgets":[]}'::jsonb,
  scope       view_scope not null default 'private',
  is_default  boolean not null default false,
  created_by  uuid references users(id) on delete set null,
  updated_by  uuid references users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists dashboards_org_idx on dashboards(org_id);
create index if not exists dashboards_creator_idx on dashboards(created_by) where scope = 'private';

alter table dashboards enable row level security;

-- ── RLS policies (idempotent) ──────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'dashboards' and policyname = 'dashboards_select') then
    create policy "dashboards_select" on dashboards for select
      using (
        is_org_member(org_id)
        and (
          scope = 'org'
          or (scope = 'private' and created_by = auth.uid())
          or scope = 'public'
        )
      );
  end if;

  if not exists (select 1 from pg_policies where tablename = 'dashboards' and policyname = 'dashboards_insert') then
    create policy "dashboards_insert" on dashboards for insert
      with check (
        is_org_member(org_id)
        and (
          scope = 'private'
          or (scope in ('org','public') and has_org_role(org_id, array['owner','admin','manager']))
        )
      );
  end if;

  if not exists (select 1 from pg_policies where tablename = 'dashboards' and policyname = 'dashboards_update_own') then
    create policy "dashboards_update_own" on dashboards for update
      using (
        is_org_member(org_id)
        and (created_by = auth.uid() or has_org_role(org_id, array['owner','admin']))
      );
  end if;

  if not exists (select 1 from pg_policies where tablename = 'dashboards' and policyname = 'dashboards_delete_own') then
    create policy "dashboards_delete_own" on dashboards for delete
      using (
        is_org_member(org_id)
        and (created_by = auth.uid() or has_org_role(org_id, array['owner','admin']))
      );
  end if;
end $$;

-- ── updated_at trigger ────────────────────────────────────────────────────
create or replace function tg_dashboards_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists dashboards_updated_at_tg on dashboards;
create trigger dashboards_updated_at_tg
  before update on dashboards
  for each row execute function tg_dashboards_updated_at();
