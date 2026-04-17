-- ═══════════════════════════════════════════════════════
-- GVTEWAY Migration 023: Vendors (Suppliers, Carriers, Rental Houses)
-- First-class vendor registry for procurement & shipping
-- ═══════════════════════════════════════════════════════

create table vendors (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  slug text not null,
  type text not null default 'supplier' check (type in ('supplier','carrier','rental_house','freelancer','other')),
  contact jsonb not null default '{}',
  address jsonb not null default '{}',
  payment_terms text check (payment_terms in ('net_15','net_30','net_45','net_60','cod','prepaid','on_account')),
  tax_id text,
  rating numeric(3,2) check (rating >= 0 and rating <= 5),
  website text,
  notes text,
  is_active boolean not null default true,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(organization_id, slug)
);

create index idx_vendors_org on vendors(organization_id);
create index idx_vendors_type on vendors(type);
create index idx_vendors_name on vendors(name);

-- Vendor contacts (multiple contacts per vendor)
create table vendor_contacts (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references vendors(id) on delete cascade,
  name text not null,
  title text,
  email text,
  phone text,
  is_primary boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);

create index idx_vendor_contacts_vendor on vendor_contacts(vendor_id);

create trigger vendors_updated_at
  before update on vendors
  for each row execute function update_updated_at();

-- RLS
alter table vendors enable row level security;
alter table vendor_contacts enable row level security;

create policy "View org vendors" on vendors for select
  using (exists(select 1 from organization_members om where om.organization_id = vendors.organization_id and om.user_id = auth.uid()));

create policy "Manage org vendors" on vendors for all
  using (exists(select 1 from organization_members om where om.organization_id = vendors.organization_id and om.user_id = auth.uid() and om.role in ('developer','owner','admin','team_member')));

create policy "View vendor contacts" on vendor_contacts for select
  using (exists(select 1 from vendors v join organization_members om on om.organization_id = v.organization_id where v.id = vendor_id and om.user_id = auth.uid()));

create policy "Manage vendor contacts" on vendor_contacts for all
  using (exists(select 1 from vendors v join organization_members om on om.organization_id = v.organization_id where v.id = vendor_id and om.user_id = auth.uid() and om.role in ('developer','owner','admin','team_member')));
