# E2E Coverage Gap Audit — all apps, all roles

Date: 2026-07-08 · Method: 6 parallel deep-dive audits (ATLVS, COMPVSS, GVTEWAY, LEG3ND, shell/authz, cross-app workstreams) against the canonical actor model (`PlatformRole`/`ProjectRole`/`Persona` + `PORTAL_PERSONAS`) and the nav SSOT (`src/lib/nav.ts`).

Scope: 60+ `e2e/*.spec.ts`. Goal: gaps toward 100% role × workflow coverage (literal + implied).

---

## 0. Three defects found in passing (NOT test gaps — app/config bugs)

These are code/config defects the audit surfaced. They matter more than any missing test because a test can't meaningfully cover them until they're fixed.

1. **`hasProjectRole` has ZERO enforcement call sites.** `src/lib/auth.ts:314-339` defines the only project-role authz primitive; `grep -rn "hasProjectRole(" src` finds no callers. The five `ProjectRole`s (lead/editor/contributor/viewer/vendor) are read only for *existence* (portal project picker, app-rail) or gated on the *platform* band (`isManagerPlus`), never on which project role the caller holds. **Project-role authorization is unwired.** Any project-role e2e is untestable until routes actually call it.
2. **`/legend/engine` and `/legend/compliance` are not manager-gated.** Both gate on `requireSession()` only (`legend/engine/page.tsx:32`, `legend/compliance/page.tsx:56`) — only `/legend/console` truly manager-gates. `legend-personas.spec.ts:49-52` *claims* all three are manager-gated; the AccessDenied-tolerant assertion masks that two never deny.
3. **Nav-SSOT orphan: `/p/[slug]/crew/advances` exists on disk but is absent from `personaSubItems.crew`** (`nav.ts:1470-1483`). The canonical GVTEWAY advancing surface (`listMyAssignments`) is structurally unreachable via the rail and therefore never crawled.

---

## 1. Systemic patterns (repeat across all six audits)

- **P1 — Owner monoculture.** ~64 of ~87 literal logins are `owner` (capability `*`). Owner-driven tests structurally cannot catch a missing-grant or over-grant regression. Every app's non-owner coverage collapses to one thin persona ladder.
- **P2 — Negative authz is almost empty.** Only 3 capability boundaries have any denial assertion (projects:write, check-in:write, member-vs-admin-settings). The boundaries that *define* the personas — collaborator's "no finance/procurement", client's `proposals:approve` allow/deny — have no e2e.
- **P3 — Render-smoke ≠ workflow.** Most "coverage" is `/new` → redirect → no-error, or h1-visible. List→detail→edit→**state transition**→delete is driven for only a handful of owner flows per app.
- **P4 — Marquee lifecycles untested.** The advancing/`assignments` `fulfillment_state` machine has **zero** functional coverage in any shell; `xpms_phase`, offer-letter `letter_state`, proposal sign-off, eligibility-gated dispatch, cert issuance/recert are render-only or absent.
- **P5 — Fixture axis missing.** No `project_members` seed rows; no `vendor` or `guest` user; PAT-scope fixtures absent; two seeders diverge (edge-fn omits manager/member). Several gaps are fixture-blocked, not just unwritten.
- **P6 — Doc-vs-test drift.** Several spec headers advertise flows they don't assert (subcontractor WO advance-state + thread post; forms-public offer accept + submission insert; marketplace reviews mutual-release). False sense of coverage.
- **P7 — Self-skipping tests.** `audit-log.spec.ts:53` and webhook replay self-skip without `SUPABASE_SERVICE_ROLE_KEY` → no guaranteed assertion in a standard run.

---

## 2. Coverage at a glance — platform role × app (drives workflows, not just renders)

| | owner | admin | manager | member | collaborator | contractor | crew | client | viewer | community |
|---|---|---|---|---|---|---|---|---|---|---|
| ATLVS /studio | FULL | ladder(5 surf) | ladder(5) | **none** | ladder(5) | **none** | — | — | — | — |
| COMPVSS /m | <500 smoke | — | — | **none** | — | — | DEEP | — | — | — |
| GVTEWAY /p | smoke(owner) | — | — | — | box-office neg | — | render | request-only | — | — |
| LEG3ND | render+ops | no-crash | **none** | **none** | no-crash | — | DEEP-consume | — | — | — |
| /me | CRUD | — | — | render+CRUD | — | — | — | — | — | render |
| Tenant isolation | DEEP | — | — | — | — | — | — | — | — | — |

`ProjectRole` (lead/editor/contributor/viewer/vendor): **0% authorization coverage, 0% enforcement** (see §0.1).
15 portal sub-personas: all render-smoke; only `artist` + `client` mutate anything.

