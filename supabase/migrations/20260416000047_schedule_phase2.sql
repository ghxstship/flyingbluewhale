-- ═══════════════════════════════════════════════════════
-- GVTEWAY Migration 045: Master Schedule Phase 2
-- Recurring events (RRULE), project timezone, schedule
-- reminders/notifications, recurrence expansion
-- ═══════════════════════════════════════════════════════

-- ─── 1. Project Timezone ─────────────────────────────
-- Stores the canonical IANA timezone for the project venue.
-- Used for display toggle and ICS export VTIMEZONE.

alter table projects
  add column if not exists timezone text not null default 'America/New_York';

-- ─── 2. RRULE + Recurrence on schedule_entries ──────
-- rrule: RFC 5545 recurrence rule string (e.g. FREQ=WEEKLY;BYDAY=MO,WE,FR)
-- recurrence_parent_id: points back to the template entry that spawned instances
-- rrule_until: pre-computed horizon for index-friendly range queries

alter table schedule_entries
  add column if not exists rrule text,
  add column if not exists recurrence_parent_id uuid references schedule_entries(id) on delete cascade,
  add column if not exists rrule_until timestamptz;

create index if not exists idx_se_rrule_parent on schedule_entries(recurrence_parent_id);
create index if not exists idx_se_rrule on schedule_entries(id) where rrule is not null;

-- ─── 3. Schedule Reminders ──────────────────────────
-- Declarative reminder configs: "Notify me X minutes before this entry"
-- Multiple reminders per entry supported (e.g. 24h + 1h before)
-- Uses text channel to avoid cross-transaction enum extension issue.

create table schedule_reminders (
  id              uuid primary key default gen_random_uuid(),
  schedule_entry_id uuid not null references schedule_entries(id) on delete cascade,
  lead_minutes    int not null default 60,
  channel         text not null default 'in_app'
    check (channel in ('email', 'sms', 'in_app')),
  recipient_id    uuid references auth.users(id),  -- null = assigned_to or project admins
  is_sent         boolean not null default false,
  sent_at         timestamptz,
  created_at      timestamptz not null default now(),
  unique(schedule_entry_id, lead_minutes, recipient_id)
);

create index idx_sr_entry on schedule_reminders(schedule_entry_id);
create index idx_sr_unsent on schedule_reminders(is_sent, schedule_entry_id)
  where not is_sent;
create index idx_sr_recipient on schedule_reminders(recipient_id);

-- RLS
alter table schedule_reminders enable row level security;

create policy "View own reminders" on schedule_reminders for select
  using (
    recipient_id = auth.uid()
    or exists(
      select 1 from schedule_entries se
      where se.id = schedule_entry_id
      and is_project_member(se.project_id)
    )
  );

create policy "Manage reminders" on schedule_reminders for all
  using (
    recipient_id = auth.uid()
    or exists(
      select 1 from schedule_entries se
      where se.id = schedule_entry_id
      and is_internal_on_project(se.project_id)
    )
  );

-- ─── 5. Reminder Processing Function ────────────────
-- Called by a cron job (pg_cron or Edge Function) to fire due reminders.
-- Processes all unsent reminders where the entry starts_at minus lead_minutes <= now()

create or replace function process_schedule_reminders()
returns int as $$
declare
  processed_count int := 0;
  r record;
begin
  for r in
    select
      sr.id as reminder_id,
      sr.lead_minutes,
      sr.channel,
      sr.recipient_id as reminder_recipient,
      se.id as entry_id,
      se.project_id,
      se.title,
      se.subtitle,
      se.starts_at,
      se.ends_at,
      se.category,
      se.icon,
      se.location_id,
      se.assigned_to
    from schedule_reminders sr
    join schedule_entries se on se.id = sr.schedule_entry_id
    where sr.is_sent = false
      and se.is_cancelled = false
      and se.starts_at - (sr.lead_minutes || ' minutes')::interval <= now()
      and se.starts_at > now() - interval '1 hour'  -- don't fire for entries already far past
    order by se.starts_at asc
    limit 500
  loop
    -- Insert notification log entry
    insert into notification_log (
      project_id, recipient_id, channel,
      subject, body, delivery_status, metadata
    ) values (
      r.project_id,
      coalesce(r.reminder_recipient, r.assigned_to),
      r.channel::notification_channel,
      'Reminder: ' || r.title,
      case
        when r.lead_minutes >= 1440 then
          r.title || ' starts in ' || (r.lead_minutes / 1440) || ' day(s)'
        when r.lead_minutes >= 60 then
          r.title || ' starts in ' || (r.lead_minutes / 60) || ' hour(s)'
        else
          r.title || ' starts in ' || r.lead_minutes || ' minutes'
      end,
      'sent',
      jsonb_build_object(
        'schedule_entry_id', r.entry_id,
        'category', r.category::text,
        'starts_at', r.starts_at,
        'icon', r.icon,
        'lead_minutes', r.lead_minutes
      )
    );

    -- Mark reminder as sent
    update schedule_reminders set is_sent = true, sent_at = now()
    where id = r.reminder_id;

    processed_count := processed_count + 1;
  end loop;

  return processed_count;
