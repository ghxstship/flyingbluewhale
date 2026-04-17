-- ═══════════════════════════════════════════════════════
-- GVTEWAY Migration 044: Master Schedule (Unified Temporal Projection)
-- Thin projection layer for all date-bearing entities
-- Answers every "When is...?" question from a single surface
-- ═══════════════════════════════════════════════════════

-- ─── Enums ───────────────────────────────────────────

create type schedule_entry_category as enum (
  'show',              -- Acts, performances, run of show
  'production',        -- Build, strike, load-in/out, rehearsals, project windows
  'logistics',         -- Pickups, deliveries, transfers, shipments, receiving
  'catering',          -- Meal plans, service windows
  'deadline',          -- Deliverable deadlines, PO expected dates
  'credential',        -- Badge issuance, expiry windows
  'ticketing',         -- Sale windows, promo validity
  'meeting',           -- Meetings, trainings, briefings (future)
  'inspection',        -- Safety inspections, walkthroughs (future)
  'milestone',         -- Project milestones, go/no-go gates (future)
  'shift',             -- Work shifts, call times (future)
  'hours_of_operation' -- Venue/location operating hours
);

create type schedule_entry_source as enum (
  'project',
  'act',
  'deliverable',
  'catering_meal_plan',
  'credential_order',
  'credential_badge',
  'fulfillment_order',
  'logistics_schedule',
  'purchase_order',
  'receiving_record',
  'shipment',
  'ticket_tier',
  'ticket_promo_code',
  'location',
  'manual'
);

-- ─── Projection Table ────────────────────────────────

create table schedule_entries (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references projects(id) on delete cascade,

  -- Source provenance (SSOT pointer)
  source_type     schedule_entry_source not null,
  source_id       uuid,
  source_field    text not null,

  -- Temporal window
  starts_at       timestamptz not null,
  ends_at         timestamptz,
  all_day         boolean not null default false,

  -- Classification
  category        schedule_entry_category not null,

  -- Display projection (write-through, never authoritative)
  title           text not null,
  subtitle        text,
  icon            text,
  color           text,

  -- Linkage
  location_id     uuid references locations(id) on delete set null,
  space_id        uuid references spaces(id) on delete set null,
  assigned_to     uuid references auth.users(id),

  -- Status mirroring
  status          text,
  is_cancelled    boolean not null default false,

  -- Metadata
  priority        text default 'normal' check (priority in ('low','normal','high','urgent')),
  visibility      text[] not null default '{internal}',
  metadata        jsonb not null default '{}',

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  -- One projection per source field per source entity
  unique(source_type, source_id, source_field)
);

-- ─── Indexes ─────────────────────────────────────────

create index idx_se_project        on schedule_entries(project_id);
create index idx_se_category       on schedule_entries(category);
create index idx_se_source         on schedule_entries(source_type, source_id);
create index idx_se_temporal       on schedule_entries(starts_at, ends_at);
create index idx_se_location       on schedule_entries(location_id);
create index idx_se_assigned       on schedule_entries(assigned_to);
create index idx_se_cancelled      on schedule_entries(is_cancelled);
create index idx_se_active_window  on schedule_entries(project_id, starts_at, ends_at)
  where not is_cancelled;

-- ─── Updated_at trigger ──────────────────────────────

create trigger schedule_entries_updated_at
  before update on schedule_entries
  for each row execute function update_updated_at();

-- ═══════════════════════════════════════════════════════
-- TRIGGER FUNCTIONS — one per source domain
-- ═══════════════════════════════════════════════════════

-- ─── 1. Projects → production ────────────────────────

create or replace function project_to_schedule()
returns trigger as $$
begin
  if tg_op = 'DELETE' then
    delete from schedule_entries where source_type = 'project' and source_id = old.id;
    return old;
  end if;

  if new.start_date is not null then
    insert into schedule_entries (
      project_id, source_type, source_id, source_field,
      starts_at, ends_at, all_day, category,
      title, icon, status
    ) values (
      new.id, 'project', new.id, 'project_window',
      new.start_date::timestamptz,
      case when new.end_date is not null then new.end_date::timestamptz else null end,
      true, 'production',
      new.name, '🏗️', new.status::text
    )
    on conflict (source_type, source_id, source_field) do update set
      starts_at    = excluded.starts_at,
      ends_at      = excluded.ends_at,
      title        = excluded.title,
      status       = excluded.status,
      is_cancelled = (new.status = 'archived'),
      updated_at   = now();
  else
    delete from schedule_entries where source_type = 'project' and source_id = new.id and source_field = 'project_window';
  end if;

  return new;
