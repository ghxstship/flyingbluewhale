-- ═══════════════════════════════════════════════════════
-- GVTEWAY Migration 010: Row-Level Security Policies
-- Org-scoped, project-scoped, role-filtered
-- ═══════════════════════════════════════════════════════

-- Enable RLS on all tables
alter table organizations enable row level security;
alter table organization_members enable row level security;
alter table profiles enable row level security;
alter table projects enable row level security;
alter table project_members enable row level security;
alter table spaces enable row level security;
alter table acts enable row level security;
alter table advance_category_groups enable row level security;
alter table advance_categories enable row level security;
alter table advance_subcategories enable row level security;
alter table advance_items enable row level security;
alter table catalog_item_interchange enable row level security;
alter table catalog_item_supersession enable row level security;
alter table catalog_item_fitment enable row level security;
alter table catalog_item_inventory enable row level security;
alter table catalog_item_allocations enable row level security;
alter table deliverables enable row level security;
alter table deliverable_comments enable row level security;
alter table deliverable_history enable row level security;
alter table catering_meal_plans enable row level security;
alter table catering_allocations enable row level security;
alter table catering_check_ins enable row level security;
alter table notification_templates enable row level security;
alter table notification_log enable row level security;
alter table cms_pages enable row level security;
alter table cms_revisions enable row level security;
alter table project_templates enable row level security;
alter table submission_templates enable row level security;

-- ═══ Helper Functions ═══

-- Get user's org membership
create or replace function user_org_role(org_id uuid)
returns platform_role as $$
  select role from organization_members
  where organization_id = org_id and user_id = auth.uid()
  limit 1;
$$ language sql security definer stable;

-- Get user's project membership
create or replace function user_project_role(proj_id uuid)
returns platform_role as $$
  select role from project_members
  where project_id = proj_id and user_id = auth.uid()
  limit 1;
$$ language sql security definer stable;

-- Check if user is member of org
create or replace function is_org_member(org_id uuid)
returns boolean as $$
  select exists(
    select 1 from organization_members
    where organization_id = org_id and user_id = auth.uid()
  );
$$ language sql security definer stable;

-- Check if user is member of project
create or replace function is_project_member(proj_id uuid)
returns boolean as $$
  select exists(
    select 1 from project_members
    where project_id = proj_id and user_id = auth.uid()
  );
$$ language sql security definer stable;

-- Check if user has internal role on project
create or replace function is_internal_on_project(proj_id uuid)
returns boolean as $$
  select exists(
    select 1 from project_members
    where project_id = proj_id
      and user_id = auth.uid()
      and role in ('developer', 'owner', 'admin', 'team_member')
  );
$$ language sql security definer stable;

-- Check if user has talent role on project
create or replace function is_talent_on_project(proj_id uuid)
returns boolean as $$
  select exists(
    select 1 from project_members
    where project_id = proj_id
      and user_id = auth.uid()
      and role in ('talent_management', 'talent_performer', 'talent_crew')
  );
$$ language sql security definer stable;

-- ═══ Profiles ═══

create policy "Users can view all profiles"
  on profiles for select using (true);

create policy "Users can update own profile"
  on profiles for update using (id = auth.uid());

-- ═══ Organizations ═══

create policy "Org members can view their org"
  on organizations for select using (is_org_member(id));

create policy "Owners can update org"
  on organizations for update using (
    user_org_role(id) in ('developer', 'owner')
  );

-- ═══ Org Members ═══

create policy "Org members can view members"
  on organization_members for select using (is_org_member(organization_id));

create policy "Admins can manage members"
  on organization_members for all using (
    user_org_role(organization_id) in ('developer', 'owner', 'admin')
  );

-- ═══ Projects ═══

create policy "Project members can view project"
  on projects for select using (is_project_member(id));

create policy "Internal can manage projects"
  on projects for all using (
    user_org_role(organization_id) in ('developer', 'owner', 'admin')
  );

-- ═══ Project Members ═══

create policy "Project members can view members"
  on project_members for select using (is_project_member(project_id));

create policy "Internal can manage project members"
  on project_members for all using (is_internal_on_project(project_id));

-- ═══ Spaces ═══

create policy "Project members can view spaces"
  on spaces for select using (is_project_member(project_id));

create policy "Internal can manage spaces"
  on spaces for all using (is_internal_on_project(project_id));

-- ═══ Acts ═══

create policy "Project members can view acts"
  on acts for select using (is_project_member(project_id));

create policy "Internal can manage acts"
  on acts for all using (is_internal_on_project(project_id));

-- ═══ Catalog (UAC) — CRITICAL: Role-filtered views ═══

-- Category structure: readable by all authenticated users
create policy "Anyone can view catalog structure"
  on advance_category_groups for select using (true);

create policy "Anyone can view categories"
  on advance_categories for select using (true);

create policy "Anyone can view subcategories"
  on advance_subcategories for select using (true);

