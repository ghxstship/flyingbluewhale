# Automation-platform compatibility — Zapier · Make · n8n

**Validated 2026-07-17** against `docs/api/openapi.yaml` (drift-guarded by
`src/app/api/openapi-drift.test.ts`) and the live `/api/v1` handlers. This is
the record of what an integration builder gets today, verified item by item —
not aspiration.

## What passes

| Requirement | State | Evidence |
| --- | --- | --- |
| Machine-readable spec | ✅ OpenAPI **3.1.0**, 152 paths / 195 operations, served at `/api/v1/openapi.json` | Make + n8n import it directly; Zapier's importer accepts 3.1 (prefers 3.0.x — see gaps) |
| Stable operation ids | ✅ **195/195** operations carry `operationId` | Required for n8n's OpenAPI node + Zapier CLI codegen |
| Token auth | ✅ `bearerToken` scheme = PAT with per-scope grants (`documents:read`, `reports:read`, `advancing:write`, …) | All three platforms support static bearer headers |
| Idempotency | ✅ `idempotencyKey` header scheme on mutating finance/booking ops | Safe retries from Make/n8n error handlers |
| Deterministic list reads | ✅ every org-scoped list orders `created_at desc` and caps at 100 rows (`src/lib/db/resource.ts` P2 guard) | Zapier polling triggers dedupe by `id` on most-recent-first pages — this shape is exactly what they need |
| Outbound webhooks (trigger side) | ✅ the automations engine ships a `webhook-send` action (`src/lib/automations/actions/webhook-send.ts`, SSRF-guarded via `src/lib/http-ssrf.ts`) — any domain event an automation can subscribe to can POST to a Zapier/Make/n8n catch-hook URL | Event catalog = the automations registry |
| Flat JSON envelopes | ✅ `apiOk`/`apiCreated`/`apiError` (`@/lib/api`) — no HAL/JSON:API nesting | Mappable in every visual field-picker |
| CORS + rate limits | ✅ enforced centrally in `src/proxy.ts` | 429s are surfaced with standard status codes |

## Known gaps (tracked, non-blocking)

1. **Cursor pagination is documented on 4 list endpoints** (`projects`,
   `handovers`, `shift-notes`, `marketplace-listings`); the remaining list
   GETs return the newest 100. Fine for polling triggers; bulk backfills
   should use the paginated four or filtered date-range queries. Extending
   `cursor`/`pageSize` across the rest is mechanical (the
   `listOrgScopedPage` helper already exists) — schedule as its own pass so
   the OpenAPI diff stays reviewable.
2. **No `webhooks` section in the OpenAPI doc** — outbound event payloads are
   defined by the automations registry, not the spec. When the event catalog
   stabilizes, mirror it into OpenAPI 3.1 `webhooks` for one-click n8n
   trigger scaffolding.
3. **Zapier importer** prefers OpenAPI 3.0.x; 3.1 works via their newer
   importer but a `3.0` down-conversion (openapi-down-convert) is a
   30-minute task if a partner asks.

## The rule for new endpoints

Every new `/api/v1` route must: carry an `operationId`, be PAT-scope gated
via `withAuth`, Zod-validate at the boundary, return the `apiOk` envelope,
and — if it lists — order deterministically and document `cursor`/`pageSize`
when it exceeds the 100-row cap. The drift gate fails CI if the yaml and the
filesystem disagree.