end;
$$ language plpgsql;

create trigger sync_project_to_schedule
  after insert or update or delete on projects
  for each row execute function project_to_schedule();

-- ─── 2. Acts → show ─────────────────────────────────

create or replace function act_to_schedule()
returns trigger as $$
begin
  if tg_op = 'DELETE' then
    delete from schedule_entries where source_type = 'act' and source_id = old.id;
    return old;
  end if;

  if new.set_time_start is not null then
    insert into schedule_entries (
      project_id, source_type, source_id, source_field,
      starts_at, ends_at, category,
      title, subtitle, space_id, icon, status, is_cancelled
    ) values (
      new.project_id, 'act', new.id, 'set_time',
      new.set_time_start, new.set_time_end, 'show',
      new.artist_name || ' – ' || new.name,
      (select s.name from spaces s where s.id = new.space_id),
      new.space_id, '🎤', new.status,
      new.status = 'cancelled'
    )
    on conflict (source_type, source_id, source_field) do update set
      starts_at    = excluded.starts_at,
      ends_at      = excluded.ends_at,
      title        = excluded.title,
      subtitle     = excluded.subtitle,
      space_id     = excluded.space_id,
      status       = excluded.status,
      is_cancelled = excluded.is_cancelled,
      updated_at   = now();
  else
    delete from schedule_entries where source_type = 'act' and source_id = new.id and source_field = 'set_time';
  end if;

  return new;
end;
$$ language plpgsql;

create trigger sync_act_to_schedule
  after insert or update or delete on acts
  for each row execute function act_to_schedule();

-- ─── 3. Deliverables → deadline ─────────────────────

create or replace function deliverable_to_schedule()
returns trigger as $$
begin
  if tg_op = 'DELETE' then
    delete from schedule_entries where source_type = 'deliverable' and source_id = old.id;
    return old;
  end if;

  if new.deadline is not null then
    insert into schedule_entries (
      project_id, source_type, source_id, source_field,
      starts_at, category,
      title, icon, status, is_cancelled
    ) values (
      new.project_id, 'deliverable', new.id, 'deadline',
      new.deadline, 'deadline',
      coalesce(new.title, new.type::text), '📋', new.status::text,
      new.status = 'approved'
    )
    on conflict (source_type, source_id, source_field) do update set
      starts_at    = excluded.starts_at,
      title        = excluded.title,
      status       = excluded.status,
      is_cancelled = excluded.is_cancelled,
      updated_at   = now();
  else
    delete from schedule_entries where source_type = 'deliverable' and source_id = new.id and source_field = 'deadline';
  end if;

  return new;
end;
$$ language plpgsql;

create trigger sync_deliverable_to_schedule
  after insert or update or delete on deliverables
  for each row execute function deliverable_to_schedule();

-- ─── 4. Catering Meal Plans → catering ──────────────

create or replace function catering_to_schedule()
returns trigger as $$
begin
  if tg_op = 'DELETE' then
    delete from schedule_entries where source_type = 'catering_meal_plan' and source_id = old.id;
    return old;
  end if;

  insert into schedule_entries (
    project_id, source_type, source_id, source_field,
    starts_at, category,
    title, subtitle, icon
  ) values (
    new.project_id, 'catering_meal_plan', new.id, 'meal_time',
    (new.date + new.time)::timestamptz, 'catering',
    new.meal_name, new.location, '🍽️'
  )
  on conflict (source_type, source_id, source_field) do update set
    starts_at  = excluded.starts_at,
    title      = excluded.title,
    subtitle   = excluded.subtitle,
    updated_at = now();

  return new;
end;
$$ language plpgsql;

create trigger sync_catering_to_schedule
  after insert or update or delete on catering_meal_plans
  for each row execute function catering_to_schedule();

-- ─── 5. Credential Orders → credential ──────────────

