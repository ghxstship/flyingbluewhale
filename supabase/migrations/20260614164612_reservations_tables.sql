-- Reservations & tables — COMPVSS Site & Venue Ops table-reservations module.
--
-- Two org-scoped tables mirroring SevenRooms-style floor-plan seating:
--   * venue_tables — the physical floor plan. One row per seating table with
--     an (x, y) position so the console can render a draggable floor-plan view.
--   * reservations — a booking against a table. The booking lifecycle is a
--     cyclical operational state machine (booked → seated → completed, with
--     no_show / cancelled exits).
--
-- LDP naming discipline (LIFECYCLE_DECOMPOSITION_PROTOCOL.md §NAMING
-- DISCIPLINE): no bare `status`. The table floor-plan lifecycle lives in
-- `table_state` and the booking lifecycle in `reservation_state`, both backed
-- by postgres enum types. RLS mirrors the canonical pattern: org members read,
-- manager+ writes; soft-delete via `deleted_at`; updated_at touch trigger.

-- ── Enum types ──────────────────────────────────────────────────────────────

-- Cyclical operational lifecycle for a physical table on the floor plan.
create type public.venue_table_state as enum (
  'available',
  'reserved',
  'occupied',
  'out_of_service'
);

-- Cyclical operational lifecycle for a single reservation.
create type public.reservation_state as enum (
  'booked',
  'seated',
  'completed',
  'no_show',
  'cancelled'
);

-- ── venue_tables ────────────────────────────────────────────────────────────

create table public.venue_tables (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  table_no text not null,
  seats integer not null default 2,
  zone text,
  -- Floor-plan position. Stored as numeric so the editor can place tables at
  -- fractional grid coordinates; the console renders these on an SVG canvas.
  x numeric not null default 0,
  y numeric not null default 0,
  table_state public.venue_table_state not null default 'available',
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint venue_tables_seats_positive check (seats > 0),
  constraint venue_tables_table_no_len check (char_length(table_no) between 1 and 40)
);

comment on table public.venue_tables is
  'Physical seating tables on a venue floor plan (COMPVSS Site & Venue Ops). x/y position drives the floor-plan view; table_state is the operational lifecycle.';

create unique index venue_tables_org_table_no_uniq
  on public.venue_tables (org_id, table_no)
  where deleted_at is null;

create index venue_tables_org_idx on public.venue_tables (org_id, table_state);

alter table public.venue_tables enable row level security;

create policy venue_tables_org_select
  on public.venue_tables for select
  using (private.is_org_member(org_id) and deleted_at is null);

create policy venue_tables_org_write
  on public.venue_tables
  using (private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller', 'collaborator']))
  with check (private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller', 'collaborator']));

create trigger venue_tables_touch_updated_at
  before update on public.venue_tables
  for each row execute function public.touch_updated_at();

-- ── reservations ────────────────────────────────────────────────────────────

create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  table_id uuid references public.venue_tables(id) on delete set null,
  guest_name text not null,
  party_size integer not null default 2,
  reserved_for timestamptz not null,
  reservation_state public.reservation_state not null default 'booked',
  contact_phone text,
  contact_email text,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint reservations_party_positive check (party_size > 0),
  constraint reservations_guest_name_len check (char_length(guest_name) between 1 and 120),
  constraint reservations_email_len check (contact_email is null or char_length(contact_email) <= 200),
  constraint reservations_phone_len check (contact_phone is null or char_length(contact_phone) <= 40)
);

comment on table public.reservations is
  'Table reservations (COMPVSS Site & Venue Ops). reservation_state is the booking lifecycle; table_id links to the floor-plan table when assigned.';

create index reservations_org_idx on public.reservations (org_id, reservation_state);
create index reservations_org_reserved_for_idx on public.reservations (org_id, reserved_for);
create index reservations_table_idx on public.reservations (table_id) where table_id is not null;

alter table public.reservations enable row level security;

create policy reservations_org_select
  on public.reservations for select
  using (private.is_org_member(org_id) and deleted_at is null);

create policy reservations_org_write
  on public.reservations
  using (private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller', 'collaborator']))
  with check (private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller', 'collaborator']));

create trigger reservations_touch_updated_at
  before update on public.reservations
  for each row execute function public.touch_updated_at();
