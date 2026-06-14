-- Box office / door scan / guest list — GVTEWAY host & commerce console.
--
-- Mirrors the DICE/TIXR box-office + door pattern. Two tables:
--   guest_lists          — one named list per (org × event), e.g. "Artist Comps",
--                          "VIP", "Press". Org+event scoped.
--   guest_list_entries   — one row per guest on a list (name + plus-ones),
--                          carrying the cyclical door lifecycle.
--
-- Door scan conceptually reuses the assignment_scan_codes / scanAssignment
-- pattern, but for guest-list entries: each entry carries an opaque
-- `scan_code` (UNIQUE per org, active rows only) so a door device resolves a
-- scan -> entry in O(1) and flips entry_state pending -> arrived, stamping
-- `checked_in_at`. Re-presenting an already-arrived code is a duplicate scan.
--
-- LDP: the door arc is a cyclical operational lifecycle -> `entry_state`
-- (NOT `status`). Backed by a postgres enum type so illegal values are
-- rejected at the DB boundary.

-- ── enum ────────────────────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_type where typname = 'guest_entry_state') then
    create type public.guest_entry_state as enum ('pending', 'arrived', 'denied');
  end if;
end$$;

-- ── guest_lists ─────────────────────────────────────────────────────
create table if not exists public.guest_lists (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  event_id uuid references public.events(id) on delete set null,
  name text not null,
  notes text,
  created_by uuid references auth.users(id),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists guest_lists_org_event_idx
  on public.guest_lists (org_id, event_id);

alter table public.guest_lists enable row level security;

create policy guest_lists_org_select
  on public.guest_lists for select
  using (private.is_org_member(org_id));

create policy guest_lists_org_write
  on public.guest_lists
  using (private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller', 'collaborator']))
  with check (private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller', 'collaborator']));

create trigger guest_lists_touch_updated_at
  before update on public.guest_lists
  for each row execute function public.touch_updated_at();

-- ── guest_list_entries ──────────────────────────────────────────────
create table if not exists public.guest_list_entries (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  guest_list_id uuid not null references public.guest_lists(id) on delete cascade,
  guest_name text not null,
  plus_ones integer not null default 0 check (plus_ones >= 0),
  entry_state public.guest_entry_state not null default 'pending',
  -- Opaque door token. UNIQUE per org over non-deleted rows so reprints /
  -- re-issues never collide while preserving audit history. Mirrors the
  -- assignment_scan_codes `UNIQUE (org_id, code) WHERE active` shape.
  scan_code text,
  checked_in_at timestamptz,
  checked_in_by uuid references auth.users(id),
  notes text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists guest_list_entries_list_idx
  on public.guest_list_entries (org_id, guest_list_id, created_at desc);

create unique index if not exists guest_list_entries_scan_code_uq
  on public.guest_list_entries (org_id, scan_code)
  where scan_code is not null and deleted_at is null;

alter table public.guest_list_entries enable row level security;

create policy guest_list_entries_org_select
  on public.guest_list_entries for select
  using (private.is_org_member(org_id));

create policy guest_list_entries_org_write
  on public.guest_list_entries
  using (private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller', 'collaborator']))
  with check (private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller', 'collaborator']));

create trigger guest_list_entries_touch_updated_at
  before update on public.guest_list_entries
  for each row execute function public.touch_updated_at();
