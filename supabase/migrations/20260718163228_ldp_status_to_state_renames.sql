-- M4: LDP naming — residual *_status text columns → *_state. APPLIED 2026-07-18
-- (ledger 20260718163228). Column RENAME auto-updates dependent views/indexes/policies;
-- the one plpgsql function referencing match_status (match_receipt_three_way) is recreated
-- (column refs + JSON return key → match_state). Ships with the app-code renames.
alter table public.budgets                    rename column budget_status     to budget_state;
alter table public.automations                rename column last_run_status   to last_run_state;
alter table public.files                      rename column virus_scan_status to virus_scan_state;
alter table public.po_invoice_matches         rename column match_status      to match_state;
alter table public.document_state_transitions rename column from_status       to from_state;
alter table public.document_state_transitions rename column to_status         to to_state;

alter table public.files
  rename constraint files_virus_scan_status_check to files_virus_scan_state_check;
alter table public.po_invoice_matches
  rename constraint po_invoice_matches_match_status_check to po_invoice_matches_match_state_check;

-- match_receipt_three_way: only change vs prior def is match_status → match_state
-- (INSERT column, UPDATE set, and the jsonb return key).
create or replace function public.match_receipt_three_way(p_receipt_id uuid, p_invoice_id uuid)
 returns jsonb language plpgsql security definer set search_path to 'public'
as $function$
declare
  v_receipt public.goods_receipts%rowtype; v_po public.purchase_orders%rowtype;
  v_inv public.invoices%rowtype; v_variance bigint; v_qty_short boolean; v_status text; v_match_id uuid;
begin
  select * into v_receipt from public.goods_receipts where id = p_receipt_id;
  if not found then raise exception 'receipt not found'; end if;
  if not private.has_org_role(v_receipt.org_id, array['owner','admin','manager']) then
    raise exception 'only manager+ can record a 3-way match'; end if;
  select * into v_po from public.purchase_orders
    where id = v_receipt.po_id and org_id = v_receipt.org_id and deleted_at is null for update;
  if not found then raise exception 'purchase order not found'; end if;
  select * into v_inv from public.invoices
    where id = p_invoice_id and org_id = v_receipt.org_id and deleted_at is null for update;
  if not found then raise exception 'invoice not found'; end if;
  if v_inv.purchase_order_id is not null and v_inv.purchase_order_id <> v_po.id then
    raise exception 'invoice is linked to a different purchase order'; end if;
  v_variance := v_inv.amount_cents - v_po.amount_cents;
  select exists (
    select 1 from public.po_line_items li
    left join (select l.po_line_item_id, sum(l.qty_received) as qty
      from public.goods_receipt_lines l join public.goods_receipts r on r.id = l.receipt_id
      where r.po_id = v_po.id group by l.po_line_item_id) rec on rec.po_line_item_id = li.id
    where li.purchase_order_id = v_po.id and coalesce(rec.qty, 0) < li.quantity) into v_qty_short;
  v_status := case when v_variance > 0 then 'over' when v_variance < 0 then 'partial'
    when v_qty_short then 'qty_variance' else 'full' end;
  select id into v_match_id from public.po_invoice_matches
    where receipt_id = p_receipt_id and invoice_id = p_invoice_id;
  if v_match_id is null then
    insert into public.po_invoice_matches
      (org_id, po_id, receipt_id, invoice_id, match_state, variance_minor, resolved_at, resolved_by)
    values (v_receipt.org_id, v_po.id, p_receipt_id, p_invoice_id, v_status, v_variance,
       case when v_status = 'full' then now() end, case when v_status = 'full' then auth.uid() end)
    returning id into v_match_id;
  else
    update public.po_invoice_matches set match_state = v_status, variance_minor = v_variance,
          resolved_at = case when v_status = 'full' then now() end,
          resolved_by = case when v_status = 'full' then auth.uid() end
      where id = v_match_id;
  end if;
  if v_status = 'full' and v_po.state not in ('matched','closed','cancelled') then
    update public.purchase_orders set state = 'matched'::public.upo_state,
          po_state = case when po_state = 'cancelled' then po_state else 'fulfilled'::public.po_status end
      where id = v_po.id;
  end if;
  update public.invoices set purchase_order_id = v_po.id,
        invoice_state = case when v_status = 'full' and invoice_state = 'submitted'
                             then 'approved'::public.invoice_status else invoice_state end,
        approved_at = case when v_status = 'full' and invoice_state = 'submitted' then now() else approved_at end
    where id = v_inv.id;
  return jsonb_build_object('match_id', v_match_id, 'match_state', v_status, 'variance_minor', v_variance);
end $function$;
