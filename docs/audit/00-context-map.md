# Phase 0 — Context Map

**Audit date:** 2026-04-18 · **Commit:** `7241811` · **Scope:** full stack

---

## 1. Repository map

Single Next.js 16 monorepo — no workspaces, no package splits.

| Area | Files |
|---|---|
| Route groups (App Router) | 283 dirs |
| API routes (`src/app/api/v1/**`) | 21 handlers |
| UI components | 59 `.tsx` |
| SQL migrations | 10 applied (`fbw_000` → `fbw_016`) |
| Supabase Edge Functions | 2 (`purge-deleted-accounts`, `seed-test-fixtures`) |
| E2E test specs | 11 files (110 tests) |
| Total dependencies | 54 (32 runtime, 22 dev) |

```
src/
  app/
    (marketing)    public SEO, unauthenticated
    (auth)         login, signup, reset, invite, magic-link
    (personal)     /me, any authed user
    (platform)     /console, internal ops     (ATLVS red)
    (portal)       /p/[slug]/*, external stakeholders (GVTEWAY blue)
    (mobile)       /m, field PWA              (COMPVSS yellow)
    api/v1         21 route handlers
    auth/          /auth/resolve, /auth/signout (legacy paths outside /api/v1)
    theme/         CHROMA BEACON 8-theme system
  components/      ui primitives + shells + domain components
  lib/
    supabase/      server + browser client, typed DB schema
    hooks/         useHotkeys, useUrlState, useUserPreferences
    db/            listOrgScoped / getOrgScoped helpers
    i18n/          locale + formatters
    webauthn.ts    passkey config
    ratelimit.ts   in-memory sliding-window
    api.ts         apiOk/apiCreated/apiError/parseJson
    auth.ts        getSession/requireSession/withAuth/has(Role)
    env.ts         typed env access
    branding.ts    safeBranding + brandingToCssVars
    flags.ts       GrowthBook fetch + local fallback
  middleware.ts    rate limiter + updateSession
supabase/
  migrations/      10 applied SQL files
  functions/       purge-deleted-accounts, seed-test-fixtures
instrumentation.ts Sentry server + edge init
sentry.*.ts        Sentry client/server/edge configs
```

---

## 2. Runtime topology

```
               ┌───────────────┐
               │  Vercel Edge  │ middleware.ts (rate limit + session)
               └───────┬───────┘
                       │
  ┌────────────────────┼────────────────────────────────┐
  │                    │                                │
  ▼                    ▼                                ▼
┌──────────┐   ┌────────────────┐            ┌──────────────────┐
│  /ssr    │   │  /api/v1/*     │            │  /api/v1/webhooks │
│  pages   │   │  route handlers│◄───────────┤  stripe (HMAC)   │
└────┬─────┘   └────────┬───────┘            └──────────────────┘
     │                  │                              ▲
     └──────────┬───────┴──────────┐                   │
                ▼                  ▼                   │
         ┌──────────────┐   ┌─────────────┐   ┌────────┴──────┐
         │  Supabase    │   │  Anthropic  │   │  Stripe       │
         │  Postgres    │   │  Claude API │   │  Payments +    │
         │  + Auth +    │   │  (streaming)│   │  Connect      │
         │  Storage +   │   └─────────────┘   └───────────────┘
         │  Edge Fns    │
         └──────────────┘
                ▲
                │
         ┌──────┴──────────────────┐
         │  Daily cron →           │
         │  purge-deleted-accounts │
         └─────────────────────────┘
```

### Services

| Service | Runtime | Origin |
|---|---|---|
| Web (Next 16 App Router, React 19, React Compiler) | Node (serverless fn per route on Vercel) | `src/app/**` |
| Middleware (rate limit, session refresh, request ID) | Edge | `src/middleware.ts` |
| Background: account purge | Supabase Edge Function, daily cron | `supabase/functions/purge-deleted-accounts` |
| Background: test fixtures | Supabase Edge Function, manual token-gated | `supabase/functions/seed-test-fixtures` |
| Database | Supabase Postgres 14.5 (managed) | `xrovijzjbyssajhtwvas` |
| Auth | Supabase Auth (bcrypt + WebAuthn + OAuth) | |
| Storage | Supabase Storage (5 buckets: advancing, receipts, proposals, credentials, branding) | |
| Observability | Sentry (client + server + edge), GrowthBook (optional) | |

### Regions

- Database: Supabase default (US East). No read replicas.
- Web: Vercel default (multi-region via CDN, SSR on IAD by default).
- No explicit region pinning.

---

## 3. Dependency graph

Top-level runtime packages:

- `next@16.2.1` · `react@19.2.4` · `react-dom@19.2.4`
- `@supabase/ssr@0.10.2` · `@supabase/supabase-js@2.103.3`
- `@anthropic-ai/sdk@0.88.0`
- `@sentry/nextjs@10.49.0`
- `@growthbook/growthbook-react@1.6.5`
- `@tanstack/react-table`, `@tanstack/react-virtual`
- `@radix-ui/*` (12 packages)
- `cmdk@1`, `sonner@2`, `framer-motion@12`, `@tiptap/*`
- `@simplewebauthn/server`, `@simplewebauthn/browser`
- `zod@4.3.6`

No peer-dep conflicts resolved cleanly (required `--legacy-peer-deps` for Sentry + WebAuthn + GrowthBook). Lockfile committed.

**Known CVE posture:** not yet scanned in CI (finding IK-028).

---

## 4. Data topology

**Tenancy model:** shared-schema, `org_id`-scoped via RLS. Every business table has `org_id uuid not null references orgs(id)`.

**Tables:** 45 (43 business + 2 WebAuthn + 1 `user_preferences`).

### Key tables (by column count — proxy for domain weight)

