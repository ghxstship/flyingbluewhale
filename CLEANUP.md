# CLEANUP.md — Deep health remediation report

**Date:** 2026-07-10 · **Branch:** main · **Companion:** [AUDIT.md](AUDIT.md) (the 238-surface UI/UX audit remediated the same day; this report covers the health-remediation phases layered on top).

## Canon deference

CLAUDE.md was treated as repo canon throughout. Deliberately **excluded as findings** (cited during investigation): the OKLCH v8.1 hand-authored color layer with `tokens.json` as sRGB reference mirror (ratified dual layer, not an SSOT violation); the spaced brand-mark treatment; the subdomain→route-group mapping; the LDP naming discipline; 16 canon-justified denormalizations (assignments.catalog_kind trigger sync, announcements.read_count, review rating rollups, budget/settlement counters, org_id RLS denorms, snapshot/certified-document totals, RPC counters, derived views); `ui/Skeleton.tsx` + `charts/BarChart.tsx` (zero importers but CLAUDE.md-named primitives — canon/code drift flagged, files kept).

## Gate stack — before / after

| Gate | Before (HEAD `4fbf6665`) | After (this remediation) |
|---|---|---|
| `npm run typecheck` | PASS (verified via stash-compare during Phase 4; 5 errors introduced mid-wave were fixed in `da4b4d0a`) | **PASS (exit 0)** |
| `npm run lint` | PASS | **PASS (exit 0)** — now also enforces the toLocale* i18n ban |
| `gen:theme:check` | **RED — pre-existing**: the retired v8.1 generator crashed on missing `@gen:` markers (CLAUDE.md itself declares it retired) | **Script removed** (HP-01, canon-backed) — gate retired with its generator |
| `gen:sitemap:check` | PASS | **PASS** (1,177 pages · 0 orphans · 0 dangling) |
| `gen:ia-map:check` | PASS | **PASS** |
| `gen:create-actions:check` | PASS (137 actions) | **PASS** (137) |
| `npm run test` (vitest) | 114 files pass | **114 files / 1,284 tests PASS** — plus 3 NEW canon suites (list-honesty, soft-delete, font-floor) and extended voice/openapi-drift guards |
| E2E (`E2E_PROD=1`, workers:1, `e2e/audit/**` excluded) | not run pre-change (no baseline capture) | _see E2E section below_ |
| i18n catalogs | en 16,270 · locales 16,252 (18-key drift) | **7-way parity at 16,283 keys / 0 missing** |

## New guards added (the classes now die in CI)

1. `src/lib/db/list-honesty-canon.test.ts` — no capped list renders without a truth marker (totalCount/pagination); 21-entry annotated allowlist + rot detection.
2. `src/lib/db/soft-delete-canon.test.ts` — no `.from(<soft-deletable>)` read chain without a `deleted_at` filter; ratchet-only allowlist frozen at the legacy 400 chains (new leaks and stale grants both fail).
3. `src/lib/theme/font-floor.test.ts` — MONUMENT 11px floor (`text-[<11px]` fails).
4. `src/app/voice-and-type.test.ts` — em/en-dash guard extended from marketing to `(platform)` UI strings (also fixed a comment-stripper masking bug in the guard itself).
5. `eslint.config.mjs` — `toLocaleDateString/TimeString/String` banned outside `src/lib/i18n/**` (the ~200-file sweep keeps it green).
6. `src/app/api/openapi-drift.test.ts` — now requires a unique operationId on every operation (180 ops covered).

## Phase 1 — dead weight removed (7 commits, ~58,700 lines / 246 files)

| Commit | What |
|---|---|
| `6c8f84fa` HP-01 | Retired theme generator (`gen-theme-tokens.{mjs,d.mts}`), its 2 broken npm scripts, PR-template + CLAUDE.md stale references |
| `422218f6` HP-02 | `supabase/migrations.legacy_backup/` + `migrations.archive_20260606_squash/` (203 files, zero references; git history preserves) |
| `c84db9ea` HP-03 | 17 landed one-shot codemod/audit scripts + 3 root .xlsx export artifacts (all regenerable, zero consumers) |
| `d1f1181d` HP-04 | Feature-flag module with zero callers (`flags.ts` + test + `FLAGS_API_HOST`/`NEXT_PUBLIC_FLAGS_CLIENT_KEY`/`hasRemoteFlags` env plumbing) — behavior identical (local fallback meant flags never gated anything) |
| `0a44d31b`+`7c41a3ff` HP-05 | 20 orphaned src files (superseded twins, unwired libs, dead barrels); `PullToRefresh.tsx` correctly **kept** — it gained a consumer during the audit wave |
| `c3b4c695` HP-06 | Dropped `@radix-ui/react-accordion` + `@radix-ui/react-radio-group` (hand-rolled components never imported them); declared `esbuild` + `fast-glob` (used-but-undeclared, previously riding transitives) |