-- Items: filtered by visibility_tags based on user's project role
-- Internal + production roles see all items
-- Talent roles only see items tagged 'talent_facing'
create policy "Catalog items visible by role"
  on advance_items for select using (
    -- If user has any internal or production role on any project, see all
    exists(
      select 1 from project_members pm
      where pm.user_id = auth.uid()
        and pm.role in ('developer', 'owner', 'admin', 'team_member', 'vendor', 'client')
    )
    or
    -- If talent role, only see talent_facing items
    (
      exists(
        select 1 from project_members pm
        where pm.user_id = auth.uid()
          and pm.role in ('talent_management', 'talent_performer', 'talent_crew')
      )
      and 'talent_facing' = any(visibility_tags)
    )
  );

create policy "Internal can manage catalog items"
  on advance_items for all using (
    exists(
      select 1 from organization_members om
      where om.user_id = auth.uid()
        and om.role in ('developer', 'owner', 'admin')
    )
  );

-- Intelligence layers: readable by project members
create policy "View interchange" on catalog_item_interchange for select using (true);
create policy "View supersession" on catalog_item_supersession for select using (true);
create policy "View fitment" on catalog_item_fitment for select using (true);
create policy "View inventory" on catalog_item_inventory for select using (true);

-- Allocations: project-scoped
create policy "View allocations"
  on catalog_item_allocations for select using (is_project_member(project_id));

create policy "Internal manage allocations"
  on catalog_item_allocations for all using (is_internal_on_project(project_id));

-- ═══ Deliverables ═══

create policy "Project members can view deliverables"
  on deliverables for select using (is_project_member(project_id));

create policy "Submitters can create deliverables"
  on deliverables for insert with check (is_project_member(project_id));

create policy "Submitters can update own drafts"
  on deliverables for update using (
    (submitted_by = auth.uid() and status = 'draft')
    or is_internal_on_project(project_id)
  );

create policy "View comments"
  on deliverable_comments for select using (
    is_project_member((select project_id from deliverables where id = deliverable_id))
  );

create policy "Add comments"
  on deliverable_comments for insert with check (
    is_project_member((select project_id from deliverables where id = deliverable_id))
  );

create policy "View history"
  on deliverable_history for select using (
    is_project_member((select project_id from deliverables where id = deliverable_id))
  );

-- ═══ Catering ═══

create policy "View meal plans"
  on catering_meal_plans for select using (is_project_member(project_id));

create policy "Manage meal plans"
  on catering_meal_plans for all using (is_internal_on_project(project_id));

create policy "View allocations"
  on catering_allocations for select using (
    is_project_member((select project_id from catering_meal_plans where id = meal_plan_id))
  );

create policy "Manage catering allocations"
  on catering_allocations for all using (
    is_internal_on_project((select project_id from catering_meal_plans where id = meal_plan_id))
  );

create policy "View catering check-ins"
  on catering_check_ins for select using (
    is_project_member((select mp.project_id from catering_allocations ca join catering_meal_plans mp on mp.id = ca.meal_plan_id where ca.id = allocation_id))
  );

create policy "Create catering check-ins"
  on catering_check_ins for insert with check (
    is_internal_on_project((select mp.project_id from catering_allocations ca join catering_meal_plans mp on mp.id = ca.meal_plan_id where ca.id = allocation_id))
  );

-- ═══ Notifications ═══

create policy "View notification templates"
  on notification_templates for select using (
    project_id is null or is_project_member(project_id)
  );

create policy "Manage notification templates"
  on notification_templates for all using (
    project_id is null or is_internal_on_project(project_id)
  );

create policy "View notification log"
  on notification_log for select using (
    recipient_id = auth.uid()
    or (project_id is not null and is_internal_on_project(project_id))
  );

-- ═══ CMS ═══

create policy "View published pages"
  on cms_pages for select using (
    (published = true and is_project_member(project_id))
    or is_internal_on_project(project_id)
  );

create policy "Manage CMS pages"
  on cms_pages for all using (is_internal_on_project(project_id));

create policy "View revisions"
  on cms_revisions for select using (
    is_internal_on_project((select project_id from cms_pages where id = page_id))
  );

-- ═══ Templates ═══

create policy "View project templates"
  on project_templates for select using (
    is_system = true
    or organization_id is null
    or is_org_member(organization_id)
  );

create policy "Manage project templates"
  on project_templates for all using (
    organization_id is not null and
    user_org_role(organization_id) in ('developer', 'owner', 'admin')
  );

create policy "View submission templates"
  on submission_templates for select using (
    is_system = true
    or scope = 'global'
    or (scope = 'personal' and created_by = auth.uid())
    or (scope = 'org' and organization_id is not null and is_org_member(organization_id))
  );

create policy "Manage submission templates"
  on submission_templates for all using (
    created_by = auth.uid()
    or (organization_id is not null and user_org_role(organization_id) in ('developer', 'owner', 'admin'))
  );
