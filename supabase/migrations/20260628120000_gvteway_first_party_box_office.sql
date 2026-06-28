-- GVTEWAY first-party box office (kit v8 / IMPLEMENTATION §5 · organizer.jsx).
--
-- Extends the existing events/ticketing/revenue schema (20260623220104) with the
-- FIRST-PARTY seller-of-record path: a dual fulfillment model on the listing, the
-- per-attendee issued pass (event_tickets), the door scan journal
-- (event_ticket_scans), and the settlement ledger (event_payouts). Provider-
-- aggregated events keep the read-only handoff; first-party events are sold,
-- issued, scanned, and settled in-platform.
--
-- 3NF, RLS via private.is_org_member / private.has_org_role, LDP *_state naming
-- (no bare `status`). The door write-path is a SECURITY DEFINER RPC so field
-- staff (members) can redeem without broad table-write grants.

-- ── 1 · dual fulfillment on the listing ────────────────────────────────────
alter table public.event_listings
  add column if not exists fulfillment text not null default 'provider'
    check (fulfillment in ('provider', 'first_party')),
  add column if not exists provider_name text,          -- aggregator label in provider mode
  add column if not exists seat_map jsonb;               -- FloorPlan zone placements (first-party seating)

-- optional seating zone per priced tier (drives the organizer Seating view)
alter table public.event_ticket_types
  add column if not exists seating_zone text;

-- ── 2 · event_tickets (the issued, scannable wallet pass) ──────────────────
create table if not exists public.event_tickets (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  event_listing_id uuid not null references public.event_listings(id) on delete cascade,
  ticket_type_id uuid references public.event_ticket_types(id) on delete set null,
  order_id uuid references public.revenue_orders(id) on delete set null,
  holder_user_id uuid references auth.users(id) on delete set null,
  holder_name text,
  holder_email text,
  code text not null,                      -- scannable QR/barcode payload
  seat_label text,
  seating_zone text,
  ticket_state text not null default 'issued'
    check (ticket_state in ('issued', 'transferred', 'redeemed', 'voided', 'refunded')),
  issued_at timestamptz not null default now(),
  redeemed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (org_id, code)
);
create index if not exists event_tickets_listing_idx on public.event_tickets (event_listing_id, ticket_state) where deleted_at is null;
create index if not exists event_tickets_holder_idx on public.event_tickets (holder_user_id) where deleted_at is null;
create index if not exists event_tickets_order_idx on public.event_tickets (order_id);

alter table public.event_tickets enable row level security;
-- The holder reads their own pass (the wallet); org members read all; manager+ writes.
create policy event_tickets_holder_select on public.event_tickets
  for select using (holder_user_id = (select auth.uid()));
create policy event_tickets_member_select on public.event_tickets
  for select using (private.is_org_member(org_id));
create policy event_tickets_write on public.event_tickets
  for all using (private.has_org_role(org_id, array['owner', 'admin', 'manager']))
  with check (private.has_org_role(org_id, array['owner', 'admin', 'manager']));
create trigger trg_event_tickets_updated before update on public.event_tickets
  for each row execute function public.compvss_set_updated_at();
grant select, insert, update, delete on public.event_tickets to authenticated;

-- ── 3 · event_ticket_scans (append-only door journal) ──────────────────────
create table if not exists public.event_ticket_scans (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  event_listing_id uuid references public.event_listings(id) on delete set null,
  ticket_id uuid references public.event_tickets(id) on delete set null,
  scanned_code text,                       -- raw code presented (kept even on not_found)
  result text not null
    check (result in ('accepted', 'duplicate', 'refunded', 'voided', 'not_found', 'wrong_event')),
  gate text,
  location text,
  scanned_by uuid references auth.users(id) on delete set null,
  scanned_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists event_ticket_scans_listing_idx on public.event_ticket_scans (event_listing_id, scanned_at desc);
create index if not exists event_ticket_scans_ticket_idx on public.event_ticket_scans (ticket_id);

alter table public.event_ticket_scans enable row level security;
create policy event_ticket_scans_select on public.event_ticket_scans
  for select using (private.is_org_member(org_id));
-- Any org member (door staff) may log a scan; the redeem RPC is the sanctioned path.
create policy event_ticket_scans_insert on public.event_ticket_scans
  for insert with check (private.is_org_member(org_id));
grant select, insert on public.event_ticket_scans to authenticated;

-- ── 4 · event_payouts (first-party settlement ledger) ──────────────────────
create table if not exists public.event_payouts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  event_listing_id uuid references public.event_listings(id) on delete set null,
  period_label text,
  gross_cents integer not null default 0,
  fees_cents integer not null default 0,
  refunds_cents integer not null default 0,
  platform_cents integer not null default 0,
  net_cents integer not null default 0,
  currency text not null default 'usd',
  account text,                            -- masked destination (bank / Stripe acct)
  payout_state text not null default 'scheduled'
    check (payout_state in ('scheduled', 'in_transit', 'paid', 'failed')),
  scheduled_for timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists event_payouts_org_idx on public.event_payouts (org_id, scheduled_for desc);
create index if not exists event_payouts_listing_idx on public.event_payouts (event_listing_id);

alter table public.event_payouts enable row level security;
create policy event_payouts_select on public.event_payouts
  for select using (private.is_org_member(org_id));
create policy event_payouts_write on public.event_payouts
  for all using (private.has_org_role(org_id, array['owner', 'admin', 'controller']))
  with check (private.has_org_role(org_id, array['owner', 'admin', 'controller']));
create trigger trg_event_payouts_updated before update on public.event_payouts
  for each row execute function public.compvss_set_updated_at();
grant select, insert, update, delete on public.event_payouts to authenticated;

-- ── 5 · redeem_event_ticket — the door write-path (SECURITY DEFINER) ───────
-- Resolves a scanned code → ticket within the caller's org, classifies the
-- result (accepted/duplicate/refunded/voided/not_found), flips a valid ticket
-- to redeemed, and append-logs the scan. Lets member-level door staff redeem
-- without table-write grants. Returns the result + holder for the door UI.
create or replace function public.redeem_event_ticket(
  p_code text,
  p_gate text default null,
  p_location text default null
) returns jsonb
language plpgsql security definer set search_path = public, private as $$
declare
  v public.event_tickets;
  v_result text;
begin
  select * into v from public.event_tickets
   where code = p_code and deleted_at is null
   order by issued_at desc limit 1;

  if v.id is null then
    return jsonb_build_object('result', 'not_found');
  end if;

  if not private.is_org_member(v.org_id) then
    raise exception 'not authorized to scan in this organization';
  end if;

  if v.ticket_state = 'refunded' then v_result := 'refunded';
  elsif v.ticket_state = 'voided' then v_result := 'voided';
  elsif v.ticket_state = 'redeemed' then v_result := 'duplicate';
  else
    v_result := 'accepted';
    update public.event_tickets
       set ticket_state = 'redeemed', redeemed_at = now(), updated_at = now()
     where id = v.id;
  end if;

  insert into public.event_ticket_scans
    (org_id, event_listing_id, ticket_id, scanned_code, result, gate, location, scanned_by)
  values
    (v.org_id, v.event_listing_id, v.id, p_code, v_result, p_gate, p_location, (select auth.uid()));

  return jsonb_build_object(
    'result', v_result,
    'ticket_id', v.id,
    'holder', coalesce(v.holder_name, v.holder_email),
    'seat', v.seat_label,
    'zone', v.seating_zone
  );
end $$;
grant execute on function public.redeem_event_ticket(text, text, text) to authenticated;
