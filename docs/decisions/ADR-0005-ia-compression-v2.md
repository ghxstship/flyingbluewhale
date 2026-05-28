# ADR-0005 — IA Compression v2: nav consolidation + portal super-persona collapse

**Status:** Accepted
**Date:** 2026-05-28
**Owner:** Platform engineering
**Supersedes:** ADR-0004 §"Portal — collapse 12 personas → 4 super-personas" (specced, never executed); unshipped residue of `docs/ia/03-ia-compression-proposal.md`

## Context

ADR-0004 (2026-05-10) shipped the XPMS-native sidebar — 10 classes × 8 phases — and explicitly approved a portal super-persona collapse and a phase-aware mobile Tools sheet as migration sequence steps 5 and 6. Neither shipped. Eighteen rounds of feature delivery later, the cost of skipping those steps is visible in the audit:

- **Console** (`/console`): 626 page routes, 11 sidebar groups, **66 top-level URL prefixes** — roughly 30 of which have real pages but no nav entry. The two largest classes (0 EXECUTIVE, 6 OPERATIONS) carry 33 and 37 leaves respectively across 4–6 sections.
- **Portal** (`/p/[slug]`): 108 routes, 15 personas. Every persona rail prepends the same 6 shared items (Overview, Guide, Updates, Inbox, Tasks, Messages) before any persona-specific work — Miller's band is spent before the persona shows up.
- **Mobile** (`/m`): 5-tab bar (good), 32 entries in `mobileSurfaces` (a stealth second nav), three near-twin routes (`/m/check-in`, `/m/checkin`, `/m/clock`).

Click-depth in the URL is not the problem — auto-expand + ⌘K make leaves reachable in ≤ 3 clicks. **Breadth at the top is the problem.** Operators scan-then-click instead of recognize-then-click because each sidebar group asks them to evaluate 8–14 sibling labels.

## Decision

Four consolidation moves, one ADR. Each move is a separate commit on `main` (trunk-based, per project convention).

### Move 1 — Console: sub-section the bloated classes

Apply the same `NavGroup.sections` pattern already used by 0 EXECUTIVE and 6 OPERATIONS to two more classes, and rebalance the existing sections so no section exceeds Miller's ceiling:

| Class                 | Before                                                 | After                                                                                                                                                                                                          |
| --------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0 EXECUTIVE → Finance | 14 flat                                                | Receivables (Invoices, Pay Apps, Lien Waivers, E-Sign, AP-OCR) · Payables (Expenses, Payouts) · Planning (Budgets, WIP, Forecasts, Periods, Reports) · Time & Payroll (Time, Certified Payroll, Subscriptions) |
| 6 OPERATIONS → Safety | 8 flat                                                 | Operational (Incidents, Crisis, Medical, Safeguarding) · Compliance (Inspections, OSHA 300, Briefings, Playbooks)                                                                                              |
| 3 MARKETING           | Marketplace + Job Postings + Open Calls as 3 siblings  | One "Marketplace" entry → tabbed landing at `/console/marketplace`                                                                                                                                             |
| 2 TALENT → Bookings   | 5 flat (Bookings, Deals, Holds, Calendar, Settlements) | One "Bookings" entry → tabbed landing at `/console/bookings`                                                                                                                                                   |

URL preservation: all sub-routes (`/console/bookings/deals`, etc.) remain reachable; the tabbed landing is a new orchestration page, not a route rewrite.

### Move 2 — Console: orphan prefix hoist + dedupe

Promote real-but-unreferenced prefixes into the nav under their canonical class, delete or redirect dead ones. Concretely:

| Prefix                       | Canonical home                                | Notes                              |
| ---------------------------- | --------------------------------------------- | ---------------------------------- |
| `/console/operations`        | 6 OPERATIONS → Coordination                   | Hub already exists; surface in nav |
| `/console/services/requests` | 6 OPERATIONS → Coordination as "Service Desk" | Real surface                       |
| `/console/dashboards`        | Workspace chrome → Dashboard sub-section      | Generic dashboards listing         |
| `/console/templates`         | 1 CREATIVE                                    | Project templates library          |
| `/console/photos`            | 4 BUILD                                       | Photo log                          |
| `/console/import`            | Settings → Billing & Data                     | Already related to Exports         |
| `/console/meetings`          | 6 OPERATIONS → Coordination                   | Real surface                       |
| `/console/forms`             | 6 OPERATIONS → Coordination                   | Form builder                       |
| `/console/action-items`      | 6 OPERATIONS → Coordination                   | Action-items rollup                |
| `/console/ops/toc`           | 6 OPERATIONS → Coordination as "TOC"          | Keep URL; surface in nav           |

