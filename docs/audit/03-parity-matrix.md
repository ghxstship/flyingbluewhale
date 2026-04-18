# Phase 3 — Industry Parity Matrix

Each dimension benchmarked against ≥ 2 named references. Gaps map 1:1 to flaw IDs from Phase 2.

Legend — **C** current · **T** target · rows ordered by severity.

---

| Dimension | Reference A | Reference B | Current state | Target state | Gap | Flaw IDs |
|---|---|---|---|---|---|---|
| **API versioning** | Stripe (URL-path + date-based sub-version in header) | GitHub (URL-path `/v3/`, `Accept: application/vnd.github.v3+json`) | URL `/api/v1/*` only | URL + date header (`Fbw-Version: 2026-04-18`) behind flag | Date header absent | IK-014 |
| **Idempotency** | Stripe (`Idempotency-Key` 24h dedup, 256-char client token) | Shopify (`X-Idempotency-Key` on order mutations) | None | Middleware `withIdempotency()` + `idempotency_keys` table, 24h TTL | Full absence | **IK-011** |
| **Response envelope** | Stripe `{object, id, ...}` consistent | Linear `{data, errors}` | 13/21 routes bypass `{ok, data}` | Every route via `apiOk` / `apiError` | 62% drift | **IK-012** |
| **Input validation** | Stripe (every param validated server-side) | GitHub (JSON schema per route) | 11/21 Zod | 21/21 via `parseJson(req, Schema)` or typed URL params | 48% absent | **IK-044** |
| **Webhooks** | Stripe (HMAC + `event.id` dedup + exponential retry) | GitHub (HMAC + ping event) | HMAC only, no dedup | HMAC + dedup table + retry | No dedup | IK-028 |
| **Rate limiting** | Stripe (per-key + per-endpoint, 429 + `Retry-After`) | GitHub (per-user token, `X-RateLimit-*` headers) | IP + path only | Per-principal (session.userId + session.orgId) + per-bucket + honor `rate_limit_overrides` | Per-principal missing | **IK-022** |
| **AuthN** | Supabase (password + magic + OAuth + passkey) | Vercel (SSO + WebAuthn) | All present; passkey register only | Complete passkey auth flow | Auth half-built | IK-021 |
| **AuthZ** | GitHub (fine-grained token scopes) | Linear (role×capability matrix) | RBAC via RLS only | RBAC + app-layer `can()` + capability table | No app-layer check | **IK-017** |
| **Tenant isolation** | Shopify (schema-per-shop + sharded) | Supabase (RLS) | RLS + `org_id` | Same + statement_timeout + per-tenant quotas | Quotas absent | **IK-022, IK-023, IK-024** |
| **Background work** | Stripe (Sidekiq-based workers + DLQ) | Shopify (async job framework) | Single Edge cron | Queue primitive (`job_queue` + retry + DLQ) | 95% absent | **IK-026, IK-027** |
| **Observability — logs** | Datadog (structured JSON + correlation IDs + PII scrubbing) | Honeycomb (wide events) | `console.*` only | Off-box sink (Axiom / BetterStack), structured events, PII scrub | **Critical gap** | **IK-038** |
| **Observability — metrics** | Datadog RED + USE | Honeycomb derived metrics | None | Vercel Analytics + `lib/metrics.ts` counters | No metrics | **IK-039** |
| **Observability — traces** | Sentry Performance + Distributed Tracing | Honeycomb span-linked | Sentry tracesSampleRate 0.1, Next handler only | Supabase + Anthropic + Stripe span wrapping | Partial | IK-040 |
| **Error tracking** | Sentry | Rollbar | Sentry configured, DSN not set in prod env | DSN + release tagging + source maps | Config only | IK-038 |
| **Caching** | Vercel (ISR + edge cache) | Cloudflare (KV + Cache API) | Next default (no ISR, no edge) | ISR on marketing, edge cache for public GETs | 90% absent | IK-030, IK-031 |
| **Resilience** | AWS Well-Architected — retry + circuit breaker + bulkhead | Stripe (timeout + retry on idempotent reads) | No timeouts, no retries | `lib/http.ts` wrapper with timeout + retry + circuit breaker | All external deps unprotected | **IK-033, IK-034, IK-035** |
| **Security — deps** | SLSA L3 + SBOM | GitHub Dependabot + CodeQL | None | CycloneDX SBOM + npm audit + OSV in CI | **Critical gap** | **IK-042** |
| **Security — secrets** | GitGuardian + gitleaks | GitHub secret scanning | No scan | gitleaks pre-commit + CI | No scan | IK-043 |
| **Security — headers** | Mozilla Observatory A+ | OWASP | CSP, HSTS, X-Frame, X-CTO set | Same + CORS allowlist documented | CORS implicit | IK-045 |
| **Testing — pyramid** | Kent Beck test pyramid | Google Testing Blog | Inverted (110 e2e / 3 unit) | 10:1 unit:e2e ratio | Inverted | IK-049 |
| **Testing — contract** | Pact + Stripe API specs | GitHub OpenAPI | None | Contract spec per `/api/v1/*` route | Total absence | **IK-048** |
| **Testing — load** | Stripe (benchmark suite) | Shopify (load per deploy) | None | k6 baseline + weekly run | Absent | IK-050 |
| **CI/CD — provenance** | SLSA L3 | Google | None | Signed build attestation | No provenance | IK-053 |
| **CI/CD — progressive delivery** | Vercel (canary + feature flags) | LaunchDarkly | Flags present, not wired to canary | 1% → 10% → 50% → 100% rollout | 0% | IK-055 |
| **CI/CD — preview envs** | Vercel (auto PR previews) | Netlify | Not wired | PR → preview URL + Lighthouse comment | Absent | **IK-052** |
| **Performance — timing** | Datadog APM (p95 per route) | Honeycomb heatmaps | None | Per-request duration logged + P95 alert | Absent | **IK-059** |
| **Performance — scalability** | AWS WAF performance pillar | Shopify (read replicas, CDN) | Single region, single DB | Read replica + edge cache headers | Deferred | IK-007, IK-031 |
| **Documentation** | Stripe API docs (auto-gen from source) | Linear (Runbook.md per service) | CLAUDE.md + 4 audit docs | ADRs + runbooks + OpenAPI-generated ref | No runbooks, no API ref | IK-062, IK-063, IK-064 |

---

## Top-10 parity gaps (ordered by reference-delta severity)

1. **Logs** — no shipping (vs Datadog/Honeycomb) — **IK-038 Critical**
2. **SCA/SBOM** — none (vs SLSA L3) — **IK-042 Critical**
3. **Idempotency** — none (vs Stripe) — IK-011 High
4. **Observability metrics** — none (vs Datadog RED) — IK-039 High
5. **Resilience** — no timeouts / retries / circuit breakers (vs Stripe clients) — IK-033/034/035 High
6. **App-layer AuthZ** — RLS only (vs GitHub token scopes) — IK-017 High
7. **Per-tenant rate limits** — global only (vs Stripe per-key) — IK-022 High
8. **Response envelope drift** — 13/21 routes inconsistent (vs Stripe) — IK-012 High
9. **Contract tests** — none (vs Pact / Stripe) — IK-048 High
10. **Input validation coverage** — 11/21 Zod (vs GitHub schema) — IK-044 High
