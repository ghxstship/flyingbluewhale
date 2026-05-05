-- flyingbluewhale · SSOT triggers (updated_at + audit_log + request_id)
-- Ensures every mutable business table:
--   1. Has updated_at maintained by trigger (no app-code drift)
--   2. Writes to audit_log on INSERT/UPDATE/DELETE (SSOT for "who did what")
--   3. Captures request_id via set_config when set by middleware
--
-- Safe to re-run: all CREATE OR REPLACE / IF NOT EXISTS.

-- ============================================================================
-- 1. Request ID helper — middleware sets per-request `app.request_id` via SET LOCAL
-- ============================================================================

create or replace function current_request_id() returns text
language plpgsql stable as $$
begin
  return coalesce(current_setting('app.request_id', true), '');
end;
$$;

-- ============================================================================
-- 2. updated_at column + trigger — add where missing, attach everywhere
-- ============================================================================

create or replace function tg_set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Add updated_at column where it doesn't exist, then attach trigger
do $$
declare
  r record;
begin
  for r in
    select c.table_schema, c.table_name
    from information_schema.tables c
    where c.table_schema = 'public'
      and c.table_type = 'BASE TABLE'
      -- exclude ledger/append-only tables
      and c.table_name not in (
        'audit_log',
        'ticket_scans',
        'deliverable_history',
        'ai_messages'
      )
  loop
    -- add column if missing
    execute format($ddl$
      alter table %I.%I
        add column if not exists updated_at timestamptz not null default now()
    $ddl$, r.table_schema, r.table_name);

    -- drop + recreate trigger
    execute format('drop trigger if exists set_updated_at on %I.%I', r.table_schema, r.table_name);
    execute format($ddl$
      create trigger set_updated_at
        before update on %I.%I
        for each row execute function tg_set_updated_at()
    $ddl$, r.table_schema, r.table_name);
  end loop;
end;
$$;

-- ============================================================================
-- 3. audit_log: extend schema + add trigger-based writer
-- ============================================================================

-- Extend audit_log with structured columns (keep existing for compat)
alter table audit_log
  add column if not exists operation text,             -- 'insert' | 'update' | 'delete'
  add column if not exists before jsonb,
  add column if not exists after jsonb,
  add column if not exists request_id text,
  add column if not exists actor_email text;

-- Partial indexes for common queries
create index if not exists audit_log_target_idx
  on audit_log(target_table, target_id) where target_id is not null;
create index if not exists audit_log_at_idx
  on audit_log(org_id, at desc);

-- Generic audit writer. Reads:
--   - auth.uid() for actor_id (via users.id = auth.users.id)
--   - current_request_id() for request correlation
--   - TG_TABLE_NAME / TG_OP for target metadata
create or replace function tg_audit_log() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_org_id uuid;
  v_row_id uuid;
  v_actor uuid;
  v_email text;
begin
  -- Extract org_id from the row (all tenant tables have it)
  if tg_op = 'DELETE' then
    v_org_id := (to_jsonb(old) ->> 'org_id')::uuid;
    v_row_id := (to_jsonb(old) ->> 'id')::uuid;
  else
    v_org_id := (to_jsonb(new) ->> 'org_id')::uuid;
    v_row_id := (to_jsonb(new) ->> 'id')::uuid;
  end if;

  if v_org_id is null then
    -- Non-tenant table — skip audit (shouldn't be attached anyway)
    return case when tg_op = 'DELETE' then old else new end;
  end if;

  v_actor := auth.uid();
  select email into v_email from auth.users where id = v_actor;

  insert into audit_log (
    org_id, actor_id, actor_email, action, operation,
    target_table, target_id, before, after, request_id, metadata
  ) values (
    v_org_id,
    v_actor,
    v_email,
    tg_table_name || '.' || lower(tg_op),
    lower(tg_op),
    tg_table_name,
    v_row_id,
    case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) end,
    current_request_id(),
    jsonb_build_object('schema', tg_table_schema)
  );

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

-- Attach audit trigger to every tenant-scoped business table
-- (any table with an org_id column, excluding audit_log itself)
do $$
declare
  r record;
