-- ═══════════════════════════════════════════════════════
-- GVTEWAY Migration 005: Credential Engine (STUBS ONLY)
-- Schema created for FK integrity; UI/API deferred
-- ═══════════════════════════════════════════════════════

create type credential_order_status as enum (
  'requested', 'approved', 'denied', 'issued', 'picked_up', 'revoked'
);

create type credential_print_status as enum (
  'pending', 'queued', 'printed', 'reprinting'
);

create type check_in_method as enum ('scan', 'manual');

-- Credential types per project (Artist, Crew, VIP, Staff, etc.)
create table credential_types (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  color text not null default '#00E5FF',
  quantity_limit int,
  settings jsonb not null default '{}',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Zones
create table credential_zones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  access_level text not null default 'standard',
  description text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Zone access matrix
create table credential_type_zones (
  id uuid primary key default gen_random_uuid(),
  credential_type_id uuid not null references credential_types(id) on delete cascade,
  zone_id uuid not null references credential_zones(id) on delete cascade,
  unique(credential_type_id, zone_id)
);

-- Orders
create table credential_orders (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  credential_type_id uuid not null references credential_types(id) on delete cascade,
  user_id uuid references auth.users(id),
  group_name text,
  quantity int not null default 1,
  status credential_order_status not null default 'requested',
  requested_at timestamptz not null default now(),
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

-- Badge templates
create table credential_badge_templates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  layout jsonb not null default '{}',
  fields text[] not null default '{}',
  branding jsonb not null default '{}',
  version int not null default 1,
  created_at timestamptz not null default now()
);

-- Badges
create table credential_badges (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references credential_orders(id) on delete cascade,
  template_id uuid references credential_badge_templates(id),
  person_name text,
  person_id uuid references auth.users(id),
  photo_uri text,
  barcode_data text,
  qr_data text,
  print_status credential_print_status not null default 'pending',
  created_at timestamptz not null default now()
);

-- Check-ins
create table credential_check_ins (
  id uuid primary key default gen_random_uuid(),
  credential_order_id uuid not null references credential_orders(id) on delete cascade,
  checked_in_at timestamptz not null default now(),
  checked_in_by uuid not null references auth.users(id),
  method check_in_method not null default 'scan',
  location text,
  notes text
);
