-- LEG3ND credits + voucher store. Purchasable credit packs (Stripe checkout,
-- same pattern as invoices), an append-only credit ledger as the balance SSOT,
-- redeemable voucher codes, and purchase orders. 3NF, org-scoped, RLS. LDP
-- naming: `*_state`.
--
-- CODE-READY migration — not applied to the live project here.

-- ── Credit products (purchasable packs) ────────────────────────────────
create table public.credit_products (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  sku text not null,
  name text not null,
  description text,
  credits integer not null check (credits > 0),
  price_cents integer not null check (price_cents >= 0),
  currency text not null default 'usd',
  stripe_price_id text,
  product_state text not null default 'active' check (product_state in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (org_id, sku)
);
create index credit_products_org_idx on public.credit_products (org_id, product_state) where deleted_at is null;

alter table public.credit_products enable row level security;
create policy credit_products_select on public.credit_products
  for select using (private.is_org_member(org_id));
create policy credit_products_write on public.credit_products
  for all using (private.has_org_role(org_id, array['owner', 'admin']))
  with check (private.has_org_role(org_id, array['owner', 'admin']));
create trigger trg_credit_products_updated before update on public.credit_products
  for each row execute function public.compvss_set_updated_at();
grant select, insert, update, delete on public.credit_products to authenticated;

-- ── Credit ledger (append-only; balance = sum(delta)) ──────────────────
create table public.credit_ledger (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  delta integer not null,
  reason text not null,
  ref_kind text,
  ref_id uuid,
  created_at timestamptz not null default now()
);
create index credit_ledger_user_idx on public.credit_ledger (org_id, user_id, created_at desc);

alter table public.credit_ledger enable row level security;
create policy credit_ledger_select on public.credit_ledger
  for select using (private.is_org_member(org_id) and (user_id = auth.uid() or private.has_org_role(org_id, array['owner', 'admin'])));
create policy credit_ledger_insert on public.credit_ledger
  for insert with check (private.is_org_member(org_id));
grant select, insert on public.credit_ledger to authenticated;

-- ── Credit orders (Stripe checkout lifecycle) ──────────────────────────
create table public.credit_orders (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  credit_product_id uuid not null references public.credit_products(id) on delete restrict,
  credits integer not null check (credits > 0),
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'usd',
  order_state text not null default 'pending'
    check (order_state in ('pending', 'paid', 'fulfilled', 'cancelled', 'refunded')),
  stripe_session_id text,
  stripe_payment_intent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index credit_orders_user_idx on public.credit_orders (org_id, user_id, created_at desc);

alter table public.credit_orders enable row level security;
create policy credit_orders_select on public.credit_orders
  for select using (private.is_org_member(org_id) and (user_id = auth.uid() or private.has_org_role(org_id, array['owner', 'admin'])));
create policy credit_orders_insert on public.credit_orders
  for insert with check (private.is_org_member(org_id) and user_id = auth.uid());
create policy credit_orders_update on public.credit_orders
  for update using (private.has_org_role(org_id, array['owner', 'admin']))
  with check (private.has_org_role(org_id, array['owner', 'admin']));
create trigger trg_credit_orders_updated before update on public.credit_orders
  for each row execute function public.compvss_set_updated_at();
grant select, insert, update, delete on public.credit_orders to authenticated;

-- ── Vouchers (redeemable codes) ────────────────────────────────────────
create table public.vouchers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  code text not null,
  credits integer not null check (credits > 0),
  max_redemptions integer not null default 1 check (max_redemptions > 0),
  redeemed_count integer not null default 0 check (redeemed_count >= 0),
  expires_on date,
  voucher_state text not null default 'active' check (voucher_state in ('active', 'redeemed', 'expired', 'void')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (org_id, code)
);
create index vouchers_org_idx on public.vouchers (org_id, voucher_state) where deleted_at is null;

alter table public.vouchers enable row level security;
-- Anyone in the org may read a voucher to redeem it; only admins author them.
create policy vouchers_select on public.vouchers
  for select using (private.is_org_member(org_id));
create policy vouchers_write on public.vouchers
  for all using (private.has_org_role(org_id, array['owner', 'admin']))
  with check (private.has_org_role(org_id, array['owner', 'admin']));
create trigger trg_vouchers_updated before update on public.vouchers
  for each row execute function public.compvss_set_updated_at();
grant select, insert, update, delete on public.vouchers to authenticated;

-- ── Voucher redemptions (one per voucher per user) ─────────────────────
create table public.voucher_redemptions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  voucher_id uuid not null references public.vouchers(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  credits integer not null check (credits > 0),
  redeemed_at timestamptz not null default now(),
  unique (voucher_id, user_id)
);
create index voucher_redemptions_user_idx on public.voucher_redemptions (org_id, user_id, redeemed_at desc);

alter table public.voucher_redemptions enable row level security;
create policy voucher_redemptions_select on public.voucher_redemptions
  for select using (private.is_org_member(org_id) and (user_id = auth.uid() or private.has_org_role(org_id, array['owner', 'admin'])));
create policy voucher_redemptions_insert on public.voucher_redemptions
  for insert with check (private.is_org_member(org_id) and user_id = auth.uid());
grant select, insert on public.voucher_redemptions to authenticated;
