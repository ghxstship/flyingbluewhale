-- ═══════════════════════════════════════════════════════
-- GVTEWAY Migration 023: Ticketing Engine (STUBS ONLY)
-- Schema created for FK integrity; UI/API deferred
-- Follows credential_stubs.sql (005) pattern exactly
-- ═══════════════════════════════════════════════════════

create type ticket_status as enum (
  'reserved', 'purchased', 'confirmed', 'transferred',
  'scanned', 'used', 'refunded', 'voided'
);

-- Ticket tiers per project (GA, VIP, Early Bird, etc.)
create table ticket_tiers (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  description text,
  price_cents int not null default 0,
  currency text not null default 'USD',
  capacity int,                     -- null = unlimited
  sort_order int not null default 0,
  sale_start timestamptz,
  sale_end timestamptz,
  settings jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- Individual tickets
create table tickets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  tier_id uuid not null references ticket_tiers(id) on delete cascade,
  holder_user_id uuid references auth.users(id),  -- nullable for anonymous
  holder_email text,
  holder_name text,
  order_reference text,              -- external payment ref
  status ticket_status not null default 'reserved',
  qr_data text,
  barcode_data text,
  purchased_at timestamptz,
  scanned_at timestamptz,
  scanned_by uuid references auth.users(id),
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- Ticket transfer log (immutable)
create table ticket_transfers (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references tickets(id) on delete cascade,
  from_user_id uuid references auth.users(id),
  from_email text,
  to_user_id uuid references auth.users(id),
  to_email text not null,
  transferred_at timestamptz not null default now(),
  initiated_by uuid references auth.users(id)
);

-- Ticket scan log (parallels credential_check_ins)
create table ticket_scans (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references tickets(id) on delete cascade,
  scanned_at timestamptz not null default now(),
  scanned_by uuid not null references auth.users(id),
  gate text,
  method check_in_method not null default 'scan',  -- reuse existing enum from 005
  result text not null default 'admitted'
    check (result in ('admitted', 'denied_already_used', 'denied_revoked', 'denied_wrong_gate')),
  notes text
);

-- Promo / comp code table
create table ticket_promo_codes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  code text not null,
  tier_id uuid references ticket_tiers(id),
  discount_type text not null default 'fixed'
    check (discount_type in ('fixed', 'percentage', 'comp')),
  discount_value int not null default 0,  -- cents or percentage
  usage_limit int,
  usage_count int not null default 0,
  valid_from timestamptz,
  valid_until timestamptz,
  created_at timestamptz not null default now(),
  unique(project_id, code)
);

-- Extend approval engine to accept ticket entities
-- Safe additive ALTER — no existing rows affected
alter table approval_actions
  drop constraint if exists approval_actions_entity_type_check;

alter table approval_actions
  add constraint approval_actions_entity_type_check
  check (entity_type in (
    'deliverable', 'credential_order', 'allocation', 'fulfillment_order',
    'ticket', 'ticket_refund'
  ));
