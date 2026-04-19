# Runbook — Stripe webhook failure

**What broke.** `/api/v1/webhooks/stripe` returned non-2xx or took too
long. Stripe will retry with exponential backoff for up to 3 days, so a
short blip isn't urgent — but extended failure means invoices aren't
updating status.

**Who's affected.** Any tenant with an in-flight Stripe payment,
Connect onboarding, or subscription event during the outage window.

**How do I confirm.**

```bash
# 1. Stripe dashboard → Developers → Webhooks → see delivery attempts.
#    Look for HTTP 500 / timeout across the last 1h.

# 2. Our logs — structured events to search for:
#    stripe.webhook.dedup_write_failed    (DB unreachable)
#    stripe.webhook.replay                (dedup hit — this is normal traffic)
#    http.request.failed                  (handler crashed)

# 3. Current health of the dedup table:
psql "$SUPABASE_URL_PG" -c "
  select state, count(*) from job_queue where type = 'stripe.reconcile' group by 1;"
#    (only relevant once we route failed events through the job queue)
```

**Stop the bleeding** (first 5 min).

1. **Is the handler 5xx'ing?** Roll back the last deploy via Vercel. A
   single bad deploy is the 90% case.
2. **Is the DB unreachable?** Check `/api/v1/health/readiness` — if that
   returns 500, this is a DB incident, not a Stripe one. See
   `db-saturation.md`.
3. **Is the signature verification failing across all events?** Rotate
   the webhook secret in Stripe and `STRIPE_WEBHOOK_SECRET` in Vercel
   simultaneously; Stripe will retry with the new secret.

**Root cause.**

- Deploy introduced a regression in handler code
- `STRIPE_WEBHOOK_SECRET` drift (rotated on one side only)
- DB connection exhaustion on writes to `stripe_events` / `invoices`
- Network flake (rare — Vercel ↔ Stripe is direct)

**Replay after recovery.** In the Stripe dashboard, select the failed
events + click "Resend". The dedup table ensures resends are idempotent:
same event_id → cached 2xx + `replay: true` in the body, zero side
effects.

**How we alert on this.**

- Stripe dashboard → Webhook endpoint → "Send all failures to Slack" +
  "Email on 10+ consecutive failures".
- Sentry `stripe.webhook.*` error events > 5 / 5 min → paging.

**Escalation.** Primary: on-call backend. Fallback: julian.clarkson@ghxstship.pro.

**Retro reference.**
- (none yet)
