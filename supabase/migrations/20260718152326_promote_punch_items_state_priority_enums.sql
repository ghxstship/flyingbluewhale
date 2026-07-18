-- Remediation A: promote punch_items.item_state + priority to native enums.
-- APPLIED 2026-07-18 (ledger 20260718152326). Torn down + rebuilt: view v_action_items
-- (security_invoker), partial index idx_punch_items_assignee (item_state text predicate).
-- Plain index idx_punch_items_project_status auto-rebuilds. CHECK names:
-- punch_items_status_check (item_state), punch_items_priority_check.
drop view public.v_action_items;
drop index public.idx_punch_items_assignee;

create type public.punch_item_state as enum ('open','in_progress','ready_for_review','complete','void');
alter table public.punch_items drop constraint if exists punch_items_status_check;
alter table public.punch_items alter column item_state drop default;
alter table public.punch_items alter column item_state type public.punch_item_state using item_state::public.punch_item_state;
alter table public.punch_items alter column item_state set default 'open';

create type public.work_priority as enum ('low','normal','high','urgent');
alter table public.punch_items drop constraint if exists punch_items_priority_check;
alter table public.punch_items alter column priority drop default;
alter table public.punch_items alter column priority type public.work_priority using priority::public.work_priority;
alter table public.punch_items alter column priority set default 'normal';

create index idx_punch_items_assignee on public.punch_items using btree (assignee_id)
  where (item_state = any (array['open'::punch_item_state,'in_progress'::punch_item_state,'ready_for_review'::punch_item_state]));

create view public.v_action_items with (security_invoker=true) as
 select 'rfi'::text as kind, r.id as record_id, r.org_id, r.project_id, r.subject as title,
        r.ball_in_court_id as owner_id, r.due_at, r.rfi_state as status, r.priority, r.created_at
   from rfis r where r.rfi_state = 'open'::text
 union all
 select 'submittal'::text, s.id, s.org_id, s.project_id, s.title, s.ball_in_court_id, s.due_at,
        s.submittal_state, 'normal'::text, s.created_at
   from submittals s where s.submittal_state = any (array['submitted'::text,'in_review'::text,'revise_resubmit'::text])
 union all
 select 'punch'::text, p.id, p.org_id, p.project_id, p.title, p.assignee_id, p.due_at,
        p.item_state::text, p.priority::text, p.created_at
   from punch_items p where p.item_state = any (array['open'::punch_item_state,'in_progress'::punch_item_state,'ready_for_review'::punch_item_state])
 union all
 select 'inspection'::text, i.id, i.org_id, i.project_id, i.name, i.inspector_id, i.scheduled_for::date,
        i.inspection_state, 'normal'::text, i.created_at
   from inspections i where i.inspection_state = any (array['scheduled'::text,'in_progress'::text])
 union all
 select 'task'::text, t.id, t.org_id, t.project_id, t.title, t.assigned_to, t.due_at,
        t.task_state::text, 'normal'::text, t.created_at
   from tasks t where t.task_state = any (array['todo'::task_status,'in_progress'::task_status,'blocked'::task_status,'review'::task_status]);
