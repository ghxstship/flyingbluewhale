-- ═══════════════════════════════════════════════════════
-- GVTEWAY Migration 022b: Role Taxonomy — Data Migration
-- Migrates existing data from legacy role names to canonical names
-- and updates all RLS helper functions.
-- Must run AFTER enum extension (022a) in a separate transaction.
-- ═══════════════════════════════════════════════════════

-- ═══ 1. Migrate existing data to canonical role names ═══

update organization_members set role = 'collaborator'
  where role in ('talent_management', 'talent_performer', 'talent_crew', 'vendor', 'client', 'sponsor', 'industry_guest');

update project_members set role = 'management'   where role = 'talent_management';
update project_members set role = 'talent'        where role = 'talent_performer';
update project_members set role = 'crew'          where role = 'talent_crew';
update project_members set role = 'guest'         where role = 'industry_guest';

-- ═══ 2. Update RLS: is_internal_on_project ═══

create or replace function is_internal_on_project(proj_id uuid)
returns boolean as $$
  select exists(
    select 1 from project_members
    where project_id = proj_id
      and user_id = auth.uid()
      and role in ('developer', 'owner', 'admin', 'team_member', 'executive', 'production')
  );
$$ language sql security definer stable;

-- ═══ 3. Update RLS: is_talent_on_project ═══

create or replace function is_talent_on_project(proj_id uuid)
returns boolean as $$
  select exists(
    select 1 from project_members
    where project_id = proj_id
      and user_id = auth.uid()
      and role in ('management', 'talent', 'crew')
  );
$$ language sql security definer stable;

-- ═══ 4. Update catalog item visibility policy ═══

drop policy if exists "Catalog items visible by role" on advance_items;

create policy "Catalog items visible by role"
  on advance_items for select using (
    -- Operations + internal roles see all items
    exists(
      select 1 from project_members pm
      where pm.user_id = auth.uid()
        and pm.role in (
          'developer', 'owner', 'admin', 'team_member',
          'executive', 'production', 'management', 'crew', 'staff',
          'vendor', 'client'
        )
    )
    or
    -- Talent + limited-access roles only see talent_facing items
    (
      exists(
        select 1 from project_members pm
        where pm.user_id = auth.uid()
          and pm.role in ('talent', 'sponsor', 'press', 'guest', 'attendee')
      )
      and 'talent_facing' = any(visibility_tags)
    )
  );
