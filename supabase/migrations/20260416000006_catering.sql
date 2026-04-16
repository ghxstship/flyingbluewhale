-- ═══════════════════════════════════════════════════════
-- GVTEWAY Migration 006: Catering Module
-- ═══════════════════════════════════════════════════════

create type catering_alloc_status as enum ('allocated', 'confirmed', 'checked_in');

-- Meal Plans
create table catering_meal_plans (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  meal_name text not null,
  date date not null,
  time time not null,
  location text not null,
  capacity int not null default 0,
  dietary_options jsonb not null default '{"vegan": true, "vegetarian": true, "gluten_free": true, "halal": true, "kosher": true, "allergen_free": true}',
  cost_per_person numeric(10,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_meal_plans_project on catering_meal_plans(project_id);
create index idx_meal_plans_date on catering_meal_plans(date);

-- Allocations
create table catering_allocations (
  id uuid primary key default gen_random_uuid(),
  meal_plan_id uuid not null references catering_meal_plans(id) on delete cascade,
  group_type text not null,
  group_id uuid,
  person_id uuid references auth.users(id),
  quantity int not null default 1,
  dietary_requirements jsonb not null default '{}',
  status catering_alloc_status not null default 'allocated',
  created_at timestamptz not null default now()
);

create index idx_catering_alloc_meal on catering_allocations(meal_plan_id);
create index idx_catering_alloc_status on catering_allocations(status);

-- Check-ins
create table catering_check_ins (
  id uuid primary key default gen_random_uuid(),
  allocation_id uuid not null references catering_allocations(id) on delete cascade,
  checked_in_at timestamptz not null default now(),
  checked_in_by uuid not null references auth.users(id)
);

create trigger meal_plans_updated_at
  before update on catering_meal_plans
  for each row execute function update_updated_at();
