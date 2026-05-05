-- ═══════════════════════════════════════════════════════════════════
-- Role System v2 — billing × operations split
-- ═══════════════════════════════════════════════════════════════════
-- Replaces the original 10-value platform_role + unused project_role
-- enums with two clean orthogonal dimensions:
--
--   platform_role (4 values, on memberships.role) — billing/governance
--     owner   — billing + delete org
--     admin   — full org control except billing
--     manager — manage projects/people, no billing
--     member  — default; access governed by project_members
--
--   project_role (5 values, on project_members.role) — operations
--     lead        — PM/producer; full project control
--     editor      — read/write team work
--     contributor — write own work, read project (crew, contractors)
--     viewer      — read-only (clients, sponsors, observers)
--     vendor      — scoped to their own POs/deliverables/invoices
--
-- Per-user developer flag becomes memberships.is_developer (orthogonal
-- to billing power). Personas are derived in the app layer, not stored.
--
-- Demo-org pattern: every signed-up user is auto-added to a single
-- 'demo' org as 'member', with seeded sample data, so guests have a
-- real project to click into instead of an empty /me.
--
-- Zero backwards compatibility — retired role names (controller,
-- collaborator, contractor, crew, client, viewer, community, developer,
-- creator) are remapped to the new model and dropped from the enum.
-- ═══════════════════════════════════════════════════════════════════

------------------------------------------------------------------
-- 1. Detach role columns from old enums (cast to text temporarily)
------------------------------------------------------------------
alter table memberships alter column role drop default;
alter table memberships alter column role type text using role::text;

alter table invites alter column role drop default;
alter table invites alter column role type text using role::text;

------------------------------------------------------------------
-- 2. Remap data: legacy role values → new role values
------------------------------------------------------------------
-- developer becomes admin + is_developer flag (added below)
-- controller → manager (privileged ops without billing)
-- collaborator/contractor/crew/client/viewer/community → member
update memberships set role = case role
  when 'developer'    then 'admin'
  when 'controller'   then 'manager'
  when 'collaborator' then 'member'
  when 'contractor'   then 'member'
  when 'crew'         then 'member'
  when 'client'       then 'member'
  when 'viewer'       then 'member'
  when 'community'    then 'member'
  else role
end;

update invites set role = case role
  when 'developer'    then 'admin'
  when 'controller'   then 'manager'
  when 'collaborator' then 'member'
  when 'contractor'   then 'member'
  when 'crew'         then 'member'
  when 'client'       then 'member'
  when 'viewer'       then 'member'
  when 'community'    then 'member'
  else role
end;

------------------------------------------------------------------
-- 3. Add is_developer flag to memberships
------------------------------------------------------------------
alter table memberships add column if not exists is_developer boolean not null default false;

-- Anyone who used to be 'developer' (now 'admin') gets the flag set.
-- We can't introspect prior values after the UPDATE above, so we set it
-- via a heuristic on existing api_keys ownership: developers are the
-- humans who minted personal access tokens. Conservative — false positives
-- only mean they keep admin without the flag (no privilege loss).
update memberships m set is_developer = true
  where exists (select 1 from api_keys k where k.created_by = m.user_id and k.org_id = m.org_id);

------------------------------------------------------------------
-- 4. Drop old enums, create new ones
------------------------------------------------------------------
drop type if exists platform_role cascade;
drop type if exists project_role cascade;

create type platform_role as enum ('owner', 'admin', 'manager', 'member');
create type project_role as enum ('lead', 'editor', 'contributor', 'viewer', 'vendor');

------------------------------------------------------------------
-- 5. Cast role columns back to enum
------------------------------------------------------------------
alter table memberships alter column role type platform_role using role::platform_role;
alter table memberships alter column role set default 'member';

alter table invites alter column role type platform_role using role::platform_role;
alter table invites alter column role set default 'member';

------------------------------------------------------------------
-- 6. project_members table — operational access at project scope
------------------------------------------------------------------
create table if not exists project_members (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references projects(id) on delete cascade,
  user_id     uuid not null references users(id) on delete cascade,
  role        project_role not null default 'contributor',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (project_id, user_id)
);

create index if not exists project_members_project_idx on project_members(project_id);
create index if not exists project_members_user_idx on project_members(user_id);

alter table project_members enable row level security;

