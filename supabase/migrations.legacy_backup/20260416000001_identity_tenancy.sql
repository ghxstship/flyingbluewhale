-- flyingbluewhale · identity + tenancy
-- Organizations, users, memberships, platform roles, subscription tiers.

create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

create type platform_role as enum (
  'developer','owner','admin','controller','collaborator',
  'contractor','crew','client','viewer','community'
);

create type project_role as enum ('creator','collaborator','viewer','vendor');

create type tier as enum ('portal','starter','professional','enterprise');

create table orgs (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null check (slug ~ '^[a-z0-9-]+$' and char_length(slug) <= 48),
  name         text not null,
  tier         tier not null default 'portal',
  created_at   timestamptz not null default now()
);

create table users (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text not null,
  name         text,
  avatar_url   text,
  created_at   timestamptz not null default now()
);

create table memberships (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references orgs(id) on delete cascade,
  user_id      uuid not null references users(id) on delete cascade,
  role         platform_role not null default 'community',
  created_at   timestamptz not null default now(),
  unique (org_id, user_id)
);

create index memberships_user_idx on memberships(user_id);
create index memberships_org_idx on memberships(org_id);

-- Trigger: auto-create public.users row when auth.users row is inserted
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Helper: list orgs the caller is a member of
create or replace function auth_org_ids() returns setof uuid
language sql stable security definer set search_path = public as $$
  select org_id from memberships where user_id = auth.uid();
$$;

-- Helper: is caller a member of given org?
create or replace function is_org_member(target_org uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from memberships where user_id = auth.uid() and org_id = target_org);
$$;

-- Helper: does caller have role >= required within org?
create or replace function has_org_role(target_org uuid, required text[]) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from memberships
    where user_id = auth.uid() and org_id = target_org and role::text = any(required)
  );
$$;
