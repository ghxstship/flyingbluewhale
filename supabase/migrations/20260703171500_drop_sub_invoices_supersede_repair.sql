-- Supersedes 20260703120500_repair_sub_invoices_partial_p3.
--
-- That repair migration (applied by a parallel Phase A session) re-created
-- public.sub_invoices after 20260703170100_merge_sub_invoices_three_way_match
-- had INTENTIONALLY merged it into `invoices` (kit 20 REPO_LANDING §1:
-- sub_invoices → invoices + source facet). The missing table was the merge,
-- not a partial apply. Re-migrate anything written to the resurrected table
-- in the interim, then drop the duplicate store for good.

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

drop trigger if exists trg_sub_invoices_gate on public.sub_invoices;
drop function if exists public.sub_invoice_requires_approved_wo();
drop table if exists public.sub_invoices;
