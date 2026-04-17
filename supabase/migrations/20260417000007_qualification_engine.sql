-- =====================================================
-- RED SEA LION Migration 007: Qualification Engine
-- Closes GAP-003, GAP-004, GAP-005
-- Provides structured compliance tracking per member.
-- =====================================================

create type qualification_check_type as enum (
  'coi',
  'w9',
  'w8',
  'background_check',
  'insurance',
  'union_card',
  'drivers_license',
  'work_authorization',
  'visa',
  'nda',
  'custom'
);

create type qualification_status as enum (
  'pending',
  'submitted',
  'under_review',
  'verified',
  'rejected',
  'expired'
);

create table qualification_checks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  check_type qualification_check_type not null,
  status qualification_status not null default 'pending',
  document_id uuid references documents(id) on delete set null,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  expires_at timestamptz,
  notes text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(project_id, user_id, check_type)
);

create index idx_qc_project on qualification_checks(project_id);
create index idx_qc_user on qualification_checks(user_id);
create index idx_qc_status on qualification_checks(status);
create index idx_qc_type on qualification_checks(check_type);
create index idx_qc_expires on qualification_checks(expires_at) where expires_at is not null;

alter table qualification_checks enable row level security;

create policy "Users can view their own qualification checks"
  on qualification_checks for select
  using (user_id = auth.uid());

create policy "Project members can view checks for their project"
  on qualification_checks for select
  using (is_project_member(project_id));

create policy "Internal can manage qualification checks"
  on qualification_checks for all
  using (is_internal_on_project(project_id));

create policy "Users can submit their own checks"
  on qualification_checks for insert
  with check (user_id = auth.uid() and is_project_member(project_id));

create policy "Users can update their own pending checks"
  on qualification_checks for update
  using (user_id = auth.uid() and status in ('pending', 'rejected'));

create trigger qualification_checks_updated_at
  before update on qualification_checks
  for each row execute function update_updated_at();

-- Audit trail for qualification status changes
create or replace function audit_qualification_change()
returns trigger as $$
begin
  if old.status is distinct from new.status then
    insert into audit_log (project_id, entity_type, entity_id, action, actor_id, old_state, new_state)
    values (
      new.project_id, 'qualification_check', new.id,
      'qualification.' || new.status::text,
      coalesce(new.reviewed_by, auth.uid()),
      jsonb_build_object('status', old.status::text, 'check_type', old.check_type::text),
      jsonb_build_object('status', new.status::text, 'check_type', new.check_type::text)
    );
  end if;
  return new;
end;
$$ language plpgsql;

create trigger audit_qualification_status
  after update on qualification_checks
  for each row execute function audit_qualification_change();

-- Extend documents.type check to include compliance types (GAP-004)
alter table documents drop constraint if exists documents_type_check;
alter table documents add constraint documents_type_check
  check (type in (
    'bol', 'pod', 'packing_slip', 'invoice', 'photo', 'receipt',
    'contract', 'manifest', 'inspection', 'other',
    'coi', 'w9', 'w8', 'insurance_cert', 'background_report',
    'union_card', 'work_authorization', 'nda', 'rider', 'release'
  ));

-- Role-specific required qualification check matrix
-- Defines which checks are required for each role on a per-project basis
create table qualification_requirements (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  role platform_role not null,
  check_type qualification_check_type not null,
  is_required boolean not null default true,
  created_at timestamptz not null default now(),
  unique(project_id, role, check_type)
);

create index idx_qr_project on qualification_requirements(project_id);

alter table qualification_requirements enable row level security;

create policy "View qualification requirements"
  on qualification_requirements for select
  using (is_project_member(project_id));

create policy "Manage qualification requirements"
  on qualification_requirements for all
  using (is_internal_on_project(project_id));

-- Function: check if a member has completed all required qualifications
create or replace function is_qualified_on_project(proj_id uuid, uid uuid)
returns boolean as $$
  select not exists(
    select 1 from qualification_requirements qr
    join project_members pm on pm.project_id = qr.project_id and pm.role = qr.role
    where qr.project_id = proj_id
      and pm.user_id = uid
      and qr.is_required = true
      and not exists(
        select 1 from qualification_checks qc
        where qc.project_id = proj_id
          and qc.user_id = uid
          and qc.check_type = qr.check_type
          and qc.status = 'verified'
          and (qc.expires_at is null or qc.expires_at > now())
      )
  );
$$ language sql security definer stable;