**Dependency delta:** −2 dependencies, +2 devDependencies (formalizing existing transitive use). Verified-and-kept: `web-ifc` (runtime engine of web-ifc-three/BIM), `@capacitor/local-notifications` (native autoregistration), `@eslint/eslintrc`.

**Proposed but deferred (with reasons):**
- i18n unused-key prune: ~1,354-key shortlist (8.3% of catalog ×7 files) — needs post-wave re-verification because dynamic key construction evades static scans; shortlist archived in the session scratchpad.
- §3b export/seed utility cluster (XPMS catalog pipeline, offer-letter exporters) — self-referential, owner-discretion; the XPMS seed was applied to the live DB and may be re-run.
- `src/lib/automations/actions/ai-assist.ts` — unregistered in the action barrel/registry (unreachable). Left in place: registering it is a behavior change (new automation action goes live); deleting it discards plausible WIP. **Decision needed: register or remove.**
- Unused-export surface (198 value / 149 type exports flagged) — bulk is deliberate design-system/library API; not pruned.

## Phase 2/3 — antipatterns + SSOT fixed (7 commits)

| Commit | What |
|---|---|
| `c1603b4b` HP-10 | **Soft-delete read leaks** (the recurring class): `fromScoped()` chokepoint in `resource.ts` + canon guard; closed the 22 worst chains across 14 external/user-facing files — deleted invoices no longer appear in portal P&L/invoice lists, deleted store products no longer purchasable |
| `9bbd9b10` HP-11 | N+1 write loops batched (CPM baseline per-activity UPDATE → chunked Promise.all; WIP per-project RPC → chunks) |
| `ff5b8362` HP-12 | Server-component fetch waterfalls parallelized on hot pages (/m home 4→1 round; receiving detail 6→3; bookings, portal landing, guide) |
| `5555eafa` HP-13 | 9 anon marketplace pages: `select("*")` on `public_*` views → explicit render-contract columns (future-column leak vector closed) |
| `dd107e8e` HP-14 | Never-written derived columns stop rendering as real values: `campaigns.spent_cents` → "Not tracked"; estimate totals now derived live from `estimate_lines`; `parties.rating_avg/count` verified unread (left, noted) |
| `500c0f90` HP-15 | Client/server validation single-sourced (`validation/constraints.ts`, `DEPOSIT_PCT_MIN/MAX`, shared date-range refine) — server rule wins where the pair disagreed |
| `fd9bb112` HP-16 | 26 unsanctioned double-casts in reports resolvers → typed rows (the one `LooseSupabase` dynamic-table dispatch remains, per CLAUDE.md sanction) |

Also fixed under the audit-wave commit (`dba0a2a6`): the forked deliverable transition map (REST handler now imports `NEXT_FULFILLMENT_STATES`; phantom `fulfilled` state removed), `urlFor` double-prefix 404s (zapier + workspace switcher), GraphQL soft-delete leak + forked pagination clamp, notification-href apex resolution (plus a latent `/me`→mobile mis-route), deposit-clamp re-inlining, manager-band role tuples (`ADMIN_BAND_ROLES`/`MANAGER_BAND_ROLES` adopted at 8 sites).

**RLS/tenancy sweep result:** no client-trusted org ids in mutations; all ~60 service-role usages censused as sanctioned or tenant-pinned server-side (the two new portal actions verify session + `project.org_id` + posted-FK re-validation); the one `?orgId` GET exception (guides/comments) is pair-gated + anon-RLS + rate-limited. **Proposed follow-up (migration-scoped, not applied):** the DB-level backstop ADR adding `deleted_at IS NULL` to SELECT policies on the 95 soft-deletable tables RLS doesn't yet cover.

**3NF verdict:** no unjustified partial/transitive dependencies found in the core domains; every live denormalization is either trigger-maintained, snapshot-by-design, or now justified here. The two "denormalized with no maintainer" columns found were HP-14's (fixed) — plus `parties.rating_*` (dead, unread).

## Phase 5 — deltas

- **Commits:** 15 total — `dba0a2a6` (audit wave, 1,069 files, +21,431/−5,995) · 13 per-finding health commits · `da4b4d0a` (type fixes).
- **Lines:** net ≈ −43k (audit wave +15.4k net; dead weight −58.7k).
- **Hosted config:** branded Supabase auth email templates applied to project `xrovijzjbyssajhtwvas` via Management API (E-07 closed end-to-end; prior config snapshotted for revert).
- **Bundle delta:** no pre-change build was captured (the audit began without one), so no honest before/after bundle diff exists; the post-change `next build` output from the E2E run is the new baseline. Recharts left static-import paths (~100KB gz) were converted to `next/dynamic`.
- **E2E:** _in progress at time of writing — results appended below when the `E2E_PROD` run completes._

## E2E results

_(pending — appended after the run)_