create or replace function credential_order_to_schedule()
returns trigger as $$
begin
  if tg_op = 'DELETE' then
    delete from schedule_entries where source_type = 'credential_order' and source_id = old.id;
    return old;
  end if;

  -- Project issued_at as an event
  if new.issued_at is not null then
    insert into schedule_entries (
      project_id, source_type, source_id, source_field,
      starts_at, category,
      title, icon, status, is_cancelled
    ) values (
      new.project_id, 'credential_order', new.id, 'issued_at',
      new.issued_at, 'credential',
      'Credential Issued – ' || coalesce(new.group_name, 'Order #' || left(new.id::text, 8)),
      '🪪', new.status::text,
      new.status = 'revoked'
    )
    on conflict (source_type, source_id, source_field) do update set
      starts_at    = excluded.starts_at,
      title        = excluded.title,
      status       = excluded.status,
      is_cancelled = excluded.is_cancelled,
      updated_at   = now();
  end if;

  return new;
end;
$$ language plpgsql;

create trigger sync_credential_order_to_schedule
  after insert or update or delete on credential_orders
  for each row execute function credential_order_to_schedule();

-- ─── 6. Credential Badges → credential ──────────────

create or replace function credential_badge_to_schedule()
returns trigger as $$
declare
  v_project_id uuid;
begin
  if tg_op = 'DELETE' then
    delete from schedule_entries where source_type = 'credential_badge' and source_id = old.id;
    return old;
  end if;

  select co.project_id into v_project_id
  from credential_orders co where co.id = new.order_id;

  if v_project_id is not null and new.expires_at is not null then
    insert into schedule_entries (
      project_id, source_type, source_id, source_field,
      starts_at, category,
      title, icon, is_cancelled
    ) values (
      v_project_id, 'credential_badge', new.id, 'expires_at',
      new.expires_at, 'credential',
      'Badge Expires – ' || coalesce(new.person_name, 'Badge #' || left(new.id::text, 8)),
      '⏰', new.is_revoked
    )
    on conflict (source_type, source_id, source_field) do update set
      starts_at    = excluded.starts_at,
      title        = excluded.title,
      is_cancelled = excluded.is_cancelled,
      updated_at   = now();
  end if;

  return new;
end;
$$ language plpgsql;

create trigger sync_credential_badge_to_schedule
  after insert or update or delete on credential_badges
  for each row execute function credential_badge_to_schedule();

-- ─── 7. Fulfillment Orders → logistics ──────────────

create or replace function fulfillment_to_schedule()
returns trigger as $$
begin
  if tg_op = 'DELETE' then
    delete from schedule_entries where source_type = 'fulfillment_order' and source_id = old.id;
    return old;
  end if;

  if new.scheduled_at is not null then
    insert into schedule_entries (
      project_id, source_type, source_id, source_field,
      starts_at, category,
      title, icon, status, is_cancelled
    ) values (
      new.project_id, 'fulfillment_order', new.id, 'scheduled_at',
      new.scheduled_at, 'logistics',
      'Fulfillment ' || coalesce(new.reference_number, left(new.id::text, 8)) || ' – ' || new.type,
      '📤', new.status,
      new.status = 'cancelled'
    )
    on conflict (source_type, source_id, source_field) do update set
      starts_at    = excluded.starts_at,
      title        = excluded.title,
      status       = excluded.status,
      is_cancelled = excluded.is_cancelled,
      updated_at   = now();
  else
    delete from schedule_entries where source_type = 'fulfillment_order' and source_id = new.id and source_field = 'scheduled_at';
  end if;

  return new;
end;
$$ language plpgsql;

create trigger sync_fulfillment_to_schedule
  after insert or update or delete on fulfillment_orders
  for each row execute function fulfillment_to_schedule();

-- ─── 8. Logistics Schedules → logistics ─────────────

create or replace function logistics_schedule_to_schedule()
returns trigger as $$
begin
  if tg_op = 'DELETE' then
    delete from schedule_entries where source_type = 'logistics_schedule' and source_id = old.id;
    return old;
  end if;

  insert into schedule_entries (
    project_id, source_type, source_id, source_field,
    starts_at, ends_at, category,
    title, subtitle, location_id, assigned_to,
    icon, status, is_cancelled, priority
  ) values (
    new.project_id, 'logistics_schedule', new.id, 'scheduled_window',
    new.scheduled_window_start, new.scheduled_window_end, 'logistics',
    new.title, new.dock_assignment,
    new.destination_location_id, new.assigned_to,
    '🚚', new.status::text,
    new.status in ('cancelled', 'no_show'),
    new.priority
  )
  on conflict (source_type, source_id, source_field) do update set
    starts_at    = excluded.starts_at,
    ends_at      = excluded.ends_at,
    title        = excluded.title,
    subtitle     = excluded.subtitle,
    location_id  = excluded.location_id,
    assigned_to  = excluded.assigned_to,
    status       = excluded.status,
    is_cancelled = excluded.is_cancelled,
    priority     = excluded.priority,
    updated_at   = now();

  return new;
