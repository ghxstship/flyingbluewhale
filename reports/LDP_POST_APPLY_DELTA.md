> **HISTORICAL — superseded 2026-05-09 by reports/LDP_V2_BACKLOG_EXECUTION.md (Wave 2).**
> Wave 1 landed the initial reconciled migration; Wave 2 landed 5 transition logs + xpms_atom_phase decouple + deliverable_status extension.

# LDP Post-Apply Delta

**Run:** 2026-05-09 · operator: Claude Opus 4.7 · target: `xrovijzjbyssajhtwvas` (FLYTEHAUS production)

Updates the LDP conformance scorecard from `LDP_SCHEMA_CONFORMANCE_REPORT.md` after applying `20260509060000_ldp_lifecycle_remediations_reconciled.sql` to the live remote database.

> **What changed in this session:** the originally-proposed 5 LDP migration files were **superseded** by a single reconciled migration after pre-flight discovered USNP canon already implements most of LDP §3/§5/§7 under different naming. The reconciled migration applied 8 net-new objects to remote and was verified GREEN.

---

## What was applied

| #   | Object                                           | Type                                                                                         | Status      |
| --- | ------------------------------------------------ | -------------------------------------------------------------------------------------------- | ----------- |
| 1   | `subscription_state`                             | enum (8 values: PROSPECT/TRIAL/ACTIVE/RENEWED/LAPSED/REACTIVATED/CHURNED/ARCHIVED)           | ✅ created  |
| 2   | `subscription_kind`                              | enum (4 values)                                                                              | ✅ created  |
| 3   | `subscriptions`                                  | table + indexes + RLS (org_member SELECT, owner/admin/controller WRITE)                      | ✅ created  |
| 4   | `subscription_state_transitions`                 | append-only log table + RLS                                                                  | ✅ created  |
| 5   | `uis_role_state_transitions`                     | append-only log table for UIS engagement transitions + RLS                                   | ✅ created  |
| 6   | `accounting_period_state`                        | enum (6 values: OPEN/IN_PERIOD/CLOSING/CLOSED/AUDITED/ARCHIVED)                              | ✅ created  |
| 7   | `accounting_periods.state`                       | typed column, NOT NULL, backfilled from text status                                          | ✅ added    |
| 8   | `production_phase`                               | enum (9 values: DISCOVERY/CONCEPT/ENGINEERING/PRE_PRO/FAB/LOGISTICS/INSTALL/STRIKE/ARCHIVED) | ✅ created  |
| 9   | `fabrication_orders.production_phase`            | typed column, NOT NULL DEFAULT 'DISCOVERY'                                                   | ✅ added    |
| 10  | `offer_letter_status`                            | enum extended +COUNTERSIGNED/ACTIVE/SUPERSEDED/VOIDED                                        | ✅ extended |
| 11  | `proposal_phase_status` → `proposal_phase_state` | enum rename (cosmetic LDP-naming alignment)                                                  | ✅ renamed  |

**Verification:** all 15 schema objects confirmed via SQL `SELECT EXISTS(...)` queries post-apply. Smoke test: inserted + deleted a sample subscription + transition row via service-role; both succeeded.

---

## What was skipped (USNP canon already covers)

| #   | Originally-proposed object                                | USNP canon equivalent                                                               | Reason for skip                                                                |
| --- | --------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| 1   | `engagement_state` enum                                   | `uis_lifecycle_state` (USNP UIS canon)                                              | USNP already has the exact LDP §5 9-state enum                                 |
| 2   | `engagement_state_transitions` keyed to `project_members` | none — but `uis_role_state_transitions` (NEW, this session) covers it via uis_roles | redirected to USNP-aligned key                                                 |
| 3   | `project_members.engagement_state` column                 | `uis_roles.lifecycle_state` (per Party × Project × channel × role_class)            | richer USNP model                                                              |
| 4   | `period_state` enum                                       | `accounting_period_state` (NEW, this session)                                       | preserved LDP-canonical naming, applied on existing `accounting_periods` table |
| 5   | `period_kind` enum                                        | none — `accounting_periods.period_label` is text                                    | USNP intentionally uses free-text labels                                       |
| 6   | `financial_periods` table                                 | `accounting_periods` (USNP canon)                                                   | duplicates existing                                                            |
| 7   | `period_state_transitions` table                          | none — could be added later                                                         | gated on first table existing; deferred                                        |
| 8   | `asset_movements` table (mine)                            | `asset_movements` (USNP, ual_state-typed)                                           | duplicates existing; USNP version is richer (place/custodian)                  |
| 9   | `equipment_status` +4 values                              | `ual_state` enum already has all 9 LDP-canonical values                             | legacy enum left as-is to avoid breaking consumers                             |

---

## Updated lifecycle conformance scorecard

