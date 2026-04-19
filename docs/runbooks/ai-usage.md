# Runbook — AI usage blow-up

**What broke.** Usage events for `ai.tokens.input` / `ai.tokens.output`
exceeded the hourly budget for a single tenant, or aggregate across
tenants jumped 10× from baseline. Either pattern points to runaway
streaming, a stuck loop, or a deliberate abuse.

**Who's affected.** The tenant whose cohort triggered the alert.
Secondarily: our Anthropic bill.

**How do I confirm.**

```sql
-- Top tenants by last-hour token consumption
select org_id,
       sum(quantity) filter (where metric = 'ai.tokens.input') as in_tokens,
       sum(quantity) filter (where metric = 'ai.tokens.output') as out_tokens,
       sum(quantity) filter (where metric = 'ai.request') as requests
from usage_events
where occurred_at > now() - interval '1 hour'
group by org_id
order by in_tokens + out_tokens desc
limit 10;

-- Per-user within an org
select actor_id, count(*), sum(quantity) as tokens
from usage_events
where org_id = '<org_id>' and metric in ('ai.tokens.input', 'ai.tokens.output')
  and occurred_at > now() - interval '1 hour'
group by actor_id
order by tokens desc;
```

**Stop the bleeding** (first 5 min).

1. **Is it one actor?** Temporarily reduce that user's AI budget: bump
   the `ai` bucket in `src/lib/ratelimit.ts` down to 5/min (from 30)
   and redeploy, OR block the user via membership `deleted_at = now()`.
2. **Is it system-wide?** Flip the `ai_opus_for_pro` flag off (in
   GrowthBook or via env override) to route to Sonnet until investigated.
3. **Is it a single conversation looping?** Query `ai_messages where
   conversation_id = '<id>' order by created_at desc limit 20` — if
   you see the assistant repeating itself, the client is fan-looping
   the stream without closing the connection. Kill the conversation row.

**Root cause.**

- Browser tab left open on AI assistant → autoresend on focus (client bug)
- Malicious prompt injection causing the model to respond in a long loop
- A new flag cohort exposing AI to users with no intended entitlement

**How we alert on this.**

- Sentry custom metric `usage.ai.tokens.per_hour` > 10× 7-day P95 → pages.
- Daily usage digest email with the top 5 consuming orgs.

**Escalation.** Primary: on-call backend. Fallback: julian.clarkson@ghxstship.pro.

**Cost floor.** Anthropic bill threshold alert configured at $500/day.
At that point the on-call is automatically paged regardless of pattern.

**Retro reference.**
- (none yet)
