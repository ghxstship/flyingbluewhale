# Enterprise SaaS Hardening Audit — ATLVS

**Date:** 2026-06-04
**Scope:** Whole codebase, every shell, every domain
**Method:** Three parallel adversarial Explore agents — security/multitenancy, code-quality/scalability, SRE/compliance — each cited file + line. Findings consolidated below.

## Executive verdict

The codebase is **above-average for a six-month-old multitenant SaaS** in primary security controls (RLS, authz, input validation, rate limits) and has unusually disciplined IA / schema work (XPMS, LDP). It is **not yet enterprise-grade** in:

1. **Compliance / audit completeness** — soft-delete consistency, audit_log gaps, PII retention, DSAR completeness
2. **Reliability** — optimistic concurrency is mostly placeholder, push delivery has no retry, no rollback migrations, no documented RPO/RTO
3. **Observability** — silent `catch {}` patterns are pervasive, no request-id propagation, no Sentry/OTel hook
4. **Performance at scale** — unbounded queries (155 `.select("*")` without limit), 60s polling instead of Realtime on hot paths, missing FK indexes only added retroactively
5. **Schema hygiene** — dual migration numbering schemes, ~20 legacy columns kept around as drift bait, `status` columns survived the LDP ban

Below is the consolidated finding list (CRITICAL → LOW), then a sequenced remediation plan organized into five phases (P0–P4).

---

## Findings — by category, severity descending

### A · Security

| Sev          | File                                              | Issue                                                                                                                                                                                           |
| ------------ | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **CRITICAL** | `src/app/api/v1/webhooks/docusign/route.ts:87`    | HMAC compared with `===` instead of `crypto.timingSafeEqual` — timing oracle on signature secret                                                                                                |
| **CRITICAL** | `src/app/api/v1/webhooks/ses-inbound/route.ts:56` | Same plain-string compare on inbound-email webhook secret                                                                                                                                       |
| **PASS**     | Stripe webhook                                    | Uses `timingSafeEqual` with length check + dedup on `event.id` (good baseline)                                                                                                                  |
| HIGH         | `src/app/api/v1/webhooks/stripe/route.ts:84–99`   | Idempotency dedup happens on `event.id` only; distinct events (`payment_intent.succeeded` + `invoice.paid`) can both fire `notify()` for the same logical action → duplicate user emails / push |
| MEDIUM       | `src/components/NotificationsBell.tsx:50`         | `catch { /* silent */ }` masks `/api/v1/notifications` outages from user AND from monitoring                                                                                                    |

### B · Multitenancy

| Sev  | Finding                                                                                                                                                                                                                                 |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PASS | All 346 `CREATE TABLE` statements in migrations have RLS enabled                                                                                                                                                                        |
| PASS | `private.is_org_member` / `private.has_org_role` consistently used                                                                                                                                                                      |
| PASS | All 30+ `createServiceClient()` call sites have a defensible "system action" justification (2FA recovery, push fan-out, anonymous form submission)                                                                                      |
| HIGH | Soft-delete RLS coverage is partial — newer tables (sheet_sets, drawing_sheet_sets, post-migration 0050) need spot audit for `is("deleted_at", null)` in SELECT policies; otherwise authorized users see "deleted" rows in list queries |

### C · Data integrity + concurrency

| Sev      | File                                                                                       | Issue                                                                                                                                                                                                                            |
| -------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **HIGH** | `src/app/(platform)/console/{clients,tasks,visa-cases,…}/[id]/edit/actions.ts` (20+ files) | Comment reads "Sea Trial FINDING-022: optimistic concurrency" — but the `_updated_at` token is **declared yet not enforced as a `.eq("updated_at", expected)` CAS** on most edit actions. Active last-write-wins race condition. |
| **HIGH** | Hard deletes on soft-deletable tables — 96+ sites                                          | `src/app/api/v1/ai/conversations/[id]/route.ts:53` hard-deletes a soft-deletable row · `src/app/(personal)/me/security/two-factor/actions.ts:17–33` hard-deletes MFA recovery codes (sensitive material) without audit trail     |
| HIGH     | Stripe webhook idempotency race                                                            | See A above; cross-event dedup needed                                                                                                                                                                                            |
| MEDIUM   | `src/lib/push/send.ts:241–264`                                                             | `recordNotifications()` silently swallows insert errors — notifications matrix loses rows on transient DB blips                                                                                                                  |

