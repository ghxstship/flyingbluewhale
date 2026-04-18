# Phase 4 — Remediation Roadmap

Three horizons. Each item is an executable unit of work with DoD + acceptance + rollback + metric.

**Horizon 1 (0-30 days) — Stabilize.** Non-negotiable: close all Critical + high-impact High findings.
**Horizon 2 (30-90 days) — Normalize.** Contract standardization, observability parity, testing uplift.
**Horizon 3 (90-180 days) — Future-proof.** Scalability, platform primitives, developer productivity.

---

## Horizon 1 — Stabilize (P5 items executed this session)

### H1-01 · Off-box log shipping — IK-038
- **DoD:** structured logger in `lib/log.ts`; every `console.*` replaced; events shipped to Sentry as `captureMessage({level, request_id, actor, route, latency_ms})`. CI asserts zero `console.log` in `src/app/api/**`.
- **Acceptance:** 100 synthetic errors in staging → 100 visible in Sentry with request_id correlation.
- **Rollback:** revert logger; keep Sentry disabled.
- **Metric:** "P95 time-to-detect" on error = <5 min (alerting on Sentry issue creation).
- **This session:** logger primitive shipped; ESLint rule added.

### H1-02 · SCA + SBOM in CI — IK-042
- **DoD:** CI step `npm audit --audit-level=high` blocks on critical/high CVEs; CycloneDX SBOM artifact attached to every release.
- **Acceptance:** planted known-vulnerable dep → CI fails with CVE id in output.
- **Rollback:** soft-warn only.
- **Metric:** "Critical CVE MTTD" = CI runtime.
- **This session:** workflow step added.

### H1-03 · Idempotency middleware — IK-011
- **DoD:** `withIdempotency(handler)` wraps every mutating `/api/v1/*` route; reads `Idempotency-Key` header; stores response body hash in `idempotency_keys` table with 24h TTL; returns cached response on re-submit.
- **Acceptance:** POST the same body twice with same key → identical response, second request short-circuits under 20 ms.
- **Rollback:** feature flag `idempotency_v1`.
- **Metric:** dedup hit rate = reported.
- **This session:** migration + helper + applied to 5 representative mutating routes.

### H1-04 · External-call hardening — IK-033 / IK-034 / IK-035
- **DoD:** `lib/http.ts` wrapper with default 5s timeout, 3x exponential retry on idempotent reads (429/5xx/network), circuit breaker per host (half-open after 30s).
- **Acceptance:** simulate 8s Stripe hang → request aborts at 5s; simulate 500 from Resend → 3 retries over backoff.
- **Rollback:** revert wrapper; `fetch` stays.
- **Metric:** external-call P95 bounded; no function timeouts from upstream hangs.
- **This session:** `lib/http.ts` shipped; applied to Stripe + Resend + GrowthBook.

### H1-05 · Response envelope enforcement — IK-012
- **DoD:** every `/api/v1/*` route calls `apiOk` / `apiCreated` / `apiError` (no raw `NextResponse.json`). ESLint `no-restricted-syntax` guards against regression.
- **Acceptance:** `grep "NextResponse.json" src/app/api` → zero matches outside `lib/api.ts`.
- **Rollback:** N/A (internal consistency).
- **Metric:** 100% route envelope compliance.
- **This session:** sweep + lint rule.

### H1-06 · Per-principal rate limiting — IK-022
- **DoD:** `middleware.ts` keys on `session.userId` (or org) when authenticated; honors `rate_limit_overrides`. Preserves IP fallback for anon.
- **Acceptance:** authenticated user hits 31 AI requests/min → 429 at #31.
- **Rollback:** revert to IP-only.
- **Metric:** per-principal 429 rate visible.
- **This session:** middleware upgrade.

### H1-07 · Input validation coverage — IK-044
- **DoD:** every mutating route uses `parseJson(req, Schema)`; GET params validated with `z.object({}).safeParse(Object.fromEntries(searchParams))` helper.
- **Acceptance:** fuzz each endpoint → zero 5xx from body misparse.
- **Rollback:** remove schema (downgrade to manual parsing).
- **Metric:** 100% mutating routes schema-validated.
- **This session:** sweep.

### H1-08 · Per-request duration logging — IK-059
- **DoD:** middleware wraps response with `Server-Timing: app;dur=N` header; logger emits `http.request.duration_ms`.
- **Acceptance:** `curl -sI /api/v1/health` shows `server-timing`.
- **Rollback:** remove header.
- **Metric:** P95 route latency per endpoint queryable.
- **This session:** middleware upgrade.

### H1-09 · Health + readiness + liveness probes — IK-036
- **DoD:** `/api/v1/health/liveness` (200 static), `/api/v1/health/readiness` (200 iff DB reachable + env complete).
- **Acceptance:** kill Supabase creds → readiness 503, liveness 200.
- **Rollback:** remove.
- **Metric:** probe latency P95 < 100 ms.
- **This session:** split endpoint.

