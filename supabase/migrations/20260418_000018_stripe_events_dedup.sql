-- fbw_018 · Stripe webhook dedup table
--
-- Stripe redelivers webhooks (up to 3 days past the first attempt) when it
-- doesn't receive a 2xx. Without replay protection we would double-apply
-- invoice status updates, duplicate ledger entries, etc. This table records
-- every processed event_id so a redelivery short-circuits to a cached 200.

create table if not exists stripe_events (
  event_id text primary key,
  type text not null,
  received_at timestamptz not null default now(),
  livemode boolean not null default false
);

alter table stripe_events enable row level security;

-- Service-role only. The Stripe webhook handler uses createServiceClient().
create policy stripe_events_no_client on stripe_events
  for all to authenticated
  using (false)
  with check (false);

comment on table stripe_events is
  'Dedup table for Stripe webhook deliveries. Row written before side effects; retries short-circuit.';
