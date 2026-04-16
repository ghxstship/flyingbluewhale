-- ═══════════════════════════════════════════════════════
-- GVTEWAY Migration 013: RLS Fix — Project Creator Self-Insert
--
-- Fixes chicken-and-egg: creating a project requires adding
-- yourself as a project member, but the RLS policy for
-- project_members INSERT checks is_internal_on_project()
-- which requires an existing project_members row.
--
-- Solution: Allow org admins (who can create projects)
-- to also insert project_members for projects in their org.
-- ═══════════════════════════════════════════════════════

-- Drop the overly restrictive policy
drop policy if exists "Internal can manage project members" on project_members;

-- Replace with one that checks org-level admin rights OR existing project membership
create policy "Admins can manage project members"
  on project_members for all using (
    -- Existing internal project member can manage
    is_internal_on_project(project_id)
    or
    -- Org admin can manage members for any project in their org
    exists(
      select 1 from projects p
      join organization_members om on om.organization_id = p.organization_id
      where p.id = project_members.project_id
        and om.user_id = auth.uid()
        and om.role in ('developer', 'owner', 'admin')
    )
  );

-- Also fix: spaces, acts, deliverables, etc. need the project creator
-- to be able to write BEFORE they have a project_members row.
-- The "Internal can manage" policies check is_internal_on_project()
-- which won't work until the user is in project_members.
-- Add fallback for org admins on all project-scoped tables.

-- Spaces: org admins can manage
drop policy if exists "Internal can manage spaces" on spaces;
create policy "Internal or org admin can manage spaces"
  on spaces for all using (
    is_internal_on_project(project_id)
    or exists(
      select 1 from projects p
      join organization_members om on om.organization_id = p.organization_id
      where p.id = spaces.project_id
        and om.user_id = auth.uid()
        and om.role in ('developer', 'owner', 'admin')
    )
  );

-- Acts: org admins can manage
drop policy if exists "Internal can manage acts" on acts;
create policy "Internal or org admin can manage acts"
  on acts for all using (
    is_internal_on_project(project_id)
    or exists(
      select 1 from projects p
      join organization_members om on om.organization_id = p.organization_id
      where p.id = acts.project_id
        and om.user_id = auth.uid()
        and om.role in ('developer', 'owner', 'admin')
    )
  );

-- Catering: org admins can manage
drop policy if exists "Manage meal plans" on catering_meal_plans;
create policy "Internal or org admin can manage meal plans"
  on catering_meal_plans for all using (
    is_internal_on_project(project_id)
    or exists(
      select 1 from projects p
      join organization_members om on om.organization_id = p.organization_id
      where p.id = catering_meal_plans.project_id
        and om.user_id = auth.uid()
        and om.role in ('developer', 'owner', 'admin')
    )
  );

-- CMS: org admins can manage
drop policy if exists "Manage CMS pages" on cms_pages;
create policy "Internal or org admin can manage CMS pages"
  on cms_pages for all using (
    is_internal_on_project(project_id)
    or exists(
      select 1 from projects p
      join organization_members om on om.organization_id = p.organization_id
      where p.id = cms_pages.project_id
        and om.user_id = auth.uid()
        and om.role in ('developer', 'owner', 'admin')
    )
  );

-- Notification templates: org admins can manage
drop policy if exists "Manage notification templates" on notification_templates;
create policy "Org admin can manage notification templates"
  on notification_templates for all using (
    (project_id is null and exists(
      select 1 from organization_members om
      where om.user_id = auth.uid()
        and om.role in ('developer', 'owner', 'admin')
    ))
    or (project_id is not null and (
      is_internal_on_project(project_id)
      or exists(
        select 1 from projects p
        join organization_members om on om.organization_id = p.organization_id
        where p.id = notification_templates.project_id
          and om.user_id = auth.uid()
          and om.role in ('developer', 'owner', 'admin')
      )
    ))
  );