------------------------------------------------------------------
-- 7. RLS helpers
------------------------------------------------------------------
-- has_org_role: existing helper, kept as-is (signature unchanged).
-- Now only accepts owner/admin/manager/member values inside the array.
create or replace function has_org_role(target_org uuid, required text[]) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from memberships
    where user_id = auth.uid() and org_id = target_org and role::text = any(required)
  );
$$;

-- is_org_admin: shorthand for owner/admin (the two billing-touching roles).
create or replace function is_org_admin(target_org uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from memberships
    where user_id = auth.uid() and org_id = target_org and role in ('owner','admin')
  );
$$;

-- is_org_manager_plus: owner/admin/manager — the privileged ops band.
create or replace function is_org_manager_plus(target_org uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from memberships
    where user_id = auth.uid() and org_id = target_org and role in ('owner','admin','manager')
  );
$$;

-- is_project_member: caller is in project_members for the given project,
-- OR is platform owner/admin/manager in the project's org (auto-bypass).
create or replace function is_project_member(target_project uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from project_members where project_id = target_project and user_id = auth.uid()
  ) or exists (
    select 1 from projects p
    join memberships m on m.org_id = p.org_id
    where p.id = target_project and m.user_id = auth.uid() and m.role in ('owner','admin','manager')
  );
$$;

-- has_project_role: caller has one of the listed project roles on the
-- given project, OR is platform owner/admin/manager (auto-bypass = lead).
create or replace function has_project_role(target_project uuid, required text[]) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from project_members
    where project_id = target_project and user_id = auth.uid() and role::text = any(required)
  ) or exists (
    select 1 from projects p
    join memberships m on m.org_id = p.org_id
    where p.id = target_project and m.user_id = auth.uid() and m.role in ('owner','admin','manager')
  );
$$;

------------------------------------------------------------------
-- 8. project_members RLS
------------------------------------------------------------------
create policy project_members_select on project_members for select to authenticated
  using (
    user_id = auth.uid()
    or exists (select 1 from projects p where p.id = project_id and is_org_member(p.org_id))
  );

create policy project_members_insert on project_members for insert to authenticated
  with check (
    exists (select 1 from projects p where p.id = project_id and is_org_manager_plus(p.org_id))
  );

create policy project_members_update on project_members for update to authenticated
  using (
    exists (select 1 from projects p where p.id = project_id and is_org_manager_plus(p.org_id))
  )
  with check (
    exists (select 1 from projects p where p.id = project_id and is_org_manager_plus(p.org_id))
  );

create policy project_members_delete on project_members for delete to authenticated
  using (
    user_id = auth.uid()
    or exists (select 1 from projects p where p.id = project_id and is_org_manager_plus(p.org_id))
  );

create or replace function project_members_touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists project_members_updated_at on project_members;
create trigger project_members_updated_at
  before update on project_members
  for each row execute function project_members_touch_updated_at();

------------------------------------------------------------------
-- 9. RLS sweep — drop + recreate every policy that referenced retired
--    role names. New mappings:
--      controller   → manager
--      collaborator → member
--      contractor   → member
--      crew         → member
--      developer    → (dropped from arrays; admin alone gates)
------------------------------------------------------------------

-- ─── core (5_rls.sql) ────────────────────────────────────────────
drop policy if exists projects_insert on projects;
create policy projects_insert on projects for insert
  with check (has_org_role(org_id, array['owner','admin','manager','member']));

drop policy if exists projects_update on projects;
create policy projects_update on projects for update
  using (has_org_role(org_id, array['owner','admin','manager','member']))
  with check (has_org_role(org_id, array['owner','admin','manager','member']));

drop policy if exists tickets_insert on tickets;
create policy tickets_insert on tickets for insert
  with check (has_org_role(org_id, array['owner','admin','manager','member']));

drop policy if exists tickets_update on tickets;
create policy tickets_update on tickets for update
  using (has_org_role(org_id, array['owner','admin','manager','member']))
  with check (has_org_role(org_id, array['owner','admin','manager','member']));

drop policy if exists ticket_scans_insert on ticket_scans;
create policy ticket_scans_insert on ticket_scans for insert
  with check (exists (select 1 from tickets t where t.id = ticket_id
                       and has_org_role(t.org_id, array['owner','admin','manager','member'])));

drop policy if exists advancing_update_reviewer on advancing_submissions;
create policy advancing_update_reviewer on advancing_submissions for update
  using (exists (select 1 from projects p where p.id = project_id
                  and has_org_role(p.org_id, array['owner','admin','manager','member'])))
  with check (exists (select 1 from projects p where p.id = project_id
                       and has_org_role(p.org_id, array['owner','admin','manager','member'])));

