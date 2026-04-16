-- ═══════════════════════════════════════════════════════
-- GVTEWAY Migration 016: Notification Trigger Rules
-- Declarative event → notification mapping
-- ═══════════════════════════════════════════════════════

create table notification_trigger_rules (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  organization_id uuid references organizations(id) on delete cascade,
  trigger_event text not null,
  template_id uuid not null references notification_templates(id) on delete cascade,
  recipient_filter jsonb not null default '{}',
  is_active boolean not null default true,
  cooldown_minutes int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_trigger_rules_event on notification_trigger_rules(trigger_event);
create index idx_trigger_rules_project on notification_trigger_rules(project_id);

alter table notification_trigger_rules enable row level security;

create policy "View trigger rules" on notification_trigger_rules for select using (project_id is null or is_project_member(project_id));
create policy "Manage trigger rules" on notification_trigger_rules for all using ((project_id is not null and is_internal_on_project(project_id)) or (organization_id is not null and user_org_role(organization_id) in ('developer', 'owner', 'admin')));

create trigger trigger_rules_updated_at
  before update on notification_trigger_rules
  for each row execute function update_updated_at();
