-- Isolate per-task timer entries (activity_category='task', added with the
-- time_entries.task_id timer) from PAYROLL timesheet compilation. A worker who
-- logs task time while clocked into a shift would otherwise be double-counted
-- (the shift punch already captures that wall-clock time). Task-timer entries
-- are a productivity attribution record, not the shift-of-record for pay.
-- Backward-compatible: no existing rows carry activity_category='task', so this
-- changes nothing for historical compiles.
create or replace function public.compile_timesheets(p_org_id uuid, p_pay_period_id uuid)
  returns jsonb language plpgsql security definer set search_path to 'public', 'pg_temp' as $function$
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

  with parties_with_time as (
    select distinct p.id as party_id
    from public.time_entries te
    join public.parties p
      on p.auth_user_id = te.user_id and p.org_id = te.org_id and p.deleted_at is null
    where te.org_id = p_org_id
      and te.ended_at is not null
      and te.activity_category <> 'task'
      and te.started_at >= v_period.period_start::timestamptz
      and te.started_at < (v_period.period_end + 1)::timestamptz
  )
  insert into public.timesheets (org_id, party_id, pay_period_id, period_start, period_end, state, compiled_at)
  select p_org_id, party_id, p_pay_period_id, v_period.period_start, v_period.period_end, 'open', now()
  from parties_with_time
  on conflict (org_id, party_id, pay_period_id) where pay_period_id is not null
  do update set compiled_at = now()
  where public.timesheets.state = 'open';
  get diagnostics v_sheets = row_count;

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
     and te.activity_category <> 'task'
     and te.started_at >= v_period.period_start::timestamptz
     and te.started_at < (v_period.period_end + 1)::timestamptz
     and te.timesheet_id is distinct from t.id;
  get diagnostics v_entries = row_count;

  return jsonb_build_object('sheets', v_sheets, 'entries_linked', v_entries);
end;
$function$;
