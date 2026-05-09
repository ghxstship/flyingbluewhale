# E2E_RUN_LOG

**Protocol:** E2E-LRP §PHASE 3 — Browser Execution
**Run:** 2026-05-09
**Harness:** Playwright (existing `e2e/` directory, 35+ specs)
**Mode:** HYBRID (S3/S4 local-scope auto-fix; S1/S2 logged)
**Execution scope:** existing Playwright suite from parent repo `/Users/julianclarkson/Documents/flyingbluewhale/`. New LDP composition specs (X-1–X-14) authored as plan but not implemented this session — schema migrations are committed-not-applied.

> **Methodology note.** This worktree has no `node_modules` or `.env.local`; tests must run from the parent repo. Parent repo is on branch `main` at HEAD `75d4fdb` — does NOT include the 5 LDP migration files committed in this worktree's branch. Therefore the run reflects current main behavior, not the post-remediation state. To re-run against post-remediation behavior, the migrations would need to be applied to a branch DB and the worktree's source synced or merged to main.

---

## Pre-flight

| Gate                                          | Result                                                                                                                | Source                                                                                             |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Dev server reachable                          | ✅ `next dev` PID 29584 active on default port 3000                                                                   | `pgrep` confirmed                                                                                  |
| Playwright binary                             | ✅ `npx playwright test` resolves                                                                                     | `node_modules/.bin/playwright`                                                                     |
| Browser binary                                | ✅ chromium-headless-shell-1217 (cached)                                                                              | Playwright cache                                                                                   |
| Supabase URL/anon                             | ❓ assumed present in parent .env.local (not inspected — file is .gitignored)                                         | parent repo `/Users/julianclarkson/Documents/flyingbluewhale/.env.local` exists (433 bytes, May 4) |
| Third-party creds (Stripe, Anthropic, Resend) | ❌ NOT SET (per UJV [reports/00_DISCOVERY.md:131](00_DISCOVERY.md:131)); Tier-C blocked flows continue env-gated-skip |

---

## Focused subset run (smoke + auth + i18n + marketing) — completed

Captured before full-suite run. Subset: `e2e/api-health.spec.ts e2e/marketing.spec.ts e2e/auth.spec.ts e2e/i18n.spec.ts`. Result: **16 passed / 5 failed / 41.1s wall**.

### Failures observed

| #   | Spec                       | Test                                       | Failure mode                                                                                                                                                                                                                                                           | Defect ID |
| --- | -------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| 1   | `e2e/marketing.spec.ts:22` | "home renders hero + CTAs"                 | `getByRole("link", { name: /^start free/i }).first()` not visible — current home likely uses a different CTA label after voice rewrite                                                                                                                                 | E2E-D-001 |
| 2   | `e2e/marketing.spec.ts:32` | "pricing shows 4 tiers + comparison table" | Test asserts tiers `Access / Core / Professional / Enterprise`. Current canon per memory `feedback_marketing_voice.md` and [src/app/(marketing)/pricing/page.tsx](<../src/app/(marketing)/pricing/page.tsx>) is `Free / Crew / Production / Festival`. **Stale test.** | E2E-D-002 |
| 3   | `e2e/marketing.spec.ts:58` | "footer has 5 nav columns"                 | `footer.getByText('Company', { exact: true })` not found. Current footer headings differ. **Stale test.**                                                                                                                                                              | E2E-D-003 |
| 4   | `e2e/i18n.spec.ts:11`      | "respects locale cookie when set"          | Sets `locale=es` cookie at `domain: localhost`; expects `<html lang="es">`. Did not flip.                                                                                                                                                                              | E2E-D-004 |
| 5   | `e2e/i18n.spec.ts:19`      | "switches to RTL when ar locale active"    | Same cookie mechanism; `<html dir="rtl">` did not flip.                                                                                                                                                                                                                | E2E-D-005 |

### Side finding from subset (not a test failure but a defect)

| #   | Source                                                                                                                                                                   | Issue                                                                                                                                                                                                                                                                                                                                 | Defect ID |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| 6   | [src/app/(marketing)/pricing/page.tsx:88, 201, 246](<../src/app/(marketing)/pricing/page.tsx>) and [src/app/(marketing)/page.tsx:514](<../src/app/(marketing)/page.tsx>) | Marketing copy mentions "Multi-org with SSO" and "SSO (SAML / OIDC)" in 4 locations. UJV R-2 (commit `dcc2390`, 2026-04-22) explicitly removed these claims; subsequent voice-rewrite commits re-added them. SSO/SCIM is **not implemented** in code (per UJV [03_REMEDIATIONS.md §R-2](03_REMEDIATIONS.md)). Brand-claim regression. | E2E-D-006 |

---

## Full suite run

**Started:** 2026-05-09 03:07 (parent repo, branch `main`)
**Status at this writing:** in progress — Playwright process active (PIDs 29560, 30455 et al), test-results directory accumulating per-test artifacts. Output is captured to `/tmp/e2e_full_run.log` once the `tail -300` pipe drains at exit.

**Expected duration:** UJV's prior run reported 847 tests in ~3-4 min wall on this machine; this run includes the same suite plus any specs added since. Estimate 3–8 min.

**Acceptance per UJV baseline:** 847 passed / 25 env-gated skipped / 0 failed.

> **Update placeholder** — once the suite drains, append: `Total: <N> passed / <M> failed / <K> skipped, wall <W>s. Failures enumerated below.` plus a per-failure breakdown.

### Update — full suite results