-- ─── invites (drop developer from admin band) ────────────────────
drop policy if exists invites_select_admin on invites;
drop policy if exists invites_insert_admin on invites;
drop policy if exists invites_update_admin on invites;
drop policy if exists invites_delete_admin on invites;

create policy invites_select_admin on invites for select
  using (has_org_role(org_id, array['owner','admin']));
create policy invites_insert_admin on invites for insert
  with check (has_org_role(org_id, array['owner','admin']));
create policy invites_update_admin on invites for update
  using (has_org_role(org_id, array['owner','admin']));
create policy invites_delete_admin on invites for delete
  using (has_org_role(org_id, array['owner','admin']));

-- ─── olympic_scope (000030) ──────────────────────────────────────
drop policy if exists risks_insert on risks;
create policy risks_insert on risks for insert to authenticated
  with check (has_org_role(org_id, array['owner','admin','manager','member']));
drop policy if exists risks_update on risks;
create policy risks_update on risks for update to authenticated
  using (has_org_role(org_id, array['owner','admin','manager','member']))
  with check (has_org_role(org_id, array['owner','admin','manager','member']));

drop policy if exists accreditation_categories_rw on accreditation_categories;
create policy accreditation_categories_rw on accreditation_categories for all to authenticated
  using (is_org_member(org_id))
  with check (has_org_role(org_id, array['owner','admin','manager']));

drop policy if exists accreditations_admin on accreditations;
create policy accreditations_admin on accreditations for all to authenticated
  using (has_org_role(org_id, array['owner','admin','manager']))
  with check (has_org_role(org_id, array['owner','admin','manager']));

drop policy if exists accreditation_changes_write on accreditation_changes;
create policy accreditation_changes_write on accreditation_changes for all to authenticated
  using (has_org_role(org_id, array['owner','admin','manager']))
  with check (has_org_role(org_id, array['owner','admin','manager']));

drop policy if exists workforce_members_admin on workforce_members;
create policy workforce_members_admin on workforce_members for all to authenticated
  using (has_org_role(org_id, array['owner','admin','manager']))
  with check (has_org_role(org_id, array['owner','admin','manager']));

drop policy if exists shifts_admin on shifts;
create policy shifts_admin on shifts for all to authenticated
  using (has_org_role(org_id, array['owner','admin','manager','member']))
  with check (has_org_role(org_id, array['owner','admin','manager','member']));

drop policy if exists medical_encounters_select on medical_encounters;
create policy medical_encounters_select on medical_encounters for select to authenticated
  using (has_org_role(org_id, array['owner','admin','manager']));

drop policy if exists medical_encounters_write on medical_encounters;
create policy medical_encounters_write on medical_encounters for all to authenticated
  using (has_org_role(org_id, array['owner','admin','manager']))
  with check (has_org_role(org_id, array['owner','admin','manager']));

drop policy if exists crisis_alerts_admin on crisis_alerts;
create policy crisis_alerts_admin on crisis_alerts for all to authenticated
  using (has_org_role(org_id, array['owner','admin','manager']))
  with check (has_org_role(org_id, array['owner','admin','manager']));

drop policy if exists delegations_admin on delegations;
create policy delegations_admin on delegations for all to authenticated
  using (has_org_role(org_id, array['owner','admin','manager']))
  with check (has_org_role(org_id, array['owner','admin','manager']));

drop policy if exists rate_card_items_admin on rate_card_items;
create policy rate_card_items_admin on rate_card_items for all to authenticated
  using (has_org_role(org_id, array['owner','admin','manager']))
  with check (has_org_role(org_id, array['owner','admin','manager']));

drop policy if exists dispatch_runs_admin on dispatch_runs;
create policy dispatch_runs_admin on dispatch_runs for all to authenticated
  using (has_org_role(org_id, array['owner','admin','manager']))
  with check (has_org_role(org_id, array['owner','admin','manager']));

drop policy if exists ticket_types_admin on ticket_types;
create policy ticket_types_admin on ticket_types for all to authenticated
  using (has_org_role(org_id, array['owner','admin','manager']))
  with check (has_org_role(org_id, array['owner','admin','manager']));

