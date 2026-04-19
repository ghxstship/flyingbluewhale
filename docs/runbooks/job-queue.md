# Runbook — Background job DLQ / stuck queue

**What broke.** Jobs in `public.job_queue` piling up. Three sub-patterns:

- `state = 'pending'` backlog growing → worker not running / too slow.
- `state = 'running'` with `locked_until < now()` → worker died mid-run.
- `state = 'dead'` accumulating → a specific job type is systematically
  failing after max_attempts retries.

**How do I confirm.**

```sql
-- Fastest triage query — one row per state
select state, count(*), min(created_at) as oldest
from job_queue group by state order by state;

-- What's dead (and why)
select type, attempts, last_error, created_at, completed_at
from job_queue where state = 'dead'
order by created_at desc limit 20;

-- Stuck-running jobs (lease expired)
select id, type, locked_by, locked_until, now() - locked_until as stale_for
from job_queue where state = 'running' and locked_until < now();
```

**Stop the bleeding** (first 5 min).

1. **Stuck-running jobs** — they auto-reclaim on the next worker tick
   via `reclaim_stuck_jobs()`. If the worker isn't running at all:
   check the Edge Function dashboard, cold-start with
   `supabase functions invoke job-worker`. If it succeeds manually,
   the cron schedule is broken (see H3-02 doc for the cron spec).
2. **Pending backlog** — if the worker is alive but draining too slowly,
   temporarily crank `JOB_WORKER_BATCH` from 10 → 50 in the edge env
   to triple throughput per tick.
3. **DLQ'd jobs** — triage each type separately. A small number
   (< 10) is usually an upstream failure (email provider down, Stripe
   hiccup). Use the handler's own retry guidance before manually
   recovering:
   ```sql
   -- Requeue a dead job for one more attempt
   update job_queue set state='pending', attempts=0, run_at=now() where id='<id>';
   ```

**Root cause.**

- Handler throws synchronously without a catch
- External dep down → retries exhaust before outage clears
- Payload shape drifted after a schema change + worker wasn't redeployed
- `max_attempts` too low for known-flaky destinations (email, SMS)

**How we alert on this.**

- Daily pager: `state='pending' rows > 1000` OR `state='dead' rows > 10`.
- Sentry `jobs.dead_letter` event immediately pages the on-call when it fires.
- Worker health: Sentry transaction for the Edge Function's tick call;
  missing ticks > 3 min → paging.

**Escalation.** Primary: on-call backend. Fallback: julian.clarkson@ghxstship.pro.

**Retro reference.**
- (none yet)
