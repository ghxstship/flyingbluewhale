-- Competitive features batch — 2026-06-29
--
-- 1. Ticket scan windows (Eventbrite April 2026):
--    scan_opens_at / scan_closes_at on master_catalog_items + window_closed result.
-- 2. Event waitlist (marketplace parity — Tixr / Eventbrite):
--    catalog_waitlist — position-ordered queue per catalog item.
--
-- Naming: LDP-compliant (no bare `status`). RLS via private.is_org_member / private.has_org_role.

-- ── 1 · Extend scan result enum ─────────────────────────────────────────────
alter type public.assignment_scan_result add value if not exists 'window_closed';

comment on type public.assignment_scan_result is
  'Gate-scan audit result: accepted, duplicate, voided, not_found, expired, wrong_zone, window_closed.';

-- ── 2 · Scan windows on catalog items (ticket kind) ─────────────────────────
alter table public.master_catalog_items
  add column if not exists scan_opens_at  timestamptz,
  add column if not exists scan_closes_at timestamptz;

-- Ordered constraint: if both are set, open must precede close.
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'mci_scan_window_order'
      and conrelid = 'public.master_catalog_items'::regclass
  ) then
    alter table public.master_catalog_items
      add constraint mci_scan_window_order
        check (scan_opens_at is null or scan_closes_at is null or scan_opens_at < scan_closes_at);
  end if;
end $$;

comment on column public.master_catalog_items.scan_opens_at  is
  'Earliest wall-clock time this ticket type can be scanned at the gate. NULL = open from issuance.';
comment on column public.master_catalog_items.scan_closes_at is
  'Latest wall-clock time this ticket type can be scanned. NULL = no expiry window.';

-- ── 3 · catalog_waitlist ─────────────────────────────────────────────────────
create table if not exists public.catalog_waitlist (
  id               uuid        primary key default gen_random_uuid(),
  org_id           uuid        not null references public.orgs(id) on delete cascade,
  catalog_item_id  uuid        not null references public.master_catalog_items(id) on delete cascade,
  -- party: exactly one of user (on-platform) or email (off-platform guest).
  party_user_id    uuid        references auth.users(id) on delete cascade,
  party_email      text,
  party_name       text,
  position         integer     not null,
  joined_at        timestamptz not null default now(),
  notified_at      timestamptz,
  -- one-of constraint
  constraint catalog_waitlist_party_check check (
    (party_user_id is not null and party_email is null)
    or (party_user_id is null and party_email is not null)
  )
);

-- Duplicate-join guards: one spot per user / per email per item.
create unique index if not exists catalog_waitlist_user_unique
  on public.catalog_waitlist (catalog_item_id, party_user_id)
  where party_user_id is not null;

create unique index if not exists catalog_waitlist_email_unique
  on public.catalog_waitlist (catalog_item_id, party_email)
  where party_email is not null;

-- FK indexes.
create index if not exists catalog_waitlist_org_idx     on public.catalog_waitlist (org_id);
create index if not exists catalog_waitlist_item_idx    on public.catalog_waitlist (catalog_item_id, position);
create index if not exists catalog_waitlist_user_idx    on public.catalog_waitlist (party_user_id) where party_user_id is not null;

-- Position auto-assignment: next-in-line per item.
create or replace function private.assign_waitlist_position()
returns trigger language plpgsql as $$
begin
  new.position := coalesce(
    (select max(position) from public.catalog_waitlist where catalog_item_id = new.catalog_item_id),
    0
  ) + 1;
  return new;
end;
$$;

drop trigger if exists trg_catalog_waitlist_position on public.catalog_waitlist;
create trigger trg_catalog_waitlist_position
  before insert on public.catalog_waitlist
  for each row execute function private.assign_waitlist_position();

-- RLS
alter table public.catalog_waitlist enable row level security;

-- Members read the full queue for their org.
create policy "catalog_waitlist_member_select"
  on public.catalog_waitlist for select
  using (private.is_org_member(org_id));

-- Users join for themselves (party_user_id = caller).
create policy "catalog_waitlist_user_insert"
  on public.catalog_waitlist for insert
  with check (
    private.is_org_member(org_id)
    and (party_user_id = (select auth.uid()) or party_user_id is null)
  );

-- Users leave their own spot; manager+ can remove any entry.
create policy "catalog_waitlist_user_delete"
  on public.catalog_waitlist for delete
  using (
    party_user_id = (select auth.uid())
    or private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller'])
  );

-- Manager+ marks notified_at (notify action).
create policy "catalog_waitlist_manager_update"
  on public.catalog_waitlist for update
  using  (private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller']))
  with check (private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller']));

comment on table public.catalog_waitlist is
  'Position-ordered waiting list per catalog item. Populated when inventory_qty is exhausted; manager notifies entries manually or via automation.';
