# Launch Runbook — ATLVS Technologies

Operational go-live checklist for `atlvs.pro` (repo: `flyingbluewhale`). Produced from the 2026-06-25 launch-readiness audit. Everything in **§1 Code/DB (DONE)** has been remediated, verified, and merged. **§2** is the set of items only an operator with dashboard/deploy/secret access can complete — these are the remaining gates to launch. **§3** is the post-launch backlog (non-blocking).

Launch scope for this runbook: **paid subscriptions + LEG3ND credits/store + EU/UK users** (all in scope → all four audit Criticals were treated as hard blockers and fixed).

---

## 1. Code / DB remediation — DONE ✅ (no action needed)

Merged to `feat/tier1-2-domains-and-festival-seed` (commits `b4ed173`, `fe04ab5`, `19e073b`, `f77cab5`). Verified: `tsc` clean · full unit suite green · targeted e2e (CSP/auth/cross-tenant) green · security advisor shows no new ERRORs.

- **Cross-tenant isolation** — fixed an anon-readable SECURITY DEFINER view leak (offer letters/PII/financials); proven by an 89-probe + 11-e2e isolation suite (0 leaks).
- **C1 Stripe subscription lifecycle** — webhook now uses the service client so renewals/dunning/churn actually apply.
- **C2 LEG3ND credit/store/voucher fulfillment** — atomic idempotent RPCs + `credit_ledger` unique key (no lost/double credit).
- **C3 GDPR retention/purge** — `pg_cron` schedules the audit-PII redaction (02:30 UTC) + account purge (03:00 UTC); failures land in `private.cron_run_log`.
- **C4 Account-erasure FKs** — 158 user FKs rewired (SET NULL / CASCADE) so purge completes with zero residual PII (erasure test guards it).
- **Highs** — XSS sanitized; CSP nonce (no `unsafe-inline`); Sentry source-map config; COMPVSS mobile-kit accessibility; React #418 hydration fixes; portal proposal sign-off gated by a `proposals:approve` capability.

---

## 2. Pre-launch gates — OWNER ACTION REQUIRED 🔲

These cannot be done from code/MCP. Do all four before flipping production traffic.

### 2.1 Enable leaked-password protection
- **Where:** Supabase Dashboard → Project `xrovijzjbyssajhtwvas` → **Authentication → Policies / Password settings**.
- **Do:** Turn on **"Check passwords against HaveIBeenPwned"** (leaked-password protection).
- **Why:** Audit flagged it off (`auth_leaked_password_protection`). Cheap SOC2/ASVS win; blocks credential-stuffing with known-breached passwords.
- **Verify:** Try signing up with `password` — it should be rejected.

### 2.2 Wire Sentry source-map upload in CI
- **Where:** CI/Vercel build environment variables.
- **Do:** Set `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`. (`withSentryConfig` is already applied in `next.config.ts`; it warns-and-skips upload when the token is absent, so builds won't break without it — but prod stack traces stay minified until it's set.)
- **Why:** Without source maps, production Sentry stack traces are unreadable, gutting the (otherwise complete) error tracking.
- **Verify:** Trigger a prod build; confirm the Sentry release shows uploaded source maps, then throw a test error and confirm a readable stack in Sentry.

### 2.3 Confirm backup / disaster-recovery posture
- **Where:** Supabase Dashboard → **Database → Backups** (+ Point-in-Time Recovery).
- **Do:**
  1. Confirm **PITR is enabled** with retention **≥ 7 days** (covers financial tables: `invoices`, `transactions`, `journal_entries`, plus the 17k-row audit log).
  2. Confirm **daily logical backups** are running.
  3. **Rehearse one restore** to a scratch project (or PITR clone) at least once and document the elapsed time → this is your RTO.
- **Why:** The audit could not verify backup posture via API; a non-recoverable incident on financial/audit data is catastrophic. This is the single biggest unverifiable gap.
- **Note:** Migrations are forward-only (`apply_migration`); the de-facto rollback story is PITR restore — see §3 (write the rollback runbook).

