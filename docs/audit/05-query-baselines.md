# Phase 5 — Hot-path query baselines

**Captured:** 2026-04-18 (Supabase project `xrovijzjbyssajhtwvas`, Postgres 14.5)
**Scope:** H3-04 / IK-005 — anchor `EXPLAIN ANALYZE` for every query on the
  read path of a user-facing request. A regression test in CI (future
  work) runs the same queries against a production-like dataset and fails
  if any plan drops an index scan, spills sorts to disk, or blows past
  the cost budget.

## How to read this

Each entry records:
- **Query** — SQL as executed.
- **Plan** — dominant node types + timings on today's data (small, seeded).
- **Indexes relied on** — index names the planner chose.
- **Production risk** — what the plan would do without each index, under load.

These baselines are NOT load-test numbers. They're a correctness check
that the planner picks the cheap path given the indexes we committed.

---

## 1. Project list by org (hot UI path)

```sql
select * from projects where org_id = :org_id order by updated_at desc limit 50;
```

**Plan** (seed data, 8 rows total):
```
Limit  (cost=1.06..1.07 rows=1) (actual time=1.65..1.66 rows=1)
  -> Sort  (Sort Key: updated_at DESC)  (actual time=1.65 rows=1)
        -> Seq Scan on projects  Filter: org_id = ... (actual time=1.6 rows=1)
Planning: 8.8 ms  Execution: 1.7 ms
```

**Indexes relied on in production:** `projects_org_idx`
**Production risk if index missing:** full-table scan × every console page.

---

## 2. Event guide by (project, persona) — portal render

```sql
select * from event_guides where project_id = :pid and persona = :persona;
```

**Plan** (21 rows):
```
Seq Scan on event_guides  Filter: (project_id = ... AND persona = 'client')
  (actual time=0.03..0.03 rows=1)
Planning: 0.7 ms  Execution: 0.1 ms
```

**Indexes relied on in production:** `event_guides_project_id_persona_key` (UNIQUE),
`event_guides_project_idx`
**Production risk if index missing:** each portal page load = N-row sequential
scan on event_guides. Uncapped as the guide catalogue grows.

---

## 3. Memberships by user — session resolution

```sql
select org_id, role from memberships where user_id = :uid;
```

**Plan** (59 rows):
```
Seq Scan on memberships  Filter: user_id = ...  (actual time=0.04 rows=4)
Planning: 1.1 ms  Execution: 0.1 ms
```

**Indexes relied on in production:** `memberships_user_idx`
**Production risk if index missing:** seq scan on every authed request.
Called once per SSR render and every /api/v1 request that calls `getSession()`.

---

## 4. Audit log for actor

```sql
select action, at from audit_log
where actor_id = :uid order by at desc limit 20;
```

**Indexes relied on in production:** `idx_audit_log_actor_id`, `audit_log_at_idx`
**Production risk if index missing:** /api/v1/me/export and the Settings →
Activity page would scan the entire audit_log.

---

## 5. Idempotency key lookup

```sql
select * from idempotency_keys where key = :client_header;
```

**Plan:**
```
Index Scan using idempotency_keys_pkey  (actual time=0.003..0.003)
Planning: 2.0 ms  Execution: 0.03 ms
```

**Indexes relied on in production:** PK (`key`) — O(log N) lookup.
**Production risk if index missing:** every mutating POST gets slower as
the dedup window (24h) accumulates keys.

---

## 6. Ticket scans by ticket

```sql
select * from ticket_scans where ticket_id in (:ids)
  order by scanned_at desc limit 50;
```

**Indexes relied on in production:** `ticket_scans_ticket_idx`
**Production risk if index missing:** every gate-ops view scans every scan
ever recorded on the show.

---

## Index presence audit (snapshot)

| Table                | Indexes |
|----------------------|--------:|
| projects             | 5 |
| memberships          | 5 |
| event_guides         | 5 |
| audit_log            | 5 |
| idempotency_keys     | 3 |
| ticket_scans         | 3 |
| usage_events         | 3 |
| job_queue            | 5 |

Full index definitions: `pg_indexes where tablename = any(...)` — checked
in via `supabase/migrations/fbw_*.sql` so they're reproducible.

---

## Regression workflow

1. Before merging a migration that adds/changes a column on a hot table,
   replay the queries above in a staging database loaded with production-
   shape data.
2. If any plan drops its index scan (→ `Seq Scan` on > 1000 rows) OR
   `Sort Method: external merge` (disk spill) OR execution time > 10× the
   baseline, the PR fails review.
3. `vacuum analyze <table>` before capturing, so the planner sees fresh
   statistics — otherwise "small seed" baselines mislead production tuning.
