-- ═══════════════════════════════════════════════════════
-- GVTEWAY Migration 001: Identity & Tenancy
-- ═══════════════════════════════════════════════════════

-- Role enum
create type platform_role as enum (
  'developer',
  'owner',
  'admin',
  'team_member',
  'talent_management',
  'talent_performer',
  'talent_crew',
  'vendor',
  'client',
  'sponsor',
  'industry_guest'
);

-- Organizations
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text,
  settings jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_organizations_slug on organizations(slug);

-- Organization Members
create table organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role platform_role not null default 'team_member',
  created_at timestamptz not null default now(),
  unique(organization_id, user_id)
);

create index idx_org_members_org on organization_members(organization_id);
create index idx_org_members_user on organization_members(user_id);

-- User profiles (extends auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  display_name text,
  avatar_url text,
  phone text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email)
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Updated_at trigger function
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger organizations_updated_at
  before update on organizations
  for each row execute function update_updated_at();

create trigger profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();