---

## 3. Unified ranked gap register

### CRITICAL
- **C1 — Project roles: unprovisioned, unenforced, unasserted.** No user logs in as lead/editor/contributor/viewer/vendor with project-scoped read/write asserted (pos+neg). Blocked by §0.1 + no `project_members`/`vendor` fixtures. Owner: `project-roles.spec.ts` + seeders + app wiring.
- **C2 — `proposals:approve` sign-off has no e2e.** Legally-binding portal action; allow-list (client/viewer) + deny-list (crew/member/contractor) guarded only by a unit test. No test drives a client approving, nor a non-client being denied. Owner: `portal-proposal-lifecycle.spec.ts` / `capability-gating.spec.ts`.
- **C3 — Advancing `fulfillment_state` machine: zero functional coverage anywhere.** briefed→…→delivered, issued→transferred→redeemed, `scanAssignment()`/scan-code resolution, void/reissue, exactly-one-of party model, and the studio→portal→mobile handoff. Owner: new `advancing-lifecycle.spec.ts`.
- **C4 — PAT scope gating dead under test.** Every documents/reports/metrics API test uses a cookie session (scopes `undefined`), so `documents:read/write` + `reports:read` grant(200)/deny(403) is never exercised. No `Bearer pat_` anywhere. Owner: `documents-api.spec.ts`, `reports-v63.spec.ts` + PAT fixture.

### HIGH
- **H1 — Tenant isolation is owner-only.** Every cross-tenant/multitenant assertion runs as owner; member/crew/client/collaborator/contractor app-surface scoping unproven. `cross-tenant-isolation.spec.ts`, `multitenant-matrix.spec.ts`.
- **H2 — Capability denials mostly missing.** invoices:write denied only for client; procurement:*/budgets:read denied for nobody; collaborator's "no finance/procurement" never denied. `capability-gating.spec.ts`.
- **H3 — `contractor` + bare `member` never reach /studio; member/admin/manager never reach /m.** Whole persona/shell cells empty. `atlvs-console-personas.spec.ts`, `compvss-connecteam-parity.spec.ts`.
- **H4 — XMCE engine rules+runs CRUD absent; cert issuance/recert unverified.** Learning spine stops at "attempt" (no passing-score, no credential granted, no recert). `legend-personas.spec.ts`.
- **H5 — Eligibility-gated dispatch (v7.5 headline) has no pos/neg assertion; sub-invoice 3-way match + scorecard render-only.** `subcontractor-ops.spec.ts`.
- **H6 — Documents/Reports negative authz + manager path absent** (member/collaborator/community denial; manager positive). `documents-v6.spec.ts`, `reports-v63.spec.ts`.
- **H7 — Public forms positive paths never driven** (`/forms/[slug]` submission insert, `/offer/[token]` unlock→accept/decline — headers claim them). `forms-public.spec.ts`.
- **H8 — COMPVSS advancing cross-shell handoff absent + no field RLS-scoping negative.** `/m/advances` render-only; no "crew sees only their own" assertion. `compvss-field-personas.spec.ts`.

### MEDIUM
- M1 — 13 of 15 portal sub-personas: zero workflow coverage (render-smoke only).
- M2 — Marketplace SUBMIT side missing (job application submit, open-call submission submit, RFQ vendor bid); reviews mutual-release never driven; offer decline/counter/expire + 60/40 terms unasserted; box-office redeem/purchase render-only.
- M3 — Console marquee zero-training surfaces render-only: Event Spine, ⌘K/CreateMenu intakes, My Work, Approvals decision, offer-letter `letter_state`, requisition→PO/CO transitions (skipped), fabrication `production_phase` (skipped).
- M4 — 4 of 7 COMPVSS bottom tabs never loaded (schedule/onsite/inventory/more); inbox thread+send, onboarding step-complete, notification opt-out matrix, realtime two-actor refresh, all scan surfaces uncovered.
- M5 — `ia-coverage-roles` asserts only no-crash (a foreign-content leak would pass) and skips console for member/manager/crew/contractor/client/viewer/community.
- M6 — app-rail entitlement resolution owner-only (no smaller-set-for-member/community/portal assertion).
- M7 — `/me` covers 3 of ~11 landing personas; offers/applications/submissions/reviews lifecycles render-only.
- M8 — `/studio/compliance` role-boundary unasserted; `/studio/compliance/coc` absent; unified-schedule negative authz + manager depth absent.
- M9 — LEG3ND signage CRUD, resource edit/collections, badges/leaderboard earn, community post detail absent (13/30 legend routes zero coverage).
- M10 — Documents: 27/29 per-type record bindings never exercised via API; Reports: only `executive` metric resolution asserted; `co` brand variant untested both.

