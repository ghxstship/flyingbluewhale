-- The timesheet spine — Phase 3 of docs/compvss/TIME_MANAGEMENT_LIFECYCLE_PLAN.md.
--
-- This is the hollow middle of the time lifecycle. Before this migration:
--
--   * `time_entries.timesheet_id` existed and NOTHING ever wrote it.
--   * NOTHING inserted a `timesheets` row.
--   * `total_minutes` / `billable_minutes` were static `integer DEFAULT 0`
--     columns with no trigger, function, or app code behind them — the UI
--     faithfully rendered a number the app never computed.
--   * `ALLOWED_DECISIONS.open = []`, so the lifecycle was unreachable from
--     its own initial state: nothing could submit.
--   * NOTHING wrote `payroll_run_lines`; both certified-payroll exporters
--     `.select()` an unpopulated table.
--
-- So capture worked, the approval UI worked, the exporters existed, and
-- nothing connected them. An HR/payroll connector built on top would have
-- exported an empty table. Everything downstream is blocked on this.
--
-- LDP: `period_state` is the cyclical lifecycle of a pay period; the
-- timesheet's own arc stays on the existing `utt_timesheet_state` enum.
-- `pay_period_kind` / `ot_rule_set` (org_time_settings) are facets.

-- ============================================================
-- 1. Pay periods
-- ============================================================

