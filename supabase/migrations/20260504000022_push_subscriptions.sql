-- ============================================================================
-- Web Push subscriptions (VAPID)
-- ============================================================================
-- Phase 2.3 of the SmartSuite parity roadmap. Stores per-device PushSubscription
-- objects so the server can fan a `notifications` row out to the user's
-- registered browsers via the standard Web Push protocol.
--
-- One row per (user, endpoint). Endpoints are unique across all users — they
-- come from the browser's push service and are inherently global identifiers.
--
-- Failure handling: when the push provider returns 410 Gone or 404 we mark
-- the row disabled (rather than delete) so audit + analytics retain history.
-- All other transient failures bump `failure_count`.

create table if not exists push_subscriptions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references users(id) on delete cascade,
  endpoint      text not null unique,
  p256dh        text not null,
  auth          text not null,
  user_agent    text,
  created_at    timestamptz not null default now(),
  last_seen_at  timestamptz not null default now(),
  failure_count int  not null default 0,
  disabled_at   timestamptz
);

create index if not exists push_subscriptions_user_idx
  on push_subscriptions(user_id) where disabled_at is null;

alter table push_subscriptions enable row level security;

drop policy if exists push_subs_self_select on push_subscriptions;
create policy push_subs_self_select on push_subscriptions
  for select using (user_id = auth.uid());

drop policy if exists push_subs_self_insert on push_subscriptions;
create policy push_subs_self_insert on push_subscriptions
  for insert with check (user_id = auth.uid());

drop policy if exists push_subs_self_update on push_subscriptions;
create policy push_subs_self_update on push_subscriptions
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists push_subs_self_delete on push_subscriptions;
create policy push_subs_self_delete on push_subscriptions
  for delete using (user_id = auth.uid());

-- The send-push worker uses the service-role client, which bypasses RLS so
-- it can mark disabled_at / increment failure_count across users.

comment on table push_subscriptions is 'Web Push (VAPID) subscriptions; one row per (user, browser device).';
comment on column push_subscriptions.endpoint is 'Push provider URL — globally unique across users.';
comment on column push_subscriptions.p256dh is 'Public key for content encryption (PushSubscription.keys.p256dh).';
comment on column push_subscriptions.auth is 'Auth secret for content encryption (PushSubscription.keys.auth).';
comment on column push_subscriptions.disabled_at is 'Set when provider returns 410/404 — retained for audit, not deleted.';