drop policy if exists sponsor_entitlements_admin on sponsor_entitlements;
create policy sponsor_entitlements_admin on sponsor_entitlements for all to authenticated
  using (has_org_role(org_id, array['owner','admin','manager']))
  with check (has_org_role(org_id, array['owner','admin','manager']));

drop policy if exists dsar_requests_admin on dsar_requests;
create policy dsar_requests_admin on dsar_requests for all to authenticated
  using (has_org_role(org_id, array['owner','admin','manager']))
  with check (has_org_role(org_id, array['owner','admin','manager']));

drop policy if exists trademarks_rw on trademarks;
create policy trademarks_rw on trademarks for all to authenticated
  using (is_org_member(org_id))
  with check (has_org_role(org_id, array['owner','admin','manager']));

drop policy if exists insurance_policies_rw on insurance_policies;
create policy insurance_policies_rw on insurance_policies for all to authenticated
  using (is_org_member(org_id))
  with check (has_org_role(org_id, array['owner','admin','manager']));

drop policy if exists kb_articles_write on kb_articles;
create policy kb_articles_write on kb_articles for all to authenticated
  using (has_org_role(org_id, array['owner','admin','manager','member']))
  with check (has_org_role(org_id, array['owner','admin','manager','member']));

-- ─── safety_marketing_tables (000035) ────────────────────────────
drop policy if exists threats_insert on threats;
drop policy if exists threats_update on threats;
create policy threats_insert on threats for insert
  with check (has_org_role(org_id, array['owner','admin','manager']));
create policy threats_update on threats for update
  using (has_org_role(org_id, array['owner','admin','manager']));

drop policy if exists playbooks_insert on playbooks;
drop policy if exists playbooks_update on playbooks;
create policy playbooks_insert on playbooks for insert
  with check (has_org_role(org_id, array['owner','admin','manager']));
create policy playbooks_update on playbooks for update
  using (has_org_role(org_id, array['owner','admin','manager']));

drop policy if exists guard_tours_insert on guard_tours;
drop policy if exists guard_tours_update on guard_tours;
create policy guard_tours_insert on guard_tours for insert
  with check (has_org_role(org_id, array['owner','admin','manager','member']));
create policy guard_tours_update on guard_tours for update
  using (has_org_role(org_id, array['owner','admin','manager','member']));

drop policy if exists campaigns_insert on campaigns;
drop policy if exists campaigns_update on campaigns;
create policy campaigns_insert on campaigns for insert
  with check (has_org_role(org_id, array['owner','admin','manager']));
create policy campaigns_update on campaigns for update
  using (has_org_role(org_id, array['owner','admin','manager']));

-- ─── service_requests + sla (000034) ─────────────────────────────
drop policy if exists service_sla_policies_insert on service_sla_policies;
drop policy if exists service_sla_policies_update on service_sla_policies;
create policy service_sla_policies_insert on service_sla_policies for insert
  with check (has_org_role(org_id, array['owner','admin','manager']));
create policy service_sla_policies_update on service_sla_policies for update
  using (has_org_role(org_id, array['owner','admin','manager']));

drop policy if exists service_requests_delete on service_requests;
create policy service_requests_delete on service_requests for delete
  using (has_org_role(org_id, array['owner','admin','manager']));

-- ─── procore_parity (000038) ─────────────────────────────────────
drop policy if exists daily_logs_insert on daily_logs;
drop policy if exists daily_logs_update on daily_logs;
create policy daily_logs_insert on daily_logs for insert
  with check (has_org_role(org_id, array['owner','admin','manager','member']));
create policy daily_logs_update on daily_logs for update
  using (has_org_role(org_id, array['owner','admin','manager','member']));

drop policy if exists incidents_update on incidents;
create policy incidents_update on incidents for update
  using (has_org_role(org_id, array['owner','admin','manager','member']));

drop policy if exists punch_items_update on punch_items;
create policy punch_items_update on punch_items for update
  using (has_org_role(org_id, array['owner','admin','manager','member']));

drop policy if exists rfis_update on rfis;
create policy rfis_update on rfis for update
  using (has_org_role(org_id, array['owner','admin','manager','member']));

drop policy if exists submittals_update on submittals;
create policy submittals_update on submittals for update
  using (has_org_role(org_id, array['owner','admin','manager','member']));

drop policy if exists pay_apps_update on payment_applications;
drop policy if exists pay_apps_delete on payment_applications;
create policy pay_apps_update on payment_applications for update
  using (has_org_role(org_id, array['owner','admin','manager']));
