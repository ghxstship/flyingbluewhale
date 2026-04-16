-- ═══════════════════════════════════════════════════════
-- GVTEWAY Migration 002: Projects, Spaces, Acts
-- ═══════════════════════════════════════════════════════

create type project_type as enum ('talent_advance', 'production_advance', 'hybrid');
create type project_status as enum ('draft', 'active', 'completed', 'archived');

-- Projects
create table projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  slug text not null,
  type project_type not null default 'hybrid',
  status project_status not null default 'draft',
  start_date date,
  end_date date,
  venue jsonb,
  features text[] not null default '{}',
  settings jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(organization_id, slug)
);

create index idx_projects_org on projects(organization_id);
create index idx_projects_slug on projects(slug);
create index idx_projects_status on projects(status);

-- Project Members
create table project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role platform_role not null,
  invited_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique(project_id, user_id)
);

create index idx_project_members_project on project_members(project_id);
create index idx_project_members_user on project_members(user_id);

-- Spaces (stages, rooms, areas within a project)
create table spaces (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  type text not null default 'stage',
  capacity int,
  backline jsonb,
  settings jsonb not null default '{}',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index idx_spaces_project on spaces(project_id);

-- Acts (performances, artists assigned to spaces)
create table acts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  space_id uuid references spaces(id) on delete set null,
  name text not null,
  artist_name text not null,
  set_time_start timestamptz,
  set_time_end timestamptz,
  status text not null default 'confirmed',
  metadata jsonb not null default '{}',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index idx_acts_project on acts(project_id);
create index idx_acts_space on acts(space_id);

create trigger projects_updated_at
  before update on projects
  for each row execute function update_updated_at();