### D · Code quality + types

| Sev    | Finding                                                                                                                                                                               |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| HIGH   | **314 sites use `as unknown as LooseSupabase`** — necessary for dynamic table names; signals the typed client's deficiency, not a bug, but the escape hatch needs a one-place runbook |
| HIGH   | **`listOrgScoped()` has no default `limit`** — `src/lib/db/resource.ts:49–72` makes it optional; **155 `.select("*")` call sites ship unbounded query results** to the client         |
| MEDIUM | 20+ `Record<string, unknown>` patch shapes on server actions — loses Zod boundary validation                                                                                          |
| MEDIUM | Hand-maintained `src/lib/supabase/types.ts` (3K lines) duplicates parts of generated `database.types.ts` (36K lines) — drift waiting to happen                                        |
| MEDIUM | 30+ `as unknown as <Row[]>` post-select casts — typed client could express these directly if the queries used `.returns<T>()` or named the join                                       |

### E · Performance + scalability

| Sev          | File                                                                                                                                              | Issue                                                                                                                                                                     |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **CRITICAL** | `src/app/api/v1/me/export/route.ts:54–100`                                                                                                        | 13-table GDPR export does sequential `await supabase.from(t).select(...).limit(10_000)` — should be `Promise.all()`; on a hot DSAR endpoint this blocks ~3-5s per request |
| HIGH         | `src/components/NotificationsBell.tsx:58`                                                                                                         | Polls every 60s instead of Realtime subscription — at 10K active users that's 167 QPS of unread-count queries against one table                                           |
| HIGH         | Workforce parity migrations 0046–0048                                                                                                            | FK indexes were added in 0050 instead of inline with table creation; production saw weeks of seq-scan queries                                                             |
| MEDIUM       | Many list queries lack pagination contracts (`limit` + cursor) — `/p/[slug]/crew/feed`, `/console/finance/expenses` (legacy), `/me/notifications` |

### F · Compliance + governance

| Sev          | Finding                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **CRITICAL** | **`AuditAction` enum has drift** — `src/lib/audit.ts` ends at `deliverable.fulfilled`. Missing entries for: budget mutations, expense approvals, project_billing_draws, accreditation, courses, shift-swaps, time-off approvals, badge awards, notifications consumption, share-link creation (which is currently `as AuditAction` cast). Every mutation without an audit row is a compliance gap. |
| **CRITICAL** | **PII in `audit_log.actor_email`** — denormalized for readability, no retention scrubber, no DSAR redaction on historical rows. GDPR/CCPA exposure if leaked.                                                                                                                                                                                                                                      |
| **HIGH**     | **DSAR/export incomplete** — `/api/v1/me/export` predates the XPMS / the deskless-workforce suite additions (0046–0073). Newer PII-bearing tables (kudos, time-off, recognition_posts, notifications matrix, etc.) likely not in the export.                                                                                                                                                                         |
| HIGH         | Hard delete of MFA recovery codes leaves no trail (CRITICAL for audit)                                                                                                                                                                                                                                                                                                                             |
| MEDIUM       | No `down.sql` migrations — rollback = manual restore                                                                                                                                                                                                                                                                                                                                               |
| MEDIUM       | Backup RPO/RTO undocumented; no DR runbook                                                                                                                                                                                                                                                                                                                                                         |
| MEDIUM       | Documented Right-to-Delete cascade (`/me/delete` + `/me/restore`) doesn't reach new XPMS/Connecteam tables                                                                                                                                                                                                                                                                                         |

### G · Observability

| Sev    | Finding                                                                                                                                                                           |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| HIGH   | **No request-id propagation** — `src/lib/audit.ts:80` accepts `requestId` but no middleware injects `x-request-id`; cross-service tracing impossible                              |
| HIGH   | Silent `catch {}` everywhere — NotificationsBell, recordNotifications, Stripe `notify()`, export endpoint per-table catches; observability dashboard sees nothing when these fail |
| MEDIUM | No Sentry / OTel hook; structured log namespace exists but is partial                                                                                                             |
| MEDIUM | Push fan-out has no retry queue (`sendOne` line 266–286) — transient 429/500 means lost delivery                                                                                  |

