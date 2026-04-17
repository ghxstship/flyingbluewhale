-- ═══════════════════════════════════════════════════════
-- RED SEA LION Migration 004: Role Lifecycle Extension
-- Implements the 13 canonical stages for project members.
-- ═══════════════════════════════════════════════════════

create type role_lifecycle_stage as enum (
  'discovery',
  'qualification',
  'onboarding',
  'contracting',
  'scheduling',
  'advancing',
  'deployment',
  'active_operations',
  'demobilization',
  'settlement',
  'reconciliation',
  'archival',
  'closeout'
);

create table project_member_lifecycles (
  project_id uuid not null,
  user_id uuid not null,
  stage role_lifecycle_stage not null default 'discovery',
  last_transitioned_at timestamptz not null default now(),
  transition_notes text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (project_id, user_id),
  foreign key (project_id, user_id) references project_members(project_id, user_id) on delete cascade
);

create index idx_pml_stage on project_member_lifecycles(stage);

alter table project_member_lifecycles enable row level security;

create policy "Users can view their own lifecycle"
  on project_member_lifecycles for select
  using (user_id = auth.uid());

create policy "Project members can view other members lifecycles"
  on project_member_lifecycles for select
  using (is_project_member(project_id));

create policy "Internal roles can manage lifecycles"
  on project_member_lifecycles for all
  using (is_internal_on_project(project_id));

-- Trigger for updated_at
create trigger project_member_lifecycles_updated_at
  before update on project_member_lifecycles
  for each row execute function update_updated_at();

-- Auto-provision lifecycle state for new members
create or replace function trg_provision_member_lifecycle()
returns trigger as $$
begin
  insert into project_member_lifecycles (project_id, user_id, stage)
  values (new.project_id, new.user_id, 'discovery')
  on conflict do nothing;
  return new;
end;
$$ language plpgsql;

create trigger auto_provision_lifecycle
  after insert on project_members
  for each row execute function trg_provision_member_lifecycle();

-- State machine transition validation
create or replace function validate_member_lifecycle_transition()
returns trigger as $$
declare
  is_internal boolean;
begin
  -- Update transition time if stage changed
  if old.stage is distinct from new.stage then
    new.last_transitioned_at := now();
    
    -- We can enforce strict flow here or leave it open for internal roles.
    -- To adhere to the GAP plan, we ensure stages move progressively.
    if new.stage < old.stage then
      -- Allow rollback for admins/internal, otherwise block
      is_internal := is_internal_on_project(new.project_id);
      if not is_internal then
        raise exception 'Invalid lifecycle regression: Cannot move back to % from %', new.stage, old.stage;
      end if;
    end if;
  end if;
  
  return new;
end;
$$ language plpgsql;

create trigger validate_lifecycle_transition
  before update on project_member_lifecycles
  for each row execute function validate_member_lifecycle_transition();

-- Backfill existing project members
insert into project_member_lifecycles (project_id, user_id, stage, last_transitioned_at)
select project_id, user_id, 'active_operations'::role_lifecycle_stage, now()
from project_members
on conflict do nothing;