[Captured at session-end. See `REPORTS/E2E_RUN_SUMMARY.md` and `reports/E2E_DEFECT_LOG.md` for the complete failure roster after the suite drains.]

---

## Per-spec coverage map

Even before full-suite numbers, here is what the existing harness covers:

| Spec                                | Coverage                                                 | Acceptance                       |
| ----------------------------------- | -------------------------------------------------------- | -------------------------------- |
| `a11y.spec.ts`                      | axe color-contrast across marketing + auth surfaces      | All clean per UJV baseline       |
| `api-authed-rest.spec.ts`           | Authenticated REST API surface                           | Per UJV baseline                 |
| `api-contract.spec.ts`              | Response shape contracts                                 | Per UJV baseline                 |
| `api-health.spec.ts`                | `/api/v1/health` endpoint                                | ✅ verified in subset run        |
| `api-idempotency.spec.ts`           | X-Idempotency-Key honored on POST                        | Per UJV baseline                 |
| `api-new-routes.spec.ts`            | Routes added since last audit                            | Per UJV baseline                 |
| `api-observability.spec.ts`         | Sentry / log endpoints                                   | Per UJV baseline                 |
| `api-security.spec.ts`              | CORS / CSP / security headers                            | Per UJV baseline                 |
| `api-v1-coverage.spec.ts`           | All /api/v1/\* namespaces respond                        | Per UJV baseline                 |
| `api-webhooks.spec.ts`              | Stripe webhook signature verify                          | Tier-C env-gated                 |
| `audit-log.spec.ts`                 | audit_log row emitted per privileged action              | Per UJV baseline                 |
| `auth.spec.ts`                      | login / signup / forgot / reset / magic-link / verify    | ✅ verified in subset run        |
| `booking-canon.spec.ts`             | 0003 booking-canon (deals / settlements / holds / tours) | Per UJV baseline                 |
| `booking-canon-extras.spec.ts`      | Extended booking flows                                   | Per UJV baseline                 |
| `capability-gating.spec.ts`         | CAPABILITIES matrix enforced per role                    | Per UJV baseline                 |
| `chroma-theme.spec.ts`              | Theme-switch + brand overlay                             | Per UJV baseline                 |
| `cms-to-portal-roundtrip.spec.ts`   | Console → portal data flow                               | Per UJV baseline                 |
| `compliance-flow.spec.ts`           | Onboarding compliance gates                              | Per UJV baseline                 |
| `consent.spec.ts`                   | Cookie consent banner                                    | Per UJV baseline                 |
| `forms-construction-trade.spec.ts`  | Construction-trade vendor form                           | Per UJV baseline                 |
| `forms-public.spec.ts`              | Public forms render                                      | Per UJV baseline                 |
| `forms-render-smoke.spec.ts`        | All form definitions render                              | Per UJV baseline                 |
| `handoff-shells.spec.ts`            | Cross-shell session handoff                              | Per UJV baseline                 |
| `i18n.spec.ts`                      | i18n locale + dir + skip-link                            | ⚠️ 2 failures observed in subset |
| `marketing-header.spec.ts`          | Header utility cluster                                   | Per UJV baseline                 |
| `marketing.spec.ts`                 | Marketing pages render                                   | ⚠️ 3 failures observed in subset |
| `marketplace-canon.spec.ts`         | 0002 marketplace canon                                   | Per UJV baseline                 |
| `marketplace-canon-actions.spec.ts` | Marketplace write actions                                | Per UJV baseline                 |
| `mobile.spec.ts`                    | COMPVSS PWA core flows                                   | Per UJV baseline                 |
| `pagination.spec.ts`                | Cursor-based pagination                                  | Per UJV baseline                 |
| `portal.spec.ts`                    | GVTEWAY portal flows                                     | Per UJV baseline                 |
| `rls-boundaries.spec.ts`            | Row-level security cross-org tests                       | Per UJV baseline                 |
| `roles.spec.ts`                     | Persona resolution + shell routing                       | Per UJV baseline                 |
| `routes-public-smoke.spec.ts`       | Every public route returns 200                           | Per UJV baseline                 |
| `seo-metadata.spec.ts`              | Sitemap + robots + meta                                  | Per UJV baseline                 |

**E2E coverage gap relative to LDP §5/§7/§8 (net-new lifecycles):** every X-\* composition case in `E2E_TEST_PLAN.md` keyed to engagement_state, financial_periods, subscriptions, asset_movements is uncovered — none of those tables exist on parent `main` yet (migrations committed in worktree only).

---

## Composition contract verification

Deferred to `E2E_COMPOSITION_CONTRACT_VERIFICATION.md` — but the high-level state going into this run:

| Contract                                                     | Existing spec                               | Status                     |
| ------------------------------------------------------------ | ------------------------------------------- | -------------------------- |
| Form submission triggers approval (UFS → UAS)                | None directly                               | uncovered                  |
| Approval advances lifecycle (UAS → UIS)                      | None directly                               | uncovered (LDP §5 net-new) |
| Lifecycle issues credentials and documents (UIS → UAL + UFS) | `cms-to-portal-roundtrip.spec.ts` (partial) | partial                    |
| Calendar event reserves asset (UCS → UAL)                    | None directly                               | uncovered                  |
| Contract milestone generates invoice (UCT → UTX)             | `cms-to-portal-roundtrip.spec.ts` (partial) | partial                    |
| Invoice payment posts ledger entry (UTX → ULG)               | None directly                               | uncovered (LDP §7 net-new) |

These are gaps in the harness, not failures of the composition contracts themselves — the contracts cannot be tested without DB-side state for the new lifecycle tables.
