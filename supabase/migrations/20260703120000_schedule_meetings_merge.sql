-- Phase A (kit 20, REPO_LANDING §1) — 3NF SSOT merge: `meetings` → `schedule + type: Meeting`.
--
-- The console's schedule store is `public.events`. This migration makes it the
-- ONE store for everything time-boxed, per the kit's §09 merge list:
--
--   1. `events.event_kind` — the type facet from the prototype's schedule
--      schema (Activity: Load In · Load Out · Delivery · Sound Check ·
--      Inspection · Shift · Meeting · Training · Run Of Show, plus `general`
--      as the bucket for pre-facet rows). A facet, not a lifecycle, so plain
--      `_kind` per the LDP naming discipline (no bare `status` anywhere here).
--   2. `public.meeting_event_details` — the per-kind detail sibling (1:1,
--      PK = events.id), same pattern as `ticket_assignment_details` et al in
--      the advancing canon. Holds everything meeting-shaped that a generic
--      schedule row has no business carrying: MTG code, meeting_kind taxonomy,
--      free-text location, meeting URL, agenda + minutes markdown, recorder,
--      finalized stamp.
--   3. Row migration — every live `meetings` row becomes an `events` row with
--      THE SAME id (so the attendee/action-item/notes/huddle FKs survive a
--      simple repoint) + a details sibling. meeting_state maps onto
--      event_status (in_progress→live, completed→complete).
--   4. FK repoints — meeting_attendees + meeting_action_items (CASCADE) and
--      meeting_notes + video_calls (SET NULL) now reference events(id). The
--      `meeting_id` column NAME stays: it still means "the meeting event".
--   5. `tg_action_item_to_task` re-reads org/project from `events`.
--   6. `public.meetings` is DROPPED (and `meeting_state` with it —
--      `meeting_kind` lives on inside the details sibling).
--
-- /studio/meetings and /studio/meetings/notes become filtered lenses over the
-- unified store; /studio/calendar + /studio/schedule render it as-is.

-- ── 1 · the type facet ──────────────────────────────────────────────────
do $$ begin
  create type public.schedule_event_kind as enum (
    'general',
    'load_in',
    'load_out',
    'delivery',
    'sound_check',
    'inspection',
    'shift',
    'meeting',
    'training',
    'run_of_show'
  );
exception when duplicate_object then null; end $$;

alter table public.events
  add column if not exists event_kind public.schedule_event_kind not null default 'general';

comment on column public.events.event_kind is
  'Kit-20 §09 schedule type facet. `meeting` rows carry a meeting_event_details sibling.';

create index if not exists events_org_kind_idx
  on public.events (org_id, event_kind);

-- ── 2 · the meeting detail sibling ──────────────────────────────────────
create table if not exists public.meeting_event_details (
  id uuid primary key references public.events(id) on delete cascade,
  org_id uuid not null references public.orgs(id) on delete cascade,
  code text not null,
  kind public.meeting_kind not null default 'other',
  location_name text,
  location_room text,
  meeting_url text,
  agenda_md text,
  minutes_md text,
  recorded_by uuid references auth.users(id) on delete set null,
  finalized_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint meeting_event_details_code_uniq unique (org_id, code)
);

comment on table public.meeting_event_details is
  'Per-kind detail sibling for events WHERE event_kind = ''meeting'' (kit-20 Phase A merge of the old public.meetings table). 1:1 PK = events.id, advancing-canon detail-table pattern.';

create index if not exists meeting_event_details_org_idx
  on public.meeting_event_details (org_id);

alter table public.meeting_event_details enable row level security;

create policy meeting_event_details_org_select
  on public.meeting_event_details for select
  using (private.is_org_member(org_id));

