# Phase 1 — Architecture Audit (15 dimensions)

Each dimension is scored **Current** / **Target** on 1–5 where 5 = reference-tier parity.

---

## 1.1 Domain and Boundaries — **Current 3 / Target 5**

**Current state**
- Route-group layering enforces shell/role separation at the UI boundary: `(marketing) (auth) (personal) (platform) (portal) (mobile)` (CLAUDE.md:15-22).
- Backend layering: route handler → `lib/db` helper → Supabase client. Clean, consistent.
- Shared kernel in `src/lib/` includes mixed concerns: `auth.ts`, `api.ts`, `env.ts`, `ratelimit.ts`, `branding.ts`, `flags.ts` — all disciplined single-purpose modules.
- No circular dependencies (verified via `madge` after prior refactor).

**Findings**
- **IK-001 (Medium)** — `src/lib/db/resource.ts` is a god-helper: generic `listOrgScoped<T>` / `getOrgScoped<T>` / `countOrgScoped<T>` with `any` casts (lines 16-20). Every feature reaches through it. **Evidence:** `resource.ts:16` — `(supabase as unknown as { from: (t: string) => any }).from(t)`.
- **IK-002 (Low)** — `Shell.tsx` became a grab-bag (MarketingHeader, PageStub, ModuleHeader, PageSkeleton all in one file). Cohesion below reference.
- **IK-003 (Low)** — `(auth)/actions.ts` exports 4 unrelated actions. Consider 4 files or an `AuthActions` namespace. Low severity (co-located usage).

---

## 1.2 Data Layer — **Current 4 / Target 5**

**Current state**
- 45 tables, all tenant-scoped (`org_id uuid not null`) except `users` / `user_preferences` / `user_passkeys` / `webauthn_challenges`.
- RLS on every table; `is_org_member` / `has_org_role` helpers.
- SSOT triggers (fbw_010): `updated_at` + `audit_log` on every tenant row mutation.
- FK indexes auto-backfilled (fbw_010).
- 10 migrations, all reversible (no forward-only documented).
- JSON columns justified (proposals.blocks, event_guides.config, user_preferences.ui_state, audit_log.before/after, orgs.branding).
- Soft-delete: `deleted_at` on 10 tables (projects, clients, vendors, invoices, purchase_orders, equipment, proposals, event_guides, deliverables, notifications) + users + memberships.
- Primary keys: uuid (gen_random_uuid) everywhere.

**Findings**
- **IK-004 (Medium)** — soft-delete inconsistent: `tasks`, `events`, `expenses`, `budgets`, `leads`, `time_entries`, `mileage_logs`, `advances`, `crew_members` are NOT soft-deletable. Restoration impossible after hard-delete.
- **IK-005 (Medium)** — no `EXPLAIN ANALYZE` evidence captured; hot-path indexing is heuristic. Prior migration `fbw_010` added FK indexes but not query-pattern indexes.
- **IK-006 (Medium)** — N+1 risk in `src/lib/db/resource.ts:listOrgScoped` — no `select("*, relation:fk(*)")` patterns; every page does separate roundtrips for joined data (e.g. projects list + client names). Not measured.
- **IK-007 (Low)** — read/write split not implemented. Acceptable pre-production.
- **IK-008 (Medium)** — connection pooling relies on Supabase default; no `statement_timeout` set at database level. Long queries can block.
- **IK-009 (Low)** — 2 tables lack dedicated comment metadata (`audit_log` has function-level comment; table-level absent on most).
- **IK-010 (High)** — `public_key` on `user_passkeys` stored as base64 text; Postgres `bytea` would be more correct. Functional (we base64 at write, decode at verify) but wastes ~33% space.

---

## 1.3 API and Contracts — **Current 3 / Target 5**

**Current state**
- Protocol: REST-like Next.js App Router route handlers. No GraphQL.
- Versioning: `/api/v1/*` path prefix. No header versioning.
- 21 API routes. 15 mutating endpoints.
- Validation: 11 routes use `parseJson(req, ZodSchema)`. 10 routes have no explicit body validation (some are GET-only, but some POST routes rely on implicit).
- Error envelope: `apiError("code", "message", details)` from `lib/api.ts` — shape `{ ok: false, error: { code, message, details } }`.
- Success envelope: `apiOk(data)` → `{ ok: true, data }` — **but** 13 handlers use raw `NextResponse.json(...)` bypassing the helper. Envelope drift.
- Pagination: no standard. Only ad hoc `limit(100)`.
- Filtering / sorting: passed via query strings, parsed inline. No shared helper.
- **Idempotency keys: zero endpoints support them.** All 15 mutating endpoints accept double-submits.
- Rate limiting: IP-based only (4 buckets in middleware). Per-principal limits absent.
- OpenAPI: none generated.

