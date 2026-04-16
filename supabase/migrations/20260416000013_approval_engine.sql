-- ═══════════════════════════════════════════════════════
-- GVTEWAY Migration 013: Approval Engine & Audit Log
-- Universal approval actions + immutable audit trail
-- ═══════════════════════════════════════════════════════

create table approval_actions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  entity_type text not null check (entity_type in ('deliverable', 'credential_order', 'allocation', 'fulfillment_order')),
  entity_id uuid not null,
  action text not null check (action in ('approve', 'reject', 'request_revision', 'escalate', 'override')),
  comment text,
  performed_by uuid not null references auth.users(id),
  performed_at timestamptz not null default now()
);

create index idx_approval_entity on approval_actions(entity_type, entity_id);
create index idx_approval_project on approval_actions(project_id);

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete set null,
  organization_id uuid references organizations(id) on delete set null,
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  actor_id uuid references auth.users(id),
  old_state jsonb,
  new_state jsonb,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index idx_audit_project on audit_log(project_id);
create index idx_audit_entity on audit_log(entity_type, entity_id);
create index idx_audit_actor on audit_log(actor_id);
create index idx_audit_created on audit_log(created_at desc);

-- Auto-update deliverable status on approval action
create or replace function handle_deliverable_approval()
returns trigger as $$
begin
  if new.entity_type = 'deliverable' then
    case new.action
      when 'approve' then
        update deliverables set status = 'approved', reviewed_by = new.performed_by, reviewed_at = now(), updated_at = now() where id = new.entity_id;
      when 'reject' then
        update deliverables set status = 'rejected', reviewed_by = new.performed_by, reviewed_at = now(), updated_at = now() where id = new.entity_id;
      when 'request_revision' then
        update deliverables set status = 'revision_requested', reviewed_by = new.performed_by, reviewed_at = now(), updated_at = now() where id = new.entity_id;
      else null;
    end case;
  end if;

  insert into audit_log (project_id, entity_type, entity_id, action, actor_id, new_state)
  values (new.project_id, new.entity_type, new.entity_id, new.entity_type || '.' || new.action || 'd', new.performed_by, jsonb_build_object('action', new.action, 'comment', new.comment));

  return new;
end;
$$ language plpgsql;

create trigger on_approval_action
  after insert on approval_actions
  for each row execute function handle_deliverable_approval();

-- Auto-log deliverable status changes
create or replace function audit_deliverable_change()
returns trigger as $$
begin
  if old.status is distinct from new.status then
    insert into audit_log (project_id, entity_type, entity_id, action, actor_id, old_state, new_state)
    values (new.project_id, 'deliverable', new.id, 'deliverable.status_changed', coalesce(new.reviewed_by, new.submitted_by), jsonb_build_object('status', old.status), jsonb_build_object('status', new.status, 'version', new.version));
  end if;
  return new;
end;
$$ language plpgsql;

create trigger audit_deliverable_status
  after update on deliverables
  for each row execute function audit_deliverable_change();

-- Auto-log allocation state changes
create or replace function audit_allocation_change()
returns trigger as $$
begin
  if old.state is distinct from new.state then
    insert into audit_log (project_id, entity_type, entity_id, action, actor_id, old_state, new_state)
    values (new.project_id, 'allocation', new.id, 'allocation.' || new.state, new.allocated_by, jsonb_build_object('state', old.state::text), jsonb_build_object('state', new.state::text, 'quantity', new.quantity));
  end if;
  return new;
end;
$$ language plpgsql;

create trigger audit_allocation_state
  after update on catalog_item_allocations
  for each row execute function audit_allocation_change();

-- RLS
alter table approval_actions enable row level security;
alter table audit_log enable row level security;

create policy "View approval actions" on approval_actions for select using (is_project_member(project_id));
create policy "Internal can create approval actions" on approval_actions for insert with check (is_internal_on_project(project_id));
create policy "View audit log" on audit_log for select using (project_id is null or is_project_member(project_id));