### H · Schema hygiene

| Sev      | Finding                                                                                                                                                                                                                                                 |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **HIGH** | **Two parallel migration numbering schemes** — `0001-0073_*.sql` (sequential 4-digit) interleaved with `20260526100007_*.sql` (timestamp). `apply_migration` ordering is correct by name but the cognitive load + risk of accidental interleave is real |
| HIGH     | **Legacy columns kept indefinitely** — `budgets.{category,spent_cents,xtc_code,code,notes}`, `expenses.{category,xtc_code,status}`, `*.xtc_code` everywhere. Deprecation comments exist; no removal roadmap                                             |
| HIGH     | **`expenses.status` violates LDP §NAMING DISCIPLINE** — CLAUDE.md bans `status` in new tables; should be `expenses.receipt_state` or similar                                                                                                            |
| MEDIUM   | Stub `PageStub` pages from `scripts/generate-stubs.sh` linger; smoke harness flags but no removal pass                                                                                                                                                  |
| LOW      | i18n keys: many strings still ship English-only fallbacks; XPMS / the deskless-workforce suite additions don't have `keys.json` entries                                                                                                                                   |

---

## Top 15 must-fix (priority order)

1. **DocuSign + SES webhook `timingSafeEqual`** — 5-minute fix, critical
2. **AuditAction enum completeness** — add all missing entries (XPMS, the deskless-workforce suite, share-link); retroactively wire emitAudit on missing mutation paths
3. **Optimistic concurrency real CAS** — convert "TODO" comments to `.eq("updated_at", expected)` on all 20+ edit actions
4. **GDPR export → `Promise.all` + error tracking + new-table coverage**
5. **`listOrgScoped` default `limit: 50` + warn-on-unbounded**
6. **Soft-delete RLS audit** — verify every `deleted_at`-bearing table has `is("deleted_at", null)` in SELECT policies
7. **MFA recovery code hard-delete → soft-delete with retention** (or document why hard is correct)
8. **Stripe webhook cross-event idempotency** — dedup at the (invoice_id, action) level, not just event.id
9. **Request-id middleware** — inject + propagate to every log line + audit_log + Sentry breadcrumb
10. **NotificationsBell Realtime** — replace 60s polling with Supabase Realtime subscription
11. **Push retry queue** — at least 3-tier exponential backoff for 429/500
12. **Legacy column removal roadmap** — three migrations: deprecate (comment) → soft-remove (drop default + view) → hard drop
13. **Migration scheme consolidation** — adopt timestamp-only going forward; document the policy
14. **audit_log PII retention** — scheduled task to redact `actor_email` on rows >90 days old (or move to `actor_id` only and lookup at query time)
15. **`expenses.status` → `expenses.receipt_state`** rename — enforce LDP, set example

---

## Remediation plan — 5 phases

### P0 · Same-day critical (1 commit each)

| Fix                                                                | Effort | Files                                    |
| ------------------------------------------------------------------ | ------ | ---------------------------------------- |
| Webhook `timingSafeEqual` × 2                                      | 10 min | docusign/route.ts · ses-inbound/route.ts |
| MFA recovery delete → audit + soft                                 | 30 min | two-factor/actions.ts                    |
| AuditAction enum cleanup (drift only — `share_link.*` + the casts) | 20 min | src/lib/audit.ts                         |

These three ship in the next session.

### P1 · Compliance sprint (one ADR-0011 + execution)

**ADR-0011 — Audit + DSAR completeness**