end;
$$ language plpgsql security definer;

-- ─── 6. Auto-Create Default Reminders ───────────────
-- When a schedule entry is created, auto-generate a 24h + 1h reminder
-- for the assigned user (if any). Only for non-cancelled, future entries.

create or replace function auto_create_schedule_reminders()
returns trigger as $$
begin
  -- Skip if cancelled or in the past
  if new.is_cancelled or new.starts_at <= now() then
    return new;
  end if;

  -- Only for categories that benefit from reminders
  if new.category not in ('show', 'production', 'logistics', 'catering', 'deadline', 'meeting', 'inspection', 'shift') then
    return new;
  end if;

  -- 24-hour reminder
  if new.starts_at > now() + interval '24 hours' then
    insert into schedule_reminders (schedule_entry_id, lead_minutes, recipient_id)
    values (new.id, 1440, new.assigned_to)
    on conflict (schedule_entry_id, lead_minutes, recipient_id) do nothing;
  end if;

  -- 1-hour reminder
  if new.starts_at > now() + interval '1 hour' then
    insert into schedule_reminders (schedule_entry_id, lead_minutes, recipient_id)
    values (new.id, 60, new.assigned_to)
    on conflict (schedule_entry_id, lead_minutes, recipient_id) do nothing;
  end if;

  return new;
end;
$$ language plpgsql;

create trigger auto_reminders_on_schedule_entry
  after insert on schedule_entries
  for each row execute function auto_create_schedule_reminders();

-- Clean up reminders when entry is cancelled
create or replace function cleanup_reminders_on_cancel()
returns trigger as $$
begin
  if new.is_cancelled and not old.is_cancelled then
    delete from schedule_reminders
    where schedule_entry_id = new.id and is_sent = false;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger cleanup_reminders_on_cancel
  after update of is_cancelled on schedule_entries
  for each row execute function cleanup_reminders_on_cancel();

-- ─── 7. Recurrence Expansion Function ───────────────
-- Expands an RRULE template entry into concrete instances.
-- This is a server-side utility called via RPC or from API code.
-- Generates individual schedule_entries with recurrence_parent_id set.
--
-- Supports: FREQ=DAILY|WEEKLY|MONTHLY, COUNT, UNTIL, INTERVAL, BYDAY
-- Complex RRULE parsing is handled in the API layer (TypeScript);
-- this function receives pre-computed occurrence dates and creates entries.

create or replace function expand_recurrence(
  p_parent_id uuid,
  p_occurrences timestamptz[]
) returns int as $$
declare
  parent schedule_entries;
  occ timestamptz;
  duration interval;
  created int := 0;
begin
  select * into parent from schedule_entries where id = p_parent_id;
  if not found then
    raise exception 'Parent schedule entry not found: %', p_parent_id;
  end if;

  -- Calculate duration from parent
  duration := coalesce(parent.ends_at - parent.starts_at, interval '0');

  -- Delete existing expansion instances (re-expand)
  delete from schedule_entries where recurrence_parent_id = p_parent_id;

  foreach occ in array p_occurrences loop
    -- Skip the parent's own start time (it's already the template)
    if occ = parent.starts_at then continue; end if;

    insert into schedule_entries (
      project_id, source_type, source_id, source_field,
      starts_at, ends_at, all_day, category,
      title, subtitle, icon, color,
      location_id, space_id, assigned_to,
      status, priority, visibility, metadata,
      recurrence_parent_id
    ) values (
      parent.project_id, parent.source_type, parent.source_id,
      parent.source_field || '_' || to_char(occ, 'YYYYMMDD_HH24MI'),
      occ,
      case when parent.ends_at is not null then occ + duration else null end,
      parent.all_day, parent.category,
      parent.title, parent.subtitle, parent.icon, parent.color,
      parent.location_id, parent.space_id, parent.assigned_to,
      parent.status, parent.priority, parent.visibility, parent.metadata,
      p_parent_id
    )
    on conflict (source_type, source_id, source_field) do update set
      starts_at = excluded.starts_at,
      ends_at   = excluded.ends_at,
      title     = excluded.title,
      updated_at = now();

    created := created + 1;
  end loop;

  return created;
end;
$$ language plpgsql;

-- ─── 8. Update Master Schedule View ─────────────────
-- Must drop and recreate because se.* now includes new columns
-- (rrule, recurrence_parent_id, rrule_until) that shift ordinals

drop view if exists v_master_schedule;

create view v_master_schedule as
select
  se.*,
  p.name       as project_name,
  p.slug       as project_slug,
  p.timezone   as project_timezone,
  l.name       as location_name,
  sp.name      as space_name,
  pr.full_name as assignee_name,
  -- Computed: is this a recurring series template?
  (se.rrule is not null) as is_recurring,
  -- Computed: number of active reminders
  (select count(*) from schedule_reminders sr
   where sr.schedule_entry_id = se.id and not sr.is_sent)::int as pending_reminders
from schedule_entries se
left join projects  p  on p.id  = se.project_id
left join locations l  on l.id  = se.location_id
left join spaces    sp on sp.id = se.space_id
left join profiles  pr on pr.id = se.assigned_to;