-- Write band matches the parent events table (owner/admin/manager/controller/
-- collaborator) so a role that can edit the event can edit its details.
create policy meeting_event_details_org_write
  on public.meeting_event_details
  using (private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller', 'collaborator']))
  with check (private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller', 'collaborator']));

create trigger meeting_event_details_touch_updated_at
  before update on public.meeting_event_details
  for each row execute function public.touch_updated_at();

-- ── 3 · migrate the rows (ids preserved) ────────────────────────────────
-- events.ends_at is NOT NULL; meetings.ends_at was nullable — default the
-- open-ended ones to a one-hour block. Soft-deleted meetings are not carried
-- over (they were already deleted from the operator's point of view) and
-- their child rows are swept before the FK repoint below.
insert into public.events
  (id, org_id, project_id, name, description, starts_at, ends_at, event_state, event_kind,
   created_by, created_at, updated_at)
select
  m.id, m.org_id, m.project_id, m.title, null, m.starts_at,
  coalesce(m.ends_at, m.starts_at + interval '1 hour'),
  case m.meeting_state
    when 'scheduled'   then 'scheduled'::public.event_status
    when 'in_progress' then 'live'::public.event_status
    when 'completed'   then 'complete'::public.event_status
    when 'cancelled'   then 'cancelled'::public.event_status
  end,
  'meeting'::public.schedule_event_kind,
  m.created_by, m.created_at, m.updated_at
from public.meetings m
where m.deleted_at is null
on conflict (id) do nothing;

insert into public.meeting_event_details
  (id, org_id, code, kind, location_name, location_room, meeting_url,
   agenda_md, minutes_md, recorded_by, finalized_at, created_at, updated_at)
select
  m.id, m.org_id, m.code, m.kind, m.location_name, m.location_room, m.meeting_url,
  m.agenda_md, m.minutes_md, m.recorded_by, m.finalized_at, m.created_at, m.updated_at
from public.meetings m
where m.deleted_at is null
on conflict (id) do nothing;

-- ── 4 · repoint the children at the unified store ───────────────────────
delete from public.meeting_attendees a
  where not exists (select 1 from public.events e where e.id = a.meeting_id);
delete from public.meeting_action_items a
  where not exists (select 1 from public.events e where e.id = a.meeting_id);
update public.meeting_notes set meeting_id = null
  where meeting_id is not null
    and not exists (select 1 from public.events e where e.id = meeting_notes.meeting_id);
update public.video_calls set meeting_id = null
  where meeting_id is not null
    and not exists (select 1 from public.events e where e.id = video_calls.meeting_id);

alter table public.meeting_attendees
  drop constraint meeting_attendees_meeting_id_fkey,
  add constraint meeting_attendees_meeting_id_fkey
    foreign key (meeting_id) references public.events(id) on delete cascade;

alter table public.meeting_action_items
  drop constraint meeting_action_items_meeting_id_fkey,
  add constraint meeting_action_items_meeting_id_fkey
    foreign key (meeting_id) references public.events(id) on delete cascade;

alter table public.meeting_notes
  drop constraint meeting_notes_meeting_id_fkey,
  add constraint meeting_notes_meeting_id_fkey
    foreign key (meeting_id) references public.events(id) on delete set null;

alter table public.video_calls
  drop constraint video_calls_meeting_id_fkey,
  add constraint video_calls_meeting_id_fkey
    foreign key (meeting_id) references public.events(id) on delete set null;

-- ── 5 · the action-item → task trigger reads the unified store ──────────
create or replace function public.tg_action_item_to_task()
returns trigger
language plpgsql
set search_path to 'pg_catalog', 'public', 'private'
as $$
declare
  v_meeting record;
  v_project_id uuid;
  v_org_id uuid;
  v_task_id uuid;
begin
  if new.assignee_user_id is null then return new; end if;
  if new.task_id is not null then return new; end if;
  select e.id, e.org_id, e.project_id into v_meeting
    from public.events e where e.id = new.meeting_id;
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
$$;

-- ── 6 · drop the duplicate store ────────────────────────────────────────
drop table public.meetings;
drop type public.meeting_state;
-- meeting_kind survives: it is the taxonomy column on meeting_event_details.
