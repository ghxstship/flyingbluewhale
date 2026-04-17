-- ═══════════════════════════════════════════════════════
-- GVTEWAY Migration 022: Locations (Multi-Location Warehousing)
-- Warehouses, sites, docks, stages, storage areas
-- ═══════════════════════════════════════════════════════

create table locations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  parent_id uuid references locations(id) on delete cascade,
  name text not null,
  slug text not null,
  type text not null check (type in ('warehouse','site','dock','stage','storage','vehicle','vendor','other')),
  address jsonb not null default '{}',
  capacity jsonb not null default '{}',
  operating_hours jsonb not null default '{}',
  contact jsonb not null default '{}',
  is_active boolean not null default true,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_locations_org on locations(organization_id);
create index idx_locations_project on locations(project_id);
create index idx_locations_parent on locations(parent_id);
create index idx_locations_type on locations(type);
create index idx_locations_slug on locations(slug);

-- Prevent circular parent references
create or replace function validate_location_hierarchy()
returns trigger as $$
declare
  ancestor_id uuid;
  depth int := 0;
begin
  if new.parent_id is null then return new; end if;
  if new.parent_id = new.id then
    raise exception 'Location cannot be its own parent';
  end if;

  ancestor_id := new.parent_id;
  while ancestor_id is not null and depth < 10 loop
    if ancestor_id = new.id then
      raise exception 'Circular location hierarchy detected';
    end if;
    select parent_id into ancestor_id from locations where id = ancestor_id;
    depth := depth + 1;
  end loop;

  return new;
end;
$$ language plpgsql;

create trigger check_location_hierarchy
  before insert or update of parent_id on locations
  for each row execute function validate_location_hierarchy();

create trigger locations_updated_at
  before update on locations
  for each row execute function update_updated_at();

-- RLS
alter table locations enable row level security;

create policy "View org locations" on locations for select
  using (
    exists(select 1 from organization_members om where om.organization_id = locations.organization_id and om.user_id = auth.uid())
    or (project_id is not null and is_project_member(project_id))
  );

create policy "Manage org locations" on locations for all
  using (
    exists(select 1 from organization_members om where om.organization_id = locations.organization_id and om.user_id = auth.uid() and om.role in ('developer','owner','admin'))
    or (project_id is not null and is_internal_on_project(project_id))
  );

-- Audit trail
create or replace function audit_location_change()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    insert into audit_log (organization_id, project_id, entity_type, entity_id, action, actor_id, new_state)
    values (new.organization_id, new.project_id, 'location', new.id, 'location.created', auth.uid(), jsonb_build_object('name', new.name, 'type', new.type));
  elsif old.is_active is distinct from new.is_active then
    insert into audit_log (organization_id, project_id, entity_type, entity_id, action, actor_id, old_state, new_state)
    values (new.organization_id, new.project_id, 'location', new.id, 'location.' || case when new.is_active then 'activated' else 'deactivated' end, auth.uid(), jsonb_build_object('is_active', old.is_active), jsonb_build_object('is_active', new.is_active));
  end if;
  return coalesce(new, old);
end;
$$ language plpgsql;

create trigger audit_location
  after insert or update on locations
  for each row execute function audit_location_change();
