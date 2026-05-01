-- Restore SSOT invariants that drifted after migration #10.
--
-- Migration 20260417_000010_ssot_triggers used DO loops to attach
-- `set_updated_at` and `audit_rows` triggers to existing tables. Tables
-- created in subsequent migrations (olympic_scope, settings_completion,
-- proposal_portal, offer_letters_3nf, itil_change, salvage_city_seed,
-- procore_parity, venue_lifecycle_artifacts) did not get the triggers
-- attached because the loop was one-time.
--
-- This migration rebuilds the SSOT discipline:
--   1. Adds `updated_at` to every public BASE TABLE that should have it
--   2. Re-attaches `set_updated_at` to every table with `updated_at`
--   3. Re-attaches `audit_rows` to every tenant table (org_id-bearing)
--      EXCEPT the audit_log itself (can't audit the auditor).
--
-- After this runs, INSERT/UPDATE/DELETE on every tenant table writes
-- to audit_log with before/after JSON, and UPDATE bumps updated_at.

------------------------------------------------------------------
-- 1. Add updated_at to entity tables that need it (idempotent)
------------------------------------------------------------------
alter table cost_codes                       add column if not exists updated_at timestamptz not null default now();
alter table conversations                    add column if not exists updated_at timestamptz not null default now();
alter table conversation_messages            add column if not exists updated_at timestamptz not null default now();
alter table daily_logs                       add column if not exists updated_at timestamptz not null default now();
alter table site_plans                       add column if not exists updated_at timestamptz not null default now();
alter table site_plan_revisions              add column if not exists updated_at timestamptz not null default now();
alter table inspections                      add column if not exists updated_at timestamptz not null default now();
alter table inspection_templates             add column if not exists updated_at timestamptz not null default now();
alter table rfis                             add column if not exists updated_at timestamptz not null default now();
alter table submittals                       add column if not exists updated_at timestamptz not null default now();
alter table punch_items                      add column if not exists updated_at timestamptz not null default now();
alter table punch_lists                      add column if not exists updated_at timestamptz not null default now();
alter table payment_applications             add column if not exists updated_at timestamptz not null default now();
alter table po_change_orders                 add column if not exists updated_at timestamptz not null default now();
alter table rfq_responses                    add column if not exists updated_at timestamptz not null default now();
alter table prequalification_questionnaires  add column if not exists updated_at timestamptz not null default now();
alter table vendor_prequalifications         add column if not exists updated_at timestamptz not null default now();
alter table safety_briefings                 add column if not exists updated_at timestamptz not null default now();
alter table work_order_broadcasts            add column if not exists updated_at timestamptz not null default now();

------------------------------------------------------------------
-- 2. Re-attach set_updated_at to every table with updated_at
------------------------------------------------------------------
do $$
declare r record;
begin
  for r in
    select c.table_schema, c.table_name
    from information_schema.tables c
    join information_schema.columns col
      on col.table_schema = c.table_schema
     and col.table_name   = c.table_name
     and col.column_name  = 'updated_at'
    where c.table_schema='public' and c.table_type='BASE TABLE'
  loop
    execute format('drop trigger if exists set_updated_at on %I.%I', r.table_schema, r.table_name);
    execute format($ddl$
      create trigger set_updated_at
        before update on %I.%I
        for each row execute function tg_set_updated_at()
    $ddl$, r.table_schema, r.table_name);
  end loop;
end $$;

------------------------------------------------------------------
-- 3. Re-attach audit_rows to every tenant table
------------------------------------------------------------------
do $$
declare r record;
begin
  for r in
    select c.table_schema, c.table_name
    from information_schema.tables c
    join information_schema.columns col
      on col.table_schema = c.table_schema
     and col.table_name   = c.table_name
     and col.column_name  = 'org_id'
    where c.table_schema='public' and c.table_type='BASE TABLE'
      and c.table_name <> 'audit_log'
  loop
    execute format('drop trigger if exists audit_rows on %I.%I', r.table_schema, r.table_name);
    execute format($ddl$
      create trigger audit_rows
        after insert or update or delete on %I.%I
        for each row execute function tg_audit_log()
    $ddl$, r.table_schema, r.table_name);
  end loop;
end $$;

------------------------------------------------------------------
-- 4. Sanity check — fail loudly if anything is still missing
------------------------------------------------------------------
do $$
declare missing_audit int;
begin
  select count(*) into missing_audit
  from information_schema.tables t
  join information_schema.columns c
    on c.table_schema=t.table_schema and c.table_name=t.table_name and c.column_name='org_id'
  where t.table_schema='public' and t.table_type='BASE TABLE'
    and t.table_name <> 'audit_log'
    and not exists (
      select 1 from information_schema.triggers tr
      where tr.event_object_table=t.table_name and tr.trigger_name='audit_rows'
    );
  if missing_audit > 0 then
    raise exception 'SSOT restore failed: % tenant tables still missing audit_rows', missing_audit;
  end if;
end $$;