end;
$$ language plpgsql;

create trigger sync_logistics_to_schedule
  after insert or update or delete on logistics_schedules
  for each row execute function logistics_schedule_to_schedule();

-- ─── 9. Purchase Orders → deadline ───────────────────

create or replace function purchase_order_to_schedule()
returns trigger as $$
begin
  if tg_op = 'DELETE' then
    delete from schedule_entries where source_type = 'purchase_order' and source_id = old.id;
    return old;
  end if;

  if new.expected_delivery is not null then
    insert into schedule_entries (
      project_id, source_type, source_id, source_field,
      starts_at, all_day, category,
      title, icon, status, is_cancelled
    ) values (
      new.project_id, 'purchase_order', new.id, 'expected_delivery',
      new.expected_delivery::timestamptz, true, 'deadline',
      'PO ' || new.po_number || ' Expected Delivery',
      '📦', new.status::text,
      new.status in ('cancelled', 'closed')
    )
    on conflict (source_type, source_id, source_field) do update set
      starts_at    = excluded.starts_at,
      title        = excluded.title,
      status       = excluded.status,
      is_cancelled = excluded.is_cancelled,
      updated_at   = now();
  else
    delete from schedule_entries where source_type = 'purchase_order' and source_id = new.id and source_field = 'expected_delivery';
  end if;

  return new;
end;
$$ language plpgsql;

create trigger sync_purchase_order_to_schedule
  after insert or update or delete on purchase_orders
  for each row execute function purchase_order_to_schedule();

-- ─── 10. Receiving Records → logistics ──────────────

create or replace function receiving_to_schedule()
returns trigger as $$
begin
  if tg_op = 'DELETE' then
    delete from schedule_entries where source_type = 'receiving_record' and source_id = old.id;
    return old;
  end if;

  -- Scheduled receiving creates an entry; actual received_at updates it
  insert into schedule_entries (
    project_id, source_type, source_id, source_field,
    starts_at, category,
    title, subtitle, location_id, icon, status
  ) values (
    new.project_id, 'receiving_record', new.id, 'receiving_window',
    coalesce(new.received_at, new.created_at), 'logistics',
    'Receiving ' || new.reference_number,
    new.carrier_name,
    new.location_id, '📥', new.status::text
  )
  on conflict (source_type, source_id, source_field) do update set
    starts_at  = excluded.starts_at,
    title      = excluded.title,
    subtitle   = excluded.subtitle,
    location_id= excluded.location_id,
    status     = excluded.status,
    updated_at = now();

  return new;
end;
$$ language plpgsql;

create trigger sync_receiving_to_schedule
  after insert or update or delete on receiving_records
  for each row execute function receiving_to_schedule();

-- ─── 11. Shipments → logistics ──────────────────────

create or replace function shipment_to_schedule()
returns trigger as $$
begin
  if tg_op = 'DELETE' then
    delete from schedule_entries where source_type = 'shipment' and source_id = old.id;
    return old;
  end if;

  -- Only project-scoped shipments get schedule entries
  if new.project_id is null then return new; end if;

  -- Scheduled pickup
  if new.scheduled_pickup_at is not null then
    insert into schedule_entries (
      project_id, source_type, source_id, source_field,
      starts_at, category,
      title, subtitle, location_id, icon, status, is_cancelled
    ) values (
      new.project_id, 'shipment', new.id, 'scheduled_pickup',
      new.scheduled_pickup_at, 'logistics',
      'Shipment Pickup ' || new.reference_number,
      new.carrier_name,
      new.origin_location_id, '📬', new.status::text,
      new.status = 'cancelled'
    )
    on conflict (source_type, source_id, source_field) do update set
      starts_at    = excluded.starts_at,
      title        = excluded.title,
      subtitle     = excluded.subtitle,
      location_id  = excluded.location_id,
      status       = excluded.status,
      is_cancelled = excluded.is_cancelled,
      updated_at   = now();
  end if;

  -- Scheduled delivery
  if new.scheduled_delivery_at is not null then
    insert into schedule_entries (
      project_id, source_type, source_id, source_field,
      starts_at, category,
      title, subtitle, location_id, icon, status, is_cancelled
    ) values (
      new.project_id, 'shipment', new.id, 'scheduled_delivery',
      new.scheduled_delivery_at, 'logistics',
      'Shipment Delivery ' || new.reference_number,
      new.carrier_name,
      new.destination_location_id, '📦', new.status::text,
      new.status = 'cancelled'
    )
    on conflict (source_type, source_id, source_field) do update set
      starts_at    = excluded.starts_at,
      title        = excluded.title,
      subtitle     = excluded.subtitle,
      location_id  = excluded.location_id,
      status       = excluded.status,
      is_cancelled = excluded.is_cancelled,
      updated_at   = now();
  end if;

  return new;