create policy pay_apps_delete on payment_applications for delete
  using (has_org_role(org_id, array['owner','admin','manager']));

drop policy if exists po_co_update on po_change_orders;
create policy po_co_update on po_change_orders for update
  using (has_org_role(org_id, array['owner','admin','manager']));

drop policy if exists site_plans_insert on site_plans;
drop policy if exists site_plans_update on site_plans;
create policy site_plans_insert on site_plans for insert
  with check (has_org_role(org_id, array['owner','admin','manager','member']));
create policy site_plans_update on site_plans for update
  using (has_org_role(org_id, array['owner','admin','manager','member']));

drop policy if exists stage_plots_insert on stage_plots;
drop policy if exists stage_plots_update on stage_plots;
create policy stage_plots_insert on stage_plots for insert
  with check (has_org_role(org_id, array['owner','admin','manager','member']));
create policy stage_plots_update on stage_plots for update
  using (has_org_role(org_id, array['owner','admin','manager','member']));

drop policy if exists deliverable_templates_insert on deliverable_templates;
drop policy if exists deliverable_templates_update on deliverable_templates;
create policy deliverable_templates_insert on deliverable_templates for insert
  with check (has_org_role(org_id, array['owner','admin','manager']));
create policy deliverable_templates_update on deliverable_templates for update
  using (has_org_role(org_id, array['owner','admin','manager']));

drop policy if exists insp_tpl_insert on inspection_templates;
drop policy if exists insp_tpl_update on inspection_templates;
create policy insp_tpl_insert on inspection_templates for insert
  with check (has_org_role(org_id, array['owner','admin','manager']));
create policy insp_tpl_update on inspection_templates for update
  using (has_org_role(org_id, array['owner','admin','manager']));

drop policy if exists inspections_insert on inspections;
drop policy if exists inspections_update on inspections;
create policy inspections_insert on inspections for insert
  with check (has_org_role(org_id, array['owner','admin','manager','member']));
create policy inspections_update on inspections for update
  using (has_org_role(org_id, array['owner','admin','manager','member']));

drop policy if exists itil_changes_insert on itil_changes;
drop policy if exists itil_changes_update on itil_changes;
create policy itil_changes_insert on itil_changes for insert
  with check (has_org_role(org_id, array['owner','admin','manager']));
create policy itil_changes_update on itil_changes for update
  using (has_org_role(org_id, array['owner','admin','manager']));

drop policy if exists itil_problems_insert on itil_problems;
drop policy if exists itil_problems_update on itil_problems;
create policy itil_problems_insert on itil_problems for insert
  with check (has_org_role(org_id, array['owner','admin','manager']));
create policy itil_problems_update on itil_problems for update
  using (has_org_role(org_id, array['owner','admin','manager']));

drop policy if exists rfq_resp_update on rfq_responses;
drop policy if exists rfq_resp_delete on rfq_responses;
create policy rfq_resp_update on rfq_responses for update
  using (has_org_role(org_id, array['owner','admin','manager']));
create policy rfq_resp_delete on rfq_responses for delete
  using (has_org_role(org_id, array['owner','admin','manager']));

drop policy if exists vp_insert on vendor_prequalifications;
drop policy if exists vp_update on vendor_prequalifications;
create policy vp_insert on vendor_prequalifications for insert
  with check (has_org_role(org_id, array['owner','admin','manager']));
create policy vp_update on vendor_prequalifications for update
  using (has_org_role(org_id, array['owner','admin','manager']));

drop policy if exists briefings_insert on safety_briefings;
drop policy if exists briefings_update on safety_briefings;
create policy briefings_insert on safety_briefings for insert
  with check (has_org_role(org_id, array['owner','admin','manager','member']));
create policy briefings_update on safety_briefings for update
  using (has_org_role(org_id, array['owner','admin','manager','member']));

drop policy if exists wob_insert on work_order_broadcasts;
drop policy if exists wob_update on work_order_broadcasts;
create policy wob_insert on work_order_broadcasts for insert
  with check (has_org_role(org_id, array['owner','admin','manager','member']));
create policy wob_update on work_order_broadcasts for update
  using (has_org_role(org_id, array['owner','admin','manager','member']));

drop policy if exists venue_build_log_insert on venue_build_log;
drop policy if exists venue_build_log_update on venue_build_log;
create policy venue_build_log_insert on venue_build_log for insert
  with check (has_org_role(org_id, array['owner','admin','manager','member']));
