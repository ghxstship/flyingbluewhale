-- v7.7 Inbox: a unified per-user triage queue. security_invoker so base-table
-- RLS is the authorization boundary; the view itself self-scopes to auth.uid()
-- so each viewer only ever sees their own actionable items. Two sources:
--   notification — unread notifications (carries approvals / mentions / assignment
--                  pings by kind, with title/body/href already resolved)
--   task         — the viewer's own not-done tasks (SLA flag from due_at)
create or replace view public.v_inbox_items
with (security_invoker = on) as
  select
    n.id                              as item_id,
    'notification'::text              as source,
    coalesce(n.kind, 'notification')  as kind,
    n.title                           as title,
    n.body                            as subtitle,
    n.href                            as href,
    n.created_at                      as at,
    false                             as sla_overdue,
    0                                 as priority,
    n.org_id                          as org_id,
    n.user_id                         as user_id
  from public.notifications n
  where n.user_id = auth.uid()
    and n.read_at is null
  union all
  select
    t.id                              as item_id,
    'task'::text                      as source,
    'task'::text                      as kind,
    t.title                           as title,
    t.description                     as subtitle,
    case when t.project_id is not null
         then '/studio/projects/' || t.project_id::text
         else null end                as href,
    t.updated_at                      as at,
    (t.due_at is not null and t.due_at < current_date) as sla_overdue,
    coalesce(t.priority, 0)           as priority,
    t.org_id                          as org_id,
    t.assigned_to                     as user_id
  from public.tasks t
  where t.assigned_to = auth.uid()
    and t.task_state <> 'done';

grant select on public.v_inbox_items to authenticated;

comment on view public.v_inbox_items is
  'v7.7 unified per-user inbox: unread notifications + the viewer''s own not-done tasks. security_invoker; self-scoped to auth.uid().';
