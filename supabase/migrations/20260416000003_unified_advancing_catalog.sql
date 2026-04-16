-- ═══════════════════════════════════════════════════════
-- GVTEWAY Migration 003: Unified Advancing Catalog
-- Single schema, role-filtered via visibility_tags
-- ═══════════════════════════════════════════════════════

create type allocation_state as enum (
  'reserved', 'confirmed', 'in_transit', 'on_site', 'returned', 'maintenance'
);

-- Category Groups (10 collections)
create table advance_category_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  sort_order int not null default 0
);

-- Categories (24+)
create table advance_categories (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references advance_category_groups(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  sort_order int not null default 0,
  unique(group_id, slug)
);

create index idx_categories_group on advance_categories(group_id);

-- Subcategories (94+)
create table advance_subcategories (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references advance_categories(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  sort_order int not null default 0,
  unique(category_id, slug)
);

create index idx_subcategories_category on advance_subcategories(category_id);

-- Items (350+)
create table advance_items (
  id uuid primary key default gen_random_uuid(),
  subcategory_id uuid not null references advance_subcategories(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  manufacturer text,
  model text,
  sku text,
  unit text not null default 'each',
  weight_kg numeric(10,2),
  power_watts int,
  daily_rate numeric(10,2),
  weekly_rate numeric(10,2),
  purchase_price numeric(10,2),
  visibility_tags text[] not null default '{production}',
  specifications jsonb not null default '{}',
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_items_subcategory on advance_items(subcategory_id);
create index idx_items_visibility on advance_items using gin(visibility_tags);
create index idx_items_name on advance_items(name);
create index idx_items_manufacturer on advance_items(manufacturer);

-- Interchange (cross-references between equivalent items)
create table catalog_item_interchange (
  id uuid primary key default gen_random_uuid(),
  item_a_id uuid not null references advance_items(id) on delete cascade,
  item_b_id uuid not null references advance_items(id) on delete cascade,
  compatibility_score numeric(3,2) not null default 1.0,
  relationship_type text not null default 'equivalent',
  notes text,
  constraint different_items check (item_a_id != item_b_id),
  unique(item_a_id, item_b_id)
);

-- Supersession (discontinued -> replacement chains)
create table catalog_item_supersession (
  id uuid primary key default gen_random_uuid(),
  discontinued_item_id uuid not null references advance_items(id) on delete cascade,
  replacement_item_id uuid not null references advance_items(id) on delete cascade,
  effective_date date not null default current_date,
  notes text,
  constraint different_supersession check (discontinued_item_id != replacement_item_id)
);

-- Fitment (item qualification by context)
create table catalog_item_fitment (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references advance_items(id) on delete cascade,
  venue_type text[] not null default '{}',
  weather text[] not null default '{}',
  min_capacity int,
  max_capacity int,
  budget_tier text,
  power_phase text,
  indoor_outdoor text[] not null default '{}',
  event_type text[] not null default '{}',
  certification text[] not null default '{}',
  weight_class text
);

create index idx_fitment_item on catalog_item_fitment(item_id);

-- Inventory
create table catalog_item_inventory (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references advance_items(id) on delete cascade unique,
  quantity_owned int not null default 0,
  quantity_available int not null default 0,
  warehouse_location text,
  updated_at timestamptz not null default now()
);

-- Allocations (per-project, per-space, with state machine)
create table catalog_item_allocations (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references advance_items(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  space_id uuid references spaces(id) on delete set null,
  quantity int not null default 1,
  state allocation_state not null default 'reserved',
  notes text,
  allocated_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_allocations_item on catalog_item_allocations(item_id);
create index idx_allocations_project on catalog_item_allocations(project_id);
create index idx_allocations_state on catalog_item_allocations(state);

-- Allocation state transition validation
create or replace function validate_allocation_transition()
returns trigger as $$
declare
  valid boolean;
begin
  if old.state = new.state then
    return new;
  end if;

  valid := case old.state
    when 'reserved' then new.state in ('confirmed', 'reserved')
    when 'confirmed' then new.state in ('in_transit', 'reserved')
    when 'in_transit' then new.state in ('on_site', 'confirmed')
    when 'on_site' then new.state in ('returned', 'maintenance')
    when 'returned' then new.state in ('reserved', 'maintenance')
    when 'maintenance' then new.state in ('returned', 'reserved')
    else false
  end;

  if not valid then
    raise exception 'Invalid allocation state transition: % -> %', old.state, new.state;
  end if;

  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger check_allocation_transition
  before update of state on catalog_item_allocations
  for each row execute function validate_allocation_transition();

create trigger items_updated_at
  before update on advance_items
  for each row execute function update_updated_at();
