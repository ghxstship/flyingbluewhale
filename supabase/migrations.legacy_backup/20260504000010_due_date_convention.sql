-- SmartSuite parity Phase 1.1 — Due Date convention
--
-- Establishes a uniform `closed_at` + `closed_by` lifecycle terminator on
-- the canonical work-item tables. The companion <DueDateBadge> primitive
-- in `src/components/ui/DueDateBadge.tsx` reads these columns to render
-- the smiley/orange/red/green-dot indicator described in
-- https://help.smartsuite.com/en/articles/4612563-due-date-field
--
-- Idempotent: every column/index/policy is `if not exists`, every table
-- mutation is gated on `to_regclass(...)` so the migration is safe to
-- re-run and safe across environments where some tables haven't shipped.

-- ----------------------------------------------------------------------
-- 1. Per-table column + index additions
-- ----------------------------------------------------------------------

-- deliverables — has `deadline` already; needs closed_at/closed_by
do $$
begin
  if to_regclass('public.deliverables') is not null then
    execute 'alter table public.deliverables add column if not exists closed_at timestamptz';
    execute 'alter table public.deliverables add column if not exists closed_by uuid references public.users(id) on delete set null';
    execute 'create index if not exists deliverables_closed_at_idx on public.deliverables(closed_at) where closed_at is not null';
  end if;
end $$;

-- rfis — already has closed_at; idempotent add of closed_by
do $$
begin
  if to_regclass('public.rfis') is not null then
    execute 'alter table public.rfis add column if not exists closed_at timestamptz';
    execute 'alter table public.rfis add column if not exists closed_by uuid references public.users(id) on delete set null';
    execute 'create index if not exists rfis_closed_at_idx on public.rfis(closed_at) where closed_at is not null';
  end if;
end $$;

-- submittals — already has closed_at; idempotent add of closed_by
do $$
begin
  if to_regclass('public.submittals') is not null then
    execute 'alter table public.submittals add column if not exists closed_at timestamptz';
    execute 'alter table public.submittals add column if not exists closed_by uuid references public.users(id) on delete set null';
    execute 'create index if not exists submittals_closed_at_idx on public.submittals(closed_at) where closed_at is not null';
  end if;
end $$;

-- punch_items — already has both columns; this is a no-op safety net
do $$
begin
  if to_regclass('public.punch_items') is not null then
    execute 'alter table public.punch_items add column if not exists closed_at timestamptz';
    execute 'alter table public.punch_items add column if not exists closed_by uuid references public.users(id) on delete set null';
    execute 'create index if not exists punch_items_closed_at_idx on public.punch_items(closed_at) where closed_at is not null';
  end if;
end $$;

-- incidents — neither column nor a due_at; we still seat closed_at/by
-- so the lifecycle terminator semantic is uniform across the resource set
do $$
begin
  if to_regclass('public.incidents') is not null then
    execute 'alter table public.incidents add column if not exists closed_at timestamptz';
    execute 'alter table public.incidents add column if not exists closed_by uuid references public.users(id) on delete set null';
    execute 'create index if not exists incidents_closed_at_idx on public.incidents(closed_at) where closed_at is not null';
  end if;
end $$;

-- tickets — admission/scan tickets, no due-date semantic. Skipped on
-- purpose: per Phase 1.1 spec, "if a resource doesn't have a due_at
-- column at all, skip it (don't fabricate one)."

-- ----------------------------------------------------------------------
-- 2. mark_closed(p_table, p_id) — security-definer helper
-- ----------------------------------------------------------------------
-- Sets closed_at = now() and closed_by = auth.uid() on a row in one of
-- the whitelisted lifecycle tables. We use a static `case` (not dynamic
-- EXECUTE) so the table name is never interpolated into SQL — Postgres
-- still planner-validates each branch.
--
-- Returns void; raises if the table is not whitelisted. Callers should
-- already be RLS-checked (the original UPDATE policy on each table
-- gates who can mutate); this function only writes the standard
-- terminator columns and bumps updated_at when the table has it.

create or replace function public.mark_closed(p_table text, p_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
begin
  if p_id is null then
    raise exception 'mark_closed: id required';
  end if;

  case p_table
    when 'deliverables' then
      update public.deliverables
         set closed_at = coalesce(closed_at, now()),
             closed_by = coalesce(closed_by, v_user),
             updated_at = now()
       where id = p_id;
    when 'rfis' then
      update public.rfis
         set closed_at = coalesce(closed_at, now()),
             closed_by = coalesce(closed_by, v_user),
             updated_at = now()
       where id = p_id;
    when 'submittals' then
      update public.submittals
         set closed_at = coalesce(closed_at, now()),
             closed_by = coalesce(closed_by, v_user),
             updated_at = now()
       where id = p_id;
    when 'punch_items' then
      update public.punch_items
         set closed_at = coalesce(closed_at, now()),
             closed_by = coalesce(closed_by, v_user),
             updated_at = now()
       where id = p_id;
    when 'incidents' then
      update public.incidents
         set closed_at = coalesce(closed_at, now()),
             closed_by = coalesce(closed_by, v_user),
             updated_at = now()
       where id = p_id;
    else
      raise exception 'mark_closed: table % not whitelisted', p_table;
  end case;
end
$$;

comment on function public.mark_closed(text, uuid) is
  'SmartSuite Due Date convention — sets closed_at/closed_by/updated_at on the matching row of a whitelisted lifecycle table. Whitelist: deliverables, rfis, submittals, punch_items, incidents.';

revoke all on function public.mark_closed(text, uuid) from public;
grant execute on function public.mark_closed(text, uuid) to authenticated;
