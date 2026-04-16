-- ═══════════════════════════════════════════════════════
-- GVTEWAY Migration 009: Template System
-- ═══════════════════════════════════════════════════════

create type template_scope as enum ('personal', 'org', 'global');

-- Project Templates (snapshot entire project config)
create table project_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  name text not null,
  description text,
  config jsonb not null default '{}',
  features text[] not null default '{}',
  venue_defaults jsonb,
  space_defaults jsonb not null default '[]',
  created_by uuid not null references auth.users(id),
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_proj_templates_org on project_templates(organization_id);

-- Submission Templates (per deliverable type)
create table submission_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  deliverable_type deliverable_type not null,
  name text not null,
  description text,
  schema jsonb not null default '{}',
  defaults jsonb not null default '{}',
  scope template_scope not null default 'org',
  created_by uuid not null references auth.users(id),
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_sub_templates_type on submission_templates(deliverable_type);
create index idx_sub_templates_scope on submission_templates(scope);

create trigger proj_templates_updated_at
  before update on project_templates
  for each row execute function update_updated_at();

create trigger sub_templates_updated_at
  before update on submission_templates
  for each row execute function update_updated_at();