Dashboard group dedupe: collapse "Inbox" (→ `/me/notifications/inbox`) + "Messages" (→ `/console/inbox`) → one "Notifications" entry + one "Threads" entry, both clearly labeled.

### Move 3 — Portal: super-persona collapse (15 → 4)

Execute ADR-0004 step 5. Add a `SuperPersona` type and a `superPersonaOf(p)` mapping. Rewrite `portalNav(slug, persona)` to return `NavGroup`-shaped sections so the rail can render a "Workspace" section (the shared 6) above the persona-scoped section. Extend `PortalRail` to render `NavGroup` (sections + items) instead of flat `NavItem[]`.

| Super-persona | XPMS class     | Sub-personas                                                   |
| ------------- | -------------- | -------------------------------------------------------------- |
| **buyer**     | MARKETING (3)  | client, sponsor, promoter, stakeholder                         |
| **talent**    | TALENT (2)     | artist, athlete, delegation, vip, hospitality, media, producer |
| **workforce** | OPERATIONS (6) | vendor, crew, volunteer                                        |
| **audience**  | EXPERIENCE (7) | guest                                                          |

**URLs preserved.** `/p/[slug]/<sub-persona>/...` continues to resolve. Only the rail's grouping and the rail title change ("Buyer" / "Talent" / "Workforce" / "Audience" replaces 15 individual titles). Sub-persona-specific routes stay in their sub-persona's section of the rail.

### Move 4 — Mobile: label dedupe + phase-aware Tools

Audit corrected: the three near-twin routes are not spelling drift, they are three distinct surfaces with collision-prone labels.

| Route         | Purpose                               | New label     |
| ------------- | ------------------------------------- | ------------- |
| `/m/clock`    | Punch in/out (writes `time_entries`)  | "Clock In"    |
| `/m/checkin`  | Read-only meal-credit + break summary | "Meal Credit" |
| `/m/check-in` | Camera-based ticket scanner           | "Ticket Scan" |

No routes are deleted. The fix is the labels in `mobileSurfaces` so operators can tell them apart at a glance instead of having to remember which dash spelling does what.

Add `mobileSurfacesForPhase(phase: XpmsPhase)` to `src/lib/nav.ts` — a pure-data helper that returns `mobileSurfaces` reordered so the surfaces most-used in the active project's phase float to the top:

| Phase                                       | Floated-to-top                                                  |
| ------------------------------------------- | --------------------------------------------------------------- |
| Build                                       | Punch · Daily Log · Driver · Handover · Chain of Custody · WMS  |
| Show                                        | Gate Scan · Incidents · Run of Show · Medic · Clock In · Alerts |
| Strike                                      | Punch · Daily Log · Handover · Chain of Custody · WMS           |
| Wrap                                        | Time Off · Kudos · Onboarding · Updates · Surveys               |
| Discovery / Concept / Development / Advance | Communications + onboarding-first                               |

The mobile Tools sheet calls this helper with `projects.xpms_phase` from the active project context.

## Acceptance criteria

Before each commit ships:

- [ ] `npm run typecheck` green.
- [ ] `npm run lint` green.
- [ ] `npm run test` green (especially `src/lib/__tests__/xpms-portal-mapping.test.ts` — extend to cover `superPersonaOf`).
- [ ] `npm run build` green.
- [ ] Every URL that resolved before the change still resolves. Nav re-grouping is not a route rewrite.
- [ ] Console sidebar: every class shows ≤ 7 visible leaves at rest (sub-sections collapse the rest behind their section label).
- [ ] Portal rail: every persona's rail has ≤ 7 visible items at rest in the persona-scoped section (the shared 6 live in their own collapsible "Workspace" section above).
- [ ] Mobile `mobileSurfaces` ordering reads `xpms_phase` from the active project context.

## Non-goals

- No URL renames. `/console/bookings/deals` stays `/console/bookings/deals`; the change is the sidebar treatment, not the route.
- No schema changes. Portal persona enum stays at 15.
- No portal dashboard-template work beyond what is already shipped via `dashboardForClass()`.
- No marketing or auth shell touch.

## Open questions

1. Should the phase-aware Tools sheet on mobile pre-compute order server-side or client-side? Decision: server-side via the project-context cookie used by `<PhaseStepper />`, so first paint is correct.
2. Does the portal super-persona collapse warrant a redirect from `/p/[slug]` (root) to `/p/[slug]/<inferred sub-persona>/...`? Out of scope for this ADR — sub-persona routing is already done in `auth/resolve`.
3. Do we ever collapse the 15 sub-personas to 4 at the schema layer too? Not yet — the sub-persona enum carries semantic meaning (rider profile, visa requirement, etc.) the super-persona doesn't.
