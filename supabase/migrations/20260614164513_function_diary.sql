-- Function Diary (room/space booking) — ATLVS Sales & CRM.
--
-- A function diary is a calendar of room/space bookings: bookable venue
-- spaces (rooms, ballrooms, suites, outdoor lots) crossed with date/time
-- ranges, each carrying a hold/tentative/confirmed/cancelled lifecycle.
-- Mirrors SevenRooms / TripleSeat function-diary semantics.
--
-- Two tables:
--   • function_spaces   — org-scoped catalog of bookable rooms/spaces.
--   • function_bookings — one row per (space × time window), with an
--                         optional link to a project and/or client.
--
-- LDP NAMING DISCIPLINE: no bare `status`. The space catalog uses a
-- cyclical operational lifecycle → `space_state`. The booking uses the
-- cyclical hold→confirmed→cancelled operational lifecycle → `booking_state`,
-- backed by a postgres enum type (lifecycle enums get a named type).
-- Both tables: org_id → orgs, RLS via private.is_org_member (read) /
-- private.has_org_role (write), soft-delete via deleted_at, updated_at
-- touch trigger.

-- ── Lifecycle enum type ─────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_type where typname = 'function_booking_state') then
    create type public.function_booking_state as enum (
      'hold',
      'tentative',
      'confirmed',
      'cancelled'
    );
  end if;
end$$;

-- ── function_spaces ─────────────────────────────────────────────────
create table if not exists public.function_spaces (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  name text not null,
  -- Optional venue / building grouping label (e.g. "Grand Hotel — L2").
  venue text,
  capacity integer check (capacity is null or capacity >= 0),
  -- Cyclical operational lifecycle for the space itself (LDP: not `status`).
  space_state text not null default 'active'
    check (space_state in ('active', 'inactive', 'archived')),
  notes text,
  sort_order integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists function_spaces_org_idx
  on public.function_spaces (org_id, sort_order)
  where deleted_at is null;

alter table public.function_spaces enable row level security;

create policy function_spaces_org_select
  on public.function_spaces for select
  using (private.is_org_member(org_id));

create policy function_spaces_org_write
  on public.function_spaces
  using (private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller', 'collaborator']))
  with check (private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller', 'collaborator']));

create trigger function_spaces_touch_updated_at
  before update on public.function_spaces
  for each row execute function public.touch_updated_at();

-- ── function_bookings ───────────────────────────────────────────────
create table if not exists public.function_bookings (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  space_id uuid not null references public.function_spaces(id) on delete restrict,
  -- Optional cross-links. Bookings can exist before a project/client is
  -- assigned (a speculative hold), so both are nullable.
  project_id uuid references public.projects(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  booking_state public.function_booking_state not null default 'hold',
  headcount integer check (headcount is null or headcount >= 0),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint function_bookings_window_ck check (ends_at > starts_at)
);

-- Diary grid is queried by space × time window — index the hot path.
create index if not exists function_bookings_space_window_idx
  on public.function_bookings (org_id, space_id, starts_at)
  where deleted_at is null;

create index if not exists function_bookings_window_idx
  on public.function_bookings (org_id, starts_at)
  where deleted_at is null;

create index if not exists function_bookings_project_idx
  on public.function_bookings (org_id, project_id)
  where deleted_at is null;

create index if not exists function_bookings_client_idx
  on public.function_bookings (org_id, client_id)
  where deleted_at is null;

alter table public.function_bookings enable row level security;

create policy function_bookings_org_select
  on public.function_bookings for select
  using (private.is_org_member(org_id));

create policy function_bookings_org_write
  on public.function_bookings
  using (private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller', 'collaborator']))
  with check (private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller', 'collaborator']));

create trigger function_bookings_touch_updated_at
  before update on public.function_bookings
  for each row execute function public.touch_updated_at();
