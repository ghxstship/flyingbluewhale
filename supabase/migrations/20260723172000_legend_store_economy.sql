-- LEG3ND store economy closure (readiness blocker B-4).
--
-- Before this migration the credit economy was open-loop: Stripe checkout and
-- voucher redemption CREDIT `credit_ledger` (fulfill_credit_order /
-- redeem_voucher, 20260625182645) but nothing ever DEBITED it — purchased
-- credits were unspendable — and no app surface could stock `credit_products`
-- or mint `vouchers` (owner/admin-only RLS with no UI). This migration closes
-- the loop:
--
--   1. `credit_products` gains a `product_kind` facet: 'pack' (the existing
--      money → credits Stripe path) or 'item' (credits → fulfillment). For a
--      pack, `credits` is the amount GRANTED on payment; for an item,
--      `credits` is the PRICE debited on purchase. Optional `stock_qty`
--      (null = unlimited) caps item purchases.
--   2. `credit_purchases` — the fulfillment record an item purchase yields
--      (the buyer's entitlement, shown in their store history). Written only
--      by the RPC; readable by the buyer + the manager band.
--   3. `purchase_store_item` — SECURITY DEFINER RPC (same idiom as
--      redeem_voucher / fulfill_credit_order / approve_time_off_request):
--      balance check + debit + fulfillment row + stock decrement in ONE
--      transaction. A per-(org,user) advisory xact lock serializes concurrent
--      debits so the ledger sum can never go negative (credits-only writers
--      never shrink the balance, so they need no lock).
--   4. Store stocking RLS widens from owner/admin to the manager band
--      (owner/admin/manager/controller) to match the `isManagerPlus` store
--      admin surface (`/legend/store/admin`) — same band the XMCE engine and
--      signage registers use.
--
-- CODE-READY migration — authored in-tree, NOT applied here. The operator
-- applies it, then regenerates database.types.ts. Until then app access to
-- the new column/table/RPC rides `LooseSupabase`.

-- ── 1. Product facets ───────────────────────────────────────────────────
alter table public.credit_products
  add column product_kind text not null default 'pack'
    check (product_kind in ('pack', 'item')),
  add column stock_qty integer
    check (stock_qty is null or stock_qty >= 0);

comment on column public.credit_products.product_kind is
  'pack = money buys credits (Stripe checkout, credits granted); item = credits buy this product (ledger debited via purchase_store_item)';
comment on column public.credit_products.credits is
  'Credit magnitude of the product: granted to the buyer for a pack, debited from the buyer for an item';
comment on column public.credit_products.stock_qty is
  'Remaining sellable units for an item (null = unlimited). Decremented atomically inside purchase_store_item.';

-- ── 2. Credit purchases (fulfillment / entitlement record) ──────────────
create table public.credit_purchases (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  credit_product_id uuid not null references public.credit_products(id) on delete restrict,
  -- Snapshot of the product name at purchase time so history survives renames.
  item_name text not null,
  credits_spent integer not null check (credits_spent > 0),
  purchase_state text not null default 'fulfilled'
    check (purchase_state in ('fulfilled', 'reversed')),
  created_at timestamptz not null default now()
);
create index credit_purchases_user_idx on public.credit_purchases (org_id, user_id, created_at desc);
create index credit_purchases_product_idx on public.credit_purchases (credit_product_id);

alter table public.credit_purchases enable row level security;
create policy credit_purchases_select on public.credit_purchases
  for select using (
    private.is_org_member(org_id)
    and (user_id = auth.uid() or private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller']))
  );
-- No INSERT/UPDATE policy or grant for authenticated: rows are written only
-- through the SECURITY DEFINER RPC below, so the balance check can never be
-- bypassed by a direct table write.
revoke all on public.credit_purchases from anon;
grant select on public.credit_purchases to authenticated;

-- ── 3. Stocking RLS → manager band ──────────────────────────────────────
-- The store admin surface is isManagerPlus (owner/admin/manager); controller
-- rides the band per the legend engine/signage precedent.
drop policy credit_products_write on public.credit_products;
create policy credit_products_write on public.credit_products
  for all using (private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller']))
  with check (private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller']));

drop policy vouchers_write on public.vouchers;
create policy vouchers_write on public.vouchers
  for all using (private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller']))
  with check (private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller']));

-- ── 4. purchase_store_item — atomic spend (balance check + debit + yield) ─
-- Contract (jsonb):
--   ok=true  → { ok, purchase_id, credits, balance }   (balance AFTER debit)
--   ok=false → { ok, reason, [balance, price] } with reason one of:
--     not_found | not_purchasable | inactive | out_of_stock |
--     insufficient_balance
--
-- Invariant: sum(credit_ledger.delta) per (org, user) never goes negative.
-- All debit writers must take the same advisory lock; credit-only writers
-- (fulfill_credit_order, redeem_voucher) only grow the balance and are safe
-- to run concurrently.
create or replace function public.purchase_store_item(
  p_org_id uuid, p_user_id uuid, p_product_id uuid
) returns jsonb
  language plpgsql
  security definer
  set search_path to 'public'
as $function$
declare
  v_credits integer;
  v_name text;
  v_kind text;
  v_state text;
  v_stock integer;
  v_balance bigint;
  v_purchase_id uuid;
begin
  -- SECURITY DEFINER + authenticated grant: bind the spender to the caller.
  -- Without this, any authenticated user could pass another user's id via a
  -- direct PostgREST call and spend their credits. Service-role calls
  -- (auth.uid() is null) pass through for system flows.
  if auth.uid() is not null and p_user_id <> auth.uid() then
    return jsonb_build_object('ok', false, 'reason', 'not_authorized');
  end if;
  if auth.uid() is not null and not private.is_org_member(p_org_id) then
    return jsonb_build_object('ok', false, 'reason', 'not_authorized');
  end if;
  -- Serialize debits per (org, user): the balance is an aggregate over an
  -- append-only ledger, so there is no single row to lock. Two concurrent
  -- purchases take this lock in turn; the second sees the first's debit.
  perform pg_advisory_xact_lock(hashtextextended(p_org_id::text || ':' || p_user_id::text, 42));

  select credits, name, product_kind, product_state, stock_qty
    into v_credits, v_name, v_kind, v_state, v_stock
    from public.credit_products
   where id = p_product_id and org_id = p_org_id and deleted_at is null
   for update;

  if v_credits is null then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;
  if v_kind <> 'item' then
    -- Packs are bought with money through Stripe checkout, never with credits.
    return jsonb_build_object('ok', false, 'reason', 'not_purchasable');
  end if;
  if v_state <> 'active' then
    return jsonb_build_object('ok', false, 'reason', 'inactive');
  end if;
  if v_stock is not null and v_stock < 1 then
    return jsonb_build_object('ok', false, 'reason', 'out_of_stock');
  end if;

  select coalesce(sum(delta), 0) into v_balance
    from public.credit_ledger
   where org_id = p_org_id and user_id = p_user_id;

  if v_balance < v_credits then
    return jsonb_build_object(
      'ok', false,
      'reason', 'insufficient_balance',
      'balance', v_balance,
      'price', v_credits
    );
  end if;

  -- Fulfillment row first so the debit can reference it (the buyer's visible
  -- yield — their entitlement to the item, listed in store history).
  insert into public.credit_purchases (org_id, user_id, credit_product_id, item_name, credits_spent)
    values (p_org_id, p_user_id, p_product_id, v_name, v_credits)
    returning id into v_purchase_id;

  -- THE debit: the only negative-delta writer in the credit economy.
  insert into public.credit_ledger (org_id, user_id, delta, reason, ref_kind, ref_id)
    values (p_org_id, p_user_id, -v_credits, 'Store purchase: ' || v_name, 'credit_purchase', v_purchase_id);

  -- Atomic stock decrement (row already locked FOR UPDATE above).
  update public.credit_products
     set stock_qty = stock_qty - 1
   where id = p_product_id and stock_qty is not null;

  return jsonb_build_object(
    'ok', true,
    'purchase_id', v_purchase_id,
    'credits', v_credits,
    'balance', v_balance - v_credits
  );
end;
$function$;

revoke all on function public.purchase_store_item(uuid, uuid, uuid) from public, anon;
grant execute on function public.purchase_store_item(uuid, uuid, uuid) to authenticated;


-- Security tightening (orchestrator, on the P6c observation): voucher codes
-- were org-member-readable — a harvest risk. Redemption rides the SECURITY
-- DEFINER redeem_voucher RPC, so members never need SELECT on raw codes.
drop policy if exists vouchers_select on public.vouchers;
create policy vouchers_select on public.vouchers
  for select using (
    private.has_org_role(org_id, array['owner','admin','manager','controller'])
  );
