# E2E-LRP Preset

**Status:** canonical · **Applies to:** `flyingbluewhale` (FLYTEHAUS Technologies) · **Authority:** user-confirmed 2026-05-09

This is the durable answer-set for the 6 inputs the [E2E-LRP protocol](../../Downloads/CLAUDE_CODE_PROMPT__E2E_LRP.md) requires. Future runs of E2E-LRP against this codebase should use these defaults unless the user explicitly amends them.

---

## Q1 — Production Lifecycle sequence

**Answer: (c) — both lifecycles exist as distinct state machines.**

- LDP §1 Project Lifecycle = `xpms_phase` enum (event-production sequence: discovery → concept → development → advance → build → show → strike → wrap). Owns the macro project arc.
- LDP §2 Production Lifecycle = `production_phase` enum (fab-shop sequence: DISCOVERY → CONCEPT → ENGINEERING → PRE_PRO → FAB → LOGISTICS → INSTALL → STRIKE → ARCHIVED). Owns the build-side production arc per fabrication order. Lives on `fabrication_orders.production_phase` (added 2026-05-09).

When a future protocol or proposal mentions "the 8-phase lifecycle", this codebase has **two**, and the speaker must specify which.

---

## Q2 — Engagement Lifecycle implementation

**Answer: (a) — per-channel state machines remain authoritative; cross-channel summary lives on `uis_roles.lifecycle_state`.**

- Channel-specific state continues to live on `talent_offers.status`, `job_applications.status`, `open_call_submissions.status`, `invites.status` per channel-internal gates.
- Cross-channel canonical engagement state lives on `uis_roles.lifecycle_state` (USNP canon, shipped 2026-05-08). Enum `uis_lifecycle_state` matches LDP §5 verbatim: `discovered, interested, vetted, committed, enabled, confirmed, active, closed, archived`.
- Append-only transitions log: `uis_role_state_transitions` (added 2026-05-09).

Any new code that needs to ask "what state is this party-in-this-project in?" reads `uis_roles.lifecycle_state`, not the per-channel statuses.

---

## Q3 — Financial Period Lifecycle

**Answer: YES — roadmap-current. Implemented.**

- Storage: `accounting_periods` table (USNP canon, shipped 2026-05-08).
- LDP-canonical state: `accounting_periods.state accounting_period_state` (added 2026-05-09; values OPEN/IN_PERIOD/CLOSING/CLOSED/AUDITED/ARCHIVED). Backfilled from existing text `status` column.
- Legacy `accounting_periods.status text` retained read-only for back-compat during the migration window.
- No transitions log table for this lifecycle yet (could be added if audit traceability demands).

---

## Q4 — Subscription Lifecycle

**Answer: YES — roadmap-current. Implemented.**

- Storage: `subscriptions` table (added 2026-05-09).
- State enum `subscription_state`: PROSPECT/TRIAL/ACTIVE/RENEWED/LAPSED/REACTIVATED/CHURNED/ARCHIVED.
- Kind enum `subscription_kind`: MEMBER / RETAINER / RECURRING_SPONSOR / PLATFORM_PLAN.
- Append-only transitions log: `subscription_state_transitions` (with `stripe_event_id` column for Stripe-correlated transitions).
- RLS: org-scoped reads via `is_org_member`; writes restricted to owner/admin/controller via `has_org_role`.

---

## Q5 — Seed strategy for synthetic test runs

**Answer: (a) — namespaced disposable demo org per run.**

- Naming: `E2E_LRP_<YYYY_MM_DD>` org / project slug prefix.
- Hard-block on production project ref `xrovijzjbyssajhtwvas` in [seeds/e2e_lifecycle/seed.ts](../seeds/e2e_lifecycle/seed.ts) and [teardown.ts](../seeds/e2e_lifecycle/teardown.ts).
- Teardown by `metadata->>seed_run_id` match — no risk to non-namespaced records.

---

## Q6 — Phase 2 execution depth

**Answer: (a) — full Role × Channel × phase execution per protocol budget.**

- 7 Roles × 8 Phases × {positive, RBAC, validation, idempotency, concurrency} = ~280 cases.
- Composition cases X-1 through X-14 included.
- Time budget bounded but not capped to a slim slice; the protocol's "complete highest-priority slice and report deferred" applies if execution overshoots.

---

## How to use this preset

When next invoking E2E-LRP against this codebase, the agent should treat Q1–Q6 above as resolved unless the user explicitly amends. The protocol still requires explicit confirmation of:

- **Archetype** (real vs synthetic)
- **In-scope subsystems** (FLYTEHAUS-native list per [docs/XPMS_TO_FLYTEHAUS_MAPPING.md](XPMS_TO_FLYTEHAUS_MAPPING.md))
- **Browser harness** (Playwright is the canonical choice; already installed)
- **Environment** (local dev `lvh.me:3000` with subdomains)
- **Time budget** (default 4h, max 8h per protocol)

---

## Audit trail

| Date       | Change                                                        | Source                                                                                                         |
| ---------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 2026-05-09 | Initial preset created from PHASE_0_EXIT_SUMMARY.md decisions | User-confirmed in turn "1) preset for future · 2) apply all migrations locally and remotely · 3) Yes they are" |