### 2.4 Production-environment smoke test
Run on the **deployed** environment (not local), because these depend on prod config/secrets.

| Area | Check |
|---|---|
| **Domains** | `atlvs.pro`, `www.`, `app.`, `gvteway.`, `compvss.` all resolve to the deployment; `src/proxy.ts` host-rewrites land each on the right shell; SSO cookie shared across subdomains (`domain=.atlvs.pro`). |
| **Auth email** | Real signup → verification email arrives → verify works; password reset email + flow; invite email + accept. (Confirm the email provider/SMTP is prod-configured in Supabase Auth.) |
| **Stripe** | Webhook endpoint registered + `STRIPE_WEBHOOK_SECRET` set; run a live/test-mode checkout → confirm `subscriptions.state` updates from the webhook (this is the C1 path); a LEG3ND credit purchase → `credit_ledger` grant appears once (C2 idempotency); Connect onboarding completes. |
| **Push** | VAPID keys set; a notification (e.g. announcement/kudos) delivers to a subscribed device. |
| **Service worker** | Registered only on `compvss.*`; other shells unregister it; `offline.html` serves when offline. |
| **Env** | All keys from `.env.example` present in prod; `NEXT_PUBLIC_USE_SUBDOMAINS=1`; `NEXT_PUBLIC_APP_URL=https://atlvs.pro`. |
| **CSP** | Load each shell in a real browser; console shows **zero CSP violations** (the nonce path was verified in staging — reconfirm on prod domains incl. Stripe.js). |
| **Cron** | After ~24h (or trigger manually), confirm `SELECT * FROM private.cron_run_log ORDER BY ran_at DESC` shows successful redaction + purge runs; alert on `succeeded = false`. |

---

## 3. Post-launch backlog (non-blocking) 📋

Tracked from the audit's Medium findings. Safe to ship without; address on the timelines noted.

- **Performance (in progress this session):** request-level `cache()` on session/tenant/org resolution + `unstable_cache` on report metrics; server pagination on ~90 `limit:500` list pages. *(These two are being remediated now — see the perf commits.)*
- **DB advisor cleanup — re-run ~2 weeks post-launch on real traffic:** 832 `multiple_permissive_policies` (merge redundant per-(role,action) policies) + 902 `unused_index` findings (drop the still-unused ones once traffic confirms they're truly unused — do NOT mass-drop pre-launch; low traffic produces false positives).
- **Rollback runbook:** document the PITR-restore procedure as the formal migration-rollback path (migrations are forward-only).
- **Type safety:** progressively replace ~139 bare `as unknown as Row` casts with typed selects (reserve `LooseSupabase` for genuinely dynamic table names).
- **Test coverage:** re-enable the 18 skipped finance/procurement e2e mutations (need seed data).
- **Accessibility polish:** `scope="col"` on the `DataView`/`DataTable` `<th>` primitives; add `error.tsx`/`loading.tsx`/`not-found.tsx` to the `(legend)` shell.
- **SEO:** wire the existing `jobPostingSchema`/`productSchema` structured-data helpers on careers/gig/store-product pages; `noIndex` the thin product not-found fallback.
- **i18n:** finish the in-progress sweep (494 keys were filled to align catalogs; ~real translations still needed for de/fr/pt/es; scrub the stray `nav.foo.bar` test key before committing).
- **Dependencies:** patch-bump `@supabase/*` and `@sentry/nextjs`; track the `next`/`postcss` moderate advisory (resolves on a forward Next patch — do **not** take the `audit fix --force` downgrade).

---

## 4. Go / No-Go

**GO when** all of §2 (2.1–2.4) is green. §1 is already done; §3 does not gate launch.

| Gate | Status |
|---|---|
| Code/DB criticals + highs remediated | ✅ Done |
| Cross-tenant isolation proven | ✅ Done |
| Leaked-password protection | 🔲 §2.1 |
| Sentry source maps in CI | 🔲 §2.2 |
| PITR/backup confirmed + restore rehearsed | 🔲 §2.3 |
| Prod-env smoke (domains/auth/Stripe/push/cron) | 🔲 §2.4 |
