-- Remediation C: promote event_listings.listing_state to a native enum.
-- APPLIED 2026-07-18 (ledger 20260718152423). Blocked by two RLS policies (same-table
-- event_listings_public_select + cross-table event_ticket_types_public_select) → dropped,
-- altered, recreated identically with the literal cast to the enum. Plain index
-- event_listings_published_idx auto-rebuilds.
drop policy if exists event_listings_public_select on public.event_listings;
drop policy if exists event_ticket_types_public_select on public.event_ticket_types;

create type public.event_listing_state as enum ('draft','published','archived');
alter table public.event_listings drop constraint if exists event_listings_listing_state_check;
alter table public.event_listings alter column listing_state drop default;
alter table public.event_listings alter column listing_state type public.event_listing_state using listing_state::public.event_listing_state;
alter table public.event_listings alter column listing_state set default 'draft';

create policy event_listings_public_select on public.event_listings
  for select to public
  using (listing_state = 'published'::public.event_listing_state and deleted_at is null);

create policy event_ticket_types_public_select on public.event_ticket_types
  for select to public
  using (deleted_at is null and exists (
    select 1 from public.event_listings l
    where l.id = event_ticket_types.event_listing_id
      and l.listing_state = 'published'::public.event_listing_state
      and l.deleted_at is null));
