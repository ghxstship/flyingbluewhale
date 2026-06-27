-- Bug: tg_action_item_to_task() inserted tasks with task_state='open', which is
-- not a valid task_status enum value (todo|in_progress|blocked|review|done).
-- This made EVERY meeting_action_item insert with an assignee fail in production.
-- Fix: use the canonical initial state 'todo'. (Superseded by the priority fix in
-- 20260624155058 which moves to column defaults; kept for lockstep with remote.)
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
  insert into public.tasks (org_id, project_id, title, description, task_state, priority, due_at, assigned_to, created_by, created_at, updated_at)
  values (v_org_id, v_project_id, left(new.description, 200), 'Auto-created from meeting action item.', 'todo', 'normal',
    case when new.due_at is not null then (new.due_at::timestamptz) else null end,
    new.assignee_user_id, new.assignee_user_id, now(), now())
  returning id into v_task_id;
  new.task_id := v_task_id;
  return new;
end;
$function$;