### H1-10 · API contract tests — IK-048
- **DoD:** Playwright `e2e/contract.spec.ts` hits every `/api/v1/*` route with canonical body and asserts `{ok, data|error}` schema + status.
- **Acceptance:** intentionally break one route shape → contract test fails.
- **Rollback:** delete file.
- **Metric:** contract-test pass rate = 100% in CI.
- **This session:** spec shipped.

### H1-11 · Secret scanning — IK-043
- **DoD:** `gitleaks` CI step; pre-push hook.
- **Acceptance:** commit containing fake AWS key → CI fails.
- **Rollback:** disable step.
- **Metric:** time-to-detect leaked secret = CI runtime.
- **This session:** CI step added.

### H1-12 · Readiness probe improvement — IK-036
Merged into H1-09.

### H1-13 · Passkey public_key bytea — IK-010
- **DoD:** write `Buffer.from(publicKey)` without base64 encode; verify endpoint decodes from bytea.
- **Acceptance:** existing passkeys re-verify (migration re-encodes).
- **Rollback:** base64 encode path kept behind flag.
- **Metric:** passkey row size reduced ~33%.
- **This session:** fix + backfill migration.

### H1-14 · Session middleware scope — IK-018
- **DoD:** `updateSession()` no longer runs on marketing paths (`(marketing)/*` + `/api/v1/*` public GETs).
- **Acceptance:** marketing TTFB drops by >20 ms in P95.
- **Rollback:** revert matcher.
- **Metric:** marketing P95 TTFB.
- **This session:** middleware matcher refined.

### H1-15 · OpenAPI schema + drift test — IK-013
- **DoD:** `scripts/gen-openapi.ts` emits `openapi.json` from route declarations; CI asserts it matches.
- **Acceptance:** add route without updating → CI fails.
- **Rollback:** delete script.
- **Metric:** OpenAPI schema checked in CI.
- **This session:** spec stub.

---

## Horizon 2 — Normalize (30-90 days; deferred to ADR triage)

| # | Flaw | Summary |
|---|---|---|
| H2-01 | IK-031 | Cache `resolveTenant()` reads per request (React cache) |
| H2-02 | IK-039 | Publish RED metrics via Vercel Analytics + derived Sentry metrics |
| H2-03 | IK-040 | OpenTelemetry span wrapping for Supabase + Anthropic + Stripe |
| H2-04 | IK-015 | Standard pagination (`cursor` + `limit` + `X-Total-Count`) helper |
| H2-05 | IK-028 | Stripe event-id dedup table |
| H2-06 | IK-041 | Tighten Sentry beforeSend PII scrubbing (tokens, emails, session IDs) |
| H2-07 | IK-046 | Audit log for privileged auth actions (login, password reset, 2FA add/remove) |
| H2-08 | IK-030 | ISR on `/solutions/**`, `/blog/**`, `/compare/**`, `/guides/**` |
| H2-09 | IK-057 | Feature flag metadata: owner + expiry required at registration |
| H2-10 | IK-017 | Application-layer `assertCapability()` on mutating routes |
| H2-11 | IK-049 | Unit test uplift for `lib/` modules (target 80% coverage) |
| H2-12 | IK-062 | ADR backfill for decisions 2-10 (post-three-shell) |

---

## Horizon 3 — Future-proof (90-180 days)

| # | Flaw | Summary |
|---|---|---|
| H3-01 | IK-023 | Per-tenant usage metering (ai_tokens, requests, bytes stored) |
| H3-02 | IK-027 | Background job primitive (`job_queue` + pg_cron + retries + DLQ) |
| H3-03 | IK-050 | Load testing with k6 (baseline + per-deploy) |
| H3-04 | IK-005 | Capture `EXPLAIN ANALYZE` baselines for hot queries |
| H3-05 | IK-024 | `statement_timeout` per role + connection pool isolation |
| H3-06 | IK-052 | Vercel preview per PR + Lighthouse CI comment |
| H3-07 | IK-053 | SLSA L2+ provenance (signed build attestation) |
| H3-08 | IK-055 | Canary rollout via feature flag cohorts |
| H3-09 | IK-058 | Staging environment with production data anonymizer |
| H3-10 | IK-063 | Runbooks per alert family |

---

## Execution rules (from the contract)

1. One remediation per PR.
2. Every PR links a flaw ID + roadmap item.
3. Every PR includes migration (if applicable) + tests + observability + docs.
4. Breaking changes behind version bump / flag with dated sunset.
5. Performance-sensitive changes carry before/after benchmark evidence.
6. Security-sensitive changes carry a threat-model delta.
7. No merge without green CI, including new tests that would have caught the flaw.
