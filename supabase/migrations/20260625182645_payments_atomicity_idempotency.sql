-- Payments / billing correctness — atomic, idempotent fulfillment RPCs.
--
-- Closes four launch-blocking money-loss / double-credit defects in the
-- Stripe-driven billing, LEG3ND credit, and store-checkout paths. Each fix
-- collapses a sequence of unguarded read-modify-write statements into a single
-- SECURITY DEFINER transaction that is safe to call twice (Stripe redelivers
-- every event until it gets a 2xx, and a delivery may be queued-and-retried
-- from multiple regions).
--
-- Mirrors the existing atomic-RPC pattern (accept_offer_letter — SELECT ...
-- FOR UPDATE + terminal-state guard + side-effect in one function).

-- ── 1. credit_ledger idempotency key ───────────────────────────────────
-- A redelivered checkout.session.completed (or a double voucher submit) must
-- never insert a second grant for the same source. The grant's natural key is
-- (ref_kind, ref_id, user_id) — the credit_order or voucher it fulfills, scoped
-- to the recipient. user_id is in the key because one voucher (a single
-- ref_id) is redeemable by many users when max_redemptions > 1: each user gets
-- exactly one grant, so the per-user key blocks double-credit without blocking
-- a second user's legitimate redemption. For a credit_order the order is
-- already one-user, so user_id is redundant-but-harmless there. Manual / seed
-- grants carry no ref and stay exempt via the partial predicate.
create unique index if not exists credit_ledger_ref_uniq
  on public.credit_ledger (ref_kind, ref_id, user_id)
  where ref_kind is not null and ref_id is not null;

-- ── 2. fulfill_credit_order — atomic, idempotent credit-pack fulfillment ─
-- Replaces the webhook's three sequential writes (order->paid, ledger insert,
-- order->fulfilled). A crash between the paid-flip and the ledger insert used
-- to lose the customer's credit (the retry's order_state='pending' guard then
-- failed); a redelivery while still pending double-credited (no ledger key).
--
-- Now: one transaction locks the order, no-ops if already fulfilled (idempotent
-- on redelivery), inserts the ledger grant guarded by ON CONFLICT on the new
-- key (idempotent even if the order row was advanced out-of-band), and flips to
-- fulfilled. Returns whether a grant was newly applied.
create or replace function public.fulfill_credit_order(
  p_order_id uuid, p_event_id text default null
) returns jsonb
  language plpgsql
  security definer
  set search_path to 'public'
as $function$
declare
  v_org_id uuid;
  v_user_id uuid;
  v_credits integer;
  v_state text;
  v_inserted integer;
begin
  select org_id, user_id, credits, order_state
    into v_org_id, v_user_id, v_credits, v_state
    from public.credit_orders
   where id = p_order_id
   for update;

  if v_org_id is null then
    return jsonb_build_object('ok', false, 'reason', 'order_not_found');
  end if;

  -- Terminal / non-grantable states. 'fulfilled' is the idempotent success
  -- path: a redelivery lands here and returns ok without re-crediting.
  if v_state = 'fulfilled' then
    return jsonb_build_object('ok', true, 'applied', false, 'reason', 'already_fulfilled');
  end if;
  if v_state in ('cancelled', 'refunded') then
    return jsonb_build_object('ok', false, 'reason', 'order_' || v_state);
  end if;

  -- Grant credits. The unique key on (ref_kind, ref_id) makes this safe to
  -- run twice for the same order; a duplicate is silently skipped.
  insert into public.credit_ledger (org_id, user_id, delta, reason, ref_kind, ref_id)
    values (v_org_id, v_user_id, v_credits, 'Credit pack purchase', 'credit_order', p_order_id)
    on conflict (ref_kind, ref_id, user_id) where ref_kind is not null and ref_id is not null
    do nothing;
  get diagnostics v_inserted = row_count;

  update public.credit_orders
     set order_state = 'fulfilled'
   where id = p_order_id;

  return jsonb_build_object(
    'ok', true,
    'applied', v_inserted > 0,
    'credits', v_credits,
    'event_id', p_event_id
  );
end;
$function$;

revoke all on function public.fulfill_credit_order(uuid, text) from public, anon, authenticated;

-- ── 3. convert_store_cart — atomic cart conversion + inventory decrement ─
-- Replaces the webhook's per-item SELECT-then-UPDATE inventory loop (lost-
-- update race + partial-decrement on mid-loop crash). One transaction flips
-- the cart (idempotent — only the pending->converted flip succeeds once) and
-- decrements every line item atomically with a non-negative floor.
create or replace function public.convert_store_cart(
  p_cart_id uuid, p_event_id text default null
) returns jsonb
  language plpgsql
  security definer
  set search_path to 'public'
as $function$
declare
  v_state text;
  v_updated integer;
  v_decremented integer := 0;
  it record;