- Inventory every mutation path; emit `audit_log` for each
- Extend AuditAction enum: `budget.create/update/delete`, `expense.approve`, `expense.reimburse`, `draw.mark_drawn`, `notification.read`, `course.complete`, `time_off.approve`, `shift_swap.accept`, `badge.award`, `recognition.post`, `share_link.create/revoke`, etc.
- Schema migration: `audit_log` gains `request_id`, `pii_redacted_at`, `retention_policy` columns
- Scheduled task (via `mcp__scheduled-tasks__create_scheduled_task`): redact `actor_email` on rows older than 90 days; preserve `actor_id` for forensic lookup
- DSAR export endpoint reaudit: parallel queries via `Promise.all`, include all new XPMS/Connecteam tables, fail-loud (return 500 + log) instead of silent `bundle[table] = []`
- Right-to-Delete cascade: extend `/me/delete` to wipe new PII-bearing tables (recognition_posts, time_off_requests, course_assignments, etc.)

### P2 · Reliability + concurrency

**ADR-0012 — Real optimistic concurrency + retry contracts**

- `updateOrgScopedWithCheck` already exists — audit the 20+ "TODO" actions and convert each to real CAS. Add a CI grep that fails the build on `// FINDING-022` comments without `.eq("updated_at", expected)` in the same file
- Push retry queue: 3-tier exponential backoff (5s → 30s → 5min) with audit logging on each retry. Stripe webhook `notify()` calls get the same treatment
- Stripe webhook idempotency: `webhook_events` table with `(provider, event_id, action_key)` UNIQUE — actions like "mark invoice paid" can't fire twice across distinct events
- Hard-delete audit: 96 call sites — classify each as "intentional hard" (e.g., session tokens) or "should be soft" (e.g., conversations, recovery codes). Migrate the should-be-soft ones; document the intentional-hard ones

### P3 · Observability foundation

**ADR-0013 — Request-id, telemetry, structured catch**

- Middleware injects `x-request-id` into every request; logger + audit emitter pick it up automatically
- Sentry / OTel SDK adoption (or self-hosted alternative). Wrap silent catches in `log.warn` with the request-id + a `breadcrumb`
- Realtime notifications bell: subscribe to `notifications` filtered to `user_id = me`, drop the 60s poll
- the deskless-workforce suite fan-out via existing `RealtimeRefresh` pattern audit — verify no other surfaces are polling unnecessarily

### P4 · Schema hygiene + performance

**ADR-0014 — Legacy column removal + migration policy + index audit**

- **Migration scheme policy**: timestamp-only going forward. The remaining 4-digit migrations (0001-0073) stay as historical record but no new sequential numbering. Migration ordering documented in CLAUDE.md
- **Legacy column removal**: three migrations per legacy column (deprecate → soft-remove → hard drop). Start with `budgets.{category,spent_cents,xtc_code}` and `expenses.{category,xtc_code}` since they have XPMS replacements
- **Rename `expenses.status` → `expenses.receipt_state`** with the LDP `*_state` discipline
- **`listOrgScoped` default limit** + pagination contract — add `cursor` parameter, deprecate unbounded calls
- **Index audit**: every new table added in 0044+ — ensure FK columns are indexed inline with the table creation; CI lint rule against missing `create index` for `references` columns
- **Down migrations** for future work; the 0001-0073 backlog stays one-way (it's been applied)

### P5 · Type safety + cleanup

Last because it's the lowest-risk and highest-touch:

- Audit 314 `LooseSupabase` cast sites — drop where typed client now works (post-types regen)
- Consolidate `src/lib/supabase/types.ts` ↔ `database.types.ts` — keep hand-maintained as the public alias surface; auto-derive every primitive type from generated
- Convert `Record<string, unknown>` action patches to typed Zod shapes
- Down-migrate stub `PageStub` pages — remove or wire them

---

## What to do next session

If you want me to start executing, I recommend P0 (~1 hour total) followed by ADR-0011 (the compliance sprint — biggest enterprise-grade gap). The optimistic concurrency work (P2) is the highest-risk for active data corruption and should follow immediately.

If you want me to keep going across all 5 phases, expect roughly:

- P0: 1 hour
- P1: 4-6 hours (ADR + execution + scheduled task)
- P2: 6-8 hours (covers all 20+ edit actions + push queue + webhook idempotency)
- P3: 3-4 hours
- P4: 4-6 hours (migrations apply individually with backfill validation)
- P5: 2-3 hours

Total: ~25-30 focused hours of work to get to genuinely enterprise-grade.