end;
$$ language plpgsql;

create trigger sync_shipment_to_schedule
  after insert or update or delete on shipments
  for each row execute function shipment_to_schedule();

-- ─── 12. Ticket Tiers → ticketing ───────────────────

create or replace function ticket_tier_to_schedule()
returns trigger as $$
begin
  if tg_op = 'DELETE' then
    delete from schedule_entries where source_type = 'ticket_tier' and source_id = old.id;
    return old;
  end if;

  if new.sale_start is not null then
    insert into schedule_entries (
      project_id, source_type, source_id, source_field,
      starts_at, ends_at, category,
      title, icon
    ) values (
      new.project_id, 'ticket_tier', new.id, 'sale_window',
      new.sale_start, new.sale_end, 'ticketing',
      new.name || ' On Sale', '🎟️'
    )
    on conflict (source_type, source_id, source_field) do update set
      starts_at  = excluded.starts_at,
      ends_at    = excluded.ends_at,
      title      = excluded.title,
      updated_at = now();
  else
    delete from schedule_entries where source_type = 'ticket_tier' and source_id = new.id and source_field = 'sale_window';
  end if;

  return new;
end;
$$ language plpgsql;

create trigger sync_ticket_tier_to_schedule
  after insert or update or delete on ticket_tiers
  for each row execute function ticket_tier_to_schedule();

-- ─── 13. Ticket Promo Codes → ticketing ─────────────

create or replace function promo_code_to_schedule()
returns trigger as $$
begin
  if tg_op = 'DELETE' then
    delete from schedule_entries where source_type = 'ticket_promo_code' and source_id = old.id;
    return old;
  end if;

  if new.valid_from is not null then
    insert into schedule_entries (
      project_id, source_type, source_id, source_field,
      starts_at, ends_at, category,
      title, subtitle, icon
    ) values (
      new.project_id, 'ticket_promo_code', new.id, 'validity_window',
      new.valid_from, new.valid_until, 'ticketing',
      'Promo: ' || new.code, new.discount_type || ' ' || new.discount_value::text,
      '🏷️'
    )
    on conflict (source_type, source_id, source_field) do update set
      starts_at  = excluded.starts_at,
      ends_at    = excluded.ends_at,
      title      = excluded.title,
      subtitle   = excluded.subtitle,
      updated_at = now();
  else
    delete from schedule_entries where source_type = 'ticket_promo_code' and source_id = new.id and source_field = 'validity_window';
  end if;

  return new;
end;
$$ language plpgsql;

create trigger sync_promo_code_to_schedule
  after insert or update or delete on ticket_promo_codes
  for each row execute function promo_code_to_schedule();

-- ═══════════════════════════════════════════════════════
-- CONVENIENCE VIEW
-- ═══════════════════════════════════════════════════════

create or replace view v_master_schedule as
select
  se.*,
  p.name  as project_name,
  p.slug  as project_slug,
  l.name  as location_name,
  sp.name as space_name,
  pr.full_name as assignee_name
from schedule_entries se
left join projects  p  on p.id  = se.project_id
left join locations l  on l.id  = se.location_id
left join spaces    sp on sp.id = se.space_id
left join profiles  pr on pr.id = se.assigned_to;

-- ═══════════════════════════════════════════════════════
-- CONFLICT DETECTION
-- ═══════════════════════════════════════════════════════

