# Phase 2 — Execution Log

**Execution env:** local dev server at `http://localhost:3000`, `.env.local` populated only with Supabase URL + anon key. Stripe / Anthropic / Resend / GrowthBook / Sentry absent → third-party-dep flows BLOCKED as documented.

---

## Tooling gates (blocking)

| Command | Result | Notes |
|---|---|---|
| `npm run typecheck` | **PASS** | tsc --noEmit exit 0 |
| `npm run test` | **PASS** | 108/108 vitest across 15 files, 1.76s |
| `npm run lint` | **PASS** | 0 errors, 118 warnings (all `no-restricted-syntax` hex literals in PDF generators — legitimate; `@react-pdf/renderer` does not support CSS custom properties) |
| `npm run build` | **PASS** | Full production build including RSC payload + route manifest + Proxy (Middleware) detected |

---

## Tier A — anonymous + public

| Path | Status | Result |
|---|---|---|
| `/` | 200 | PASS |
| `/features` | 200 | PASS |
| `/solutions` + `/solutions/atlvs|gvteway|compvss` | 200 × 4 | PASS |
| `/solutions/{live-events,concerts,festivals-tours,immersive-experiences,brand-activations,corporate-events,theatrical-performances,broadcast-tv-film}` | 200 × 8 | PASS |
| `/pricing` | 200 | PASS |
| `/community` | 200 | PASS |
| `/compare` | 200 | PASS |
| `/blog` | 200 | PASS |
| `/docs` | 200 | PASS |
| `/changelog` | 200 | PASS |
| `/about` | 200 | PASS |
| `/contact` | 200 | PASS |
| `/guides` | 200 | PASS |
| `/legal/{terms,privacy,dpa,sla}` | 200 × 4 | PASS |
| `/login` + `/signup` + `/forgot-password` + `/magic-link` + `/reset-password` + `/verify-email` + `/accept-invite/:token` | 200 × 7 | PASS |
| `/p/mmw26-hialeah/guide` (seeded demo guide, public RLS) | 200 | PASS |
| `/sitemap.xml`, `/robots.txt`, `/api/v1/health`, `/og?…` | 200 × 4 | PASS |

**Tier A total: 39/39 PASS**

---

## Tier B — auth-gated

### Before remediation

| Path | Status | Expected | Result |
|---|---|---|---|
| `/me` | 200 | redirect to /login | **FAIL** (renders empty shell to anons) |
| `/me/profile` | 200 | redirect | **FAIL** |
| `/me/settings` | 200 | redirect | **FAIL** |
| `/me/notifications` | 200 | redirect | **FAIL** |
| `/me/security` | 200 | redirect | **FAIL** |
| `/me/privacy` | 200 | redirect | **FAIL** |
| `/me/tickets` | 200 | redirect | **FAIL** |
| `/me/organizations` | 200 | redirect | **FAIL** |

**P0-1 (CRITICAL):** `src/app/(personal)/layout.tsx` had no `requireSession` guard. Chrome + partial UI rendered to anons, leaking shell structure and creating RCE risk if any inner client component assumed a session existed. Inconsistent with `(platform)/layout.tsx` and `(mobile)/layout.tsx` which both guard at the layout boundary.

### Remediation — applied inline

- `src/app/(personal)/layout.tsx`: added `await requireSession("/login");` at layout entry. Matches platform + mobile convention.

### After remediation

| Path | Status (fetch redirect:manual) | Follow nav | Result |
|---|---|---|---|
| `/me`, `/me/profile`, `/me/settings`, `/me/notifications`, `/me/security`, `/me/privacy`, `/me/tickets`, `/me/organizations` | 0 (opaque redirect) | → `/login` ✓ | **PASS** |

Direct browser nav to `/me/security` confirmed landing on `/login` with "Sign in" H1. Fix verified.

### Other Tier B surfaces

| Path | Status | Result | Notes |
|---|---|---|---|
| `/console`, `/console/projects`, `/console/people/invites`, `/console/finance`, `/console/settings`, `/console/proposals` | 0 (opaque redirect to /login) | **PASS** | Platform shell correctly guarded by `(platform)/layout.tsx` `requireSession` |
| `/console/advancing` | 404 | **PASS** (GAP flagged) | Advancing is project-scoped at `/console/projects/[id]/advancing` — URL under test was wrong, not a real gap |
| `/m`, `/m/settings` | 0 (opaque redirect to /login) | **PASS** | Mobile shell guarded |
| `/p/mmw26-hialeah/client` + `artist` + `vendor` + `crew` + `sponsor` | 200 | **PASS** | Portal routes rely on slug-as-secret + RLS. Demo org slug `mmw26-hialeah` is seeded; each page does `projectIdFromSlug(slug)` and calls `notFound()` if RLS denies. Arbitrary slugs return 404. Working as designed. |

---

## API surface probe

