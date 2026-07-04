-- ─────────────────────────────────────────────────────────────────────────────
-- Kit v7.8/20 Phase A · C-06 — one physical-asset store.
--
-- Executes the merge ADR-0014 deferred: `equipment` (owned-gear registry,
-- `equipment_state equipment_status`) folds into `assets` (the UAL canon:
-- `state ual_state` + immutable `asset_movements` ledger). Facets per the kit:
--   assets.asset_class  enum gear | fleet | lot   (kit "Class")
--   assets.qty          integer ≥ 1               (lots are quantity-bearing)
--   assets.disposition  enum ship_to_site | return_to_vendor | hold, NULL = "—"
--
-- Equipment rows migrate as class='fleet' PRESERVING ids, so rentals /
-- daily-log lines / maintenance target_ids keep resolving. The old
-- setEquipmentStatus ledger write was shaped against a schema that never
-- shipped (equipment_id/moved_by/reason) and has been silently failing —
-- post-merge the studio actions write real `asset_movements` rows.
--
-- LDP: no lifecycle column added — `state ual_state` stays the machine;
-- asset_class/disposition/qty are facets (like catalog_kind), not lifecycles.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1 · Facet enums + columns on the canonical store
create type public.asset_class as enum ('gear', 'fleet', 'lot');
create type public.asset_disposition as enum ('ship_to_site', 'return_to_vendor', 'hold');

alter table public.assets
  add column asset_class public.asset_class not null default 'gear',
  add column qty integer not null default 1,
  add column disposition public.asset_disposition,
  add column location_id uuid references public.locations(id) on delete set null,
  add column notes text,
  add column deleted_at timestamptz,
  add column xtc_code integer;

alter table public.assets add constraint assets_qty_positive check (qty > 0);

create index idx_assets_org_class on public.assets (org_id, asset_class);
create index idx_assets_location_id on public.assets (location_id);
create index idx_assets_deleted_at on public.assets (deleted_at) where deleted_at is not null;

-- 2 · Row migration: equipment → assets(class='fleet'), ids preserved.
--     equipment_status maps onto ual_state 1:1 except maintenance → in_maintenance.
insert into public.assets (
  id, org_id, asset_kind, xpms_atom_id, display_name, state,
  serial, asset_tag, ownership, acquired_at,
  daily_rate_minor, daily_rate_currency, acquisition_currency,
  metadata, created_at, updated_at,
  asset_class, qty, disposition, location_id, notes, deleted_at, xtc_code
)
select
  e.id, e.org_id,
  coalesce(nullif(lower(e.category), ''), 'equipment'),
  e.xpms_atom_id, e.name,
  case e.equipment_state
    when 'maintenance' then 'in_maintenance'::public.ual_state
    else (e.equipment_state::text)::public.ual_state
  end,
  e.serial, e.asset_tag, 'owned', e.created_at,
  e.daily_rate_cents, coalesce(e.daily_rate_currency, 'USD'), coalesce(e.daily_rate_currency, 'USD'),
  '{}'::jsonb, e.created_at, e.updated_at,
  'fleet', 1, null, e.location_id, e.notes, e.deleted_at, e.xtc_code
from public.equipment e
on conflict (id) do nothing;

-- 3 · Repoint children at the canonical store (ids preserved ⇒ values valid).
alter table public.rentals drop constraint rentals_equipment_id_fkey;
alter table public.rentals rename column equipment_id to asset_id;
alter table public.rentals
  add constraint rentals_asset_id_fkey foreign key (asset_id) references public.assets(id);
comment on column public.rentals.asset_id is
  'Sub-rented asset (unified store; was equipment_id pre kit-20 Phase A).';

alter table public.warranties drop constraint warranties_equipment_id_fkey;
alter table public.warranties rename column equipment_id to asset_id;
alter table public.warranties
  add constraint warranties_asset_id_fkey foreign key (asset_id) references public.assets(id) on delete set null;

-- daily_log_equipment keeps its column name (field daily-log vocabulary) but
-- the FK now targets the unified store.
alter table public.daily_log_equipment drop constraint daily_log_equipment_equipment_id_fkey;
alter table public.daily_log_equipment
  add constraint daily_log_equipment_equipment_id_fkey
  foreign key (equipment_id) references public.assets(id) on delete set null;

