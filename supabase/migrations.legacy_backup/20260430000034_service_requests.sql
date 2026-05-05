-- Service requests + SLA tracking (2026-04-30)
-- ADR-0002 Sprint 2 Epic 2: highest-ROI epic in the Klipboard parity plan.
-- Live-event service tickets (AV buzz, broken locker, soiled bathroom) need
-- a triage queue with response/resolution targets — currently they disappear
-- into Slack/radio threads invisible to ops.
--
-- Pattern: org-scoped + RLS + status state machine. P1 unacknowledged past
-- the response SLA auto-escalates to a crisis_alert via a follow-on cron
-- (out of scope for this migration).

------------------------------------------------------------------
-- 1. service_sla_policies — per-org severity → response/resolution windows
------------------------------------------------------------------
create table if not exists service_sla_policies (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  severity text not null check (severity in ('P1','P2','P3','P4')),
  response_minutes integer not null,                       -- ack target
  resolution_minutes integer not null,                     -- resolve target
  business_hours_only boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, severity)
);
create index if not exists idx_service_sla_policies_org on service_sla_policies (org_id);

alter table service_sla_policies enable row level security;
create policy service_sla_policies_select on service_sla_policies for select using (is_org_member(org_id));
create policy service_sla_policies_insert on service_sla_policies for insert with check (has_org_role(org_id, array['owner','admin','controller']));
create policy service_sla_policies_update on service_sla_policies for update using (has_org_role(org_id, array['owner','admin','controller']));
create policy service_sla_policies_delete on service_sla_policies for delete using (has_org_role(org_id, array['owner','admin']));

------------------------------------------------------------------
-- 2. service_requests — the triage queue
------------------------------------------------------------------
create table if not exists service_requests (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  venue_id uuid references venues(id) on delete set null,
  zone_id uuid references venue_zones(id) on delete set null,

  category text not null check (category in (
    'AV','cleaning','repair','IT','hospitality','security','other'
  )),
  severity text not null default 'P3' check (severity in ('P1','P2','P3','P4')),

  summary text not null,
  description text,
  photos jsonb not null default '[]'::jsonb,             -- array of {path, mime, width?, height?}

  requester_id uuid references auth.users(id),           -- staff submission
  requester_email text,                                  -- guest/anon submission via portal
  requester_name text,                                   -- display only when requester_id null

  assigned_to uuid references auth.users(id),
  status text not null default 'open' check (status in (
    'open','acknowledged','in_progress','resolved','cancelled'
  )),

  opened_at timestamptz not null default now(),
  acknowledged_at timestamptz,
  resolved_at timestamptz,
  cancelled_at timestamptz,

  -- Materialised SLA targets at the moment the row was created so policy
  -- changes don't retroactively shift due times on open requests.
  sla_response_due timestamptz,
  sla_resolution_due timestamptz,
  sla_response_breached boolean not null default false,
  sla_resolution_breached boolean not null default false,

  resolution_note text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_service_requests_org_status on service_requests (org_id, status, severity);
create index if not exists idx_service_requests_project on service_requests (project_id) where project_id is not null;
create index if not exists idx_service_requests_venue on service_requests (venue_id) where venue_id is not null;
create index if not exists idx_service_requests_assigned on service_requests (assigned_to) where assigned_to is not null;
create index if not exists idx_service_requests_response_breach on service_requests (sla_response_due) where status in ('open');
create index if not exists idx_service_requests_resolution_breach on service_requests (sla_resolution_due) where status in ('open','acknowledged','in_progress');

alter table service_requests enable row level security;
create policy service_requests_select on service_requests for select using (is_org_member(org_id));
create policy service_requests_insert on service_requests for insert with check (is_org_member(org_id));
create policy service_requests_update on service_requests for update using (is_org_member(org_id));
create policy service_requests_delete on service_requests for delete using (has_org_role(org_id, array['owner','admin','controller']));

------------------------------------------------------------------
-- 3. service_request_events — append-only audit timeline
------------------------------------------------------------------
create table if not exists service_request_events (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references service_requests(id) on delete cascade,
  org_id uuid not null references orgs(id) on delete cascade,
  actor_id uuid references auth.users(id),
  kind text not null check (kind in (
    'opened','acknowledged','assigned','status_changed','note','resolved','cancelled','sla_breached'
  )),
  payload jsonb not null default '{}'::jsonb,            -- {from, to, note, ...}
  occurred_at timestamptz not null default now()
);
create index if not exists idx_service_request_events_request on service_request_events (request_id, occurred_at desc);

alter table service_request_events enable row level security;
create policy service_request_events_select on service_request_events for select using (is_org_member(org_id));
create policy service_request_events_insert on service_request_events for insert with check (is_org_member(org_id));

------------------------------------------------------------------
-- 4. SLA materialisation trigger — populates sla_response_due / sla_resolution_due
--    from the active policy at insert time.
------------------------------------------------------------------
create or replace function service_request_set_sla()
returns trigger language plpgsql as $$
declare
  policy record;
begin
  if new.sla_response_due is null or new.sla_resolution_due is null then
    select response_minutes, resolution_minutes into policy
      from service_sla_policies
     where org_id = new.org_id
       and severity = new.severity
       and active = true
     limit 1;
    if found then
      if new.sla_response_due is null then
        new.sla_response_due := new.opened_at + make_interval(mins => policy.response_minutes);
      end if;
      if new.sla_resolution_due is null then
        new.sla_resolution_due := new.opened_at + make_interval(mins => policy.resolution_minutes);
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_service_request_set_sla on service_requests;
create trigger trg_service_request_set_sla
  before insert on service_requests
  for each row execute function service_request_set_sla();

------------------------------------------------------------------
-- 5. Default SLA policies — seed sensible defaults for any org missing them.
--    Operators can edit via /console/services/sla-policies.
------------------------------------------------------------------
insert into service_sla_policies (org_id, severity, response_minutes, resolution_minutes)
select o.id, sev, resp, res
  from orgs o
  cross join (values
    ('P1', 5,   60),    -- live-event blocker — 5 min ack, 1 hr resolve
    ('P2', 15,  240),   -- urgent — 15 min ack, 4 hr resolve
    ('P3', 60,  1440),  -- standard — 1 hr ack, 1 day resolve
    ('P4', 240, 4320)   -- low — 4 hr ack, 3 day resolve
  ) as p(sev, resp, res)
on conflict (org_id, severity) do nothing;
