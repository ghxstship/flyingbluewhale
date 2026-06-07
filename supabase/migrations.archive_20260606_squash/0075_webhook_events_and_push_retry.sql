-- ============================================================================
-- 0075 — webhook_events idempotency + push_send_failures retry queue
-- ============================================================================
--
-- P2 hardening (docs/HARDENING_AUDIT.md):
--
-- 1. webhook_events: cross-event idempotency at the (provider, event_id,
--    action_key) level. The Stripe webhook used to dedup on event.id
--    alone, which let distinct events that drive the same logical
--    action (e.g. payment_intent.succeeded + invoice.paid both marking
--    an invoice paid) fire the downstream notify() twice. Action handlers
--    INSERT into webhook_events BEFORE firing the action — UNIQUE
--    constraint provides the dedup gate.
--
-- 2. push_send_failures: retry queue for transient push failures
--    (429/5xx/timeout). sendOne() enqueues with next_attempt_at set via
--    exponential backoff. A scheduled replayer drains due rows.
-- ============================================================================

create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_id text not null,
  action_key text not null,
  payload jsonb,
  processed_at timestamptz not null default now(),
  unique (provider, event_id, action_key)
);
create index if not exists webhook_events_provider_idx on public.webhook_events (provider, processed_at desc);
alter table public.webhook_events enable row level security;

comment on table public.webhook_events is
  'P2 — cross-event idempotency. Insert (provider, event_id, action_key) BEFORE firing the downstream action; UNIQUE constraint is the dedup gate.';

create table if not exists public.push_send_failures (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subscription_id uuid not null,
  payload jsonb not null,
  attempt int not null default 1,
  max_attempts int not null default 3,
  next_attempt_at timestamptz not null default now(),
  last_error text,
  last_status int,
  created_at timestamptz not null default now()
);
create index if not exists push_send_failures_due_idx
  on public.push_send_failures (next_attempt_at)
  where attempt < max_attempts;
create index if not exists push_send_failures_user_idx on public.push_send_failures (user_id);
alter table public.push_send_failures enable row level security;

comment on table public.push_send_failures is
  'P2 — push retry queue. sendOne enqueues transient failures with exponential backoff next_attempt_at. Replayer drains rows where next_attempt_at <= now() AND attempt < max_attempts.';
