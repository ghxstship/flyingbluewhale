# Phase 2 — Flaw Registry

Each finding is individually addressable. Machine-readable sibling at `02-flaw-registry.json`.

---

## Critical (2)

### IK-038 · No off-box log shipping
- **Layer:** 1.9 Observability
- **Evidence:** `src/app/api/v1/**/*.ts` — 42 `console.log/error` calls. No log sink configured.
- **Blast radius:** zero forensic evidence on production incidents.
- **Reference violated:** Datadog / Honeycomb — structured logs with correlation IDs to a shipper.
- **Remediation:** Axiom / Logtail / BetterStack adapter OR Sentry structured events via `Sentry.captureMessage`.
- **Effort:** M
- **Deps:** IK-021 (already have request IDs, easy to enrich).

### IK-042 · No SCA / SBOM in CI
- **Layer:** 1.10 Security
- **Evidence:** `.github/workflows/ci.yml` — lint, typecheck, test, build. No `npm audit`, no Snyk, no OSV, no CycloneDX SBOM step.
- **Blast radius:** unknown vulnerabilities in 54 deps.
- **Reference violated:** SLSA level 1 (basic provenance).
- **Remediation:** add `npm audit --audit-level=high`, CycloneDX SBOM generation, OSV-Scanner in CI.
- **Effort:** S

---

## High (15)

### IK-010 · Passkey public_key stored as base64 text instead of bytea
- **Layer:** 1.2 Data
- **Evidence:** `supabase/migrations/20260417_000013_passkeys.sql` uses `bytea`, but `src/app/api/v1/auth/webauthn/register/verify/route.ts:58` writes `Buffer.from(publicKey).toString("base64")`.
- **Blast radius:** ~33% storage waste; base64 decode cost per auth.
- **Remediation:** keep bytea schema, pass `Buffer.from(publicKey)` directly (PostgREST encodes it).
- **Effort:** S

### IK-011 · No idempotency keys on mutating endpoints
- **Layer:** 1.3 API
- **Evidence:** 15/15 mutating routes lack `Idempotency-Key` handling. `src/lib/api.ts` has no helper.
- **Reference violated:** Stripe `Idempotency-Key` header (24h dedup window).
- **Remediation:** implement `withIdempotency()` middleware + `idempotency_keys` table.
- **Effort:** M

### IK-012 · 13/21 API routes bypass the response envelope
- **Layer:** 1.3 API
- **Evidence:** `grep "NextResponse.json" src/app/api` returns 13 non-helper responses with drift shapes: `{ok, comments}`, `{ok, data:{…}}`, `{ok, message, purgeAt}`.
- **Remediation:** require `apiOk`/`apiCreated` everywhere; add lint rule.
- **Effort:** S

### IK-017 · Permission checks live only in RLS (no application-layer defense-in-depth)
- **Layer:** 1.4 AuthZ
- **Evidence:** no mutating handler calls `has("write:projects")` or similar before Supabase.
- **Remediation:** add `assertCapability(session, "write:projects")` checks.
- **Effort:** L

### IK-022 · No per-tenant rate limits / quotas
- **Layer:** 1.5 Multi-Tenancy
- **Evidence:** `src/middleware.ts:31` uses hardcoded `RATE_BUDGETS`; `rate_limit_overrides` table never read.
- **Remediation:** per-principal (session.orgId / session.userId) keying in rate limiter; honor `rate_limit_overrides`.
- **Effort:** M

### IK-023 · No usage metering per tenant
- **Layer:** 1.5 Multi-Tenancy
- **Evidence:** no `ai_usage`, no `request_count`, no `storage_bytes` per org.
- **Remediation:** materialized view + per-request increment.
- **Effort:** L (deferred — pre-production)

### IK-026 · Purge cron has no retry / DLQ
- **Layer:** 1.6 Background
- **Evidence:** `supabase/functions/purge-deleted-accounts/index.ts:55-65` — failed deletes logged but not retried.
- **Remediation:** DLQ table `job_failures`, exponential backoff, next-run retry.
- **Effort:** M

### IK-027 · Long-running work inline in HTTP handlers
- **Layer:** 1.6 Background
- **Evidence:** `/api/v1/stripe/connect/onboarding` — 2 serialized external calls; no async.
- **Remediation:** background queue primitive (Supabase pg_cron + `job_queue` table, or Inngest).
- **Effort:** XL (deferred)

### IK-033 · No timeouts on external fetch()
- **Layer:** 1.8 Resilience
- **Evidence:** `src/lib/email.ts:21`, `src/app/api/v1/stripe/checkout/route.ts:37`, `src/lib/flags.ts:55` — no `signal:AbortSignal.timeout()`.
- **Remediation:** `src/lib/http.ts` wrapper that enforces default 5s timeout + retry.
- **Effort:** S

### IK-034 · No retry on transient external failures
- **Layer:** 1.8 Resilience
- **Remediation:** same wrapper — exponential backoff for idempotent reads.
- **Effort:** S (combined with IK-033)

