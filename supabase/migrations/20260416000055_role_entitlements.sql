-- ═══════════════════════════════════════════════════════
-- GVTEWAY Migration 055: Entitlement Bootstrapping
-- Auto-provisions credentials for project members based
-- on their assigned platform/project role.
-- ═══════════════════════════════════════════════════════

create table auto_entitlement_rules (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  role platform_role not null,
  credential_type_id uuid not null references credential_types(id) on delete cascade,
  quantity int not null default 1,
  created_at timestamptz not null default now(),
  unique(project_id, role, credential_type_id)
);

create index idx_aer_project on auto_entitlement_rules(project_id);

-- Enable RLS for rule matrix
alter table auto_entitlement_rules enable row level security;
create policy "View entitlement rules" on auto_entitlement_rules for select using (is_project_member(project_id));
create policy "Manage entitlement rules" on auto_entitlement_rules for all using (is_internal_on_project(project_id));

create or replace function auto_provision_credentials_for_role()
returns trigger as $$
declare
  rule record;
begin
  for rule in select * from auto_entitlement_rules where project_id = new.project_id and role = new.role loop
    insert into credential_orders (
      project_id,
      user_id,
      credential_type_id,
      quantity,
      status,
      approved_at,
      approved_by
    ) values (
      rule.project_id,
      new.user_id,
      rule.credential_type_id,
      rule.quantity,
      'approved',
      now(),
      new.user_id -- Since this is auto-provisioned upon their role grant
    );
  end loop;
  return new;
end;
$$ language plpgsql;

create trigger trg_auto_provision_credentials
  after insert on project_members
  for each row execute function auto_provision_credentials_for_role();
