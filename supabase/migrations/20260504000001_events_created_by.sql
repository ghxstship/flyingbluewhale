-- Sea Trial FINDING-017: add `created_by` to events for actor attribution.
-- Pre-fix `events` had no creator column, so the audit log + look-ahead
-- views couldn't say *who* scheduled an event, only that one was inserted.
-- Backfill is best-effort via the audit_log trigger that records inserts;
-- rows older than the audit retention simply land with NULL.

alter table public.events
  add column if not exists created_by uuid references public.users(id);

-- Best-effort backfill: pull the actor_id from the earliest matching
-- insert audit row. Anything missing stays NULL — that's the historical
-- truth, not a bug. `audit_log.target_id` is text, so cast both sides
-- to uuid to match the events.id PK type.
update public.events e
set created_by = sub.actor_id
from (
  select distinct on (target_id::uuid) target_id::uuid as target_uuid, actor_id
  from public.audit_log
  where target_table = 'events' and action = 'insert' and actor_id is not null
  order by target_id::uuid, at asc
) sub
where e.id = sub.target_uuid and e.created_by is null;

create index if not exists events_created_by_idx on public.events(created_by);
