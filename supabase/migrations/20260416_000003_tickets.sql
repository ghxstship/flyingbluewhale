-- flyingbluewhale · ticketing + scans

create type ticket_status as enum ('issued','transferred','scanned','voided');

create table tickets (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references orgs(id) on delete cascade,
  project_id   uuid not null references projects(id) on delete cascade,
  code         text not null,
  holder_name  text,
  holder_email text,
  tier         text not null default 'GA',
  status       ticket_status not null default 'issued',
  issued_at    timestamptz not null default now(),
  scanned_at   timestamptz,
  scanned_by   uuid references users(id),
  unique (org_id, code)
);

create index tickets_project_idx on tickets(project_id);
create index tickets_status_idx on tickets(status);

create table ticket_scans (
  id           uuid primary key default gen_random_uuid(),
  ticket_id    uuid not null references tickets(id) on delete cascade,
  scanner_id   uuid not null references users(id) on delete restrict,
  scanned_at   timestamptz not null default now(),
  location     jsonb,
  result       text not null check (result in ('accepted','duplicate','voided','not_found'))
);

create index ticket_scans_ticket_idx on ticket_scans(ticket_id);