### IK-039 · No metrics published
- **Layer:** 1.9 Observability
- **Remediation:** Vercel Analytics plus simple `lib/metrics.ts` that emits RED via Sentry metrics or OpenTelemetry.
- **Effort:** M

### IK-040 · No distributed tracing across deps
- **Layer:** 1.9 Observability
- **Remediation:** OpenTelemetry SDK or Sentry traces on Supabase / Anthropic / Stripe spans.
- **Effort:** M (deferred; Sentry partial today)

### IK-043 · No secret scanning in CI
- **Layer:** 1.10 Security
- **Remediation:** `gitleaks` pre-commit + CI step; `trufflehog` for PRs.
- **Effort:** S

### IK-044 · Input validation missing on 10/21 routes
- **Layer:** 1.10 Security
- **Remediation:** audit each route; add Zod schema via `parseJson` or UUID/search-param validation.
- **Effort:** M

### IK-052 · No per-PR preview environment
- **Layer:** 1.12 CI/CD
- **Remediation:** Vercel auto-provides; needs linking + PR comment action.
- **Effort:** S (deferred — Vercel deploy not yet wired)

### IK-059 · No per-request duration logging
- **Layer:** 1.14 Performance
- **Remediation:** middleware wrapper that times route handlers and logs `http.request.duration` metric.
- **Effort:** S

### IK-048 · No API contract tests
- **Layer:** 1.11 Testing
- **Evidence:** `e2e/api.spec.ts` only tests happy paths for auth & stripe webhook. No schema assertions.
- **Remediation:** contract spec per `/api/v1/**` route asserting envelope + status + schema.
- **Effort:** M

---

## Medium (30)

| ID | Title | Layer | Effort |
|---|---|---|---|
| IK-001 | `lib/db/resource.ts` `any`-cast god helper | 1.1 | M |
| IK-004 | Soft-delete inconsistent (10/45 tables) | 1.2 | M |
| IK-005 | No EXPLAIN evidence on hot paths | 1.2 | L |
| IK-006 | N+1 potential in list pages | 1.2 | L |
| IK-008 | No DB-level `statement_timeout` | 1.2 | S |
| IK-013 | No OpenAPI schema | 1.3 | M |
| IK-014 | No deprecation / sunset headers | 1.3 | S |
| IK-015 | Pagination not standardized | 1.3 | M |
| IK-018 | `updateSession()` on every request | 1.4 | S |
| IK-019 | Token rotation policy undocumented | 1.4 | S |
| IK-024 | No noisy-neighbor controls | 1.5 | M |
| IK-025 | Tenant deprovisioning not automated | 1.5 | M |
| IK-028 | Stripe webhook no event-id dedup | 1.6 | S |
| IK-030 | Marketing pages not statically regenerated | 1.7 | S |
| IK-031 | Hot-path DB reads uncached (TenantShell) | 1.7 | M |
| IK-035 | No circuit breaker | 1.8 | M |
| IK-036 | Health endpoint is not a readiness probe | 1.8 | S |
| IK-041 | Sentry `beforeSend` scrubbing incomplete | 1.9 | S |
| IK-045 | CORS allowlist not explicit | 1.10 | S |
| IK-046 | Privileged-action audit log (auth events) | 1.10 | M |
| IK-049 | Inverted test pyramid | 1.11 | L |
| IK-050 | No load tests | 1.11 | L |
| IK-053 | No SLSA provenance | 1.12 | M |
| IK-054 | No migration safety gate | 1.12 | S |
| IK-056 | No env validation at boot | 1.13 | S |
| IK-057 | Feature flags lack owner/expiry | 1.13 | S |
| IK-060 | No per-tenant cost telemetry | 1.14 | L |
| IK-061 | Middleware on every request (perf) | 1.14 | S |
| IK-062 | No ADR for recent architectural decisions | 1.15 | S |
| IK-063 | No runbooks | 1.15 | M |

## Low (17)

| ID | Title | Layer |
|---|---|---|
| IK-002 | `Shell.tsx` cohesion | 1.1 |
| IK-003 | `(auth)/actions.ts` multi-export | 1.1 |
| IK-007 | Read/write split absent (pre-production) | 1.2 |
| IK-009 | Table comment metadata incomplete | 1.2 |
| IK-016 | OAuth GET mutation non-idiomatic | 1.3 |
| IK-020 | Service-role key not least-privileged | 1.4 |
| IK-021 | Passkey *auth* flow half-built | 1.4 |
| IK-029 | Purge cron no distributed lock | 1.6 |
| IK-032 | No stampede protection | 1.7 |
| IK-037 | No graceful degrade when AI disabled | 1.8 |
| IK-047 | Key rotation procedure undocumented | 1.10 |
| IK-051 | `/m/tasks` e2e skipped | 1.11 |
| IK-055 | No canary via feature flags | 1.12 |
| IK-058 | No staging env | 1.13 |
| IK-064 | No generated API reference | 1.15 |

---

## Remediation surface summary

- **Critical + High target for Horizon 1:** 17 items (S/M effort mostly)
- **Medium deferred to Horizon 2:** 30 items
- **Low triaged to Horizon 3:** 17 items
