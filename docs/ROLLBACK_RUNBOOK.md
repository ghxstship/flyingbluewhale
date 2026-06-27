# Rollback Runbook — ATLVS Technologies

How to reverse a bad production change. Migrations in this repo are **forward-only** (applied via the Supabase MCP `apply_migration`; there are no `*_down` files), so DB rollback is **Point-in-Time Recovery (PITR)** or a **forward-fix migration** — not a scripted down-migration. Code rollback is independent (Vercel redeploy). This doc is the formal procedure the launch runbook (§3) points to.

- **Supabase project:** `flyingbluewhale` / `xrovijzjbyssajhtwvas`
- **Hosting:** Vercel (single deployment serving all five domains; `src/proxy.ts` host-rewrites)
- **Migration convention:** repo filename == remote `supabase_migrations.schema_migrations.version` (lockstep). Verify with `select version, name from supabase_migrations.schema_migrations order by version desc limit 5;`

---

## 0. First: classify the incident

| Symptom | Most likely cause | Go to |
|---|---|---|
| New deploy breaks UI/API, DB unchanged | Bad code/config | **§1 Code rollback** |
| Bad data written / schema change broke queries | Bad migration or data corruption | **§2 DB rollback** |
| Both (deploy shipped code + migration together) | Combined | **§3 Combined** |
| Security/data-exposure incident | Any | **§4 Emergency** |

**Default bias:** prefer a **forward fix** (a new commit / new migration) over a destructive restore when the blast radius is small and well-understood. Reserve PITR for data corruption or a migration you cannot safely fix forward. PITR is destructive to data written after the restore point — treat it as the last resort, not the first.

---

## 1. Code / config rollback (no DB change)

Code deploys are decoupled from the database, so this is the safe, fast path.

1. **Vercel → Deployments →** find the last-known-good deployment → **Promote to Production** (instant rollback) — or `vercel rollback <deployment-url>`.
2. If the bad change is a single commit: `git revert <sha>` on `main`, push, let CI redeploy. CI gates (lint/typecheck/unit/e2e/security/build) must pass.
3. **Env/secret regression** (e.g. a rotated key): fix the env var in Vercel and redeploy — no code change needed.
4. **Verify:** load each shell (`atlvs.pro`, `app.`, `gvteway.`, `compvss.`), check the failing path is restored, and confirm no new Sentry errors.

**Note:** A code rollback does NOT undo any migration the bad release applied. If the bad release also ran a migration, the old code must still be compatible with the new schema — usually true for additive migrations, NOT for destructive ones (see §3).

---

## 2. Database rollback

### 2a. Forward-fix migration (preferred)
For a recoverable mistake (wrong default, missing/incorrect policy, bad constraint, a function bug):
1. Write a corrective migration and apply via `apply_migration`.
2. **Lockstep:** read the new `schema_migrations` version and rename the repo file under `supabase/migrations/` to `<version>_<name>.sql`; commit the SQL.
3. Re-run `get_advisors(security)` + the cross-tenant isolation probe (`node scripts/cross-tenant-isolation-probe.mjs`) if RLS/views were touched.

### 2b. PITR restore (data corruption / unrecoverable migration)
**Destructive:** discards all data written after the restore point. Coordinate before running.
1. **Quiesce writes** if possible (maintenance mode / pause the affected surface) to bound data loss.
2. **Supabase Dashboard → Database → Backups / PITR →** pick a timestamp **just before** the bad change.
3. Prefer restoring to a **clone/scratch project first** to validate, then cut over — avoids a blind in-place restore. (In-place restore overwrites the live DB.)
4. After restore: **reconcile the migration ledger** — the restored DB's `schema_migrations` reflects the restore point, so re-apply any *good* migrations that landed after it (in order, lockstep-renamed). Regenerate `database.types.ts` if schema shifted.
5. **Reconcile external state:** Stripe/webhooks are idempotent (`stripe_events` dedup), but events that arrived during the lost window may need replay from the Stripe dashboard; check `private.cron_run_log` for purge/redaction runs that may need re-trigger.
6. **Verify:** isolation probe + the payments/GDPR guards (`npx vitest run src/lib/payments-fulfillment.test.ts src/lib/privacy/gdpr-lifecycle.test.ts`) + a prod smoke.

**RTO:** the restore-rehearsal in launch-runbook §2.3 establishes the expected restore duration — record it there and reference it during an incident.

---

## 3. Combined (code + migration shipped together)

Order matters. If the migration was **destructive** (dropped/renamed/retyped a column), rolling back code alone leaves new code gone but the schema changed → old code may break.
1. If the migration is **additive/backward-compatible** (most are): roll back code only (§1); leave the schema — old code ignores the new objects.
2. If the migration is **destructive**: either (a) **forward-fix** by re-adding the dropped object in a compatible way and keep the new code, or (b) **PITR** to before the migration AND roll back code to the matching release (§2b + §1) so code and schema agree.
3. Never leave code and schema on incompatible versions.

---

## 4. Emergency: security / data-exposure incident

1. **Contain first:** if a surface is leaking data, take it offline (Vercel: pin a maintenance deploy, or disable the route) before debugging.
2. **Revoke if credentials/tokens are implicated:** rotate the affected key (Supabase service role, Stripe, Anthropic, SENTRY_*), revoke PATs (`api_keys`), invalidate sessions if needed.
3. **For an RLS/exposure regression:** apply a corrective RLS migration immediately (§2a), then re-run `get_advisors(security)` (expect ERROR == the 9 known-intentional baseline) and the isolation probe (expect 89 probes / 0 leaks).
4. **Audit the blast radius:** query `audit_events` for the window; for a data-subject impact, follow the GDPR breach-notification SLA (48h per the DPA).
5. **Then** root-cause + forward-fix + add a guard test (the project pattern: every fixed exposure gets a `*-canon.test.ts` regression guard).

---

## 5. Pre-flight (do once, before launch)

- [ ] **Rehearse a PITR restore** to a scratch project; record the elapsed time as RTO (launch-runbook §2.3).
- [ ] Confirm Vercel "Promote previous deployment" works (rehearse one promote/rollback).
- [ ] Confirm the team knows where the Stripe event-replay control + Supabase PITR UI are.
- [ ] Confirm `scripts/cross-tenant-isolation-probe.mjs` runs green from a clean checkout (the post-incident verification gate).
