# Runbooks

**H3-10 / IK-063.** One page per alert family — what it means, how to
diagnose, first three mitigations, owner of last resort. Optimized for
a pager at 3am; every runbook starts with the three commands that
decide whether this is a real incident or noise.

When an alert fires, the runbook linked from its Sentry issue / Datadog
monitor must answer four questions in the first 60 seconds of reading:

1. **What broke?** — one sentence, operator-level.
2. **Who's affected?** — tenant scope, traffic %, impact class.
3. **How do I confirm?** — 3 commands max.
4. **How do I stop the bleeding?** — first mitigation, not root cause.

Root cause + permanent fix come after the incident is contained.

## Alert families

| Family | Runbook |
|---|---|
| Rate limit saturation | [rate-limit.md](./rate-limit.md) |
| Stripe webhook failure | [stripe-webhook.md](./stripe-webhook.md) |
| AI usage blow-up | [ai-usage.md](./ai-usage.md) |
| Background job DLQ | [job-queue.md](./job-queue.md) |
| Auth error spike | [auth-errors.md](./auth-errors.md) |
| Database saturation | [db-saturation.md](./db-saturation.md) |
| External-call circuit open | [circuit-breaker.md](./circuit-breaker.md) |

## Conventions

- Every runbook includes a "how we alert on this" section pointing to the
  exact Sentry / Datadog monitor + the threshold values, so when an
  operator wants to tune the noise floor, the config is one click away.
- Every runbook ends with an **escalation** section naming the primary
  on-call + a fallback. Update when rotation changes.
- Every runbook carries a **retro reference** list — past incidents in
  this family and what we changed. The signal-to-noise floor rises as
  the list grows.
