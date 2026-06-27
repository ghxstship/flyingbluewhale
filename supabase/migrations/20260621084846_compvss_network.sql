-- ── connections (ATLVS professional network — cross-org, user-owned graph) ──
create table public.connections (
  id uuid primary key default gen_random_uuid(),
  requester_user_id uuid not null references auth.users(id) on delete cascade,
  addressee_user_id uuid not null references auth.users(id) on delete cascade,
  connection_state text not null default 'pending' check (connection_state in ('pending','connected','declined','blocked')),
  requested_at timestamptz not null default now(),
  responded_at timestamptz,
  constraint connections_distinct check (requester_user_id <> addressee_user_id),
  constraint connections_unique_pair unique (requester_user_id, addressee_user_id)
);
create index connections_addressee_idx on public.connections (addressee_user_id, connection_state);
create index connections_requester_idx on public.connections (requester_user_id, connection_state);
alter table public.connections enable row level security;
create policy connections_select on public.connections for select using (requester_user_id = auth.uid() or addressee_user_id = auth.uid());
create policy connections_insert on public.connections for insert with check (requester_user_id = auth.uid());
create policy connections_update on public.connections for update using (requester_user_id = auth.uid() or addressee_user_id = auth.uid()) with check (requester_user_id = auth.uid() or addressee_user_id = auth.uid());
create policy connections_delete on public.connections for delete using (requester_user_id = auth.uid() or addressee_user_id = auth.uid());
grant select, insert, update, delete on public.connections to authenticated;

-- ── marketplace_listings (crew buy/sell/trade gear, org-scoped) ───────────
create table public.marketplace_listings (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  seller_user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  price_cents bigint,
  currency text not null default 'USD',
  item_condition text check (item_condition in ('new','like_new','used','for_parts')),
  category text,
  listing_state text not null default 'active' check (listing_state in ('draft','active','sold','withdrawn')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index marketplace_listings_org_idx on public.marketplace_listings (org_id, listing_state, created_at desc);
alter table public.marketplace_listings enable row level security;
create policy marketplace_listings_select on public.marketplace_listings for select using (private.is_org_member(org_id));
create policy marketplace_listings_insert on public.marketplace_listings for insert with check (private.is_org_member(org_id) and seller_user_id = auth.uid());
create policy marketplace_listings_update on public.marketplace_listings for update using (seller_user_id = auth.uid() or private.has_org_role(org_id, array['owner','admin'])) with check (seller_user_id = auth.uid() or private.has_org_role(org_id, array['owner','admin']));
create policy marketplace_listings_delete on public.marketplace_listings for delete using (seller_user_id = auth.uid() or private.has_org_role(org_id, array['owner','admin']));
create trigger trg_marketplace_listings_updated before update on public.marketplace_listings for each row execute function public.compvss_set_updated_at();
grant select, insert, update, delete on public.marketplace_listings to authenticated;

create table public.marketplace_listing_photos (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  listing_id uuid not null references public.marketplace_listings(id) on delete cascade,
  storage_path text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);
create index marketplace_listing_photos_idx on public.marketplace_listing_photos (listing_id, position);
alter table public.marketplace_listing_photos enable row level security;
create policy marketplace_listing_photos_select on public.marketplace_listing_photos for select using (private.is_org_member(org_id));
create policy marketplace_listing_photos_insert on public.marketplace_listing_photos for insert with check (private.is_org_member(org_id) and exists (select 1 from public.marketplace_listings l where l.id = listing_id and l.seller_user_id = auth.uid()));
create policy marketplace_listing_photos_delete on public.marketplace_listing_photos for delete using (exists (select 1 from public.marketplace_listings l where l.id = listing_id and (l.seller_user_id = auth.uid() or private.has_org_role(l.org_id, array['owner','admin']))));
grant select, insert, update, delete on public.marketplace_listing_photos to authenticated;

-- ── referrals (affiliate program — user-owned) ────────────────────────────
create table public.referral_codes (
  user_id uuid primary key references auth.users(id) on delete cascade,
  code text not null unique,
  points integer not null default 0,
  tier text not null default 'bronze',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.referral_codes enable row level security;
create policy referral_codes_select on public.referral_codes for select using (user_id = auth.uid());
create policy referral_codes_insert on public.referral_codes for insert with check (user_id = auth.uid());
create policy referral_codes_update on public.referral_codes for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create trigger trg_referral_codes_updated before update on public.referral_codes for each row execute function public.compvss_set_updated_at();
grant select, insert, update, delete on public.referral_codes to authenticated;

create table public.referral_invitations (
  id uuid primary key default gen_random_uuid(),
  referrer_user_id uuid not null references auth.users(id) on delete cascade,
  invitee_contact text not null,
  invite_state text not null default 'invited' check (invite_state in ('invited','joined','hired')),
  reward_cents bigint,
  reward_points integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index referral_invitations_referrer_idx on public.referral_invitations (referrer_user_id, created_at desc);
alter table public.referral_invitations enable row level security;
create policy referral_invitations_select on public.referral_invitations for select using (referrer_user_id = auth.uid());
create policy referral_invitations_insert on public.referral_invitations for insert with check (referrer_user_id = auth.uid());
create policy referral_invitations_update on public.referral_invitations for update using (referrer_user_id = auth.uid()) with check (referrer_user_id = auth.uid());
create trigger trg_referral_invitations_updated before update on public.referral_invitations for each row execute function public.compvss_set_updated_at();
grant select, insert, update, delete on public.referral_invitations to authenticated;
