# Runbook — External-call circuit open

**What broke.** `lib/http.ts`'s per-host breaker tripped. A downstream
(Stripe, Resend, Anthropic, GrowthBook, etc.) returned 5 consecutive
failures within the breaker window, and every subsequent call is now
short-circuiting to `CircuitOpenError` for 30 s before a half-open probe.

**Who's affected.** Whatever feature depends on the downed dep:
- Stripe open → /api/v1/stripe/checkout + connect/onboarding 500
- Resend open → email sends silently queue (send is best-effort)
- Anthropic open → /api/v1/ai/chat streams error event
- GrowthBook open → feature flags fall back to defaults (benign)

**How do I confirm.**

```bash
# 1. Which host(s) are tripped? Structured log:
#    http.circuit.open {"host":"api.stripe.com","until":1776...}

# 2. Upstream status page
open https://status.stripe.com
open https://status.anthropic.com
open https://status.resend.com

# 3. Is it us or them? Issue a direct call from a shell:
curl -sSf -m 5 https://api.stripe.com/v1/balance -u "${STRIPE_SECRET_KEY}:" | head
```

**Stop the bleeding** (first 3 min).

1. **Upstream down** (status page red) → this is correct behavior. The
   breaker's whole point is to fail fast instead of pile retries. Wait
   for the status page to recover + the half-open probe to succeed.
2. **Upstream up but we still tripped** → our creds may be wrong, or
   we're hitting a per-customer rate limit. Check Sentry for the
   404/401/429 signatures emitted just before the breaker opened.
3. **Circuit open on GrowthBook** → benign, no user impact (local
   `FLAG_DEFAULTS` fallback kicks in). Clear silently.
4. **Stuck open breaker** (rare: more than 5 min since the half-open
   window should have let a probe through) → bounce the serverless
   instance (Vercel redeploy) to reset in-memory breaker state.

**Root cause.**

- Genuine upstream outage
- Rotated API key missing from the Vercel env
- DNS blip (per-host breaker correctly recovers in ~30 s)
- Misconfigured timeout: if `httpFetch` is invoked with `timeoutMs: 100`
  against a slow endpoint, breaker trips immediately — check for
  recent changes to the callsite

**How we alert on this.**

- Log event `http.circuit.open` on any host → single-shot Slack ping
  (no paging) so operators can ack upstream incidents.
- If the breaker is still open 30 min later → paging severity.

**Escalation.** Primary: on-call backend. Fallback: julian.clarkson@ghxstship.pro.
Stripe/Anthropic/Resend status pages are the authoritative upstream source.

**Retro reference.**
- (none yet)