begin
  for r in
    select c.table_schema, c.table_name
    from information_schema.tables c
    join information_schema.columns col
      on col.table_schema = c.table_schema
     and col.table_name = c.table_name
     and col.column_name = 'org_id'
    where c.table_schema = 'public'
      and c.table_type = 'BASE TABLE'
      and c.table_name <> 'audit_log'
  loop
    execute format('drop trigger if exists audit_rows on %I.%I', r.table_schema, r.table_name);
    execute format($ddl$
      create trigger audit_rows
        after insert or update or delete on %I.%I
        for each row execute function tg_audit_log()
    $ddl$, r.table_schema, r.table_name);
  end loop;
end;
$$;

-- ============================================================================
-- 4. Missing FK indexes — close the gap for join performance
-- ============================================================================

do $$
declare
  r record;
begin
  for r in
    select
      tc.table_schema,
      tc.table_name,
      kcu.column_name,
      format('idx_%s_%s', tc.table_name, kcu.column_name) as idx_name
    from information_schema.table_constraints tc
    join information_schema.key_column_usage kcu
      on tc.constraint_name = kcu.constraint_name
     and tc.table_schema = kcu.table_schema
    where tc.constraint_type = 'FOREIGN KEY'
      and tc.table_schema = 'public'
      and not exists (
        select 1
        from pg_indexes i
        where i.schemaname = tc.table_schema
          and i.tablename = tc.table_name
          and i.indexdef ilike format('%%(%s%%', kcu.column_name)
      )
  loop
    execute format(
      'create index if not exists %I on %I.%I (%I)',
      r.idx_name, r.table_schema, r.table_name, r.column_name
    );
  end loop;
end;
$$;

-- ============================================================================
-- 5. Soft-delete column — add deleted_at where missing for auditable resources
-- ============================================================================

do $$
declare
  r record;
begin
  for r in
    select table_schema, table_name from information_schema.tables
    where table_schema = 'public'
      and table_type = 'BASE TABLE'
      and table_name in (
        'projects','clients','vendors','invoices','purchase_orders',
        'equipment','proposals','event_guides','deliverables','notifications'
      )
  loop
    execute format(
      'alter table %I.%I add column if not exists deleted_at timestamptz',
      r.table_schema, r.table_name
    );
  end loop;
end;
$$;

-- ============================================================================
-- 6. User preferences table — SSOT for per-user UI state (density, saved views, consent)
-- ============================================================================

create table if not exists user_preferences (
  user_id      uuid primary key references users(id) on delete cascade,
  theme        text check (theme in ('light','dark','system')) default 'system',
  density      text check (density in ('comfortable','compact')) default 'comfortable',
  locale       text default 'en',
  timezone     text default 'UTC',
  consent      jsonb not null default '{"essential":true,"analytics":false,"marketing":false}'::jsonb,
  table_views  jsonb not null default '{}'::jsonb,  -- keyed by table name
  last_org_id  uuid references orgs(id),
  updated_at   timestamptz not null default now()
);

drop trigger if exists set_updated_at on user_preferences;
create trigger set_updated_at before update on user_preferences
  for each row execute function tg_set_updated_at();

alter table user_preferences enable row level security;

drop policy if exists user_preferences_own_rw on user_preferences;
create policy user_preferences_own_rw on user_preferences
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ============================================================================
-- 7. Rate-limit configuration table — SSOT for per-org overrides
-- ============================================================================

create table if not exists rate_limit_overrides (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references orgs(id) on delete cascade,
  bucket       text not null check (bucket in ('ai','scan','webhook','auth')),
  limit_count  int not null check (limit_count > 0),
  window_ms    int not null check (window_ms > 0),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (org_id, bucket)
);

drop trigger if exists set_updated_at on rate_limit_overrides;
create trigger set_updated_at before update on rate_limit_overrides
  for each row execute function tg_set_updated_at();

alter table rate_limit_overrides enable row level security;

drop policy if exists rate_limit_overrides_read on rate_limit_overrides;
create policy rate_limit_overrides_read on rate_limit_overrides
  for select using (is_org_member(org_id));

drop policy if exists rate_limit_overrides_write on rate_limit_overrides;
create policy rate_limit_overrides_write on rate_limit_overrides
  for all using (has_org_role(org_id, array['owner','admin']))
  with check (has_org_role(org_id, array['owner','admin']));

comment on function tg_audit_log is 'SSOT writer for audit_log. Attached to every tenant table. Do not log to audit_log from application code.';
comment on function tg_set_updated_at is 'Maintains updated_at on every business table. Do not set updated_at from application code.';
