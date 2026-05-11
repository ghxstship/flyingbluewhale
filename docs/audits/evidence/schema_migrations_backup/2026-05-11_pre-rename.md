# schema_migrations backup — pre-sequential rename (2026-05-11)

Before renaming local migration files to a sequential 4-digit format,
captured the remote `supabase_migrations.schema_migrations` row count and
range. Full per-row version list lives in the next file.

- Project: `xrovijzjbyssajhtwvas` (flyingbluewhale)
- Total rows: **316**
- First version: `20260416000001` (identity_tenancy)
- Last version: `20260510224516` (ldp_wave2_deliverable_state_column)

316 of those rows correspond to migrations that have since been
consolidated into `0001_remote_snapshot.sql`. The new sequential
naming reduces the repo's migration count to 44 files. After the
rename, the remote `schema_migrations` table is rebuilt to match the
new 44-row layout.

If a rollback is ever needed, the migration _content_ is preserved
on every commit in `supabase/migrations/` — schema_migrations only
tracks which file versions have run, not the SQL itself.
