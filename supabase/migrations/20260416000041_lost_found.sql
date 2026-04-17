-- ═══════════════════════════════════════════════════════
-- GVTEWAY Migration 030: Lost & Found
-- Report → catalog → claim → verify → return/ship lifecycle
-- ═══════════════════════════════════════════════════════

create type lf_status as enum ('reported','cataloged','claimed','verified','returned','shipped','unclaimed','disposed');
create type lf_type as enum ('lost','found');

create table lost_found_reports (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  type lf_type not null,
  status lf_status not null default 'reported',
  reference_number text not null,
  category text not null default 'personal_item' check (category in ('radio','credential','equipment','personal_item','clothing','electronics','wallet_keys','other')),

  -- Item details
  item_description text not null,
  item_color text,
  item_brand text,
  identifying_features text,
  estimated_value numeric(10,2),
  asset_instance_id uuid references asset_instances(id) on delete set null,
  allocation_id uuid references catalog_item_allocations(id) on delete set null,

  -- Location context
  found_location text,
  found_location_id uuid references locations(id) on delete set null,
  found_at timestamptz,
  found_by_name text,
  found_by_user_id uuid references auth.users(id),
  found_by_phone text,
  found_by_email text,

  -- Lost report context (when type = 'lost')
  lost_location text,
  lost_at_approx timestamptz,
  last_seen_description text,

  -- Claimant
  claimed_by_name text,
  claimed_by_email text,
  claimed_by_phone text,
  claimed_by_user_id uuid references auth.users(id),
  claimed_at timestamptz,
  claim_description text,

  -- Verification
  verified_by uuid references auth.users(id),
  verified_at timestamptz,
  verification_method text check (verification_method in ('id_check','description_match','photo_match','serial_match','other')),
  verification_notes text,

  -- Resolution
  resolution text check (resolution in ('returned_in_person','shipped','disposed','donated','transferred_to_venue','transferred_to_police','other')),
  resolution_notes text,
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id),

  -- Shipping (mail-back)
  shipping_address jsonb,
  shipment_id uuid references shipments(id) on delete set null,

  -- Storage
  storage_location text,
  storage_location_id uuid references locations(id) on delete set null,
  disposal_date date,

  notes text,
  metadata jsonb not null default '{}',
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_lf_project on lost_found_reports(project_id);
create index idx_lf_type on lost_found_reports(type);
create index idx_lf_status on lost_found_reports(status);
create index idx_lf_ref on lost_found_reports(reference_number);
create index idx_lf_category on lost_found_reports(category);
create index idx_lf_asset on lost_found_reports(asset_instance_id);
create index idx_lf_found_at on lost_found_reports(found_at);

-- Status transition validation
create or replace function validate_lf_transition()
returns trigger as $$
declare valid boolean;
begin
  if old.status = new.status then return new; end if;

  valid := case old.status
    when 'reported' then new.status in ('cataloged', 'claimed')
    when 'cataloged' then new.status in ('claimed', 'unclaimed', 'disposed')
    when 'claimed' then new.status in ('verified', 'cataloged')
    when 'verified' then new.status in ('returned', 'shipped')
    when 'returned' then false
    when 'shipped' then false
    when 'unclaimed' then new.status in ('disposed', 'claimed')
    when 'disposed' then false
    else false
  end;

  if not valid then
    raise exception 'Invalid L&F status transition: % -> %', old.status, new.status;
  end if;

  if new.status = 'claimed' then new.claimed_at = coalesce(new.claimed_at, now()); end if;
  if new.status = 'verified' then new.verified_at = coalesce(new.verified_at, now()); end if;
  if new.status in ('returned', 'shipped', 'disposed') then new.resolved_at = coalesce(new.resolved_at, now()); end if;

  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger check_lf_transition
  before update of status on lost_found_reports
  for each row execute function validate_lf_transition();

-- Auto-match found items to lost reports
create or replace function attempt_lf_auto_match()
returns trigger as $$
begin
  -- If a found item has an asset_instance_id, check if it was reported lost
  if new.type = 'found' and new.asset_instance_id is not null then
    -- Update the asset instance status from 'lost' to 'available'
    update asset_instances set
      status = 'available',
      notes = 'Found via L&F report ' || new.reference_number
    where id = new.asset_instance_id and status = 'lost';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger auto_match_lf
  after insert on lost_found_reports
  for each row execute function attempt_lf_auto_match();

-- Auto-create shipment when L&F status changes to 'shipped'
create or replace function create_lf_shipment()
returns trigger as $$
begin
  if new.status = 'shipped' and old.status != 'shipped' and new.shipment_id is null and new.shipping_address is not null then
    insert into shipments (organization_id, project_id, direction, status, reference_number, destination_address, created_by, notes)
    select p.organization_id, new.project_id, 'outbound', 'booked', 'LF-SHIP-' || new.reference_number, new.shipping_address, coalesce(new.resolved_by, new.created_by), 'Lost & Found mail-back for ' || new.reference_number
    from projects p where p.id = new.project_id
    returning id into new.shipment_id;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger auto_create_lf_shipment
  before update of status on lost_found_reports
  for each row execute function create_lf_shipment();

-- Audit trail
create or replace function audit_lf_change()
returns trigger as $$
begin
  if old.status is distinct from new.status then
    insert into audit_log (project_id, entity_type, entity_id, action, actor_id, old_state, new_state)
    values (new.project_id, 'lost_found', new.id, 'lost_found.' || new.status, coalesce(new.resolved_by, new.verified_by, new.created_by),
      jsonb_build_object('status', old.status::text),
      jsonb_build_object('status', new.status::text, 'type', new.type::text, 'category', new.category, 'reference_number', new.reference_number));
  end if;
  return new;
end;
$$ language plpgsql;

create trigger audit_lf_status
  after update on lost_found_reports
  for each row execute function audit_lf_change();

create trigger lf_updated_at
  before update on lost_found_reports
  for each row execute function update_updated_at();

-- RLS
alter table lost_found_reports enable row level security;

create policy "View L&F reports" on lost_found_reports for select using (is_project_member(project_id));
create policy "Create L&F reports" on lost_found_reports for insert with check (is_project_member(project_id));
create policy "Manage L&F reports" on lost_found_reports for update using (is_internal_on_project(project_id));
