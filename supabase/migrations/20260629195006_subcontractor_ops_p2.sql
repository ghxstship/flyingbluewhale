-- Subcontractor-Operations layer (v7.5) — Phase 2.
-- Work Order Thread storage + the public (anon-readable) Trades Marketplace view.
-- Additive only. Reads the Phase 1 records.

-- ── Work Order Thread — per-work-order message log ──────────────────────
create table public.work_order_messages (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  work_order_id uuid not null references public.work_orders(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null,
  body text not null,
  attachment_file_id uuid,
  created_at timestamptz not null default now()
);
create index work_order_messages_wo_idx on public.work_order_messages (work_order_id, created_at);

alter table public.work_order_messages enable row level security;
create policy work_order_messages_select on public.work_order_messages
  for select using (private.is_org_member(org_id));
create policy work_order_messages_insert on public.work_order_messages
  for insert with check (private.is_org_member(org_id) and author_id = auth.uid());
grant select, insert on public.work_order_messages to authenticated;

-- ── Public Trades Marketplace — anon-readable published work orders ─────
-- Mirrors the public_* discovery-view pattern: a SECURITY DEFINER view (so anon
-- doesn't need RLS-select on work_orders) exposing ONLY public, still-open work
-- orders with safe columns (no awarded vendor, no org id). Cross-org by design —
-- it's a public marketplace, same as public_talent_directory.
create or replace view public.public_work_orders as
select
  wo.id,
  wo.title,
  wo.trade,
  wo.site_address,
  wo.start_date,
  wo.end_date,
  wo.budget_guide_cents,
  wo.dispatch_mode,
  wo.work_order_state,
  wo.created_at
from public.work_orders wo
where wo.visibility = 'public'
  and wo.deleted_at is null
  and wo.work_order_state in ('posted', 'bids-in');

grant select on public.public_work_orders to anon, authenticated;
