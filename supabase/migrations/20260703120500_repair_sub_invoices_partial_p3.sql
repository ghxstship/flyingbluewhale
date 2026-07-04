-- Repair: 20260629140000_subcontractor_ops_p3 was recorded as applied but the
-- sub_invoices block was absent from the live schema (partial apply — every
-- other p3 object exists). Re-creates the table + indexes + RLS + triggers
-- exactly per the original migration. Discovered during the kit-20 Phase A
-- types regen (the old database.types.ts had been spliced from the migration
-- file, masking the drift; /studio/finance/sub-invoices was querying a
-- nonexistent relation).

create table public.sub_invoices (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  vendor_id uuid not null references public.vendors(id) on delete restrict,
  work_order_id uuid not null references public.work_orders(id) on delete cascade,
  amount_cents integer not null check (amount_cents >= 0),
  -- LDP lifecycle: cyclical operational state of an inbound invoice.
  invoice_state text not null default 'submitted'
    check (invoice_state in ('submitted', 'approved', 'paid', 'rejected')),
  submitted_on date not null default current_date,
  approved_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index sub_invoices_org_state_idx on public.sub_invoices (org_id, invoice_state) where deleted_at is null;
create index sub_invoices_wo_idx on public.sub_invoices (work_order_id);
create index sub_invoices_vendor_idx on public.sub_invoices (org_id, vendor_id);

alter table public.sub_invoices enable row level security;
create policy sub_invoices_select on public.sub_invoices
  for select using (private.is_org_member(org_id));
create policy sub_invoices_write on public.sub_invoices
  for all using (private.has_org_role(org_id, array['owner', 'admin', 'controller']))
  with check (private.has_org_role(org_id, array['owner', 'admin', 'controller']));
create trigger trg_sub_invoices_updated before update on public.sub_invoices
  for each row execute function public.compvss_set_updated_at();
grant select, insert, update, delete on public.sub_invoices to authenticated;

create or replace function public.sub_invoice_requires_approved_wo()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from public.work_orders w
    where w.id = new.work_order_id
      and w.work_order_state in ('approved', 'invoiced', 'closed')
  ) then
    raise exception 'sub_invoice requires an approved work order';
  end if;
  return new;
end $$;
create trigger trg_sub_invoices_gate before insert on public.sub_invoices
  for each row execute function public.sub_invoice_requires_approved_wo();
