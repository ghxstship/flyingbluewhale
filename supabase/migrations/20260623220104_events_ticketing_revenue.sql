-- Public Events / Ticketing + transactional Revenue (kit v7 / IMPLEMENTATION §5).
--
-- Two concerns:
--   1. event_listings + event_ticket_types — the public, anon-readable
--      box-office surface rendered in the marketing shell (/events).
--   2. revenue_orders + revenue_transactions — the transactional Revenue
--      ledger (marketplace + box office + store), distinct from Finance AR.
--
-- 3NF, RLS via private.is_org_member / private.has_org_role, LDP *_state naming
-- (never bare `status`). Public select policies gate on the published state so
-- anonymous visitors see only live listings.
--
-- CODE-READY migration — not applied to the live project here. The operator
-- applies it, then regenerates database.types.ts.

-- ── event_listings (public box-office surface) ─────────────────────────────
create table public.event_listings (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  event_id uuid references public.events(id) on delete set null,
  slug text not null,
  title text not null,
  summary text,
  hero_image text,
  venue_name text,
  starts_at timestamptz,
  ends_at timestamptz,
  listing_state text not null default 'draft' check (listing_state in ('draft', 'published', 'archived')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (slug)
);
create index event_listings_org_idx on public.event_listings (org_id, starts_at) where deleted_at is null;
create index event_listings_published_idx on public.event_listings (listing_state, starts_at) where deleted_at is null;

alter table public.event_listings enable row level security;
-- Anonymous + authenticated may read published, non-deleted listings.
create policy event_listings_public_select on public.event_listings
  for select using (listing_state = 'published' and deleted_at is null);
create policy event_listings_member_select on public.event_listings
  for select using (private.is_org_member(org_id));
create policy event_listings_write on public.event_listings
  for all using (private.has_org_role(org_id, array['owner', 'admin', 'manager']))
  with check (private.has_org_role(org_id, array['owner', 'admin', 'manager']));
create trigger trg_event_listings_updated before update on public.event_listings
  for each row execute function public.compvss_set_updated_at();
grant select on public.event_listings to anon;
grant select, insert, update, delete on public.event_listings to authenticated;

-- ── event_ticket_types (priced inventory per listing) ──────────────────────
create table public.event_ticket_types (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  event_listing_id uuid not null references public.event_listings(id) on delete cascade,
  name text not null,
  description text,
  price_cents integer not null default 0 check (price_cents >= 0),
  currency text not null default 'usd',
  quantity_total integer not null default 0 check (quantity_total >= 0),
  quantity_sold integer not null default 0 check (quantity_sold >= 0),
  sales_state text not null default 'on_sale' check (sales_state in ('on_sale', 'sold_out', 'closed')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index event_ticket_types_listing_idx on public.event_ticket_types (event_listing_id, sort_order) where deleted_at is null;

alter table public.event_ticket_types enable row level security;
-- Public read when the parent listing is published.
create policy event_ticket_types_public_select on public.event_ticket_types
  for select using (
    deleted_at is null
    and exists (
      select 1 from public.event_listings l
      where l.id = event_ticket_types.event_listing_id and l.listing_state = 'published' and l.deleted_at is null
    )
  );
create policy event_ticket_types_member_select on public.event_ticket_types
  for select using (private.is_org_member(org_id));
create policy event_ticket_types_write on public.event_ticket_types
  for all using (private.has_org_role(org_id, array['owner', 'admin', 'manager']))
  with check (private.has_org_role(org_id, array['owner', 'admin', 'manager']));
create trigger trg_event_ticket_types_updated before update on public.event_ticket_types
  for each row execute function public.compvss_set_updated_at();
grant select on public.event_ticket_types to anon;
grant select, insert, update, delete on public.event_ticket_types to authenticated;

-- ── revenue_orders (marketplace + box office + store) ──────────────────────
create table public.revenue_orders (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  order_source text not null check (order_source in ('marketplace', 'box_office', 'store')),
  reference text not null,
  buyer_name text,
  buyer_email text,
  subtotal_cents integer not null default 0,
  total_cents integer not null default 0,
  currency text not null default 'usd',
  order_state text not null default 'pending'
    check (order_state in ('pending', 'paid', 'fulfilled', 'refunded', 'cancelled')),
  event_listing_id uuid references public.event_listings(id) on delete set null,
  checkout_session_id text,
  placed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index revenue_orders_org_idx on public.revenue_orders (org_id, placed_at desc) where deleted_at is null;
create index revenue_orders_source_idx on public.revenue_orders (org_id, order_source, order_state);

alter table public.revenue_orders enable row level security;
create policy revenue_orders_select on public.revenue_orders
  for select using (private.is_org_member(org_id));
create policy revenue_orders_write on public.revenue_orders
  for all using (private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller']))
  with check (private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller']));
create trigger trg_revenue_orders_updated before update on public.revenue_orders
  for each row execute function public.compvss_set_updated_at();
grant select, insert, update, delete on public.revenue_orders to authenticated;

-- ── revenue_transactions (charges / refunds / payouts / fees) ──────────────
create table public.revenue_transactions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  order_id uuid references public.revenue_orders(id) on delete set null,
  txn_kind text not null check (txn_kind in ('charge', 'refund', 'payout', 'fee', 'adjustment')),
  amount_cents integer not null,
  currency text not null default 'usd',
  txn_state text not null default 'pending' check (txn_state in ('pending', 'succeeded', 'failed')),
  processor text not null default 'stripe',
  processor_ref text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index revenue_transactions_org_idx on public.revenue_transactions (org_id, occurred_at desc);
create index revenue_transactions_order_idx on public.revenue_transactions (order_id);

alter table public.revenue_transactions enable row level security;
create policy revenue_transactions_select on public.revenue_transactions
  for select using (private.is_org_member(org_id));
create policy revenue_transactions_write on public.revenue_transactions
  for all using (private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller']))
  with check (private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller']));
grant select, insert, update, delete on public.revenue_transactions to authenticated;
