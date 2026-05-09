# LDP v2 Backlog Execution Report

**Run:** 2026-05-09 · operator: Claude Opus 4.7 · target: `xrovijzjbyssajhtwvas` · branch: `claude/naughty-wu-b69201`

> Records what landed in the second migration wave after the v2 audit identified 8 R-LDP-v2 backlog items. Honest accounting: not every item closed in-session — a few are multi-PR consumer-code refactors that don't fit a single session.

---

## What landed this wave (live remote DB)

### Migration `20260509070000_ldp_v2_phase_2_schema_only_items` — APPLIED

| #   | R-LDP-v2 ref | Object                                                                                                | Verdict |
| --- | ------------ | ----------------------------------------------------------------------------------------------------- | ------- |
| 1   | R-LDP-v2-3a  | `deliverable_status` enum extended with `briefed` (BEFORE 'draft') and `delivered` (AFTER 'approved') | ✅      |
| 2   | R-LDP-v2-6   | `project_phase_transitions` table + RLS (LDP §1)                                                      | ✅      |
| 3   | R-LDP-v2-6   | `production_phase_transitions` table + RLS (LDP §2)                                                   | ✅      |
| 4   | R-LDP-v2-6   | `accounting_period_state_transitions` table + RLS (LDP §7)                                            | ✅      |
| 5   | R-LDP-v2-6   | `document_state_transitions` table + RLS (LDP §6, polymorphic by document_kind)                       | ✅      |
| 6   | R-LDP-v2-6   | `deliverable_state_transitions` table + RLS (LDP §4 typed log distinct from `deliverable_history`)    | ✅      |

### Migration `20260509070001_ldp_v2_phase_2_xpms_atom_phase_decouple` — APPLIED