create table if not exists public.pay_periods (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  period_state text not null default 'open'
    check (period_state in ('open', 'locked', 'posted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, period_start, period_end),
  constraint pp_range check (period_end >= period_start)
);

comment on table public.pay_periods is
  'The org pay calendar, generated from org_time_settings.pay_period_kind + pay_period_anchor. A period is the unit a timesheet is compiled for. `locked` stops new compiles; `posted` means payroll consumed it.';

create index if not exists pay_periods_org_range_idx on public.pay_periods (org_id, period_start desc);

alter table public.pay_periods enable row level security;

create policy pay_periods_read on public.pay_periods
  for select using (private.is_org_member(org_id));
-- Only the admin band shapes the pay calendar. Managers approve hours;
-- they do not decide which week those hours belong to.
create policy pay_periods_admin_write on public.pay_periods
  for all using (private.is_org_admin(org_id))
  with check (private.is_org_admin(org_id));

create or replace trigger pay_periods_touch_updated_at
  before update on public.pay_periods
  for each row execute function public.touch_updated_at();

-- ============================================================
-- 2. Timesheet lifecycle columns
-- ============================================================
-- `posted_at` already exists. `updated_at` does not, so the rollup has
-- nowhere to record that it ran — add it with the rest.

alter table public.timesheets
  add column if not exists pay_period_id uuid references public.pay_periods(id),
  add column if not exists submitted_at timestamptz,
  add column if not exists submitted_by uuid references auth.users(id),
  add column if not exists posted_by uuid references auth.users(id),
  add column if not exists compiled_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

comment on column public.timesheets.compiled_at is
  'When compile_timesheets last gathered entries into this sheet. Re-compiling is idempotent and safe while the sheet is open, which is what lets a late offline punch still land.';
comment on column public.timesheets.pay_period_id is
  'The pay period this sheet covers. Null on sheets that predate the spine (they were never compiled by anything).';

-- One sheet per worker per period. This is what makes compile idempotent:
-- re-running upserts onto this index instead of duplicating.
create unique index if not exists ts_one_per_party_period
  on public.timesheets (org_id, party_id, pay_period_id)
  where pay_period_id is not null;

create index if not exists ts_pay_period_idx on public.timesheets (pay_period_id) where pay_period_id is not null;
create index if not exists ts_submitted_by_idx on public.timesheets (submitted_by) where submitted_by is not null;
create index if not exists ts_posted_by_idx on public.timesheets (posted_by) where posted_by is not null;

create or replace trigger timesheets_touch_updated_at
  before update on public.timesheets
  for each row execute function public.touch_updated_at();

-- ============================================================
-- 3. The rollup — derived, never trusted
-- ============================================================

create or replace function public.recompute_timesheet_totals(p_timesheet_id uuid)
  returns void language plpgsql security definer set search_path to 'public', 'pg_temp' as $$
begin
  update public.timesheets t set
    total_minutes = coalesce(agg.total, 0),
    billable_minutes = coalesce(agg.billable, 0),
    updated_at = now()
  from (
    select
      coalesce(sum(duration_minutes), 0) as total,
      coalesce(sum(duration_minutes) filter (where billable), 0) as billable
    from public.time_entries
    where timesheet_id = p_timesheet_id and ended_at is not null
  ) agg
  where t.id = p_timesheet_id
    -- A posted sheet's totals are what payroll paid against. Never move them.
    and t.state not in ('posted', 'archived');
end;
$$;

comment on function public.recompute_timesheet_totals(uuid) is
  'Derive timesheets.total_minutes / billable_minutes from the linked entries. The columns were static integers nothing ever computed; this is the SSOT. Only counts CLOSED entries (an open punch has no duration yet) and refuses to touch a posted sheet.';

-- Keep the rollup live while a sheet is open: any entry change recomputes
-- the sheet it belongs to. Without this the totals drift the moment a
-- correction is applied.
create or replace function public.tg_rollup_timesheet_totals() returns trigger
  language plpgsql security definer set search_path to 'public', 'pg_temp' as $$
begin
  if tg_op <> 'INSERT' and old.timesheet_id is not null then
    perform public.recompute_timesheet_totals(old.timesheet_id);
  end if;
  if tg_op <> 'DELETE' and new.timesheet_id is not null
     and new.timesheet_id is distinct from old.timesheet_id then
    perform public.recompute_timesheet_totals(new.timesheet_id);
  elsif tg_op <> 'DELETE' and new.timesheet_id is not null then
    perform public.recompute_timesheet_totals(new.timesheet_id);
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists time_entries_rollup on public.time_entries;
create trigger time_entries_rollup
  after insert or update or delete on public.time_entries
  for each row execute function public.tg_rollup_timesheet_totals();

-- ============================================================
-- 4. Compile — idempotent by construction
-- ============================================================

create or replace function public.compile_timesheets(p_org_id uuid, p_pay_period_id uuid)
  returns jsonb language plpgsql security definer set search_path to 'public', 'pg_temp' as $$
declare
  v_period public.pay_periods;
  v_sheets int := 0;
  v_entries int := 0;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;
  if not private.has_org_role(p_org_id, array['owner', 'admin', 'manager']) then
    raise exception 'Only managers can compile timesheets' using errcode = '42501';
  end if;

  select * into v_period from public.pay_periods
   where id = p_pay_period_id and org_id = p_org_id;
  if not found then
    raise exception 'Pay period not found' using errcode = 'P0002';
  end if;
  if v_period.period_state <> 'open' then
    raise exception 'Pay period is %, not open', v_period.period_state using errcode = '55000';
  end if;

  -- One sheet per party with closed entries in the window. ON CONFLICT on
  -- the unique index is what makes this re-runnable as late offline punches
  -- replay: it never duplicates, it just gathers again.
  with parties_with_time as (
    select distinct p.id as party_id
    from public.time_entries te
    join public.parties p
      on p.auth_user_id = te.user_id and p.org_id = te.org_id and p.deleted_at is null
    where te.org_id = p_org_id
      and te.ended_at is not null
      and te.started_at >= v_period.period_start::timestamptz
      and te.started_at < (v_period.period_end + 1)::timestamptz
  )
  insert into public.timesheets (org_id, party_id, pay_period_id, period_start, period_end, state, compiled_at)
  select p_org_id, party_id, p_pay_period_id, v_period.period_start, v_period.period_end, 'open', now()
  from parties_with_time
  on conflict (org_id, party_id, pay_period_id) where pay_period_id is not null
  do update set compiled_at = now()
  -- Only re-gather sheets still open; a submitted/approved sheet is out of
  -- the compiler's hands.
  where public.timesheets.state = 'open';
  get diagnostics v_sheets = row_count;

  -- Link the entries. Only entries whose sheet is still open move, so a
  -- posted period can't be quietly re-pointed.
  update public.time_entries te
     set timesheet_id = t.id
    from public.timesheets t
    join public.parties p on p.id = t.party_id
   where t.pay_period_id = p_pay_period_id
     and t.org_id = p_org_id
     and t.state = 'open'
     and p.auth_user_id = te.user_id
     and te.org_id = p_org_id
     and te.ended_at is not null
     and te.started_at >= v_period.period_start::timestamptz
     and te.started_at < (v_period.period_end + 1)::timestamptz
     and te.timesheet_id is distinct from t.id;
  get diagnostics v_entries = row_count;

  return jsonb_build_object('sheets', v_sheets, 'entries_linked', v_entries);
end;
$$;

comment on function public.compile_timesheets(uuid, uuid) is
  'Gather closed time_entries in a pay period into one timesheet per worker, and stamp time_entries.timesheet_id — the FK that existed for months with nothing writing it. Idempotent by construction (ON CONFLICT on ts_one_per_party_period), so it is safe to re-run as late offline punches replay. Only touches sheets still in `open`.';

revoke all on function public.compile_timesheets(uuid, uuid) from public;
grant execute on function public.compile_timesheets(uuid, uuid) to authenticated;
revoke all on function public.recompute_timesheet_totals(uuid) from public;
grant execute on function public.recompute_timesheet_totals(uuid) to authenticated;
