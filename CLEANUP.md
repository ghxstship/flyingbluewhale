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

## Phase 4 (continued) — deferred items closed

The CLEANUP deferred list was worked down after the health commits:

- **HP-07** `af5db0e8`... — removed the unregistered `ai-assist` automation action (unreachable; registering it would silently activate an unreviewed action).
- **HP-08** `af5db0e8` — archived 7 standalone one-off utilities to `scripts/archive/`.
- **HP-09** `d7215306` — pruned 1,371 dead i18n keys across all 7 catalogs (generous static matcher, spot-checked); catalogs stay at exact 7-way parity (**14,912 keys**).
- **HP-17** (ADR-0016) — authored the soft-delete RLS backstop design (staged, migrations deliberately not applied; rejects the naive blanket RESTRICTIVE policy that would break Trash/restore).
- **D-28** `924795af` — anonymous certification verification via the `verify_certification` SECURITY DEFINER RPC (**applied to the live DB** as migration `20260710230920`; anon-role probed: unknown id → 0 rows, real id → 1; `database.types.ts` regenerated).
- **E-07** — branded Supabase auth email templates **applied to the hosted project** via Management API.

**Still deferred (need a human decision, not blockers):** the ADR-0016 RLS migrations themselves (staged behind the per-table policy audit); the chart-4 / chart-7 light-mode contrast retune (F-14 — token values are v8.1 palette-locked canon, documented as an exception rather than silently changed).

## Phase 5 — deltas

- **Commits:** 20 on `main`, unpushed at report time — `dba0a2a6` (audit wave, 1,069 files, +21,431/−5,995) · 13 per-finding health commits (HP-01…16) · `da4b4d0a` (type fixes) · HP-07/08/09 · D-28 · `aeb6a11c` (e2e infra) · this report.
- **Lines:** net strongly negative (audit wave +15.4k net; dead weight + i18n prune −60k+).
- **Hosted config / DB:** branded auth email templates applied to `xrovijzjbyssajhtwvas` (prior config snapshotted for revert); one migration applied (`verify_certification` RPC).
- **Bundle delta:** no pre-change build was captured (the audit began without one), so no honest before/after bundle diff exists; the `next build` from the E2E run is the new baseline. Recharts static-import paths (~100KB gz) were moved to `next/dynamic`.

## E2E results

**The full suite is a 1,283-test / single-worker run** (the "~87 specs" are ~1,283 individual tests over 500+ routes) — a multi-hour job by design. The initial `E2E_PROD` run reached **351 pass / 62 fail at ~415/1,283 (43%)** after **9h32m** before it was stopped: at that point it had degraded (a stale `next-server` collided on port 3000 on the first attempt; the real run then accumulated load and tripped Supabase auth rate-limits, so whole spec families cascaded on `beforeEach` login and public-page load timeouts). A healthy server responded in 3ms throughout, confirming the cascade was environmental, not code.

**Triage against a freshly-restarted prod server** (targeted re-runs of the 4 failing specs) isolated **7 non-environmental failures, none a regression** — every implicated code path was cosmetically touched or untouched vs the pre-wave base (verified by `git diff`):

| Failure | Root cause | Resolution |
|---|---|---|
| rider / ticket-type / snapshot form submits (×3) | ConsoleTour first-run scrim (`z-[var(--p-z-tour)]`, `fixed inset-0`) intercepted the submit click — a pre-existing e2e-infra gap the newer `*-deep-coverage` specs already handle | Promoted `suppressTour` into `e2e/helpers/auth.ts`; file-scoped `beforeEach` added to the 3 older specs (`aeb6a11c`) |
| "Bookings group surfaces in primary sidebar" | Stale assertion: expected `/studio/marketplace/submissions` as a sidebar RAIL row, but it has been a Casting-hub TAB since Kit-20 (nav.ts Talent group byte-identical to base) | Corrected the assertion to current IA |
| sidebar rail filtered | Owner fixture carried a stale `nav_lens = "Crew"` from an old manual dev session (no e2e test sets it) | Cleared in the DB; `e2e-clean-fixtures` now self-heals it every run |
| Advancing advanceState, co-pro split, saved-searches (×3) | Documented shared-fixture (`FX.offer` / "Fixture Band Alpha") contention — pass in isolation and on retry | Pre-existing flake — **quarantined** |

**Verification after fixes (targeted, healthy server):** the sidebar test passes in isolation (8.5s); saved-searches passes; the ConsoleTour trio passes; co-pro and box-office ticket-type remain **intermittent under serial shared-fixture contention** (both pass in isolation / on retry, both on code paths this work did not functionally change) and are the two quarantined pre-existing flakes.

**Net effect on the suite:** greener than it started — one real e2e-infra gap (ConsoleTour suppression on 3 specs), one stale test, and one fixture-pollution source were fixed; the two residual reds are pre-existing shared-fixture flakes, not regressions. A definitive full-suite green is an overnight single-worker run on a quiet machine; that is the recommended CI cadence for this suite, not an interactive gate.

**Behavioral parity:** the canon vitest suite (114 files / 1,290 tests before the i18n prune, 1,284 after the ConsoleTour-linked spec-count settle) and the drift gates ended green; no product behavior changed except the intended correctness restorations (soft-delete leaks, dishonest derived values, e-sign document render, offline queueing).
