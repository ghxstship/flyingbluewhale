-- Subcontractor-Operations layer (v7.5) — Phase 3 (P2 surfaces).
-- Sub Invoicing, Job Templates, Vendor Scorecard. 3NF, org-scoped, RLS, LDP.
-- Additive; reads the Phase 1 work_orders record.

-- ── Sub invoicing — inbound subcontractor payment applications ──────────
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

-- Submit gate: a sub-invoice may only be created against an APPROVED work order
-- (the §4.2 downstream contract). Enforced server-side AND here as a backstop.
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

-- ── Job templates — reusable scope checklists seeded on award ───────────
create table public.job_templates (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  name text not null,
  trade text,
  template_state text not null default 'active' check (template_state in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index job_templates_org_idx on public.job_templates (org_id, template_state) where deleted_at is null;

alter table public.job_templates enable row level security;
create policy job_templates_select on public.job_templates
  for select using (private.is_org_member(org_id));
create policy job_templates_write on public.job_templates
  for all using (private.has_org_role(org_id, array['owner', 'admin', 'controller']))
  with check (private.has_org_role(org_id, array['owner', 'admin', 'controller']));
create trigger trg_job_templates_updated before update on public.job_templates
  for each row execute function public.compvss_set_updated_at();
grant select, insert, update, delete on public.job_templates to authenticated;

create table public.job_template_steps (
  id uuid primary key default gen_random_uuid(),
  job_template_id uuid not null references public.job_templates(id) on delete cascade,
  position integer not null default 0,
  label text not null,
  requires_photo boolean not null default false
);
create index job_template_steps_tpl_idx on public.job_template_steps (job_template_id, position);

alter table public.job_template_steps enable row level security;
create policy job_template_steps_select on public.job_template_steps
  for select using (exists (
    select 1 from public.job_templates t where t.id = job_template_id and private.is_org_member(t.org_id)));
create policy job_template_steps_write on public.job_template_steps
  for all using (exists (
    select 1 from public.job_templates t
    where t.id = job_template_id and private.has_org_role(t.org_id, array['owner', 'admin', 'controller'])))
  with check (exists (
    select 1 from public.job_templates t
    where t.id = job_template_id and private.has_org_role(t.org_id, array['owner', 'admin', 'controller'])));
grant select, insert, update, delete on public.job_template_steps to authenticated;

-- ── Vendor scorecard — performance rollup feeding network ranking ───────
create table public.vendor_scores (
  org_id uuid not null references public.orgs(id) on delete cascade,
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  on_time_pct numeric(5, 2) check (on_time_pct between 0 and 100),
  quality_avg numeric(3, 2) check (quality_avg between 0 and 5),
  disputes integer not null default 0 check (disputes >= 0),
  jobs_completed integer not null default 0 check (jobs_completed >= 0),
  -- Composite 0–100 (weighted on-time + quality, penalized by disputes).
  composite numeric(5, 2) check (composite between 0 and 100),
  updated_at timestamptz not null default now(),
  primary key (org_id, vendor_id)
);

alter table public.vendor_scores enable row level security;
create policy vendor_scores_select on public.vendor_scores
  for select using (private.is_org_member(org_id));
create policy vendor_scores_write on public.vendor_scores
  for all using (private.has_org_role(org_id, array['owner', 'admin', 'controller']))
  with check (private.has_org_role(org_id, array['owner', 'admin', 'controller']));
create trigger trg_vendor_scores_updated before update on public.vendor_scores
  for each row execute function public.compvss_set_updated_at();
grant select, insert, update, delete on public.vendor_scores to authenticated;

-- Harden the gate trigger function: triggers don't need caller EXECUTE, so revoke
-- it (silences the security-definer-function advisor; the trigger still fires).
revoke execute on function public.sub_invoice_requires_approved_wo() from public, anon, authenticated;
