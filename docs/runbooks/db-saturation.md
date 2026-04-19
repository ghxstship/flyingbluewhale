# Runbook — Database saturation

**What broke.** Either:
- Supabase Postgres connection pool exhausted (new queries error with
  `remaining connection slots reserved`)
- Statement timeout hits (`canceling statement due to statement timeout`)
- Replication lag on a read replica climbed
- Live disk % > 85

**Who's affected.** Everyone with active traffic — this is the
second-worst incident class after a full outage.

**How do I confirm.**

```sql
-- Active connections and what they're doing
select pid, usename, application_name, state, wait_event_type, wait_event,
       now() - xact_start as xact_age, query
from pg_stat_activity
where state != 'idle'
order by xact_age desc nulls last limit 20;

-- Lock contention
select * from pg_locks where not granted;

-- Table-level bloat (last resort)
select relname, n_live_tup, n_dead_tup, last_vacuum, last_autovacuum
from pg_stat_user_tables
order by n_dead_tup desc limit 10;
```

**Stop the bleeding** (first 5 min).

1. **Pool exhausted** — scale the pool in Supabase dashboard (Infrastructure →
   Database settings → Pooler size). Temporary measure. Root cause is
   usually a leaked connection on a long-running edge function or a
   stuck migration.
2. **Statement timeout pinging** — this is working as designed (H3-05 caps
   authenticated=10s / service_role=60s). Find the slow query:
   `select * from pg_stat_activity where state='active' order by xact_start asc limit 5`,
   then `EXPLAIN ANALYZE` it. Missing index usually.
3. **Deadlock** — read the lock table. Kill the youngest culprit with
   `select pg_terminate_backend(<pid>);`. Document who wrote the
   offending transaction.
4. **Disk full** — vacuum-full the largest bloated table OR truncate the
   oldest partition of `usage_events` / `audit_log` (retention is
   90d / 400d respectively; earlier purge is safe).

**Root cause.**

- Missing index surfaced by a new query path (see `docs/audit/05-query-baselines.md`)
- Long-running migration forgotten open in a psql session
- Leaked connection from edge function crash mid-transaction
- Accidental full-table scan from a filter on an unindexed column

**How we alert on this.**

- Supabase dashboard alert: pool utilization > 80% for 5 min.
- Sentry error rate for `statement timeout` > baseline × 3.
- Disk use monitor at 70% → warn, 85% → page.

**Escalation.** Primary: on-call backend. DBA fallback:
  julian.clarkson@ghxstship.pro.

**Retro reference.**
- (none yet)