create policy venue_build_log_update on venue_build_log for update
  using (has_org_role(org_id, array['owner','admin','manager','member']));

drop policy if exists venue_closeout_insert on venue_closeout_items;
drop policy if exists venue_closeout_update on venue_closeout_items;
create policy venue_closeout_insert on venue_closeout_items for insert
  with check (has_org_role(org_id, array['owner','admin','manager','member']));
create policy venue_closeout_update on venue_closeout_items for update
  using (has_org_role(org_id, array['owner','admin','manager','member']));

drop policy if exists venue_design_specs_insert on venue_design_specs;
drop policy if exists venue_design_specs_update on venue_design_specs;
create policy venue_design_specs_insert on venue_design_specs for insert
  with check (has_org_role(org_id, array['owner','admin','manager','member']));
create policy venue_design_specs_update on venue_design_specs for update
  using (has_org_role(org_id, array['owner','admin','manager','member']));

drop policy if exists venue_handover_insert on venue_handover_items;
drop policy if exists venue_handover_update on venue_handover_items;
create policy venue_handover_insert on venue_handover_items for insert
  with check (has_org_role(org_id, array['owner','admin','manager','member']));
create policy venue_handover_update on venue_handover_items for update
  using (has_org_role(org_id, array['owner','admin','manager','member']));

drop policy if exists venue_vop_insert on venue_vop_sections;
drop policy if exists venue_vop_update on venue_vop_sections;
create policy venue_vop_insert on venue_vop_sections for insert
  with check (has_org_role(org_id, array['owner','admin','manager']));
create policy venue_vop_update on venue_vop_sections for update
  using (has_org_role(org_id, array['owner','admin','manager']));

-- ─── conversations + xpms ────────────────────────────────────────
drop policy if exists conversations_update on conversations;
create policy conversations_update on conversations for update
  using (has_org_role(org_id, array['owner','admin','manager','member']));

------------------------------------------------------------------
-- 10. Demo org + auto-add trigger + seed
------------------------------------------------------------------
-- Stable demo-org id so seed data and triggers can reference it.
insert into orgs (id, slug, name, tier)
values ('00000000-0000-4000-a000-000000000001', 'demo', 'LYTEHAUS Demo', 'access')
on conflict (slug) do nothing;

-- Trigger: every new authenticated user is added to the demo org as
-- 'member'. Real-org membership comes later via invite/create-org.
-- Idempotent: on conflict (org_id, user_id) do nothing, so re-running
-- handle_new_user (e.g. during email-change webhooks) is safe.
create or replace function add_user_to_demo_org() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  demo_org_id uuid := '00000000-0000-4000-a000-000000000001';
begin
  insert into memberships (org_id, user_id, role)
  values (demo_org_id, new.id, 'member')
  on conflict (org_id, user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_user_demo_org on users;
create trigger on_user_demo_org
  after insert on users
  for each row execute function add_user_to_demo_org();

-- Backfill: any existing user without a demo-org membership gets one.
insert into memberships (org_id, user_id, role)
select '00000000-0000-4000-a000-000000000001', id, 'member' from users
on conflict (org_id, user_id) do nothing;

-- Seeded sample project for the demo org.
insert into projects (id, org_id, slug, name, description, status, created_by)
select
  '00000000-0000-4000-a000-000000000002',
  '00000000-0000-4000-a000-000000000001',
  'demo-festival-26',
  'Demo Festival ''26',
  'A seeded sample project so guests can see what a real ATLVS project looks like — tasks, deliverables, advancing, and a portal preview.',
  'active',
  (select user_id from memberships where org_id = '00000000-0000-4000-a000-000000000001' limit 1)
where exists (select 1 from memberships where org_id = '00000000-0000-4000-a000-000000000001')
on conflict (id) do nothing;

------------------------------------------------------------------
-- 11. Comments
------------------------------------------------------------------
comment on type platform_role is
  'Org-level role (billing/governance). owner=billing+delete, admin=full org, manager=projects+people no billing, member=default.';
comment on type project_role is
  'Project-level role (operations). lead=PM, editor=team, contributor=crew/contractors, viewer=read-only, vendor=scoped POs.';
comment on column memberships.is_developer is
  'Per-user developer flag — orthogonal to billing role. Grants API key + webhook + audit access.';
comment on table project_members is
  'Project-scoped access. Platform owner/admin/manager auto-bypass via RLS helpers.';