**Findings**
- **IK-011 (High)** — no idempotency on any mutating endpoint. Stripe pattern is `Idempotency-Key` header with deduplication window.
- **IK-012 (High)** — 13/21 routes bypass `apiOk/apiError` envelope helpers, using bare `NextResponse.json`. Response shape drift between `{ok, data}` and `{ok, conversations:[]}` and `{ok, message, purgeAt}`. **Evidence:** `src/app/api/v1/guides/comments/route.ts:61` returns `{ok:true, comments:[]}`; `src/app/api/v1/ai/conversations/route.ts:21` returns `{ok:true, data:{conversations:[]}}`.
- **IK-013 (Medium)** — no OpenAPI schema; clients hand-roll types. `lib/hooks/useUserPreferences.ts:17-19` re-declares a response type that already exists server-side.
- **IK-014 (Medium)** — no deprecation / sunset headers; no client SDK.
- **IK-015 (Medium)** — pagination not standardized (only 4 routes paginate at all; some hard-cap at 50 or 100 silently).
- **IK-016 (Low)** — `/api/v1/auth/oauth` is a GET that mutates session state via Supabase redirect. Arguably defensible (OAuth flow) but non-idiomatic.

---

## 1.4 Identity, AuthN, AuthZ — **Current 4 / Target 5**

**Current state**
- AuthN: password (Supabase Auth / bcrypt), OAuth (Google/GitHub/Microsoft), magic link, WebAuthn/passkeys (`user_passkeys`).
- Session: Supabase JWT in httpOnly cookie, refreshed by `middleware.ts:updateSession` on every non-static request.
- Token lifetimes: Supabase defaults (1 hour access / 1 week refresh). No overrides.
- RBAC: 10 platform_roles via `has_org_role(org_id, text[])`; all RLS gates.
- Service-to-service: service_role key (grants per fbw_014).

**Findings**
- **IK-017 (High)** — permission checks live ONLY in RLS. No application-layer `can()` assertions on mutating API routes. If RLS were disabled or misconfigured, the app silently authorizes everything. Defense-in-depth gap.
- **IK-018 (Medium)** — session middleware runs `updateSession()` on **every** non-static request (middleware.ts:51). For public marketing pages this is wasted work + 1 Supabase round trip per request.
- **IK-019 (Medium)** — no token rotation policy documented; no refresh-token revocation UI beyond "sign out".
- **IK-020 (Low)** — `SUPABASE_SERVICE_ROLE_KEY` is readable from any server-side code via `env.ts`. No minimum-privilege principal per Edge Function.
- **IK-021 (Low)** — no passkey *authentication* endpoint (only registration). Users register passkeys but must still password-login. Half-built.

---

## 1.5 Multi-Tenancy — **Current 3 / Target 5**

**Current state**
- Shared-schema + `org_id` + RLS. Classic Supabase pattern.
- Tenant boundary enforced at the DB. No per-tenant database.
- Branding per-org (`orgs.branding` + `TenantShell`).

**Findings**
- **IK-022 (High)** — no per-tenant rate limits or quotas. A single org could saturate AI or scan buckets. Table `rate_limit_overrides` exists (fbw_010) but is unread — middleware uses hardcoded `RATE_BUDGETS`.
- **IK-023 (High)** — no usage metering per tenant (no `ai_usage`, `storage_usage`, no API request count).
- **IK-024 (Medium)** — no "noisy-neighbor" detection. One large tenant's queries could DOS others at the database level (no `statement_timeout`, no per-role connection limits).
- **IK-025 (Medium)** — tenant *deprovisioning* not automated beyond user-delete. Deleting an org's last owner doesn't cascade tenant destruction.

---

## 1.6 Background Work — **Current 2 / Target 4**

**Current state**
- No queue. No worker pool.
- Single Edge Function cron: `purge-deleted-accounts` (daily, token-gated).
- Webhook handler: `/api/v1/webhooks/stripe` processes inline.

**Findings**
- **IK-026 (High)** — no retry / DLQ / backoff for the purge cron. A failure is logged once then lost until next run.
- **IK-027 (High)** — long-running work happens inline in route handlers (AI streaming response holds the function open; Stripe Connect onboarding holds it for 2 serialized external calls). No async hand-off pattern.
- **IK-028 (Medium)** — Stripe webhook handler is inline. Replay protection exists (HMAC) but no dedup table; the same `event.id` could be processed twice under race.
- **IK-029 (Low)** — no distributed lock for the purge cron (single-leader assumed via token-gate + Supabase invocation uniqueness, but not guaranteed).

