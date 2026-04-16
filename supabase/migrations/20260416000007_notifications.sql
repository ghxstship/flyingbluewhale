-- ═══════════════════════════════════════════════════════
-- GVTEWAY Migration 007: Notification Engine
-- ═══════════════════════════════════════════════════════

create type notification_channel as enum ('email', 'sms');

-- Templates
create table notification_templates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  organization_id uuid references organizations(id) on delete cascade,
  channel notification_channel not null default 'email',
  name text not null,
  subject text,
  body_template text not null,
  trigger_event text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_notif_templates_project on notification_templates(project_id);
create index idx_notif_templates_trigger on notification_templates(trigger_event);

-- Delivery Log
create table notification_log (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete set null,
  recipient_id uuid references auth.users(id),
  recipient_email text,
  recipient_phone text,
  channel notification_channel not null,
  template_id uuid references notification_templates(id) on delete set null,
  subject text,
  body text,
  sent_at timestamptz not null default now(),
  delivery_status text not null default 'pending',
  provider_message_id text,
  metadata jsonb not null default '{}'
);

create index idx_notif_log_project on notification_log(project_id);
create index idx_notif_log_recipient on notification_log(recipient_id);
create index idx_notif_log_status on notification_log(delivery_status);

create trigger notif_templates_updated_at
  before update on notification_templates
  for each row execute function update_updated_at();