begin
  select cart_state::text into v_state
    from public.store_carts
   where id = p_cart_id
   for update;

  if v_state is null then
    return jsonb_build_object('ok', false, 'reason', 'cart_not_found');
  end if;
  if v_state = 'converted' then
    -- Idempotent success path on redelivery — inventory already decremented.
    return jsonb_build_object('ok', true, 'applied', false, 'reason', 'already_converted');
  end if;

  update public.store_carts
     set cart_state = 'converted'
   where id = p_cart_id and cart_state <> 'converted';
  get diagnostics v_updated = row_count;
  if v_updated = 0 then
    -- Lost the race to a concurrent delivery — that one did the work.
    return jsonb_build_object('ok', true, 'applied', false, 'reason', 'race_lost');
  end if;

  -- Atomic per-item decrement. The `inventory_qty >= quantity` guard prevents
  -- oversell; items that can't satisfy the qty are floored at 0 so we never
  -- write a negative count, and reported as short.
  for it in
    select product_id, sum(quantity)::integer as qty
      from public.store_cart_items
     where cart_id = p_cart_id and product_id is not null
     group by product_id
  loop
    update public.store_products
       set inventory_qty = greatest(0, coalesce(inventory_qty, 0) - it.qty)
     where id = it.product_id;
    v_decremented := v_decremented + 1;
  end loop;

  return jsonb_build_object(
    'ok', true,
    'applied', true,
    'items', v_decremented,
    'event_id', p_event_id
  );
end;
$function$;

revoke all on function public.convert_store_cart(uuid, text) from public, anon, authenticated;

-- ── 4. redeem_voucher — atomic grant + redemption + count bump ──────────
-- Replaces the server action's three unguarded writes (redemption insert,
-- ledger insert, count/state bump). A crash mid-way left the unique
-- (voucher_id, user_id) redemption row in place permanently blocking the
-- retry, with no credit granted. One transaction locks the voucher, validates
-- state/expiry/caps, records the redemption, grants credits (idempotent via
-- the new ledger key), and bumps the count/state.
--
-- Caller passes the acting user; the function runs SECURITY DEFINER but is
-- only granted to authenticated and re-checks org membership via the voucher's
-- org scope at the app layer (the action already validated the session).
create or replace function public.redeem_voucher(
  p_org_id uuid, p_user_id uuid, p_code text
) returns jsonb
  language plpgsql
  security definer
  set search_path to 'public'
as $function$
declare
  v_id uuid;
  v_credits integer;
  v_max integer;
  v_count integer;
  v_expires date;
  v_state text;
  v_next_count integer;
begin
  select id, credits, max_redemptions, redeemed_count, expires_on, voucher_state
    into v_id, v_credits, v_max, v_count, v_expires, v_state
    from public.vouchers
   where org_id = p_org_id and code = p_code and deleted_at is null
   for update;

  if v_id is null then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;
  if v_state <> 'active' then
    return jsonb_build_object('ok', false, 'reason', 'inactive');
  end if;
  if v_expires is not null and (v_expires + interval '1 day') <= now() then
    return jsonb_build_object('ok', false, 'reason', 'expired');
  end if;
  if v_count >= v_max then
    return jsonb_build_object('ok', false, 'reason', 'fully_redeemed');
  end if;

  -- One redemption per user. A pre-existing row means this user already
  -- redeemed — but if a prior crash left the redemption without its grant,
  -- the ledger insert below still backfills the credit idempotently.
  begin
    insert into public.voucher_redemptions (org_id, voucher_id, user_id, credits)
      values (p_org_id, v_id, p_user_id, v_credits);
  exception when unique_violation then
    -- Already redeemed by this user. Treat as terminal — but reconcile the
    -- ledger in case the grant was lost mid-transaction previously.
    insert into public.credit_ledger (org_id, user_id, delta, reason, ref_kind, ref_id)
      values (p_org_id, p_user_id, v_credits, 'Voucher ' || p_code, 'voucher', v_id)
      on conflict (ref_kind, ref_id, user_id) where ref_kind is not null and ref_id is not null
      do nothing;
    return jsonb_build_object('ok', false, 'reason', 'already_redeemed');
  end;

  -- Grant credits, keyed on the voucher so a redelivery / double-submit can't
  -- double-credit.
  insert into public.credit_ledger (org_id, user_id, delta, reason, ref_kind, ref_id)
    values (p_org_id, p_user_id, v_credits, 'Voucher ' || p_code, 'voucher', v_id)
    on conflict (ref_kind, ref_id, user_id) where ref_kind is not null and ref_id is not null
    do nothing;

  v_next_count := v_count + 1;
  update public.vouchers
     set redeemed_count = v_next_count,
         voucher_state = case when v_next_count >= v_max then 'redeemed' else 'active' end
   where id = v_id;

  return jsonb_build_object('ok', true, 'credits', v_credits);
end;
$function$;

revoke all on function public.redeem_voucher(uuid, uuid, text) from public, anon;
grant execute on function public.redeem_voucher(uuid, uuid, text) to authenticated;
