-- ═══════════════════════════════════════════════════════
-- GVTEWAY Migration 004: Deliverables (Dual-Track)
-- 6 Talent + 9 Production + Custom
-- ═══════════════════════════════════════════════════════

create type deliverable_type as enum (
  -- Talent (6)
  'technical_rider',
  'hospitality_rider',
  'input_list',
  'stage_plot',
  'crew_list',
  'guest_list',
  -- Production (9)
  'equipment_pull_list',
  'power_plan',
  'rigging_plan',
  'site_plan',
  'build_schedule',
  'vendor_package',
  'safety_compliance',
  'comms_plan',
  'signage_grid',
  -- Custom
  'custom'
);

create type deliverable_status as enum (
  'draft',
  'submitted',
  'in_review',
  'approved',
  'rejected',
  'revision_requested'
);

-- Deliverables
create table deliverables (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  act_id uuid references acts(id) on delete set null,
  type deliverable_type not null,
  title text,
  status deliverable_status not null default 'draft',
  data jsonb not null default '{}',
  version int not null default 1,
  submitted_by uuid references auth.users(id),
  reviewed_by uuid references auth.users(id),
  submitted_at timestamptz,
  reviewed_at timestamptz,
  deadline timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_deliverables_project on deliverables(project_id);
create index idx_deliverables_act on deliverables(act_id);
create index idx_deliverables_type on deliverables(type);
create index idx_deliverables_status on deliverables(status);
create index idx_deliverables_deadline on deliverables(deadline);

-- Comments
create table deliverable_comments (
  id uuid primary key default gen_random_uuid(),
  deliverable_id uuid not null references deliverables(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index idx_comments_deliverable on deliverable_comments(deliverable_id);

-- Version History
create table deliverable_history (
  id uuid primary key default gen_random_uuid(),
  deliverable_id uuid not null references deliverables(id) on delete cascade,
  version int not null,
  data jsonb not null,
  changed_by uuid not null references auth.users(id),
  changed_at timestamptz not null default now()
);

create index idx_history_deliverable on deliverable_history(deliverable_id);

-- Auto-snapshot on status change
create or replace function snapshot_deliverable_on_submit()
returns trigger as $$
begin
  if old.status != new.status and new.status = 'submitted' then
    new.version = old.version + 1;
    new.submitted_at = now();
    insert into deliverable_history (deliverable_id, version, data, changed_by)
    values (new.id, new.version, new.data, coalesce(new.submitted_by, old.submitted_by));
  end if;
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger deliverable_submit_snapshot
  before update on deliverables
  for each row execute function snapshot_deliverable_on_submit();

-- Guest list enforcement: caps at DB level
create or replace function enforce_guest_list_caps()
returns trigger as $$
declare
  project_settings jsonb;
  max_ga int;
  max_vip int;
  current_ga int;
  current_vip int;
begin
  if new.type != 'guest_list' then
    return new;
  end if;

  select p.settings into project_settings
  from projects p where p.id = new.project_id;

  max_ga := coalesce((project_settings->>'guest_list_ga_cap')::int, 10);
  max_vip := coalesce((project_settings->>'guest_list_vip_cap')::int, 1);

  current_ga := coalesce((new.data->>'ga_count')::int, 0);
  current_vip := coalesce((new.data->>'vip_count')::int, 0);

  if current_ga > max_ga then
    raise exception 'GA guest list exceeds cap: % > %', current_ga, max_ga;
  end if;

  if current_vip > max_vip then
    raise exception 'VIP guest list exceeds cap: % > %', current_vip, max_vip;
  end if;

  return new;
end;
$$ language plpgsql;

create trigger check_guest_list_caps
  before insert or update on deliverables
  for each row execute function enforce_guest_list_caps();

-- Deadline lockout: prevent submission after deadline
create or replace function enforce_deadline_lockout()
returns trigger as $$
begin
  if new.status = 'submitted'
    and new.deadline is not null
    and now() > new.deadline then
    raise exception 'Cannot submit after deadline: %', new.deadline;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger check_deadline_lockout
  before update on deliverables
  for each row execute function enforce_deadline_lockout();