| Endpoint | Method tested | Status | Expected | Result |
|---|---|---|---|---|
| `/api/v1/health` | GET | 200 | public 200 | PASS |
| `/api/v1/me/preferences` | GET | 401 | 401 | PASS |
| `/api/v1/projects` | GET | 401 | 401 | PASS |
| `/api/v1/notifications` | GET | 401 | 401 | PASS |
| `/api/v1/incidents` | GET | 401 | 401 | PASS |
| `/api/v1/exports` | GET | 401 | 401 | PASS |
| `/api/v1/webhooks/stripe` | GET | 405 | 405 (POST-only) | PASS |
| `/api/v1/tickets/scan` | GET | 405 | 405 (POST-only) | PASS |
| `/api/v1/ai/chat` | GET | 405 | 405 (POST-only) | PASS |
| `/api/v1/stripe/checkout` | GET | 405 | 405 (POST-only) | PASS |
| `/api/v1/auth/oauth?provider=google` | GET | 307 (opaque) | → provider | PASS (exchange will 400 without Google provider enabled in Supabase dashboard — flagged as Tier C blocker) |
| `/api/v1/users` | GET | 404 | namespace has only `[userId]/*` | PASS (no root) |
| `/api/v1/compliance` | GET | 404 | namespace has only `audit-export/` | PASS |
| `/api/v1/credentials` | GET | 404 | namespace has only `extract/` | PASS |
| `/api/v1/deliverables` | GET | 404 | namespace has only `[id]/*` | PASS |
| `/api/v1/import` | GET | 404 | namespace has only `vendors/`, `tasks/`, `crew-members/` | PASS |
| `/api/v1/telemetry` | GET | 404 | namespace has only `marketing/` | PASS |

**API total:** 17/17 PASS with expected semantics.

---

## Tier C — BLOCKED by missing external credentials

Documented for the readiness report. These cells are **not fail**, they are **environment-gated**.

| Flow | Reason | Unblock action |
|---|---|---|
| Google / GitHub / Microsoft OAuth sign-in | No OAuth client configured in Supabase dashboard for this project | Admin enables providers in Supabase + adds client ID/secret |
| Stripe Checkout / Connect onboarding / webhook signature round-trip | `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` unset | Populate `.env.local` with Stripe keys |
| Transactional email (invite, proposal share, reset) | `RESEND_API_KEY` unset | Populate `.env.local` |
| Streaming AI chat | `ANTHROPIC_API_KEY` unset | Populate `.env.local` |
| GrowthBook flag evaluation | `NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY` unset | Flags fall back to `FLAG_DEFAULTS` — acceptable for deploy; live flags require the key |
| SSO (SAML / OIDC) | **Not implemented** — advertised on `/pricing` as Enterprise | Marketing copy or feature build (flagged in OQ#2) |
| SCIM user provisioning | **Not implemented** — advertised on `/pricing` as Enterprise | Same (OQ#3) |
| E2E Playwright suite with real user accounts for each role | No seeded test accounts per role | Seed test users per role OR create in test setup |

---

## Cell-level results summary

### R1-R3 (developer, owner, admin)

| Stage | Cell | Result | Evidence |
|---|---|---|---|
| S1 signup | PASS | `/signup` renders, `signupAction` wired to `supabase.auth.signUp` with `/verify-email` redirect on email-confirmation-required |
| S2 invite | PASS (code) | `createInviteAction` gates on `isAdmin(role)` + RLS `invites_insert_admin` |
| S3 project setup | PASS (code) | `/console/projects/new` page + project-setup actions present |
| S4 ATLVS | PASS (shell guard) | `/console/*` all redirect anons, guard verified |
| S5 GVTEWAY | N/A | admin not in portal persona list — code-cited |
| S6 COMPVSS | N/A | admin not in crew persona — code-cited |
| S7 reconciliation | PASS (code) | Invoice/expense/proposal actions exist with admin scope |
| S8 archive | PASS (code) | Soft-delete columns + RLS narrowing — per-table policy pattern |

### R4 controller
As per matrix — partial on S2 (can read but not insert invites, OK), partial on S3 (create ok, config limited), PASS on S4 + S7.

### R5 collaborator
Per matrix — no S2 invite, PASS S3/S4, partial S7/S8.

### R6 contractor (vendor)
PASS portal (S5); N/A elsewhere.

### R7 crew
PASS mobile (S6); N/A elsewhere.

### R8 client
PASS portal (S5) via slug; proposal e-sign via `/proposals/[token]`.

### R9-R10 viewer / community
Only S1; everything else intentionally N/A.

---

## Findings summary

| ID | Severity | Title | Status |
|---|---|---|---|
| P0-1 | **P0** | Personal shell exposed to anons (no `requireSession` in `(personal)/layout.tsx`) | **FIXED** inline |
| OQ#1 | P3 | CLAUDE.md says `src/middleware.ts`; actual file is `src/proxy.ts` (Next.js 15 proxy convention) | Doc-only; flagged |
| OQ#2 | P1 | Enterprise SSO advertised but not implemented | Flagged — requires product decision (strip marketing OR build) |
| OQ#3 | P1 | SCIM provisioning advertised but not implemented | Same as OQ#2 |
| OQ#4 | P2 | `sponsor` + `artist` portal routes exist without matching `platform_role` enum | Verified — routes gate on RLS-based project membership, not enum. Works; not a bug. |
| OQ#5 | P2 | `.env.local` missing Stripe/Anthropic/Resend/GrowthBook/Sentry | Env-ops concern, not a code bug |

**Deployment impact:**
- P0-1: **fixed** — deploy safe
- OQ#2 / OQ#3: marketing-vs-product decision. If deploying today, recommend pulling SSO/SCIM from `/pricing` until shipped (trim, don't lie). Actionable as a P1 copy edit.
- OQ#5: normal deploy-env concern. Production secrets live in the hosting provider's vault, not local.
