-- ═══════════════════════════════════════════════════════
-- RED SEA LION Migration 005: RLS Lifecycle Gates
-- Enforces lifecycle stage requirements for read/write access.
-- ═══════════════════════════════════════════════════════

-- Update is_internal_on_project to require minimum of 'onboarding'
create or replace function is_internal_on_project(proj_id uuid)
returns boolean as $$
  select exists(
    select 1 from project_members pm
    join project_member_lifecycles pml 
      on pml.project_id = pm.project_id and pml.user_id = pm.user_id
    where pm.project_id = proj_id
      and pm.user_id = auth.uid()
      and pm.role in ('developer', 'owner', 'admin', 'team_member', 'executive', 'production')
      and pml.stage >= 'onboarding'::role_lifecycle_stage
  );
$$ language sql security definer stable;

-- Update is_talent_on_project to require minimum of 'onboarding'
create or replace function is_talent_on_project(proj_id uuid)
returns boolean as $$
  select exists(
    select 1 from project_members pm
    join project_member_lifecycles pml 
      on pml.project_id = pm.project_id and pml.user_id = pm.user_id
    where pm.project_id = proj_id
      and pm.user_id = auth.uid()
      and pm.role in ('management', 'talent', 'crew')
      and pml.stage >= 'onboarding'::role_lifecycle_stage
  );
$$ language sql security definer stable;

-- Update is_project_member to require minimum of 'onboarding'
-- (Assuming is_project_member exists, replacing it to inject the lifecycle check)
create or replace function is_project_member(proj_id uuid)
returns boolean as $$
  select exists(
    select 1 from project_members pm
    join project_member_lifecycles pml 
      on pml.project_id = pm.project_id and pml.user_id = pm.user_id
    where pm.project_id = proj_id
      and pm.user_id = auth.uid()
      and pml.stage >= 'onboarding'::role_lifecycle_stage
  );
$$ language sql security definer stable;
