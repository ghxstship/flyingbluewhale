-- ═══════════════════════════════════════════════════════
-- GVTEWAY Migration 021: Role Taxonomy Overhaul
-- Two-tier RBAC: platform_role (internal) + project_role (external)
--
-- Platform Roles (org-scoped, internal):
--   developer, owner, admin, team_member, collaborator
--
-- Project Roles (project-scoped, external):
--   executive, production, management, crew, staff,
--   talent, vendor, client, sponsor, press, guest, attendee
-- ═══════════════════════════════════════════════════════

-- ═══ 1. Create project_role enum ═══

create type project_role as enum (
  'executive',
  'production',
  'management',
  'crew',
  'staff',
  'talent',
  'vendor',
  'client',
  'sponsor',
  'press',
  'guest',
  'attendee'
);

-- ═══ 2. Replace platform_role enum ═══
-- Postgres doesn't allow removing values from an enum,
-- so we create a new one and migrate columns.

-- Create the new slimmed-down platform role
create type platform_role_v2 as enum (
  'developer',
  'owner',
  'admin',
  'team_member',
  'collaborator'
);

-- ═══ 3. Migrate organization_members.role ═══

alter table organization_members
  add column role_new platform_role_v2;

update organization_members set role_new = case role::text
  when 'developer' then 'developer'::platform_role_v2
  when 'owner' then 'owner'::platform_role_v2
  when 'admin' then 'admin'::platform_role_v2
  when 'team_member' then 'team_member'::platform_role_v2
  -- All external roles become collaborator at the org level
  when 'talent_management' then 'collaborator'::platform_role_v2
  when 'talent_performer' then 'collaborator'::platform_role_v2
  when 'talent_crew' then 'collaborator'::platform_role_v2
  when 'vendor' then 'collaborator'::platform_role_v2
  when 'client' then 'collaborator'::platform_role_v2
  when 'sponsor' then 'collaborator'::platform_role_v2
  when 'industry_guest' then 'collaborator'::platform_role_v2
  else 'collaborator'::platform_role_v2
end;

alter table organization_members
  alter column role_new set not null,
  alter column role_new set default 'collaborator'::platform_role_v2;

alter table organization_members drop column role;
alter table organization_members rename column role_new to role;

-- ═══ 4. Migrate project_members.role ═══

alter table project_members
  add column role_new project_role;

update project_members set role_new = case role::text
  when 'developer' then 'executive'::project_role
  when 'owner' then 'executive'::project_role
  when 'admin' then 'executive'::project_role
  when 'team_member' then 'production'::project_role
  when 'talent_management' then 'management'::project_role
  when 'talent_performer' then 'talent'::project_role
  when 'talent_crew' then 'crew'::project_role
  when 'vendor' then 'vendor'::project_role
  when 'client' then 'client'::project_role
  when 'sponsor' then 'sponsor'::project_role
  when 'industry_guest' then 'guest'::project_role
  else 'attendee'::project_role
end;

alter table project_members
  alter column role_new set not null;

alter table project_members drop column role;
alter table project_members rename column role_new to role;

-- ═══ 5. Drop old enum, rename new one ═══

drop type platform_role;
alter type platform_role_v2 rename to platform_role;

-- ═══ 6. Update RLS helper functions ═══

-- Get user's org membership (updated return type)
create or replace function user_org_role(org_id uuid)
returns platform_role as $$
  select role from organization_members
  where organization_id = org_id and user_id = auth.uid()
  limit 1;
$$ language sql security definer stable;

-- Get user's project membership (now returns project_role)
create or replace function user_project_role(proj_id uuid)
returns project_role as $$
  select role from project_members
  where project_id = proj_id and user_id = auth.uid()
  limit 1;
$$ language sql security definer stable;

-- Check if user is member of org (unchanged logic)
create or replace function is_org_member(org_id uuid)
returns boolean as $$
  select exists(
    select 1 from organization_members
    where organization_id = org_id and user_id = auth.uid()
  );
$$ language sql security definer stable;

-- Check if user is member of project (unchanged logic)
create or replace function is_project_member(proj_id uuid)
returns boolean as $$
  select exists(
    select 1 from project_members
    where project_id = proj_id and user_id = auth.uid()
  );
$$ language sql security definer stable;

-- Check if user has internal/operations role on project
-- Executive + Production have full write access
create or replace function is_internal_on_project(proj_id uuid)
returns boolean as $$
  select exists(
    select 1 from project_members
    where project_id = proj_id
      and user_id = auth.uid()
      and role in ('executive', 'production')
  );
$$ language sql security definer stable;

-- Check if user has talent/creative role on project
create or replace function is_talent_on_project(proj_id uuid)
returns boolean as $$
  select exists(
    select 1 from project_members
    where project_id = proj_id
      and user_id = auth.uid()
      and role in ('management', 'talent', 'crew')
  );
$$ language sql security definer stable;

-- ═══ 7. Update catalog item visibility policy ═══

drop policy if exists "Catalog items visible by role" on advance_items;

create policy "Catalog items visible by role"
  on advance_items for select using (
    -- Internal + operations roles see all items
    exists(
      select 1 from project_members pm
      where pm.user_id = auth.uid()
        and pm.role in ('executive', 'production', 'management', 'crew', 'staff', 'vendor', 'client')
    )
    or
    -- Talent roles only see talent_facing items
    (
      exists(
        select 1 from project_members pm
        where pm.user_id = auth.uid()
          and pm.role in ('talent', 'sponsor', 'press', 'guest', 'attendee')
      )
      and 'talent_facing' = any(visibility_tags)
    )
  );

-- ═══ 8. Update portal_track enum ═══
-- Add new tracks for press and attendee

alter type portal_track add value if not exists 'press';
alter type portal_track add value if not exists 'attendee';
alter type portal_track add value if not exists 'talent';
alter type portal_track add value if not exists 'crew';
alter type portal_track add value if not exists 'staff';
alter type portal_track add value if not exists 'management';

-- ═══ 9. Done ═══
-- All downstream RLS policies reference the helper functions
-- (is_internal_on_project, is_talent_on_project, etc.)
-- which are now updated to use the new project_role values.
-- No individual policy rewrites needed beyond catalog visibility.
