-- Outbound webhooks + notification triggers.
-- Resolves audit findings B1 (notifications write-side) + B2 (webhooks vapor).

-- Prereq: notifications table grows a `kind` column for grouping.
alter table public.notifications add column if not exists kind text not null default 'system';
create index if not exists notifications_user_unread_idx on notifications(user_id, read_at)
  where read_at is null and deleted_at is null;

-- ─── 1. Outbound webhooks ────────────────────────────────────────────────
create table if not exists public.webhook_endpoints (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references orgs(id) on delete cascade,
  url             text not null check (url ~* '^https?://'),
  description     text,
  events          text[] not null default '{}',           -- event-type allowlist
  secret          text not null,                          -- HMAC-SHA256 signing key
  is_active       boolean not null default true,
  last_delivery_at timestamptz,
  last_error      text,
  failure_count   int not null default 0,
  created_by      uuid references users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);

create index if not exists webhook_endpoints_org_idx on webhook_endpoints(org_id) where deleted_at is null;

alter table public.webhook_endpoints enable row level security;

create policy webhook_endpoints_read on webhook_endpoints for select
  using (is_org_member(org_id));
create policy webhook_endpoints_insert on webhook_endpoints for insert
  with check (is_org_member(org_id));
create policy webhook_endpoints_update on webhook_endpoints for update
  using (is_org_member(org_id)) with check (is_org_member(org_id));
create policy webhook_endpoints_delete on webhook_endpoints for delete
  using (is_org_member(org_id));

-- Outbox for webhook deliveries — the worker claims FOR UPDATE SKIP LOCKED
-- from here, attempts delivery, and updates status.
create table if not exists public.webhook_deliveries (
  id              uuid primary key default gen_random_uuid(),
  endpoint_id     uuid not null references webhook_endpoints(id) on delete cascade,
  org_id          uuid not null references orgs(id) on delete cascade,
  event_type      text not null,
  payload         jsonb not null,
  state           text not null default 'pending' check (state in ('pending','delivered','failed','dead')),
  attempts        int not null default 0,
  max_attempts    int not null default 5,
  next_attempt_at timestamptz not null default now(),
  delivered_at    timestamptz,
  last_status     int,
  last_error      text,
  created_at      timestamptz not null default now()
);

create index if not exists webhook_deliveries_claim_idx on webhook_deliveries(state, next_attempt_at)
  where state = 'pending';
create index if not exists webhook_deliveries_endpoint_idx on webhook_deliveries(endpoint_id, created_at desc);

alter table public.webhook_deliveries enable row level security;

-- Members can inspect their org's deliveries; only service role writes.
create policy webhook_deliveries_read on webhook_deliveries for select
  using (is_org_member(org_id));

-- ─── 2. Notification emit helper ──────────────────────────────────────────
-- One function to insert a notification + fan out to every matching
-- webhook endpoint. Callers pass (org_id, event_type, user_id, title,
-- body, href, payload). user_id is nullable for "notify all owners" etc.
create or replace function public.emit_notification(
  p_org_id     uuid,
  p_user_id    uuid,
  p_event_type text,
  p_title      text,
  p_body       text default null,
  p_href       text default null,
  p_payload    jsonb default '{}'::jsonb
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_notification_id uuid;
  v_endpoint record;
begin
  -- 1. Insert user-facing notification (skip if no user_id supplied — this
  --    form is for webhook-only events like admin audit rollups).
  if p_user_id is not null then
    insert into notifications (id, org_id, user_id, kind, title, body, href)
    values (gen_random_uuid(), p_org_id, p_user_id, p_event_type, p_title, p_body, p_href)
    returning id into v_notification_id;
  end if;

  -- 2. Fan out to every active endpoint that subscribed to this event_type
  --    (or '*' = all events).
  for v_endpoint in
    select id from webhook_endpoints
     where org_id = p_org_id
       and is_active = true
       and deleted_at is null
       and (p_event_type = any(events) or '*' = any(events))
  loop
    insert into webhook_deliveries (endpoint_id, org_id, event_type, payload)
    values (
      v_endpoint.id,
      p_org_id,
      p_event_type,
      jsonb_build_object(
        'id', v_notification_id,
        'type', p_event_type,
        'title', p_title,
        'body', p_body,
        'href', p_href,
        'user_id', p_user_id,
        'occurred_at', now(),
        'data', p_payload
      )
    );
  end loop;

  return v_notification_id;
end;
$$;

-- Let authenticated callers invoke this via `supabase.rpc('emit_notification', …)`
-- so the app-layer helper stays simple.
grant execute on function public.emit_notification(uuid, uuid, text, text, text, text, jsonb) to authenticated, service_role;
