-- crisis.respond — the field half of the crisis loop (kit 28 backlog §3 item 1).
--
-- The store already exists and is NOT duplicated here: the console declares
-- into `crisis_alerts` (baseline), and `crisis_alert_receipts` (baseline) is
-- the per-user response ledger with UNIQUE (alert_id, user_id, channel) and a
-- self-UPDATE policy. What was missing is the WRITE path for the person in
-- the field: the baseline shipped SELECT (org member or self) and UPDATE
-- (self) policies but NO INSERT policy, so nothing — fan-out included — has
-- ever been able to create a receipt row, and a crew member could not record
-- an acknowledgement at all. This migration adds exactly that policy.
--
-- Response semantics ride the existing `channel` discriminator (the unique
-- key already includes it, so responses are natural upserts):
--
--   channel = 'muster_ack' — the holder acknowledged the muster instruction
--   channel = 'self_safe'  — the holder marked themself safe
--
-- `acknowledged_at` carries the response time on both rows and `delivered_at`
-- is set alongside (a response is proof of delivery). No new lifecycle column
-- is added: this table predates LDP and its nullable timestamps ARE the state
-- (NULL = unanswered); a `*_state` twin would be a second source of truth to
-- keep in sync with them. If a stand-down lifecycle is ever added it belongs
-- on `crisis_alerts` (e.g. `alert_state` declared/stood_down) as console-side
-- work — today the field treats a recent declaration as active because the
-- alerts table has no terminal state to read.

comment on column public.crisis_alert_receipts.channel is
  'Response/delivery discriminator, part of the (alert_id, user_id, channel) unique key. Field responses use ''muster_ack'' (muster instruction acknowledged) and ''self_safe'' (holder marked themself safe); acknowledged_at is the response time, NULL = unanswered.';

-- Self-write only: a member records their OWN response, inside their own org,
-- and only against an alert that really belongs to that org — the EXISTS
-- prevents planting a receipt that pairs your org_id with a foreign org's
-- alert (the subquery is itself RLS-filtered to alerts the caller can see,
-- which for a member is exactly their org's).
drop policy if exists "crisis_alert_receipts_self_insert" on public.crisis_alert_receipts;
create policy "crisis_alert_receipts_self_insert" on public.crisis_alert_receipts
  for insert to authenticated
  with check (
    ("user_id" = (select auth.uid()))
    and private.is_org_member("org_id")
    and exists (
      select 1
      from public.crisis_alerts a
      where a.id = "alert_id"
        and a.org_id = "crisis_alert_receipts"."org_id"
    )
  );
