-- Phase A §09 merge (kit v7.8/20 REPO_LANDING §1): sub_invoices → invoices.
-- Part 2 of 2 — row migration, the two AP gates (approved-WO on insert,
-- lien-waiver before paid), the po_invoice_matches invoice leg, the atomic
-- 3-way-match RPC (REPO_LANDING §2: cross-patches the PO AND the invoice in
-- one transaction), and the sub_invoices drop.

-- ── 1 · Row migration ─────────────────────────────────────────────────────
-- sub_invoices rows become source='ap_sub' invoices. Number minted SI-<id8>
-- (the kit's sub-invoice ID convention); submitted_on maps to issued_at.
insert into public.invoices (
  id, org_id, vendor_id, work_order_id, number, title, amount_cents, currency,
  invoice_state, source, issued_at, approved_at, paid_at,
  created_at, updated_at, deleted_at
)
select
  s.id, s.org_id, s.vendor_id, s.work_order_id,
  'SI-' || upper(substr(replace(s.id::text, '-', ''), 1, 8)),
  'Sub invoice · ' || coalesce(v.name, 'Vendor'),
  s.amount_cents, 'USD',
  s.invoice_state::public.invoice_status, 'ap_sub',
  s.submitted_on, s.approved_at, s.paid_at,
  s.created_at, s.updated_at, s.deleted_at
from public.sub_invoices s
left join public.vendors v on v.id = s.vendor_id
on conflict (id) do nothing;

-- ── 2 · Approved-WO gate (ported from trg_sub_invoices_gate) ──────────────
-- An AP-sub invoice may only be created against an APPROVED work order.
create or replace function public.invoice_ap_requires_approved_wo()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.source = 'ap_sub' and new.work_order_id is not null then
    if not exists (
      select 1 from public.work_orders w
      where w.id = new.work_order_id
        and w.work_order_state in ('approved', 'invoiced', 'closed')
    ) then
      raise exception 'sub invoice requires an approved work order';
    end if;
  end if;
  return new;
end $$;
create trigger trg_invoices_ap_wo_gate before insert on public.invoices
  for each row execute function public.invoice_ap_requires_approved_wo();
revoke execute on function public.invoice_ap_requires_approved_wo() from public, anon, authenticated;

-- ── 3 · Waiver gate ───────────────────────────────────────────────────────
-- The kit contract: "a sub invoice can't reach Paid until its waiver is on
-- file." On file = the linked lien_waivers row is signed/returned/released.
create or replace function public.invoice_ap_waiver_gate()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.source = 'ap_sub'
     and new.invoice_state = 'paid'
     and old.invoice_state is distinct from new.invoice_state then
    if new.lien_waiver_id is null or not exists (
      select 1 from public.lien_waivers w
      where w.id = new.lien_waiver_id
        and w.waiver_state in ('signed', 'returned', 'released')
        and w.deleted_at is null
    ) then
      raise exception 'sub invoice cannot reach paid until its lien waiver is on file';
    end if;
  end if;
  return new;
end $$;
create trigger trg_invoices_ap_waiver_gate before update on public.invoices
  for each row execute function public.invoice_ap_waiver_gate();
revoke execute on function public.invoice_ap_waiver_gate() from public, anon, authenticated;

-- ── 4 · po_invoice_matches: the invoice leg ───────────────────────────────
-- The baseline match table only knew transactions (invoice_tx_id). The
-- merged store lets a match cite the invoice row directly.
alter table public.po_invoice_matches alter column invoice_tx_id drop not null;
alter table public.po_invoice_matches
  add column invoice_id uuid references public.invoices(id) on delete cascade;
alter table public.po_invoice_matches add constraint po_invoice_matches_leg_check
  check (invoice_tx_id is not null or invoice_id is not null);
create index po_invoice_matches_invoice_idx on public.po_invoice_matches (invoice_id)
  where invoice_id is not null;

-- ── 5 · Atomic 3-way match RPC ────────────────────────────────────────────
-- REPO_LANDING §2: `receiving → 3-way match` cross-patches the PO AND the
-- invoice in one transaction. A plpgsql function IS that transaction —
-- match verdict, PO lifecycle advance, and invoice approve-to-pay commit or
-- roll back together. SECURITY DEFINER with an explicit manager-band org
-- gate (mirrors the po_invoice_matches write policy).
create or replace function public.match_receipt_three_way(p_receipt_id uuid, p_invoice_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_receipt public.goods_receipts%rowtype;
  v_po public.purchase_orders%rowtype;
  v_inv public.invoices%rowtype;
  v_variance bigint;
  v_qty_short boolean;
  v_status text;
  v_match_id uuid;
begin
  select * into v_receipt from public.goods_receipts where id = p_receipt_id;
  if not found then
    raise exception 'receipt not found';
  end if;
  if not private.has_org_role(v_receipt.org_id, array['owner', 'admin', 'manager']) then
    raise exception 'only manager+ can record a 3-way match';
  end if;

  select * into v_po from public.purchase_orders
    where id = v_receipt.po_id and org_id = v_receipt.org_id and deleted_at is null
    for update;
  if not found then
    raise exception 'purchase order not found';
  end if;

  select * into v_inv from public.invoices
    where id = p_invoice_id and org_id = v_receipt.org_id and deleted_at is null
    for update;
  if not found then
    raise exception 'invoice not found';
  end if;
  if v_inv.purchase_order_id is not null and v_inv.purchase_order_id <> v_po.id then
    raise exception 'invoice is linked to a different purchase order';
  end if;

  -- Verdict: invoice-vs-PO amount variance, then received-vs-ordered quantity.
  v_variance := v_inv.amount_cents - v_po.amount_cents;
  select exists (
    select 1
    from public.po_line_items li
    left join (
      select l.po_line_item_id, sum(l.qty_received) as qty
      from public.goods_receipt_lines l
      join public.goods_receipts r on r.id = l.receipt_id
      where r.po_id = v_po.id
      group by l.po_line_item_id
    ) rec on rec.po_line_item_id = li.id
    where li.purchase_order_id = v_po.id
      and coalesce(rec.qty, 0) < li.quantity
  ) into v_qty_short;

  v_status := case
    when v_variance > 0 then 'over'
    when v_variance < 0 then 'partial'
    when v_qty_short then 'qty_variance'
    else 'full'
  end;

  -- Upsert on (receipt, invoice): re-running the match refreshes the verdict
  -- instead of stacking duplicate rows (idempotent on retry).
  select id into v_match_id from public.po_invoice_matches
    where receipt_id = p_receipt_id and invoice_id = p_invoice_id;
  if v_match_id is null then
    insert into public.po_invoice_matches
      (org_id, po_id, receipt_id, invoice_id, match_status, variance_minor, resolved_at, resolved_by)
    values
      (v_receipt.org_id, v_po.id, p_receipt_id, p_invoice_id, v_status, v_variance,
       case when v_status = 'full' then now() end,
       case when v_status = 'full' then auth.uid() end)
    returning id into v_match_id;
  else
    update public.po_invoice_matches
      set match_status = v_status,
          variance_minor = v_variance,
          resolved_at = case when v_status = 'full' then now() end,
          resolved_by = case when v_status = 'full' then auth.uid() end
      where id = v_match_id;
  end if;

  -- Cross-patch leg 1 — the PO: a full match advances the unified lifecycle
  -- to matched/fulfilled (never regresses a closed or cancelled PO).
  if v_status = 'full' and v_po.state not in ('matched', 'closed', 'cancelled') then
    update public.purchase_orders
      set state = 'matched'::public.upo_state,
          po_state = case when po_state = 'cancelled'
                          then po_state else 'fulfilled'::public.po_status end
      where id = v_po.id;
  end if;

  -- Cross-patch leg 2 — the invoice: back-link the PO; a full match moves a
  -- submitted AP invoice to approved (approve-to-pay; the waiver gate still
  -- guards paid).
  update public.invoices
    set purchase_order_id = v_po.id,
        invoice_state = case when v_status = 'full' and invoice_state = 'submitted'
                             then 'approved'::public.invoice_status else invoice_state end,
        approved_at = case when v_status = 'full' and invoice_state = 'submitted'
                           then now() else approved_at end
    where id = v_inv.id;

  return jsonb_build_object(
    'match_id', v_match_id,
    'match_status', v_status,
    'variance_minor', v_variance
  );
end $$;
revoke execute on function public.match_receipt_three_way(uuid, uuid) from public, anon;
grant execute on function public.match_receipt_three_way(uuid, uuid) to authenticated;

-- ── 6 · Drop the duplicate store ──────────────────────────────────────────
drop trigger if exists trg_sub_invoices_gate on public.sub_invoices;
drop function if exists public.sub_invoice_requires_approved_wo();
drop table public.sub_invoices;