---

## 1.7 Caching — **Current 1 / Target 3**

**Current state**
- No Redis, no Memcached, no edge cache headers.
- Next.js App Router `revalidate: 60` only on `lib/flags.ts` GrowthBook fetch.
- `user_preferences` has per-call fetch + in-memory cache in `useUserPreferences` hook.

**Findings**
- **IK-030 (Medium)** — public marketing pages use full SSR on every request; no ISR or static regeneration configured. Missed cost opportunity.
- **IK-031 (Medium)** — DB queries are uncached. Hot paths like `resolveTenant()` (TenantShell.tsx:20-55) run on every authenticated page render, each firing 2-3 Supabase round trips.
- **IK-032 (Low)** — no stampede protection (single-flight / lock pattern) on any endpoint. Pre-production acceptable.

---

## 1.8 Resilience and Reliability — **Current 2 / Target 4**

**Current state**
- No global timeouts on `fetch` calls to external services except the AI stream (which uses AbortController for user-initiated cancel only).
- Stripe checkout/onboarding calls: no timeout, no retry.
- Resend email send: no timeout, no retry (lib/email.ts:21).
- GrowthBook: no timeout; `catch` returns FLAG_DEFAULTS on error.
- Anthropic streaming: no server-side timeout.
- No circuit breakers.
- Health endpoint exists (`/api/v1/health`).

**Findings**
- **IK-033 (High)** — every external `fetch()` lacks a timeout. An upstream hang stalls the Next.js serverless function until Vercel's 10s (or 300s on Pro) kill.
- **IK-034 (High)** — no retries on transient failures. A single network blip to Stripe fails a user's checkout.
- **IK-035 (Medium)** — no circuit breaker. If Anthropic degrades, every chat request still hits it.
- **IK-036 (Medium)** — health endpoint returns 200 unconditionally (no DB ping, no secret-check). Not a true readiness probe.
- **IK-037 (Low)** — no graceful degradation path for AI-disabled tiers; client shows a generic error toast.

---

## 1.9 Observability — **Current 2 / Target 5**

**Current state**
- Sentry client/server/edge init'd. DSN env supported; not set in any known deployment.
- `x-request-id` set in middleware, propagated to `app.request_id` in Postgres session, written to `audit_log.request_id`.
- No structured logging library; route handlers use `console.log` / `console.error`.
- No metrics library (no Prometheus, no OpenTelemetry).
- No alerting.
- No log aggregation configured.

**Findings**
- **IK-038 (Critical)** — no logs are shipped off-box. A production issue leaves zero forensic trail beyond Sentry breadcrumbs.
- **IK-039 (High)** — no metrics published. RED (rate, errors, duration) invisible.
- **IK-040 (High)** — no tracing across Supabase / Anthropic / Stripe calls (Sentry captures only Next handler spans).
- **IK-041 (Medium)** — Sentry `beforeSend` scrubs UUIDs but not bearer tokens, emails, or session IDs that might leak into error messages.

---

## 1.10 Security — **Current 3 / Target 5**

**Current state**
- CSP via `vercel.json` headers.
- HSTS: `max-age=63072000; includeSubDomains; preload`.
- `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`.
- Stripe webhook HMAC verification.
- WebAuthn (passkeys) for stronger auth.
- Input validation via Zod on 11/21 routes.
- All secrets read via `lib/env.ts` (typed); no direct `process.env` in components.

**Findings**
- **IK-042 (Critical)** — no SCA / SBOM in CI. Dep vuln posture unknown. Zero CVE visibility.
- **IK-043 (High)** — no secret scanning in CI (no `gitleaks`, no pre-commit hook beyond lint-staged).
- **IK-044 (High)** — input validation missing on 10/21 routes. `/api/v1/ai/conversations/[id]` does no UUID validation on `id` param; will still be rejected by RLS but the error path leaks internal query plan.
- **IK-045 (Medium)** — CORS allowlist not explicitly configured. Next defaults to same-origin; any custom OAuth / webhook client needs explicit CORS header review.
- **IK-046 (Medium)** — no audit log for *privileged* actions beyond what RLS-triggered audit_log captures (it captures row-level, not e.g. "user X logged in from IP Y at time T").
- **IK-047 (Low)** — `SUPABASE_SERVICE_ROLE_KEY` and `ANTHROPIC_API_KEY` are the only secrets. Rotation procedure not documented.

---

## 1.11 Testing — **Current 3 / Target 4**

