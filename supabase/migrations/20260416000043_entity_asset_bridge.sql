-- ═══════════════════════════════════════════════════════
-- GVTEWAY Migration 032: Entity-Asset Bridge
-- Universal linking layer between credentials/tickets
-- and the asset catalog (allocations + instances)
-- ═══════════════════════════════════════════════════════

-- ═══ 1. Entity-Asset Links (polymorphic junction) ═══
-- Bridges credential orders, credential types, tickets,
-- and ticket tiers to catalog allocations and items.

create table entity_asset_links (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,

  -- Polymorphic source: what entity owns this link
  source_type text not null
    check (source_type in (
      'credential_order', 'credential_type',
      'ticket', 'ticket_tier'
    )),
  source_id uuid not null,

  -- Target: the allocation or item being linked
  allocation_id uuid references catalog_item_allocations(id) on delete set null,
  asset_instance_id uuid references asset_instances(id) on delete set null,
  item_id uuid not null references advance_items(id) on delete cascade,
  quantity int not null default 1,

  -- Link lifecycle
  link_type text not null default 'assigned'
    check (link_type in ('entitlement', 'assigned', 'checked_out', 'returned')),
  linked_at timestamptz not null default now(),
  linked_by uuid references auth.users(id),
  unlinked_at timestamptz,
  unlinked_by uuid references auth.users(id),
  notes text,

  created_at timestamptz not null default now()
);

create index idx_eal_source on entity_asset_links(source_type, source_id);
create index idx_eal_allocation on entity_asset_links(allocation_id);
create index idx_eal_asset_instance on entity_asset_links(asset_instance_id);
create index idx_eal_project on entity_asset_links(project_id);
create index idx_eal_item on entity_asset_links(item_id);
create index idx_eal_link_type on entity_asset_links(link_type);
create index idx_eal_active on entity_asset_links(source_type, source_id)
  where unlinked_at is null;

-- ═══ 2. Extend allocations with holder entity tracking ═══
-- Allows allocations to know their originating entity

alter table catalog_item_allocations
  add column if not exists holder_entity_type text
    check (holder_entity_type is null or holder_entity_type in (
      'credential_order', 'ticket'
    )),
  add column if not exists holder_entity_id uuid,
  add column if not exists holder_email text;

create index if not exists idx_allocations_holder_entity
  on catalog_item_allocations(holder_entity_type, holder_entity_id)
  where holder_entity_type is not null;

-- ═══ 3. Extend fulfillment orders with origin entity tracking ═══
-- Allows tracing shipments back to credential/ticket batches

alter table fulfillment_orders
  add column if not exists origin_entity_type text
    check (origin_entity_type is null or origin_entity_type in (
      'credential_order', 'credential_type',
      'ticket', 'ticket_tier'
    )),
  add column if not exists origin_entity_id uuid;

create index if not exists idx_fulfillment_origin_entity
  on fulfillment_orders(origin_entity_type, origin_entity_id)
  where origin_entity_type is not null;

-- ═══ 4. Fix approval_actions CHECK constraint ═══
-- Migration 042 dropped ticket/ticket_refund — re-add alongside
-- all entity types from the current constraint

alter table approval_actions
  drop constraint if exists approval_actions_entity_type_check;

alter table approval_actions
  add constraint approval_actions_entity_type_check
  check (entity_type in (
    'deliverable', 'credential_order', 'allocation', 'fulfillment_order',
    'purchase_order', 'logistics_schedule', 'lost_found',
    'ticket', 'ticket_refund', 'entity_asset_link'
  ));

-- ═══ 5. RLS for entity_asset_links ═══

alter table entity_asset_links enable row level security;

-- Internal project roles can manage all links
create policy "Manage entity asset links"
  on entity_asset_links for all
  using (is_internal_on_project(project_id));

-- Users can view links for their own credential orders
create policy "View own credential asset links"
  on entity_asset_links for select
  using (
    source_type = 'credential_order'
    and exists(
      select 1 from credential_orders co
      where co.id = source_id and co.user_id = auth.uid()
    )
  );

-- Users can view links for their own tickets
create policy "View own ticket asset links"
  on entity_asset_links for select
  using (
    source_type = 'ticket'
    and exists(
      select 1 from tickets t
      where t.id = source_id and t.holder_user_id = auth.uid()
    )
  );

-- All project members can view entitlement templates
create policy "View entitlement templates"
  on entity_asset_links for select
  using (
    link_type = 'entitlement'
    and is_project_member(project_id)
  );

-- ═══ 6. Extend catalog item visibility for guest-facing items ═══
-- The existing policy (from migration 033) covers:
--   - Internal roles see all
--   - Talent/sponsor/press/guest/attendee see talent_facing only
-- We add a third branch: attendee/guest/sponsor also see guest_facing

drop policy if exists "Catalog items visible by role" on advance_items;

create policy "Catalog items visible by role"
  on advance_items for select using (
    -- Internal + operations roles see all items
    exists(
      select 1 from project_members pm
      where pm.user_id = auth.uid()
        and pm.role in (
          'developer', 'owner', 'admin', 'team_member',
          'executive', 'production', 'management', 'crew', 'staff',
          'vendor', 'client'
        )
    )
    or
    -- Talent roles see talent_facing items
    (
      exists(
        select 1 from project_members pm
        where pm.user_id = auth.uid()
          and pm.role in ('talent', 'sponsor', 'press', 'guest', 'attendee')
      )
      and ('talent_facing' = any(visibility_tags) or 'guest_facing' = any(visibility_tags))
    )
  );

-- ═══ 7. Audit trigger for entity-asset link changes ═══

create or replace function audit_entity_asset_link_change()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    insert into audit_log (project_id, entity_type, entity_id, action, actor_id, new_state)
    values (
      new.project_id, 'entity_asset_link', new.id, 'asset.linked',
      coalesce(new.linked_by, auth.uid()),
      jsonb_build_object(
        'source_type', new.source_type, 'source_id', new.source_id,
        'item_id', new.item_id, 'quantity', new.quantity,
        'link_type', new.link_type
      )
    );
  elsif tg_op = 'UPDATE' and old.unlinked_at is null and new.unlinked_at is not null then
    insert into audit_log (project_id, entity_type, entity_id, action, actor_id, old_state, new_state)
    values (
      new.project_id, 'entity_asset_link', new.id, 'asset.unlinked',
      coalesce(new.unlinked_by, auth.uid()),
      jsonb_build_object('link_type', old.link_type),
      jsonb_build_object('link_type', new.link_type, 'unlinked_at', new.unlinked_at::text)
    );
  elsif tg_op = 'UPDATE' and old.link_type is distinct from new.link_type then
    insert into audit_log (project_id, entity_type, entity_id, action, actor_id, old_state, new_state)
    values (
      new.project_id, 'entity_asset_link', new.id,
      'asset.' || new.link_type,
      coalesce(new.linked_by, auth.uid()),
      jsonb_build_object('link_type', old.link_type),
      jsonb_build_object('link_type', new.link_type)
    );
  end if;
  return coalesce(new, old);
end;
$$ language plpgsql;

create trigger audit_entity_asset_link
  after insert or update on entity_asset_links
  for each row execute function audit_entity_asset_link_change();