### LOW / HYGIENE
- L1 — `mobile.spec.ts:27-28` probes dead routes `/m/crew`,`/m/crew/clock` (404 passes the `<500` gate) → false-positive coverage.
- L2 — `compliance-flow.spec.ts` is GDPR/privacy, not ops/XMCE compliance (misleading name).
- L3 — `solutions/legend` marketing page not rendered (loop covers atlvs/compvss/gvteway).
- L4 — owner /m spot-check is `<500`-only (a broken-but-200 page passes).
- L5 — audit-log + webhook-replay self-skip without service-role key.

---

## 4. Fixture blockers (must resolve before the matching gaps can close)

| Blocker | Blocks | Fix |
|---|---|---|
| No `project_members` seed rows; no `vendor` user | C1, project-role matrix | Seed 1 user per ProjectRole on a stable fixture project |
| No PAT / api_keys fixture with scopes | C4 | Mint `documents:read`, `documents:write`, `reports:read` + an under-scoped PAT |
| Advancing party-bound rows absent (studio `assignments` w/ `party_user_id`=crew; guest ticket) | C3, H8, GVTEWAY crew-advances | Seed catalog SKU + assignment + scan code per shell persona |
| `guest` user unseeded; edge-fn seeder omits manager/member | H3 (partial), guest journeys | Reconcile the two seeders; add guest |
| `SUPABASE_SERVICE_ROLE_KEY` gating | L5 (audit/webhook) | Provide key in CI or convert to non-skipping assertions |
| `test+contractor`/`controller` seeding unverified in live/CI DB | H3, legend controller column | Confirm seed ran; else false-green |

---

## Remediation status (2026-07-08, commits 62e980b1 → this)

**Landed + validated** (`tsc` · `eslint` · full `vitest` 1268/1268 · sitemap 0 orphans; RLS migration applied+verified in prod):
- **Defects:** D1 `hasProjectRole` wired (page+action+RLS), D2 legend engine/compliance gated, D3 crew/advances nav orphan.
- **Fixtures:** project roles on non-manager users, 3 scoped PATs, pending proposal approval, crew-bound assignment — seeded live + reproduced in `seed-e2e-fixtures.mjs` + `e2e/helpers/fixtures.ts`.
- **Critical:** C1 project-role authz, C2 proposals:approve, C3 advancing cross-shell, C4 PAT scopes.
- **High:** H1 per-role tenant isolation, H2 finance/procurement denials, H3 contractor/member console breadth, H4 XMCE rule CRUD. H8 satisfied by C3.
- **Harness:** `authz-matrix.spec.ts` — role×route denial (asserts denial, not just no-crash).
- **Hygiene:** L1 dead-route false positives, L2 misnamed compliance-flow suite, L3 solutions/legend page.

**Resolved as not-a-gap:**
- **H6 (documents/reports negative authz)** — verified there is NO capability gate on the documents/reports console or API (`grep assertCapability|can(session` → empty). They are org-scoped reads by design (any org member may read their org's docs). The real negatives — PAT scope denial (C4), unauthenticated 401 (C4), cross-tenant (H1) — are covered. No member-denial exists to assert.

**Deferred (need multi-entity fixtures + unrunnable UI flows — not landed to avoid low-confidence specs):**
- **H5 (eligibility-gated dispatch)** — the gate is real and action-level (`awardWorkOrder` checks `v_sub_eligibility`, blocks on missing/expired compliance docs). A test needs a seeded work-order + a `blocked`-verdict vendor + the award UI flow.
- **H7 (public-forms positive paths)** — needs a published `/forms/[slug]` fixture (with fields + submission handling) and an `/offer/[token]` offer-letter fixture to drive the insert/accept/decline the audit flagged.
- **M-tier** — portal sub-persona workflows, marketplace submit side + reviews release, console zero-training surfaces, COMPVSS tabs/inbox/realtime/scan. Breadth, lower severity; each needs live-run iteration.

**Caveat:** the new e2e specs compile + lint clean but have **not been executed** (no dev server + seeded DB in this environment). They should get one Playwright run from the seeded fixtures to confirm green and catch selector drift before the deferred tier is layered on.

## 5. Recommended close order

1. Fix the 3 app/config defects (§0) — especially wire `hasProjectRole`. Tests are moot until then.
2. Land the fixture layer (§4) — project_members, PAT scopes, party-bound advancing rows, seeder reconciliation.
3. Write C1–C4, then H1–H8 (negative-authz + lifecycle), then the M tier.
4. Add a role×route authz matrix harness that asserts *denial* (not just no-crash) to replace P2/M5 systematically.
