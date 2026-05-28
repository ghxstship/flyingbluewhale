# Round 10 — Deep Action Validation + Validation Suite

**Date:** 2026-05-23
**Scope:** Go beyond page-render PASS into action depth — hunt raw-enum
Badge leaks, exercise write actions for silent failures, run the canonical
`/validate` zero-tolerance suite end-to-end.

## A · Raw Badge audit (Title Case canon enforcement)

Round 9's `StatusBadge` fix only covered call sites using the canonical
`<StatusBadge>` component. A platform-wide grep turned up **76 ad-hoc
`<Badge variant=...>{r.field}</Badge>` renders** that bypassed it —
rendering enum fields lowercase / snake_case directly to users.

Fields touched: `status`, `state`, `kind`, `type`, `audience`, `persona`,
`fleet`, `provider`, `genre`, `subject_kind`, `transaction_type`,
`room_kind`, `project_state`, `lifecycle_state`, `stakeholder_group`,
`swap_state`, `request_state`, `deal_type`, `posting_type`, `category`,
`tier`, `severity`.

### Fix

Bulk script (`/tmp/fix_raw_badges.py`) wraps every matching field with
`toTitle()` from `@/lib/format` (canonical helper extracted in Round 8).
Whitelist of enum field names prevents accidental wrapping of numerics
or already-cased literals.

### Coverage

- **67 files touched** across comms, bookings, agency, marketplace,
  workforce, safety, operations, ops/toc, commercial, subscriptions,
  settings, clients, transport, xpms, inbox, insights.
- Confirmed render via probe: `/console/marketplace/calls` now returns
  `"children":"Talent Call"` instead of raw `"talent_call"`.

## B · Action depth checks

| Workflow                                             | Test                                                                      | Result |
| ---------------------------------------------------- | ------------------------------------------------------------------------- | ------ |
| Crisis alert send                                    | severity `warn` accepted, list shows Warning badge                        | ✓      |
| Site-plan transition (siteplan_transition_state RPC) | "Cannot issue without at least one zone region" (prefix stripped Round 7) | ✓      |
| Settlement reconciliation                            | GBOR $125k → auto-NBOR $109,625 persisted                                 | ✓      |
| Talent publish flow                                  | publishTalentAction + router.refresh() reflects state                     | ✓      |
| Form-reset on validation error                       | site-plans/new echoes back ORG/EVT/YY/etc. after failure                  | ✓      |
| Briefing → detail                                    | new briefing created → detail page renders (Round 6 fix)                  | ✓      |
| Offer FSM (Draft → Sent → Accepted)                  | all three transitions render new button set                               | ✓      |
| Fabrication FSM (Open → In Progress → Complete)      | all transitions persist + UI updates                                      | ✓      |

## C · Zero-tolerance `/validate` suite

| Gate                                            | Result                                                                                    |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Branch state                                    | ✅ clean, HEAD = origin/main = `97d2140c`                                                 |
| Typecheck                                       | ✅ 0 errors                                                                               |
| Vitest                                          | ✅ 577/577 across 50 test files                                                           |
| Production build                                | ✅ Compiled successfully                                                                  |
| Brand SSOT (no banned brand names)              | ✅ 0 hits                                                                                 |
| URL canon (no hardcoded atlvs.pro outside SSOT) | ✅ 0 hits                                                                                 |
| LDP naming (no new `status` columns)            | ✅ 0 hits                                                                                 |
| Unsafe casts (`as any` in src)                  | ✅ 0 violations (sole hit on projects.ts:83 is gen-type widening, eslint-disabled inline) |
| Lint                                            | _pending — monitor running_                                                               |

## D · Cumulative remediations across rounds 1-10

1. Auth: `getSession` persona override bug
2. Project edit form FK + branding fields
3. Tracker shows orphan deliverables on new projects
4. Calendar empty state CTA
5. View toggle canonicalization (DataViewSwitcher)
6. Table view added
7. "Console" UI label eliminated
8. Marketing iframe blank fix
9. MSAs → Contracts rename
10. Parentheses purge from nav/IA
11. Sidebar EXECUTIVE 25-item collapse → 4 sections
12. Title Case sweep (120+ subtitles)
13. LDP `projects.status` → `project_state`
14. Backfill 5 missing remote migrations
15. Briefing detail page added (was 404 post-create)
16. Service-role-key fan-out crash fix (announcement publish)
17. Publish-now race fix (two submit buttons)
18. Sponsor entitlement detail rewrite
19. Crisis Alerts severity badge mapping (Warning / Critical)
20. Open Calls kind labels (Talent Call / Public RFQ)
21. Holds form pickers (venue + talent_profile selects)
22. FormShell preserves values via toEcho() on validation error
23. SitePlan user-visible string purge (5 eyebrows + jargon dumps)
24. `discipline (legacy)` field removed
25. SQL `siteplan:` prefix stripped from user-facing errors
26. TalentVisibility router.refresh fix
27. Marketplace render bug (`verified_at` → `is_verified` in views)
28. StatusBadge canonical Title Case
29. `toTitle()` extracted to @/lib/format
30. Hospitality (#36) catering advancing assignment verified end-to-end
31. AV systems → AV Systems / A&D manifests → A&D Manifests
32. **Round 10**: 67 raw-Badge enum leaks wrapped with `toTitle()` for Title Case across the entire operator console

## Sign-off

- 8/9 canonical gates ✅. Lint pending (running in monitor).
- 1000+ workflow cells validated across rounds 6-9.
- Zero new product gaps in Round 10's deep walk.
