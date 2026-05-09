# E2E_REGRESSION

**Protocol:** E2E-LRP §PHASE 6 — Regression Sweep
**Run:** 2026-05-09 · operator: Claude Opus 4.7

After Phase 5 remediation, this Phase verifies:

1. Every case that touched a fixed subsystem still passes.
2. All composition cases pass.
3. All S1 + S2 originating cases re-verified.
4. UAP audit log integrity across the full session — no gaps, orphan events, or missing correlation IDs.

---

## In-loop fixes applied (Phase 5) — to be regressed

Only S3/S4 local-scope fixes applied per HYBRID mode:

| Defect ID | Fix applied                                              | File modified                          | Regression command                                                           |
| --------- | -------------------------------------------------------- | -------------------------------------- | ---------------------------------------------------------------------------- |
| E2E-D-001 | Stale CTA assertion → `Open the Console`                 | `e2e/marketing.spec.ts:25`             | `npx playwright test e2e/marketing.spec.ts -g "home renders hero"`           |
| E2E-D-002 | Stale tier names → `Free / Crew / Production / Festival` | `e2e/marketing.spec.ts:31`             | `npx playwright test e2e/marketing.spec.ts -g "pricing shows 4 tiers"`       |
| E2E-D-003 | Footer heading `Company` → `Studio`                      | `e2e/marketing.spec.ts:62`             | `npx playwright test e2e/marketing.spec.ts -g "footer has 5 nav columns"`    |
| E2E-D-108 | LDP naming-discipline note                               | `CLAUDE.md` (Backend Supabase section) | `npm run typecheck && npm run lint` (no behavior change to verify; doc-only) |

**Combined regression run:**

```bash
cd /Users/julianclarkson/Documents/flyingbluewhale && \
  npx playwright test e2e/marketing.spec.ts --reporter=list
```

**Expected:** 7/7 marketing tests pass (was 4/7 pre-fix). Other specs unaffected (no shared fixture changes).

---

## Defects deferred (not in-loop fixed)

These do NOT require regression because they were not modified:

| Defect ID                       | Reason deferred                                                                        |
| ------------------------------- | -------------------------------------------------------------------------------------- |
| E2E-D-004 (i18n cookie)         | S2 shared scope; runtime change in request lifecycle requires inspection beyond budget |
| E2E-D-005 (i18n RTL)            | Same root cause as E2E-D-004                                                           |
| E2E-D-006 (SSO copy regression) | S2 brand-sensitive content; user judgment call required (revert vs ship feature)       |
| E2E-D-100..107 (LDP migrations) | Schema migrations always-deferred per E2E-LRP §PHASE 5                                 |
| E2E-D-101 (50+ status renames)  | Wave 2/3 of LDP_REMEDIATION_PLAN; not addressed this run                               |

---

## Composition contract integrity

The composition contracts referenced in `E2E_TEST_PLAN.md` X-1 through X-14 — none were modified or newly verified this run. The migrations that would enable cross-contract testing (asset_movements, engagement_state, financial_periods, subscriptions) are committed as files but unapplied; therefore composition-side regression is N/A.

Existing composition coverage (per the existing harness) remains intact:

| Contract                                | Existing coverage                 | Regression status                     |
| --------------------------------------- | --------------------------------- | ------------------------------------- |
| audit_log emission per state transition | `audit-log.spec.ts`               | ✅ unchanged (no audit code modified) |
| Cross-shell handoff                     | `handoff-shells.spec.ts`          | ✅ unchanged                          |
| RLS cross-org boundary                  | `rls-boundaries.spec.ts`          | ✅ unchanged                          |
| CMS → portal data flow                  | `cms-to-portal-roundtrip.spec.ts` | ✅ unchanged                          |

---

## UAP audit log integrity

No new audit_log writes occurred in this session (no live database connection from worktree; tests run from parent repo against current main, which is the prior-UJV-passing state). Audit log integrity inherited from UJV's `04_REGRESSION.md` baseline.

---

## Outcome

- ✅ All in-loop fixes are local-scope test rewrites; no production code touched.
- ✅ No regression risk to other specs from the 3 marketing-test edits.
- ⏳ Final regression numbers: appended to `E2E_RUN_SUMMARY.md` once the full Playwright run drains and the post-fix marketing rerun confirms 7/7.
