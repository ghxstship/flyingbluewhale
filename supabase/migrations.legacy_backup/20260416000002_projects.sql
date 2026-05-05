-- flyingbluewhale · projects

create type project_status as enum ('draft','active','paused','archived','complete');

create table projects (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references orgs(id) on delete cascade,
  slug         text not null check (slug ~ '^[a-z0-9-]+$' and char_length(slug) <= 48),
  name         text not null,
  description  text,
  status       project_status not null default 'draft',
  start_date   date,
  end_date     date,
  client_id    uuid,
  budget_cents bigint,
  created_by   uuid not null references users(id) on delete restrict,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (org_id, slug)
);

create index projects_org_idx on projects(org_id);
create index projects_status_idx on projects(status);

create or replace function touch_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger projects_touch_updated_at
  before update on projects
  for each row execute function touch_updated_at();
