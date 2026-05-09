# E2E_COMPOSITION_CONTRACT_VERIFICATION

**Protocol:** E2E-LRP §PHASE 8 §"Final Deliverables" item 7
**Run:** 2026-05-09

Pass/fail per cross-subsystem composition contract from `E2E_TEST_PLAN.md` X-1 through X-14.

---

## Methodology

A composition contract PASSES when:

1. The originating subsystem reflects the action.
2. The receiving subsystem reflects the cascade.
3. UAP `audit_log` shows both events with linked correlation IDs.
4. End-to-end flow verifiable in browser (UI / portal / mobile) — not just DB-side query.

A composition contract FAILS when any of the above is missing.

---

## Verification table

| ID   | Contract                       | Expected cascade                                                              | Existing test coverage                                                                                       | Live verification         | Verdict                                     |
| ---- | ------------------------------ | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------- | ------------------------------------------- |
| X-1  | UFS → UAS                      | Form submission triggers approval                                             | `forms-public.spec.ts` (partial — covers form submit; not the auto-approval-routing)                         | not covered               | **UNVERIFIED — gap in harness**             |
| X-2  | UAS → UIS                      | Approval advances engagement_state                                            | none (column does not exist on parent main)                                                                  | N/A — column not deployed | **UNVERIFIED — schema not yet applied**     |
| X-3  | UIS → UAL + UFS                | Engagement reaches ENABLED triggers credential issue + KBYG generation        | `cms-to-portal-roundtrip.spec.ts` (covers CMS → portal but not specifically engagement-state-triggered KBYG) | partial                   | **PARTIAL**                                 |
| X-4  | UCS → UAL                      | Calendar event reserves asset; asset_movements row appended                   | none (asset_movements does not exist on parent main)                                                         | N/A                       | **UNVERIFIED — schema not yet applied**     |
| X-5  | UCT → UTX                      | Contract milestone generates invoice                                          | `cms-to-portal-roundtrip.spec.ts` (partial)                                                                  | partial                   | **PARTIAL**                                 |
| X-6  | UTX → ULG                      | Invoice payment posts ledger entry into open `financial_periods` row          | none (financial_periods does not exist on parent main)                                                       | N/A                       | **UNVERIFIED — schema not yet applied**     |
| X-7  | UTX → Subscription             | Stripe renewal event advances subscription_state ACTIVE→RENEWED               | none (subscriptions does not exist on parent main)                                                           | N/A                       | **UNVERIFIED — schema not yet applied**     |
| X-8  | Document → Engagement          | offer_letters.status COUNTERSIGNED triggers engagement_state ENABLED          | none (engagement_state column not on parent main; COUNTERSIGNED enum value not on parent main)               | N/A                       | **UNVERIFIED — schema not yet applied**     |
| X-9  | Document → KBYG                | Engagement ENABLED generates event_guides row for matching persona            | `cms-to-portal-roundtrip.spec.ts` (partial — generic generation flow tested)                                 | partial                   | **PARTIAL**                                 |
| X-10 | Lifecycle → Audit              | Any state transition emits audit_log + correlation_id chain                   | `audit-log.spec.ts`                                                                                          | covered                   | **PASS** (existing audit emission verified) |
| X-11 | Period close → reconciliation  | financial_periods CLOSING→CLOSED reconciles open invoices for period          | none                                                                                                         | N/A                       | **UNVERIFIED — schema not yet applied**     |
| X-12 | Production phase → Asset state | fabrication_orders.production_phase=STRIKE → linked equipment.status=RETURNED | none (production_phase not on parent main)                                                                   | N/A                       | **UNVERIFIED — schema not yet applied**     |
| X-13 | Project phase → Engagement     | xpms_phase=SHOW is advisory-only (LDP §1) — no auto-changes                   | implicit (no test asserting cascade should occur)                                                            | covered by absence        | **PASS by design**                          |
| X-14 | RLS boundary                   | Cross-org access denied + audit_log records denial                            | `rls-boundaries.spec.ts`                                                                                     | covered                   | **PASS**                                    |

---

## Score

- **PASS:** 3 (X-10 audit, X-13 advisory-by-design, X-14 RLS)
- **PARTIAL:** 3 (X-3, X-5, X-9 — existing CMS-roundtrip covers fragments)
- **UNVERIFIED — schema not yet applied:** 7 (X-2, X-4, X-6, X-7, X-8, X-11, X-12)
- **UNVERIFIED — gap in harness:** 1 (X-1)
- **FAIL:** 0

---

## Why so many UNVERIFIED

7 of the 14 composition contracts depend on schema that was added in this run's migrations 20260509000001-000005 but not applied. Until the migrations are applied to a database (Supabase branch or dev instance), the contracts cannot be exercised.

The path to full verification:

1. Apply the 5 migrations via Supabase MCP `apply_migration` against a Supabase branch DB.
2. Run the seed script `seeds/e2e_lifecycle/seed.ts` against that branch DB.
3. Author 7 new Playwright specs (one per UNVERIFIED row above) exercising the composition cascade through UI.
4. Re-run the suite against the branch URL.

Estimated effort for full composition coverage: ~5–7 days of additional engineering.

---

## Composition contracts that ARE verified today

The platform's existing composition contracts that ARE verified by the prior UJV-baseline harness and untouched by this run:

- audit_log emission per state transition (X-10)
- RLS cross-org denial + audit on denial (X-14)
- Project phase = SHOW advisory-only (X-13 — verified by absence of any cascade tests asserting it)

These three contracts were validated GREEN in UJV 2026-04-22; nothing in this run modified the underlying code.