| Table | Cols | Indexes | Soft-delete? |
|---|---|---|---|
| `proposals` | 25 | 6 | ✓ |
| `invoices` | 18 | 6 | ✓ |
| `deliverables` | 17 | 8 | ✓ |
| `event_guides` | 15 | 5 | ✓ |
| `projects` | 15 | 5 | ✓ |
| `webauthn_challenges` | 14 | 3 | — |
| `purchase_orders` | 14 | 7 | ✓ |
| `leads` | 13 | 4 | — |
| `vendors` | 13 | 2 | ✓ |
| `audit_log` | 13 | 5 | — (append-only) |

**Row-count order of magnitude:** all tables currently under 10⁴ rows (pre-production). Scale targets unspecified.

**Replication:** none (managed Supabase defaults). No read replicas, no CDC.

### RLS coverage

Every `public.*` table has RLS enabled. Policies gated on `is_org_member(org_id)` + `has_org_role(org_id, text[])` (SECURITY DEFINER helpers). Verified via `fbw_008_business_rls.sql`.

### SSOT triggers (applied `fbw_010`)

- `tg_set_updated_at()` — attached to every mutable table
- `tg_audit_log()` — attached to every tenant-scoped table; writes before/after jsonb + request_id + actor_email

---

## 5. Deployment topology

| Environment | Provider | URL | Notes |
|---|---|---|---|
| Production | Vercel | `https://flyingbluewhale.app` | Not yet deployed |
| Preview | Vercel (per-PR) | `*.vercel.app` | Not yet wired |
| Local dev | `npm run dev` | `http://localhost:3000` | |

**CI/CD:** `.github/workflows/ci.yml`
- Stages: lint, typecheck, vitest, playwright, build
- Secrets: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL`
- Playwright uploads trace on failure
- No SBOM, no SAST/SCA, no container scan

**Deployment gates:** none enforced.

---

## 6. Observability footprint

| Signal | Where | Status |
|---|---|---|
| Structured logs | `console.*` only, not shipped | **Gap** (IK-021) |
| Metrics | None | **Gap** (IK-022) |
| Traces | Sentry `tracesSampleRate: 0.1` | Partial |
| Errors | Sentry client + server + edge | Configured but DSN not set in env |
| Alerts | None | **Gap** (IK-023) |
| PII scrubbing | `beforeSend` strips UUIDs from URLs | Basic |
| Release tagging | `SENTRY_RELEASE` env supported, not set | **Gap** |

Request IDs propagate via middleware → response header `x-request-id` and Postgres `set_config('app.request_id', ...)` → audit_log. End-to-end correlation possible but not yet consumed by any log aggregator.

---

## 7. Identity and tenancy

**AuthN:** Supabase Auth
- Email + password (bcrypt, 12 rounds default)
- OAuth: Google / GitHub / Microsoft (route at `/api/v1/auth/oauth`)
- Magic links (`/magic-link/[token]`)
- WebAuthn / passkeys (`user_passkeys`, `webauthn_challenges`)
- Session: JWT in httpOnly cookie, refreshed by middleware `updateSession()` on every non-static request

**AuthZ:**
- 10 platform_roles: developer, owner, admin, controller, collaborator, contractor, crew, client, viewer, community
- 4 project_roles: creator, collaborator, viewer, vendor
- RBAC via `has_org_role(org_id, text[])` in RLS policies
- No ABAC, no ReBAC
- Tenant boundary enforced at DB (RLS) — **no single application-layer check exists for `org_id`; all correctness flows through RLS** (IK-011 surfaces risk if RLS is disabled by error)

**Service-to-service:**
- Edge Functions use `SUPABASE_SERVICE_ROLE_KEY`
- Stripe webhook: HMAC-SHA256 signature verification (no SDK), 300ms tolerance
- Anthropic: bearer `ANTHROPIC_API_KEY` in server-only env

**Secrets:** Vercel env vars (no Vault integration). `.env.local` gitignored.

---

## 8. Compliance surface

| Regulation | Scope | Status |
|---|---|---|
| GDPR — right to access | `/api/v1/me/export` returns user-scoped JSON bundle | ✓ Shipped |
| GDPR — right to erasure | `/api/v1/me/delete` soft-deletes + 30-day purge via Edge Function | ✓ Shipped |
| GDPR — consent | `CookieConsent` dialog (essential/analytics/marketing); Sentry gated on consent | ✓ Shipped |
| SOC-2 — access control | RLS + audit_log + memberships; no SSO/SCIM yet | Partial |
| SOC-2 — audit trail | `audit_log` table written by trigger on every tenant row mutation | ✓ Shipped |
| SOC-2 — incident response | No runbook | **Gap** (IK-045) |
| PCI | Out of scope — Stripe Checkout hosted | N/A |
| HIPAA | Out of scope | N/A |

### PII fields identified

- `users.email`, `users.name`, `users.avatar_url`
- `clients.contact_email`, `clients.contact_phone`
- `vendors.contact_email`, `vendors.contact_phone`
- `crew_members.email`, `crew_members.phone`
- `proposal_signatures.signer_email`, `signer_ip`
- `webauthn_challenges.email`
- `audit_log.actor_email`

All PII fields are within the RLS tenant boundary. No PII in URLs (UUIDs only).

---

## 9. Known architectural limits at time of audit

1. No queue system (workers are direct HTTP + daily cron). Sync work is the norm.
2. No background job orchestration beyond the purge cron.
3. No read replicas; all reads hit primary.
4. No caching layer (no Redis, no CDN cache-control headers set for API).
5. No OpenAPI / typed client generation; internal API consumed ad hoc.
6. Single region deployment implied by Supabase default.

---

**Phase 0 output complete.** Artifacts: this document. Proceed to Phase 1.