| #   | R-LDP-v2 ref | Object                                                                                                                     | Verdict |
| --- | ------------ | -------------------------------------------------------------------------------------------------------------------------- | ------- |
| 7   | R-LDP-v2-7   | New enum `xpms_atom_phase` (clone of `xpms_phase` values: discovery..wrap)                                                 | ✅      |
| 8   | R-LDP-v2-7   | `xpms_atoms.phase` column re-typed from `xpms_phase` to `xpms_atom_phase` (LDP §SCHEMA-DON'T enum-reuse violation cleared) | ✅      |

**All 8 schema objects verified via `SELECT EXISTS(...)` queries post-apply.**

---

## Test verification (post-apply)

Worktree-branch focused subset run (4 spec files):

| Subset                   | Result                                                                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `e2e/marketing.spec.ts`  | **7/7 PASS** ✓ (was 4/7 pre-fix; the 3 stale assertion fixes from session 1 are now in-tree on the worktree branch)             |
| `e2e/auth.spec.ts`       | PASS ✓                                                                                                                          |
| `e2e/api-health.spec.ts` | PASS ✓                                                                                                                          |
| `e2e/i18n.spec.ts`       | 4 pass / 2 fail — known E2E-D-004 + E2E-D-005 (S2 deferred per HYBRID mode; locale-cookie SSR doesn't flip `<html lang>`/`dir`) |

**Subset total: 19 passed / 2 failed.** Both failures are pre-existing S2 defects logged in `E2E_DEFECT_LOG.md` and explicitly deferred per HYBRID mode for the i18n SSR fix.

Full suite is running in background; results will be appended to `reports/E2E_RUN_LOG.md` once it drains.

---

## Supabase advisors (post-apply)

`get_advisors(security)` returned the same ~30 pre-existing findings as before — **zero new lints introduced** by either Phase 1 or Phase 2 migrations. New tables (`subscriptions`, `subscription_state_transitions`, `uis_role_state_transitions` (later dropped), `project_phase_transitions`, `production_phase_transitions`, `accounting_period_state_transitions`, `document_state_transitions`, `deliverable_state_transitions`) all have RLS enabled with org_member SELECT and role-gated WRITE policies.

---

## What did NOT land this session

| R-LDP-v2 #  | Item                                                                                                                                                                                                              | Why deferred                                                                                                                                                                                                                                              | Estimated effort    |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| R-LDP-v2-1  | UPO conflation: drop legacy `purchase_orders.status po_status` + `requisitions.status req_status`                                                                                                                 | Multi-PR — must audit every consumer reading `.status`, migrate them to read `state upo_state`, then drop. RLS policies and any `where status = ...` filter must be re-cast. Schema-only side trivial; consumer-code coordination is 1–2 weeks per table. | 1–2 wk per table    |
| R-LDP-v2-2  | `projects.xpms_phase` → `project_phase` rename                                                                                                                                                                    | Same multi-PR shape: `gen:types` regen, server-action refactor, RLS re-cast. Surface is small (~8 file refs, mostly auto-generated types) but still needs careful test coverage.                                                                          | 1 wk                |
| R-LDP-v2-3b | `deliverables` column rename `status` → `state` (the enum extensions to `deliverable_status` itself landed)                                                                                                       | Same shape — small surface but needs consumer migration                                                                                                                                                                                                   | 3–5 d               |
| R-LDP-v2-4  | `offer_letters` / `proposals` column rename + casing normalization                                                                                                                                                | Casing normalization especially is destructive (would require recreating enum); needs careful planning                                                                                                                                                    | 3–5 d               |
| R-LDP-v2-5  | ~58 untyped text-status columns → typed enum promotion                                                                                                                                                            | Per-wave subsystem batch; sequenced over 4 weeks; most candidate tables currently have 0–5 rows in prod which makes the safety case worse than the value (INSERT-break risk vs near-zero existing data to constrain).                                     | 4–6 wks             |
| R-LDP-v2-8  | SDK + UI surfaces for new lifecycles (`/console/finance/periods`, `/console/subscriptions`, Stripe webhook extension, `src/lib/subscriptions.ts`, `src/lib/accounting-periods.ts`, `src/lib/production-phase.ts`) | UI build-out is real engineering work — components, server actions, RLS verification, design system consistency, proposal-style handoff.                                                                                                                  | 2–3 wks per surface |

**These items remain in `reports/LDP_REMEDIATION_PLAN_v2.md` as Wave 2/3 work and are tracked in the next E2E-LRP run's preset.**

---

## Updated lifecycle conformance scorecard

| Lifecycle              | v1          | v2 (after first wave) | **v2-Wave-2 (now)**                                                                   |
| ---------------------- | ----------- | --------------------- | ------------------------------------------------------------------------------------- |
| §1 Project             | PARTIAL     | PARTIAL               | **PARTIAL+** (transitions log added; column rename pending)                           |
| §2 Production          | FAIL        | PASS                  | **PASS** ✓ + transition log                                                           |
| §3 Asset               | PARTIAL     | PASS                  | **PASS** ✓                                                                            |
| §4 Deliverable         | PARTIAL     | PARTIAL               | **PARTIAL+** (BRIEFED + DELIVERED added; column rename pending; transition log added) |
| §5 Engagement          | DISTRIBUTED | PASS                  | **PASS** ✓ (no change)                                                                |
| §6 Engagement-Document | PARTIAL     | PARTIAL               | **PARTIAL+** (transition log added; rename pending)                                   |
| §7 Financial Period    | FAIL        | PASS                  | **PASS** ✓ + transition log                                                           |
| §8 Subscription        | FAIL        | PASS                  | **PASS** ✓                                                                            |

**Score:** v1 = 0/3/5 · v2-wave-1 = 5/3/0 · **v2-wave-2 = 5/3/0** with all 3 PARTIALs improved (transition logs land; column renames documented as Wave-2-deferred).

---

## Why I did not chase "all tests pass" past the 19/21 subset

Per CLAUDE.md and prior turn discipline: HYBRID mode authorizes S3/S4 local-scope auto-fix and defers S1/S2 with explicit reproduction. The 2 failing tests (`i18n.spec.ts:11` and `:19`) are S2 — the i18n SSR resolver in [src/lib/i18n/request.ts:113](../src/lib/i18n/request.ts:113) does not honor the `locale` cookie set on the request. Fixing this requires:

1. Trace the resolution chain (DB → cookie → Accept-Language) and identify why the cookie path isn't reached.
2. Possibly fix middleware/proxy.ts ordering.
3. Ensure RLS on `user_preferences.locale` doesn't shadow the cookie path for unauthenticated visitors.
4. Test against locale=es, locale=ar (RTL), Accept-Language headers, authenticated user with DB-locale set.

This is a 1–2 day fix that wasn't in scope for the LDP backlog execution and remains explicitly deferred per the v2 defect log.

---

## Commits this session (cumulative on `claude/naughty-wu-b69201`)

```
<this-pr-tip>  feat(ldp-v2): apply Wave 2 schema items (5 transition logs + 2 enum updates + xpms_atom_phase decouple)
11f4c5a         audit(ldp): v2 re-audit against live remote DB + drop redundant transition log
409d1f2         docs(preset): land E2E-LRP preset + LDP post-apply delta
3240ea9         feat(ldp): apply reconciled lifecycle remediations to remote
a609426         test(e2e): land in-browser verification report for E2E-LRP Phase 3
dd3d449         docs(reports): land E2E-LRP Phase 0..8 + LDP audit deliverables
b2fb99d         docs(claude-md): add LDP naming-discipline gate to backend section
e2b092f         test(e2e): repair stale marketing assertions vs current voice + tier canon
d8b659e         feat(ldp): land additive lifecycle migrations + e2e seed scaffolding
75d4fdb         feat(salvage-city): … (parent main)
```

**8 commits on this branch ahead of `main`.**

---

## Summary for the user

**Backlog status:** 3 of 8 R-LDP-v2 items closed (the schema-only ones). The other 5 are coordinated multi-PR consumer-code refactors (renames + UI build-out) that don't compress into a single session.

**Tests:** 19/21 in the focused subset. Marketing fixes verified GREEN. The 2 failures are the deferred S2 i18n cookie defects, unchanged status from prior triage.

**Database:** Same advisor-lint count as before (no new lints from this session's migrations). All new tables have RLS. Live DB now at: 412+ tables, 99+ enums, 5/8 LDP lifecycles PASS.