create or replace function detect_schedule_conflicts(
  p_project_id uuid,
  p_starts_at  timestamptz,
  p_ends_at    timestamptz,
  p_location_id uuid default null,
  p_space_id    uuid default null,
  p_exclude_id  uuid default null
) returns setof schedule_entries as $$
  select * from schedule_entries
  where project_id = p_project_id
    and not is_cancelled
    and (p_exclude_id is null or id != p_exclude_id)
    and ends_at is not null
    and tstzrange(starts_at, ends_at, '[]') &&
        tstzrange(p_starts_at, p_ends_at, '[]')
    and (p_location_id is null or location_id = p_location_id)
    and (p_space_id is null or space_id = p_space_id);
$$ language sql stable;

-- ═══════════════════════════════════════════════════════
-- RLS
-- ═══════════════════════════════════════════════════════

alter table schedule_entries enable row level security;

create policy "View schedule entries"
  on schedule_entries for select
  using (is_project_member(project_id));

create policy "Manage schedule entries"
  on schedule_entries for all
  using (is_internal_on_project(project_id));

-- ═══════════════════════════════════════════════════════
-- BACKFILL — Populate from existing data
-- Run once after migration; triggers handle ongoing sync
-- ═══════════════════════════════════════════════════════

-- Projects
insert into schedule_entries (project_id, source_type, source_id, source_field, starts_at, ends_at, all_day, category, title, icon, status)
select p.id, 'project', p.id, 'project_window', p.start_date::timestamptz,
  case when p.end_date is not null then p.end_date::timestamptz else null end,
  true, 'production', p.name, '🏗️', p.status::text
from projects p where p.start_date is not null
on conflict (source_type, source_id, source_field) do nothing;

-- Acts
insert into schedule_entries (project_id, source_type, source_id, source_field, starts_at, ends_at, category, title, subtitle, space_id, icon, status)
select a.project_id, 'act', a.id, 'set_time', a.set_time_start, a.set_time_end, 'show',
  a.artist_name || ' – ' || a.name,
  (select s.name from spaces s where s.id = a.space_id),
  a.space_id, '🎤', a.status
from acts a where a.set_time_start is not null
on conflict (source_type, source_id, source_field) do nothing;

-- Deliverable deadlines
insert into schedule_entries (project_id, source_type, source_id, source_field, starts_at, category, title, icon, status)
select d.project_id, 'deliverable', d.id, 'deadline', d.deadline, 'deadline',
  coalesce(d.title, d.type::text), '📋', d.status::text
from deliverables d where d.deadline is not null
on conflict (source_type, source_id, source_field) do nothing;

-- Catering meal plans
insert into schedule_entries (project_id, source_type, source_id, source_field, starts_at, category, title, subtitle, icon)
select mp.project_id, 'catering_meal_plan', mp.id, 'meal_time',
  (mp.date + mp.time)::timestamptz, 'catering', mp.meal_name, mp.location, '🍽️'
from catering_meal_plans mp
on conflict (source_type, source_id, source_field) do nothing;

-- Logistics schedules
insert into schedule_entries (project_id, source_type, source_id, source_field, starts_at, ends_at, category, title, subtitle, location_id, assigned_to, icon, status, priority)
select ls.project_id, 'logistics_schedule', ls.id, 'scheduled_window',
  ls.scheduled_window_start, ls.scheduled_window_end, 'logistics',
  ls.title, ls.dock_assignment,
  ls.destination_location_id, ls.assigned_to, '🚚', ls.status::text, ls.priority
from logistics_schedules ls
on conflict (source_type, source_id, source_field) do nothing;

-- Purchase orders (expected delivery)
insert into schedule_entries (project_id, source_type, source_id, source_field, starts_at, all_day, category, title, icon, status)
select po.project_id, 'purchase_order', po.id, 'expected_delivery',
  po.expected_delivery::timestamptz, true, 'deadline',
  'PO ' || po.po_number || ' Expected Delivery', '📦', po.status::text
from purchase_orders po where po.expected_delivery is not null
on conflict (source_type, source_id, source_field) do nothing;

-- Shipments (scheduled delivery — project-scoped only)
insert into schedule_entries (project_id, source_type, source_id, source_field, starts_at, category, title, subtitle, location_id, icon, status)
select s.project_id, 'shipment', s.id, 'scheduled_delivery',
  s.scheduled_delivery_at, 'logistics',
  'Shipment Delivery ' || s.reference_number, s.carrier_name,
  s.destination_location_id, '📦', s.status::text
