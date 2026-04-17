-- ═══════════════════════════════════════════════════════
-- RED SEA LION Migration 011: Role Enum Separation
-- Closes GAP-001
-- Adds CHECK constraints to enforce semantic boundary
-- between platform roles (org) and project roles (project)
-- without breaking the shared enum (zero-downtime).
-- ═══════════════════════════════════════════════════════

-- ===== 1. Constrain project_members to valid project roles =====
alter table project_members
  drop constraint if exists project_members_role_check;

alter table project_members
  add constraint project_members_role_check
  check (role in (
    'executive', 'production', 'management', 'crew', 'staff',
    'talent', 'vendor', 'client', 'sponsor', 'press', 'guest', 'attendee'
  ));

-- ===== 2. Constrain organization_members to valid platform roles =====
alter table organization_members
  drop constraint if exists organization_members_role_check;

alter table organization_members
  add constraint organization_members_role_check
  check (role in (
    'developer', 'owner', 'admin', 'team_member', 'collaborator'
  ));

-- ===== 3. Audit log for role reassignment on project_members =====
create or replace function audit_project_member_role_change()
returns trigger as $$
begin
  if old.role is distinct from new.role then
    insert into audit_log (
      project_id, entity_type, entity_id, action, actor_id,
      old_state, new_state
    ) values (
      new.project_id,
      'project_member',
      new.id,
      'project_member.role_changed',
      auth.uid(),
      jsonb_build_object('role', old.role::text, 'user_id', new.user_id::text),
      jsonb_build_object('role', new.role::text, 'user_id', new.user_id::text)
    );
  end if;
  return new;
end;
$$ language plpgsql;

create trigger audit_member_role_reassignment
  after update of role on project_members
  for each row execute function audit_project_member_role_change();