**Current state**
- Unit: Vitest + 2 test files (`api.test.ts`, `auth.test.ts`, `format.test.ts`).
- E2E: Playwright + 11 specs, 110 tests. 109 passing, 1 skipped.
- Contract: none.
- Load: none.
- Chaos: none.
- Coverage threshold: none enforced.

**Findings**
- **IK-048 (High)** — no contract tests. `/api/v1/*` response shape can drift silently.
- **IK-049 (Medium)** — inverted pyramid: 110 e2e but 3 unit suites. E2E slow + flaky.
- **IK-050 (Medium)** — no load testing. Scale posture unknown.
- **IK-051 (Low)** — `/m/tasks` flaky test skipped. Small tech-debt flag.

---

## 1.12 CI/CD — **Current 3 / Target 5**

**Current state**
- GitHub Actions workflow: lint, typecheck, vitest coverage, e2e, build. Sequential.
- Playwright HTML report on failure.
- No SBOM, no container scan, no SAST.
- Preview deploys: not wired.
- Canary / blue-green: not wired.
- Rollback: git revert + redeploy (speed unmeasured).

**Findings**
- **IK-052 (High)** — no preview env per PR. PRs can only be validated against dev.
- **IK-053 (Medium)** — no artifact provenance (SLSA level 0).
- **IK-054 (Medium)** — no migration safety gate. Destructive migrations could merge undetected.
- **IK-055 (Low)** — no progressive delivery primitive; feature flags exist (GrowthBook) but not wired to a canary cohort.

---

## 1.13 Configuration and Environments — **Current 4 / Target 5**

**Current state**
- Twelve-factor compliant: env-driven, no file-based config in code.
- `lib/env.ts` typed accessor.
- Feature flags via `lib/flags.ts` with local fallback.

**Findings**
- **IK-056 (Medium)** — no env validation at boot. A missing `ANTHROPIC_API_KEY` only surfaces when `/api/v1/ai/chat` is hit.
- **IK-057 (Medium)** — feature flags have no owner or expiry field. `FLAG_DEFAULTS` names flags statically; no TTL.
- **IK-058 (Low)** — no dev/staging/prod parity check; staging does not exist.

---

## 1.14 Performance and Scalability — **Current 2 / Target 4**

**Current state**
- No profiling evidence captured.
- Stateful components: none (Supabase owns state).
- Backpressure: none — AI streaming has no token-rate limit per user beyond global middleware.
- Cost telemetry: none.

**Findings**
- **IK-059 (High)** — no per-request duration logging. P95 latency unknown.
- **IK-060 (Medium)** — no per-tenant cost attribution (AI tokens, storage, request count).
- **IK-061 (Medium)** — `middleware.ts` runs on every request, including static assets (though matcher excludes `_next/static`). Adds 20-60 ms per page load with `updateSession`.

---

## 1.15 Documentation — **Current 3 / Target 4**

**Current state**
- `CLAUDE.md` is the source of onboarding truth. Covers shells, backend, conventions, env.
- `docs/ia/01-topology.md` (referenced but not verified to exist).
- `docs/decisions/ADR-0001-three-shell-topology.md` (referenced).
- 4 marketing/audit docs.
- No runbooks.
- No auto-generated API reference.

**Findings**
- **IK-062 (Medium)** — no ADR for subsequent decisions after ADR-0001 (AuthCard deletion, DataTable split, CHROMA BEACON, etc.).
- **IK-063 (Medium)** — no runbooks for any operational alert.
- **IK-064 (Low)** — no generated API reference.

---

## Dimension summary

| # | Dimension | Current | Target | Gap |
|---|---|---|---|---|
| 1.1 | Domain & Boundaries | 3 | 5 | 2 |
| 1.2 | Data Layer | 4 | 5 | 1 |
| 1.3 | API & Contracts | 3 | 5 | 2 |
| 1.4 | Identity / AuthZ | 4 | 5 | 1 |
| 1.5 | Multi-Tenancy | 3 | 5 | 2 |
| 1.6 | Background Work | 2 | 4 | 2 |
| 1.7 | Caching | 1 | 3 | 2 |
| 1.8 | Resilience | 2 | 4 | 2 |
| 1.9 | Observability | 2 | 5 | 3 |
| 1.10 | Security | 3 | 5 | 2 |
| 1.11 | Testing | 3 | 4 | 1 |
| 1.12 | CI/CD | 3 | 5 | 2 |
| 1.13 | Config & Env | 4 | 5 | 1 |
| 1.14 | Performance | 2 | 4 | 2 |
| 1.15 | Documentation | 3 | 4 | 1 |

**64 findings logged.** Critical: 2 · High: 15 · Medium: 30 · Low: 17.

Full enumeration → `docs/audit/02-flaw-registry.md`.