from shipments s where s.scheduled_delivery_at is not null and s.project_id is not null
on conflict (source_type, source_id, source_field) do nothing;

-- Shipments (scheduled pickup — project-scoped only)
insert into schedule_entries (project_id, source_type, source_id, source_field, starts_at, category, title, subtitle, location_id, icon, status)
select s.project_id, 'shipment', s.id, 'scheduled_pickup',
  s.scheduled_pickup_at, 'logistics',
  'Shipment Pickup ' || s.reference_number, s.carrier_name,
  s.origin_location_id, '📬', s.status::text
from shipments s where s.scheduled_pickup_at is not null and s.project_id is not null
on conflict (source_type, source_id, source_field) do nothing;

-- Fulfillment orders (scheduled)
insert into schedule_entries (project_id, source_type, source_id, source_field, starts_at, category, title, icon, status)
select fo.project_id, 'fulfillment_order', fo.id, 'scheduled_at',
  fo.scheduled_at, 'logistics',
  'Fulfillment ' || coalesce(fo.reference_number, left(fo.id::text, 8)) || ' – ' || fo.type,
  '📤', fo.status
from fulfillment_orders fo where fo.scheduled_at is not null
on conflict (source_type, source_id, source_field) do nothing;

-- Ticket tiers (sale windows)
insert into schedule_entries (project_id, source_type, source_id, source_field, starts_at, ends_at, category, title, icon)
select tt.project_id, 'ticket_tier', tt.id, 'sale_window',
  tt.sale_start, tt.sale_end, 'ticketing',
  tt.name || ' On Sale', '🎟️'
from ticket_tiers tt where tt.sale_start is not null
on conflict (source_type, source_id, source_field) do nothing;

-- Ticket promo codes (validity windows)
insert into schedule_entries (project_id, source_type, source_id, source_field, starts_at, ends_at, category, title, subtitle, icon)
select tpc.project_id, 'ticket_promo_code', tpc.id, 'validity_window',
  tpc.valid_from, tpc.valid_until, 'ticketing',
  'Promo: ' || tpc.code, tpc.discount_type || ' ' || tpc.discount_value::text, '🏷️'
from ticket_promo_codes tpc where tpc.valid_from is not null
on conflict (source_type, source_id, source_field) do nothing;

-- Credential orders (issued)
insert into schedule_entries (project_id, source_type, source_id, source_field, starts_at, category, title, icon, status, is_cancelled)
select co.project_id, 'credential_order', co.id, 'issued_at',
  co.issued_at, 'credential',
  'Credential Issued – ' || coalesce(co.group_name, 'Order #' || left(co.id::text, 8)),
  '🪪', co.status::text, co.status = 'revoked'
from credential_orders co where co.issued_at is not null
on conflict (source_type, source_id, source_field) do nothing;

-- Credential badges (expiry)
insert into schedule_entries (project_id, source_type, source_id, source_field, starts_at, category, title, icon, is_cancelled)
select co.project_id, 'credential_badge', cb.id, 'expires_at',
  cb.expires_at, 'credential',
  'Badge Expires – ' || coalesce(cb.person_name, 'Badge #' || left(cb.id::text, 8)),
  '⏰', cb.is_revoked
from credential_badges cb
join credential_orders co on co.id = cb.order_id
where cb.expires_at is not null
on conflict (source_type, source_id, source_field) do nothing;

-- Receiving records
insert into schedule_entries (project_id, source_type, source_id, source_field, starts_at, category, title, subtitle, location_id, icon, status)
select rr.project_id, 'receiving_record', rr.id, 'receiving_window',
  coalesce(rr.received_at, rr.created_at), 'logistics',
  'Receiving ' || rr.reference_number, rr.carrier_name,
  rr.location_id, '📥', rr.status::text
from receiving_records rr
on conflict (source_type, source_id, source_field) do nothing;

-- Extend approval_actions entity_type constraint to include schedule_entry
alter table approval_actions drop constraint if exists approval_actions_entity_type_check;
alter table approval_actions add constraint approval_actions_entity_type_check
  check (entity_type in (
    'deliverable', 'credential_order', 'allocation', 'fulfillment_order',
    'purchase_order', 'logistics_schedule', 'lost_found',
    'ticket', 'ticket_refund', 'schedule_entry'
  ));
