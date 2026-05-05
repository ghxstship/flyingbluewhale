-- flyingbluewhale · artist advancing submissions

create type advancing_status as enum ('pending','submitted','approved','rejected','revision_requested');

create type advancing_category as enum ('rider','input_list','stage_plot','catering','travel','other');

create table advancing_submissions (
  id                 uuid primary key default gen_random_uuid(),
  project_id         uuid not null references projects(id) on delete cascade,
  submitter_user_id  uuid not null references users(id) on delete restrict,
  category           advancing_category not null,
  title              text not null,
  notes              text,
  file_path          text,
  status             advancing_status not null default 'pending',
  submitted_at       timestamptz not null default now(),
  reviewed_at        timestamptz,
  reviewed_by        uuid references users(id)
);

create index advancing_project_idx on advancing_submissions(project_id);
create index advancing_status_idx on advancing_submissions(status);