-- 4 · Utilization view moves to the unified store (fleet lens). The old view
--     joined asset_movements on equipment ids, which never matched (movements
--     only ever referenced assets) — utilization was structurally zero.
--     Output column `state` (not `status`) per LDP.
drop view if exists public.v_equipment_utilization;
create view public.v_asset_utilization
with (security_invoker = true) as
with movements as (
  select
    a.id as asset_id,
    a.org_id,
    a.asset_kind,
    a.asset_class,
    a.display_name as name,
    a.asset_tag,
    a.state,
    a.daily_rate_minor as daily_rate_cents,
    a.daily_rate_currency,
    count(am.*) filter (
      where am.movement_kind in ('checkout', 'reserve', 'transfer')
        and am.occurred_at >= now() - interval '30 days'
    )::integer as movements_30d,
    count(am.*) filter (
      where am.movement_kind in ('checkout', 'reserve', 'transfer')
        and am.occurred_at >= now() - interval '90 days'
    )::integer as movements_90d,
    coalesce(sum(
      case
        when am.movement_kind = 'reserve'
          and am.reservation_starts_at is not null
          and am.reservation_ends_at is not null
          and am.occurred_at >= now() - interval '30 days'
        then greatest(0::numeric, extract(epoch from am.reservation_ends_at - am.reservation_starts_at) / 86400::numeric)
        else 0::numeric
      end), 0::numeric)::numeric(10,2) as reserved_days_30d,
    coalesce(sum(
      case
        when am.movement_kind = 'reserve'
          and am.reservation_starts_at is not null
          and am.reservation_ends_at is not null
          and am.occurred_at >= now() - interval '90 days'
        then greatest(0::numeric, extract(epoch from am.reservation_ends_at - am.reservation_starts_at) / 86400::numeric)
        else 0::numeric
      end), 0::numeric)::numeric(10,2) as reserved_days_90d,
    max(am.occurred_at) filter (
      where am.movement_kind in ('checkout', 'reserve', 'transfer')
    ) as last_active_at
  from public.assets a
  left join public.asset_movements am on am.asset_id = a.id
  where a.deleted_at is null
  group by a.id, a.org_id, a.asset_kind, a.asset_class, a.display_name, a.asset_tag,
    a.state, a.daily_rate_minor, a.daily_rate_currency
)
select
  asset_id,
  org_id,
  asset_kind,
  asset_class,
  name,
  asset_tag,
  state,
  daily_rate_cents,
  daily_rate_currency,
  movements_30d,
  movements_90d,
  reserved_days_30d,
  reserved_days_90d,
  last_active_at,
  round(reserved_days_30d / 30.0 * 100::numeric, 1) as utilization_pct_30d,
  round(reserved_days_90d / 90.0 * 100::numeric, 1) as utilization_pct_90d,
  case
    when daily_rate_cents is not null
    then ((30::numeric - least(reserved_days_30d, 30::numeric)) * daily_rate_cents::numeric)::bigint
    else null::bigint
  end as idle_revenue_30d_cents
from movements m;

grant select on public.v_asset_utilization to authenticated;

-- 5 · RLS parity — assets previously had a single permissive ALL policy
--     (any org member could write). Equipment carried the canonical
--     manager-band write policies; the unified store inherits them.
drop policy ual_assets_org on public.assets;
create policy assets_select on public.assets
  for select using (private.is_org_member(org_id));
create policy assets_insert on public.assets
  for insert with check (private.has_org_role(org_id, array['owner','admin','controller','collaborator','manager']));
create policy assets_update on public.assets
  for update using (private.has_org_role(org_id, array['owner','admin','controller','collaborator','manager']))
  with check (private.has_org_role(org_id, array['owner','admin','controller','collaborator','manager']));
create policy assets_delete on public.assets
  for delete using (private.has_org_role(org_id, array['owner','admin']));

-- 6 · One store: the duplicate table + its enum go away.
drop table public.equipment;
drop type public.equipment_status;
