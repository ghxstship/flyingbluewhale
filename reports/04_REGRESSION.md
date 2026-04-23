# Phase 4 — Regression

All native checks run in the order specified by the protocol. Every gate green.

---

## Gates

| # | Command | Result | Duration | Evidence |
|---|---|---|---|---|
| 1 | `npm run lint` | **PASS** | ~5s | 0 errors, 118 warnings (all `no-restricted-syntax` hex-literal in `src/lib/pdf/*.tsx` — `@react-pdf/renderer` does not support CSS custom properties; hex values are correct here) |
| 2 | `npm run typecheck` | **PASS** | ~12s | `tsc --noEmit` exit 0 |
| 3 | `npm run test` | **PASS** | 1.73s | **108/108 tests** across 15 files |
| 4 | `npm run build` | **PASS** | ~28s | Full production build; every route classified static/dynamic; Proxy (Middleware) layer detected; no compile errors |
| 5 | `npx playwright test` | **PASS** | 14.1 min | **847 passed, 25 skipped, 0 failed** across 33 spec files |
| 6 | Migrations | **up-to-date** | — | 29 migrations applied; last applied `20260421_000029_invites` via Supabase MCP |

---

## E2E coverage by spec domain

| Spec file | Result |
|---|---|
| `a11y.spec.ts` | PASS — accessibility gates across shells |
| `api-*.spec.ts` (10 files: authed-rest, contract, health, idempotency, new-routes, observability, security, v1-coverage, webhooks, api.spec) | PASS — auth gating, HMAC verification, route contract, idempotency keys |
| `audit/` (themes-snapshots, themes-responsive, chroma-theme, etc.) | PASS — 8 themes × N routes × 3 viewports visual regression |
| `audit-log.spec.ts` | PASS — mutations write to audit_log with actor + timestamp |
| `auth.spec.ts` | PASS — login/signup/forgot-password round-trip |
| `capability-gating.spec.ts` | PASS — RLS + role capabilities enforced |
| `cms-to-portal-roundtrip.spec.ts` | PASS — Event Guide authored in ATLVS renders in portal |
| `compliance-flow.spec.ts` | PASS — audit-export runs |
| `consent.spec.ts` | PASS — cookie consent gates analytics |
| `handoff-shells.spec.ts` | PASS — cross-shell handoffs (platform ↔ portal, slug-RLS boundary) |
| `i18n.spec.ts` | PASS — locale cookie + RTL flip for `ar` |
| `marketing-header.spec.ts` | PASS — theme toggle, locale switcher, theme gallery, mobile nav |
| `marketing.spec.ts` | PASS — hero content, CTA links, legal footer |
| `mobile.spec.ts` | PASS — COMPVSS tab bar, offline queue, service worker |
| `pagination.spec.ts` | PASS — table pagination contracts |
| `portal.spec.ts` | PASS — portal rails per persona |
| `rls-boundaries.spec.ts` | PASS — anon cannot see other-org rows |
| `roles.spec.ts` | PASS — 10 platform_role × capability matrix |
| `routes-public-smoke.spec.ts` | PASS — every public marketing route 200 |
| `seo-metadata.spec.ts` | PASS — title, description, canonical, OG, Twitter, sitemap, robots, manifest |

**25 skipped** breakdown (env-gated, intentional):
- `api-webhooks.spec.ts` — Stripe webhook HMAC round-trip skips when `STRIPE_WEBHOOK_SECRET` unset
- `api-v1-coverage.spec.ts` — Anthropic chat streaming skips when `ANTHROPIC_API_KEY` unset
- `api-new-routes.spec.ts` — Resend email delivery skips when `RESEND_API_KEY` unset
- `mobile.spec.ts` — service-worker test skips when not running production build
- `audit/themes-snapshots.spec.ts` + `audit/themes-responsive.spec.ts` — a few combos skip when baseline image is missing (first-run bootstrap)

---

## Test-suite drift remediation

During Phase 4 review, three e2e specs + one audit config still referenced the legacy `/customers` URL path (renamed to `/community` earlier with no redirect, per project's clean-cut rule). One unused diagnostic spec targeted `/customers` exclusively. Fixed inline:

| File | Change |
|---|---|
| `e2e/seo-metadata.spec.ts:19` | `"/customers"` → `"/community"` in MARKETING array |
| `e2e/marketing.spec.ts:51-52` | `"guides + blog + customers"` test → `"guides + blog + community"` + URL swap |
| `e2e/routes-public-smoke.spec.ts:20` | `"/customers"` → `"/community"` |
| `e2e/audit/matrix.config.ts:58` | `/customers` + name `marketing-customers` → `/community` + `marketing-community` |
| `e2e/audit/overflow-customers-probe.spec.ts` | **deleted** — probe for `/customers` overflow; route no longer exists |

Spec-level tests that previously "passed" against the not-found.tsx fallback now test the correct page. No test logic changed beyond the URL literal.

---

## No new regressions introduced

After the Phase 3 remediations (`requireSession` in personal layout + SSO/SCIM copy cleanup across 6 marketing files) + the Phase 4 spec-URL fixups:

- `npm run typecheck` — PASS
- `npm run test` — 108/108 PASS
- Next.js build inventory — unchanged route count
- Runtime browser probing — `/me/*` now correctly redirects anons; `/customers` 404s (clean cut); `/community` 200s; all grep sweeps for SSO/SCIM return zero hits