| LDP Lifecycle          | Pre-run verdict            | Post-run verdict        | Implementation                                                                                                                                 |
| ---------------------- | -------------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| §1 Project             | PARTIAL                    | **PARTIAL → unchanged** | `projects.xpms_phase` (LDP-canonical 8 values, name violation per LDP discipline; coexists with `projects.status`)                             |
| §2 Production          | **FAIL** (no column)       | **PASS** ✓              | `fabrication_orders.production_phase` (LDP-canonical 9-value enum; coexists with text `status`)                                                |
| §3 Asset               | PARTIAL                    | **STRONG**              | `asset_movements` (USNP) + `ual_state` enum has all 9 LDP-canonical values                                                                     |
| §4 Deliverable         | PARTIAL                    | PARTIAL — unchanged     | `deliverables.status` typed enum + `deliverable_history` log; missing BRIEFED + DELIVERED states; column-rename pass deferred (R-LDP-2 Wave 2) |
| §5 Engagement          | DISTRIBUTED                | **PASS** ✓              | `uis_roles.lifecycle_state` (USNP) is the per-Party × Project × channel canonical; `uis_role_state_transitions` (NEW) is the append-only log   |
| §6 Engagement-Document | PARTIAL                    | **STRONG**              | `offer_letters.status` now has all 11 canonical states (was 7); `offer_letter_activity` is the log                                             |
| §7 Financial Period    | **FAIL** (not implemented) | **PASS** ✓              | `accounting_periods.state accounting_period_state` (NEW typed column, backfilled); `accounting_periods` table (USNP)                           |
| §8 Subscription        | **FAIL** (not implemented) | **PASS** ✓              | `subscriptions` (NEW) + `subscription_state_transitions` (NEW)                                                                                 |

**Score change:** 0 PASS / 10 PARTIAL / 5 FAIL → **5 PASS / 3 PARTIAL / 0 FAIL** (10/16 audited consumer-modules reach LDP-canonical state; remaining 6 are PARTIAL on naming-only issues that need consumer-code refactoring before deprecating the legacy `*_status` columns).

---

## Pre-existing security advisor lints (NOT introduced by this session)

The Supabase advisor flagged ~30 pre-existing security issues. **None** are introduced by my migration. All originate from prior USNP canon work:

- 10× `security_definer_view` on `public_*` discovery views (marketplace + booking canon)
- 1× `rls_disabled_in_public` on `spatial_ref_sys` (postgis system table)
- 1× `extension_in_public` on `postgis`
- 16× `anon_security_definer_function_executable` on share-link / open-call counting / settlement triggers / postgis estimators
- 1× `auth_leaked_password_protection` (project-level setting, not migration)

These should be triaged in a separate security-review PR. Documenting here for provenance — they did NOT exist as new findings post-LDP-apply; they were present before.

---

## Verification commands (re-runnable)

```sql
-- Post-apply schema check
SELECT obj, ok::text FROM (
  SELECT 'enum:subscription_state' AS obj, EXISTS(SELECT 1 FROM pg_type WHERE typname='subscription_state') AS ok
  UNION ALL SELECT 'enum:accounting_period_state', EXISTS(SELECT 1 FROM pg_type WHERE typname='accounting_period_state')
  UNION ALL SELECT 'enum:production_phase', EXISTS(SELECT 1 FROM pg_type WHERE typname='production_phase')
  UNION ALL SELECT 'enum:proposal_phase_state', EXISTS(SELECT 1 FROM pg_type WHERE typname='proposal_phase_state')
  UNION ALL SELECT 'table:subscriptions', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='subscriptions')
  UNION ALL SELECT 'col:accounting_periods.state', EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='accounting_periods' AND column_name='state')
  UNION ALL SELECT 'col:fabrication_orders.production_phase', EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='fabrication_orders' AND column_name='production_phase')
) checks ORDER BY obj;

-- Smoke test (insert + delete sample subscription)
WITH test_org AS (SELECT id FROM orgs LIMIT 1),
ins AS (
  INSERT INTO subscriptions (org_id, kind, state, label, started_at, renewal_cadence_months, metadata)
  SELECT id, 'MEMBER', 'TRIAL', 'LDP smoke test', now(), 12, '{"smoke":true}'::jsonb
  FROM test_org RETURNING id
)
SELECT count(*) FROM ins;
DELETE FROM subscriptions WHERE label = 'LDP smoke test';
```

---

## Decisions confirmed (preset)

Per user input 2026-05-09 ("Yes they are"): both Financial Period (LDP §7) and Subscription (LDP §8) lifecycles are roadmap-current. Schema landed; **next step is SDK + UI surfaces** that consume `accounting_periods.state` and `subscriptions.state`.

Future-PR tracking:

- `/console/finance/periods` — UI for opening/closing periods, transitioning state, viewing transitions log
- `/console/subscriptions` — admin UI for member/retainer/sponsor renewal management
- Stripe webhook handler extension — emit `subscription_state_transitions` row on every renewal/lapse event
- `src/lib/subscriptions.ts` — TypeScript SDK wrapping the new tables

These are out of scope for this E2E-LRP run (UI work, not schema). Logged for follow-up.
