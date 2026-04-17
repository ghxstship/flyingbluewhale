-- ═══════════════════════════════════════════════════════
-- RED SEA LION Migration 014: Re-Audit Remediations
-- Closes GAP-038 through GAP-042
-- Discovered in re-audit pass after initial 37-gap closure.
-- ═══════════════════════════════════════════════════════

-- ===== 1. Fix is_internal_on_project (GAP-038) ==========
-- Remove dead platform role references; add 'management'
-- which should have internal-equivalent project access.
create or replace function is_internal_on_project(proj_id uuid)
returns boolean as $$
  select exists(
    select 1 from project_members pm
    join project_member_lifecycles pml
      on pml.project_id = pm.project_id and pml.user_id = pm.user_id
    where pm.project_id = proj_id
      and pm.user_id = auth.uid()
      and pm.role in ('executive', 'production', 'management')
      and pml.stage >= 'onboarding'::role_lifecycle_stage
  );
$$ language sql security definer stable;


-- ===== 2. Fix is_talent_on_project (GAP-039) ============
-- Add 'staff' which has talent-adjacent access (event-day ops,
-- check-in scanning, catering access).
create or replace function is_talent_on_project(proj_id uuid)
returns boolean as $$
  select exists(
    select 1 from project_members pm
    join project_member_lifecycles pml
      on pml.project_id = pm.project_id and pml.user_id = pm.user_id
    where pm.project_id = proj_id
      and pm.user_id = auth.uid()
      and pm.role in ('talent', 'crew', 'staff')
      and pml.stage >= 'onboarding'::role_lifecycle_stage
  );
$$ language sql security definer stable;


-- ===== 3. ATLVS Lookup Table RLS (GAP-040) ==============
-- These 8 tables live in the atlvs schema, not public.
-- The dynamic loop in migration 010 uses LIKE 'atlvs_%' on
-- pg_tables but these tables don't have that prefix.

alter table atlvs.countries enable row level security;
alter table atlvs.region_level_1 enable row level security;
alter table atlvs.region_level_2 enable row level security;
alter table atlvs.localities enable row level security;
alter table atlvs.districts enable row level security;
alter table atlvs.venue_types enable row level security;
alter table atlvs.features enable row level security;
alter table atlvs.venue_type_assignments enable row level security;

-- Public read (reference data), admin write
create policy "Public read countries" on atlvs.countries for select using (true);
create policy "Admin write countries" on atlvs.countries for all using (
  exists(select 1 from public.organization_members om where om.user_id = auth.uid() and om.role in ('developer', 'owner', 'admin'))
);

create policy "Public read region_level_1" on atlvs.region_level_1 for select using (true);
create policy "Admin write region_level_1" on atlvs.region_level_1 for all using (
  exists(select 1 from public.organization_members om where om.user_id = auth.uid() and om.role in ('developer', 'owner', 'admin'))
);

create policy "Public read region_level_2" on atlvs.region_level_2 for select using (true);
create policy "Admin write region_level_2" on atlvs.region_level_2 for all using (
  exists(select 1 from public.organization_members om where om.user_id = auth.uid() and om.role in ('developer', 'owner', 'admin'))
);

create policy "Public read localities" on atlvs.localities for select using (true);
create policy "Admin write localities" on atlvs.localities for all using (
  exists(select 1 from public.organization_members om where om.user_id = auth.uid() and om.role in ('developer', 'owner', 'admin'))
);

create policy "Public read districts" on atlvs.districts for select using (true);
create policy "Admin write districts" on atlvs.districts for all using (
  exists(select 1 from public.organization_members om where om.user_id = auth.uid() and om.role in ('developer', 'owner', 'admin'))
);

create policy "Public read venue_types" on atlvs.venue_types for select using (true);
create policy "Admin write venue_types" on atlvs.venue_types for all using (
  exists(select 1 from public.organization_members om where om.user_id = auth.uid() and om.role in ('developer', 'owner', 'admin'))
);

create policy "Public read features" on atlvs.features for select using (true);
create policy "Admin write features" on atlvs.features for all using (
  exists(select 1 from public.organization_members om where om.user_id = auth.uid() and om.role in ('developer', 'owner', 'admin'))
);

create policy "Public read venue_type_assignments" on atlvs.venue_type_assignments for select using (true);
create policy "Admin write venue_type_assignments" on atlvs.venue_type_assignments for all using (
  exists(select 1 from public.organization_members om where om.user_id = auth.uid() and om.role in ('developer', 'owner', 'admin'))
);
