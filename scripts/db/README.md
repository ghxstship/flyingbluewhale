# Database scripts

## `anonymize-staging.sql` — H3-09 / IK-058

Transforms a production data copy into a safe staging dataset. Idempotent
(running twice is a no-op). Preserves all foreign-key integrity so any
application that reads staging gets the same row graph as prod.

### Workflow

```bash
# 1. Dump production (Supabase → Supabase via pg_dump)
pg_dump "postgres://<prod>" > prod.sql

# 2. Restore into the staging DB
psql "postgres://<staging>" < prod.sql

# 3. Anonymize (REQUIRES the allow flag to be set in-session)
psql "postgres://<staging>" <<'PSQL'
SET fbw.allow_anonymize = 'yes';
\i scripts/db/anonymize-staging.sql
PSQL

# 4. Verify
psql "postgres://<staging>" -c "
  select count(*) total_users,
         count(*) filter (where email like '%@staging.invalid') anonymized
  from auth.users;"
```

### What it touches

| Table                 | Column(s)                              | Transform                  |
|-----------------------|----------------------------------------|----------------------------|
| auth.users            | email, raw_user_meta_data              | deterministic hash         |
| users                 | email, name, avatar_url                | hash, generated, null      |
| orgs                  | name, name_override                    | generated, null            |
| clients / leads       | email, phone, notes                    | hash email, null rest      |
| vendors               | email, notes                           | hash, null                 |
| credentials           | details (jsonb)                        | empty object               |
| audit_log             | actor_email                            | hash                       |
| user_passkeys         | public_key, counter                    | zeroed                     |
| idempotency_keys      | response                               | empty object               |
| stripe_events         | (whole table)                          | truncated                  |

### What it does NOT touch

- Primary keys + all foreign keys (FK integrity preserved).
- Non-PII business state: projects, tickets, deliverables, schedules, etc.
- Timestamps (useful for perf tests against real access patterns).
- Org slugs + project slugs (needed for portal routing).

### Safety

The script's `do $$ … end $$` guard refuses to run unless the operator has
explicitly set `SET fbw.allow_anonymize = 'yes'` in the same session. That
prevents accidental execution against the wrong database. The guard does
NOT try to auto-detect production — that's the operator's responsibility.
**Never run this script against production.**
