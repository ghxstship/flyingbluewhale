-- Second defect in tg_action_item_to_task(): it passed priority='normal' (text)
-- into tasks.priority, which is integer NOT NULL DEFAULT 2. Omit task_state and
-- priority entirely so the column defaults ('todo', 2) apply. Completes the fix
-- started in fix_action_item_to_task_invalid_task_state.
create or replace function public.tg_action_item_to_task()
  returns trigger
  language plpgsql
  set search_path to 'pg_catalog','public','private'
as $function$
declare
  v_meeting record;
  v_project_id uuid;
  v_org_id uuid;
  v_task_id uuid;
begin
  if new.assignee_user_id is null then return new; end if;
  if new.task_id is not null then return new; end if;
  select m.id, m.org_id, m.project_id into v_meeting from public.meetings m where m.id = new.meeting_id;
  if not found then return new; end if;
  v_org_id := v_meeting.org_id;
  v_project_id := v_meeting.project_id;
  if v_project_id is null then return new; end if;
  insert into public.tasks (org_id, project_id, title, description, due_at, assigned_to, created_by, created_at, updated_at)
  values (v_org_id, v_project_id, left(new.description, 200), 'Auto-created from meeting action item.',
    case when new.due_at is not null then (new.due_at::timestamptz) else null end,
    new.assignee_user_id, new.assignee_user_id, now(), now())
  returning id into v_task_id;
  new.task_id := v_task_id;
  return new;
end;
$function$;
