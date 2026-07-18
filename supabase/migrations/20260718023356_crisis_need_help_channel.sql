-- crisis.respond — third field response channel (kit 32 E1).
--
-- No schema change: `crisis_alert_receipts.channel` is the free-text
-- response/delivery discriminator inside the baseline's UNIQUE
-- (alert_id, user_id, channel), and the 20260717130103 self-insert policy
-- already admits any channel value the holder writes for themself. This
-- migration documents the new value so the SQL <-> action drift guard
-- (src/app/(mobile)/m/emergency/crisis-respond.test.ts) keeps the pair in
-- lockstep:
--
--   channel = 'need_help' — the holder called for help during the code.
--     The server action pushes the manager band on the `crisis` push kind;
--     the ops muster count reads the latest of self_safe/need_help per user
--     as that person's current answer.

comment on column public.crisis_alert_receipts.channel is
  'Response/delivery discriminator, part of the (alert_id, user_id, channel) unique key. Field responses use ''muster_ack'' (muster instruction acknowledged), ''self_safe'' (holder marked themself safe) and ''need_help'' (holder called for help — pushes the manager band); acknowledged_at is the response time, NULL = unanswered. Latest of self_safe/need_help wins as the holder''s current safety status.';
