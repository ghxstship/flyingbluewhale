-- SSOT correction for the first-party box office (review follow-up to 20260628120000).
--
-- The authoritative money facts are revenue_transactions (charge/fee/refund/
-- payout/adjustment). event_payouts had stored a derived gross/fees/refunds/
-- platform rollup that can drift from that SSOT (the repo prefers views over
-- denormalized rollups — cf. v_catalog_inventory retiring the `sold` counter).
--
-- Fix: event_payouts becomes the settlement RECORD (net actually settled + when/
-- where/state + a FK to the payout transaction). The live per-event breakdown is
-- derived from revenue_transactions via the security-invoker view v_event_revenue
-- (so org RLS on the base tables applies — no cross-tenant leak). Also drop the
-- redundant per-ticket seating_zone: a ticket owns only its seat_label; the
-- section is the ticket type's fact (event_ticket_types.seating_zone).

alter table public.event_payouts
  drop column if exists gross_cents,
  drop column if exists fees_cents,
  drop column if exists refunds_cents,
  drop column if exists platform_cents,
  add column if not exists transaction_id uuid references public.revenue_transactions(id) on delete set null;

alter table public.event_tickets
  drop column if exists seating_zone;

-- Live revenue breakdown per first-party event, derived from the SSOT.
-- security_invoker so the querying user's RLS on revenue_orders/_transactions
-- applies (tenant-safe).
create or replace view public.v_event_revenue
with (security_invoker = true) as
select
  o.org_id,
  o.event_listing_id,
  coalesce(sum(t.amount_cents) filter (where t.txn_kind = 'charge' and t.txn_state = 'succeeded'), 0) as gross_cents,
  coalesce(sum(t.amount_cents) filter (where t.txn_kind = 'fee'), 0) as fees_cents,
  coalesce(sum(t.amount_cents) filter (where t.txn_kind = 'refund'), 0) as refunds_cents,
  coalesce(sum(t.amount_cents) filter (where t.txn_kind = 'adjustment'), 0) as adjustments_cents,
  coalesce(sum(t.amount_cents) filter (where t.txn_kind = 'payout' and t.txn_state = 'succeeded'), 0) as paid_out_cents,
  count(distinct o.id) as order_count
from public.revenue_orders o
join public.revenue_transactions t on t.order_id = o.id
where o.event_listing_id is not null and o.deleted_at is null
group by o.org_id, o.event_listing_id;
grant select on public.v_event_revenue to authenticated;

-- Door write-path RPC no longer returns the dropped per-ticket zone.
create or replace function public.redeem_event_ticket(
  p_code text, p_gate text default null, p_location text default null
) returns jsonb
language plpgsql security definer set search_path = public, private as $$
declare v public.event_tickets; v_result text;
begin
  select * into v from public.event_tickets where code = p_code and deleted_at is null order by issued_at desc limit 1;
  if v.id is null then return jsonb_build_object('result', 'not_found'); end if;
  if not private.is_org_member(v.org_id) then raise exception 'not authorized to scan in this organization'; end if;
  if v.ticket_state = 'refunded' then v_result := 'refunded';
  elsif v.ticket_state = 'voided' then v_result := 'voided';
  elsif v.ticket_state = 'redeemed' then v_result := 'duplicate';
  else
    v_result := 'accepted';
    update public.event_tickets set ticket_state = 'redeemed', redeemed_at = now(), updated_at = now() where id = v.id;
  end if;
  insert into public.event_ticket_scans
    (org_id, event_listing_id, ticket_id, scanned_code, result, gate, location, scanned_by)
  values
    (v.org_id, v.event_listing_id, v.id, p_code, v_result, p_gate, p_location, (select auth.uid()));
  return jsonb_build_object('result', v_result, 'ticket_id', v.id, 'holder', coalesce(v.holder_name, v.holder_email), 'seat', v.seat_label);
end $$;
grant execute on function public.redeem_event_ticket(text, text, text) to authenticated;
