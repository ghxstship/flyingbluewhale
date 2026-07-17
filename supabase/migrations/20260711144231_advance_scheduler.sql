-- Advancing & Onboarding Merge Engine (kit 27) — Phase 4: bespoke scheduler.
--
-- Decision #2: v1 supports an external scheduler link per audience AND ships
-- a bespoke ATLVS scheduler with Calendly feature parity — availability
-- windows, buffers, min notice, daily caps, round-robin pools, timezone
-- handling, reschedule/cancel tokens in every email, ICS attachments,
-- redirect-after-booking. Bespoke is the default once live.
--
--   scheduler_event_types  — bookable meeting definitions (owner, duration,
--                            buffers, min notice, daily cap, location kind,
--                            round-robin pool). `public_token` powers the
--                            no-auth /book/[token] page.
--   scheduler_availability — weekly windows + date overrides per event type.
--   scheduler_bookings     — booked slots with invitee tz, reschedule/cancel
--                            tokens, calendar-sync external id, and the
--                            advance recipient linkage (per-audience booking
--                            links from the packet portal).
--
-- LDP: named enum on booking_state + append-only ledger. RLS: org members
-- read, manager+ writes; anonymous booking flows go through the
-- service-role client in /book/[token] server actions (never direct RLS).

do $$ begin
  create type public.scheduler_location_kind as enum ('call','on_site');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.scheduler_booking_state as enum ('booked','rescheduled','cancelled','no_show');
exception when duplicate_object then null; end $$;

create table if not exists public.scheduler_event_types (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  owner_id uuid references auth.users(id) on delete set null,
  name text not null,
  description text,
  duration_minutes integer not null default 30,
  buffer_before_minutes integer not null default 0,
  buffer_after_minutes integer not null default 0,
  min_notice_minutes integer not null default 240,
  max_per_day integer,
  location_kind public.scheduler_location_kind not null default 'call',
  round_robin_pool uuid[] not null default '{}',
  redirect_url text,
  timezone text not null default 'UTC',
  is_active boolean not null default true,
  public_token text not null default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create unique index if not exists scheduler_event_types_token_uq on public.scheduler_event_types (public_token);
create index if not exists scheduler_event_types_org_idx on public.scheduler_event_types (org_id) where deleted_at is null;

create table if not exists public.scheduler_availability (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  event_type_id uuid not null references public.scheduler_event_types(id) on delete cascade,
  -- Weekly window (weekday 0=Sunday … 6=Saturday) OR a dated override.
  weekday smallint check (weekday between 0 and 6),
  override_date date,
  start_minute integer not null default 540,
  end_minute integer not null default 1020,
  -- false on a dated override blocks the day (holiday/blackout).
  is_open boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint scheduler_availability_window check (weekday is not null or override_date is not null),
  constraint scheduler_availability_minutes check (start_minute >= 0 and end_minute <= 1440 and start_minute < end_minute)
);

create index if not exists scheduler_availability_event_idx on public.scheduler_availability (event_type_id) where deleted_at is null;
create index if not exists scheduler_availability_org_idx on public.scheduler_availability (org_id) where deleted_at is null;

create table if not exists public.scheduler_bookings (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  event_type_id uuid not null references public.scheduler_event_types(id) on delete restrict,
  -- Advance linkage: which packet recipient booked (per-audience links).
  recipient_id uuid references public.advance_send_recipients(id) on delete set null,
  assigned_host_id uuid references auth.users(id) on delete set null,
  invitee_name text,
  invitee_email text not null,
  invitee_timezone text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  booking_state public.scheduler_booking_state not null default 'booked',
  reschedule_token text not null default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  cancel_token text not null default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  external_calendar_id text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create unique index if not exists scheduler_bookings_reschedule_uq on public.scheduler_bookings (reschedule_token);
create unique index if not exists scheduler_bookings_cancel_uq on public.scheduler_bookings (cancel_token);
create index if not exists scheduler_bookings_event_start_idx on public.scheduler_bookings (event_type_id, starts_at) where deleted_at is null;
create index if not exists scheduler_bookings_org_idx on public.scheduler_bookings (org_id, starts_at desc) where deleted_at is null;
create index if not exists scheduler_bookings_recipient_idx on public.scheduler_bookings (recipient_id) where deleted_at is null;

create table if not exists public.scheduler_booking_state_transitions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  booking_id uuid not null references public.scheduler_bookings(id) on delete cascade,
  from_state public.scheduler_booking_state,
  to_state public.scheduler_booking_state not null,
  transitioned_at timestamptz not null default now(),
  transitioned_by uuid,
  reason text
);

create index if not exists scheduler_booking_transitions_booking_idx on public.scheduler_booking_state_transitions (booking_id, transitioned_at desc);
create index if not exists scheduler_booking_transitions_org_idx on public.scheduler_booking_state_transitions (org_id, transitioned_at desc);

alter table public.scheduler_event_types enable row level security;
create policy scheduler_event_types_org_select on public.scheduler_event_types for select using (private.is_org_member(org_id));
create policy scheduler_event_types_org_write on public.scheduler_event_types using (private.has_org_role(org_id, array['owner','admin','manager','controller','collaborator'])) with check (private.has_org_role(org_id, array['owner','admin','manager','controller','collaborator']));
create trigger scheduler_event_types_touch_updated_at before update on public.scheduler_event_types for each row execute function public.touch_updated_at();

alter table public.scheduler_availability enable row level security;
create policy scheduler_availability_org_select on public.scheduler_availability for select using (private.is_org_member(org_id));
create policy scheduler_availability_org_write on public.scheduler_availability using (private.has_org_role(org_id, array['owner','admin','manager','controller','collaborator'])) with check (private.has_org_role(org_id, array['owner','admin','manager','controller','collaborator']));
create trigger scheduler_availability_touch_updated_at before update on public.scheduler_availability for each row execute function public.touch_updated_at();

alter table public.scheduler_bookings enable row level security;
create policy scheduler_bookings_org_select on public.scheduler_bookings for select using (private.is_org_member(org_id));
create policy scheduler_bookings_org_write on public.scheduler_bookings using (private.has_org_role(org_id, array['owner','admin','manager','controller','collaborator'])) with check (private.has_org_role(org_id, array['owner','admin','manager','controller','collaborator']));
create trigger scheduler_bookings_touch_updated_at before update on public.scheduler_bookings for each row execute function public.touch_updated_at();

alter table public.scheduler_booking_state_transitions enable row level security;
create policy scheduler_booking_transitions_select on public.scheduler_booking_state_transitions for select using (private.is_org_member(org_id));
create policy scheduler_booking_transitions_insert on public.scheduler_booking_state_transitions for insert with check (private.has_org_role(org_id, array['owner','admin','manager','controller','collaborator']));
