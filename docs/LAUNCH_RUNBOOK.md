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

### 2.2 Wire Sentry — ✅ configured + verified locally; ⏳ set the same vars in Vercel
- **Resolved values** (org `G H X S T S H I P INDUSTRIES LLC`, project `atlvs`, region US): written to local `.env.local` (gitignored) and verified — a `CI=1` prod build **uploaded 890 source-map files** (artifact bundle) and a CLI test event ingested (`Event dispatched`). Keys documented in `.env.example`.
  - `NEXT_PUBLIC_SENTRY_DSN = https://fd898bba56a981f72ac7b35fcec89b38@o4510240000376832.ingest.us.sentry.io/4510240006275072`
  - `SENTRY_ORG = g-h-x-s-t-s-h-i-p-industries-l`
  - `SENTRY_PROJECT = atlvs`
  - `SENTRY_AUTH_TOKEN = <the org:ci token from sentry-cli login — copy the value from .env.local>`
- **Remaining (you):** add those four to **Vercel → Project → Settings → Environment Variables** (Production + Preview). `NEXT_PUBLIC_SENTRY_DSN` must be present at build for the client bundle; the other three drive source-map upload in CI.
- **Security:** the `org:ci` token (used everywhere here) never touched chat — it came from your interactive `sentry-cli login`. The broad **personal token** pasted during setup should be **revoked** at Settings → Auth Tokens (it was only used to discover the org/project/DSN).
- **Verify after Vercel:** a deploy build log shows "Uploaded files to Sentry"; trigger a client error and confirm a readable (un-minified) stack in the `atlvs` project.

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

- **Performance — ✅ DONE (commit `eab0b8a`):** request-level React `cache()` on session resolution + parallelized `(platform)` layout awaits + `unstable_cache` (60s, org-keyed) on report metrics; server pagination (`src/lib/db/pagination.ts` + `PagerNav`) wired into ~40 high-cardinality list pages. Verified tsc + 1103 unit + e2e smoke.
- **Rollback runbook — ✅ DONE (commit `43041db`):** see [`ROLLBACK_RUNBOOK.md`](./ROLLBACK_RUNBOOK.md).
- **Accessibility polish — ✅ DONE (commits `43041db`, `63477c1`):** `scope="col"` on the shared table primitives — `DataView.tsx` + the real interactive headers in `DataTableInteractive.tsx` (sortable/select-all/actions) + `DataTable.tsx` ghost/skeleton; plus `error.tsx`/`loading.tsx`/`not-found.tsx` for the `(legend)` shell.
- **SEO — ✅ DONE (commit `63477c1`):** `jobPostingSchema` wired into the marketplace gig detail (real `public_job_board` data, `datePosted` from `published_at`, emitted only when present); `productSchema` into the store product detail (+ extended with `currency`/`inStock` so OutOfStock is honest); thin product not-found metadata now `noIndex`. Careers `jobPostingSchema` intentionally deferred — `ROLES` is an empty placeholder array, so wiring it now would be a no-op needing fabricated dates; wire when real roles land.
- **Test coverage — 🔍 INVESTIGATED 2026-06-25; skips are legitimate, kept skipped to protect CI:** un-skipped + ran the `console-modules-b6` self-seeding chains — the underlying create FLOWS are correct (MSA, participant-entry, prequalification, inspection, PO-change-order all created successfully; **no hidden app bugs**), but the 2–3× sequential-create chains are **flaky as a batch** under single-server e2e contention (a different chain times out each run). The pay-app chain additionally needs a PO that is project-tied **and** in `po_state` sent/acknowledged/fulfilled (a fresh PO is `draft` and isn't even listed) — the app is correct; the self-seed is insufficient. The `b5`/`b7`/`console-transitions` skips are already accurately annotated (map-picker `.refine()`, composite sheet codes, create-redirects-to-list-without-detail-URL). **Re-enable needs pre-seeded fixtures + serialized workers, not the self-seed-chain approach** — a focused test-infra pass, best run with the agent fleet.
- **DB advisor cleanup — ⏸️ deferred (post-launch on real traffic, per design):** 832 `multiple_permissive_policies` (merge redundant per-(role,action) policies) + 902 `unused_index` findings — drop only once real traffic confirms they're unused; mass-dropping pre-launch produces false positives, and the permissive-policy merge is broad RLS surgery best not done at the launch gate.
- **Type safety — ⏸️ deferred (progressive):** ~139 bare `as unknown as Row` casts → typed selects. Incremental by nature; high-churn/low-value to mass-convert at the launch gate.
- **Dependencies — ⏸️ deferred (stability over currency at launch):** patch-bump `@supabase/*` + `@sentry/nextjs` in a dedicated post-launch window with full regression. The one security-relevant advisory (`next`/`postcss`, moderate) is gated on a forward Next patch — do **not** take the `audit fix --force` downgrade.
- **i18n — ⏸️ deferred (not machine-completable):** the in-progress sweep aligned catalog keys, but real de/fr/pt/es translations require a human/translation pass (can't be fabricated), and it remains a separate uncommitted in-flight edit; scrub the stray `nav.foo.bar` test key when that work lands.

---

## 4. Go / No-Go

**GO when** all of §2 (2.1–2.4) is green. §1 is already done; §3 does not gate launch.

| Gate | Status |
|---|---|
| Code/DB criticals + highs remediated | ✅ Done |
| Cross-tenant isolation proven | ✅ Done |
| Leaked-password protection | 🔲 §2.1 |
| Sentry source maps in CI | 🟡 configured + verified locally; add 4 vars to Vercel (§2.2) |
| PITR/backup confirmed + restore rehearsed | 🔲 §2.3 |
| Prod-env smoke (domains/auth/Stripe/push/cron) | 🔲 §2.4 |
