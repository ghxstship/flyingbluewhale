# Runbook — rate limit saturation

**What broke.** The per-principal sliding window is rejecting above-budget
traffic with `429 rate_limited`. For an authed user this means they're
hammering the endpoint; for an IP fallback it usually means a misbehaving
client or scraping.

**Who's affected.** Only callers over budget — other users on the same
endpoint are unaffected. Check `x-ratelimit-bucket` header on the 429
to scope.

**How do I confirm.**

```bash
# 1. Is the spike real? (Sentry ratelimit.blocked events, last 15 min)
gh api repos/ghxstship/flyingbluewhale/issues?q=is:issue+label:"ratelimit" | head

# 2. Which principal + bucket?
#    Structured logs: grep "ratelimit.blocked" | jq '.request_id, .bucket, .method, .route'

# 3. Is the same key across IPs (probable abuse) or one IP (probable bug)?
#    Look at the fallback prefix in the log line — ip:<ip> vs user:<uuid>.
```

**Stop the bleeding** (first 3 min).

1. Identify the principal from the log line. If it's a bot / scraper:
   block via Vercel firewall rule or add the IP to a Supabase auth
   deny-list.
2. If it's a legitimate tenant: bump their budget temporarily through
   the `rate_limit_overrides` table (H2 scope — if not yet implemented,
   raise the bucket's `max` in `src/lib/ratelimit.ts#RATE_BUDGETS` and
   redeploy).
3. If the bucket itself is misconfigured (budget too tight): same
   redeploy, but also write a postmortem — numbers that throttle real
   users are worse than not throttling at all.

**Root cause.** Common causes:
- Frontend hot loop calling `/api/v1/ai/chat` on keystroke (client bug)
- Webhook receiver re-posting (retry storm — Stripe / any upstream)
- User-agent probing /auth/login endpoints (scraper)

**How we alert on this.**

- Sentry `ratelimit.blocked` event count > 100 / 5 min → paging severity.
- Dashboard panel: `count by (bucket, route) {event="ratelimit.blocked"}`.

**Escalation.** Primary: on-call backend. Fallback: julian.clarkson@ghxstship.pro.

**Retro reference.**
- (none yet — this runbook is proactive)
