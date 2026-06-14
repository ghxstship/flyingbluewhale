-- GVTEWAY commerce admin — discount codes + promoter/affiliate commission splits.
--
-- Mirrors Shopify discounts (codes with kind/value/redemption caps) and
-- Posh.VIP affiliates (promoters earn a bps commission, attributed per
-- transaction). Three org-scoped tables:
--   - discount_codes        : redeemable codes, percent or fixed value
--   - promoters             : affiliate/promoter directory, commission_bps
--   - promoter_attributions : per-transaction commission ledger rows
--
-- LDP naming discipline: NO bare `status`. The discount lifecycle is a
-- cyclical operational state → `discount_state` (postgres enum type, since
-- it is a lifecycle column). Promoters use a cyclical `promoter_state`.

-- ── enum types ──────────────────────────────────────────────────────────
do $$ begin
  create type public.discount_kind as enum ('percent', 'fixed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.discount_state as enum ('active', 'paused', 'expired');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.promoter_state as enum ('active', 'paused', 'archived');
exception when duplicate_object then null; end $$;

-- ── discount_codes ──────────────────────────────────────────────────────
create table if not exists public.discount_codes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  code text not null,
  kind public.discount_kind not null default 'percent',
  -- percent: basis points of the order (e.g. 1000 = 10%); fixed: cents off.
  value integer not null check (value >= 0),
  max_redemptions integer check (max_redemptions is null or max_redemptions >= 0),
  redeemed_count integer not null default 0 check (redeemed_count >= 0),
  discount_state public.discount_state not null default 'active',
  starts_at timestamptz,
  ends_at timestamptz,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Code is unique per org (case-insensitive), ignoring soft-deleted rows.
create unique index if not exists discount_codes_org_code_uniq
  on public.discount_codes (org_id, lower(code))
  where deleted_at is null;

create index if not exists discount_codes_org_state_idx
  on public.discount_codes (org_id, discount_state)
  where deleted_at is null;

alter table public.discount_codes enable row level security;

create policy discount_codes_org_select
  on public.discount_codes for select
  using (private.is_org_member(org_id));

create policy discount_codes_org_write
  on public.discount_codes
  using (private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller', 'collaborator']))
  with check (private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller', 'collaborator']));

create trigger discount_codes_touch_updated_at
  before update on public.discount_codes
  for each row execute function public.touch_updated_at();

-- ── promoters ───────────────────────────────────────────────────────────
create table if not exists public.promoters (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  name text not null,
  email text,
  -- commission rate in basis points (e.g. 1500 = 15%).
  commission_bps integer not null default 1000 check (commission_bps between 0 and 10000),
  ref_code text,
  promoter_state public.promoter_state not null default 'active',
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create unique index if not exists promoters_org_ref_code_uniq
  on public.promoters (org_id, lower(ref_code))
  where ref_code is not null and deleted_at is null;

create index if not exists promoters_org_state_idx
  on public.promoters (org_id, promoter_state)
  where deleted_at is null;

alter table public.promoters enable row level security;

create policy promoters_org_select
  on public.promoters for select
  using (private.is_org_member(org_id));

create policy promoters_org_write
  on public.promoters
  using (private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller', 'collaborator']))
  with check (private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller', 'collaborator']));

create trigger promoters_touch_updated_at
  before update on public.promoters
  for each row execute function public.touch_updated_at();

-- ── promoter_attributions ───────────────────────────────────────────────
-- One row per attributed transaction. `transaction_ref` is a free-form
-- pointer (order id / invoice id / external ref); `amount_cents` is the
-- gross transaction amount the commission is computed against, and
-- `commission_cents` is the captured payout at attribution time (so a later
-- bps change on the promoter doesn't rewrite history).
create table if not exists public.promoter_attributions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  promoter_id uuid not null references public.promoters(id) on delete cascade,
  discount_code_id uuid references public.discount_codes(id) on delete set null,
  transaction_ref text not null,
  amount_cents integer not null check (amount_cents >= 0),
  commission_cents integer not null default 0 check (commission_cents >= 0),
  occurred_at timestamptz not null default now(),
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists promoter_attributions_promoter_idx
  on public.promoter_attributions (org_id, promoter_id, occurred_at desc);

create index if not exists promoter_attributions_code_idx
  on public.promoter_attributions (org_id, discount_code_id);

alter table public.promoter_attributions enable row level security;

create policy promoter_attributions_org_select
  on public.promoter_attributions for select
  using (private.is_org_member(org_id));

create policy promoter_attributions_org_write
  on public.promoter_attributions
  using (private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller', 'collaborator']))
  with check (private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller', 'collaborator']));

create trigger promoter_attributions_touch_updated_at
  before update on public.promoter_attributions
  for each row execute function public.touch_updated_at();
