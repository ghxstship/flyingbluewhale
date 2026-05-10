# ADR-0004 — XPMS-native navigation: 10 Classes × 8 Phases

**Status:** Accepted
**Date:** 2026-05-10
**Owner:** Platform engineering
**Supersedes:** the implicit "11 verb-shaped sidebar groups" model in [src/lib/nav.ts:143](src/lib/nav.ts:143)

## Context

The current console sidebar (`platformNav` in [src/lib/nav.ts:143](src/lib/nav.ts:143)) is an 11-group verb-shaped IA — Dashboard, Plan, Run, Safety, Logistics, People, Production, Procurement, Commerce, Bookings, Reference. Two structural problems:

1. **No time axis.** Nav has no awareness of where the active project is in its lifecycle. Every leaf is "always visible," regardless of whether the project is in Discovery (where Sourcing is irrelevant) or in Show (where Concept is closed). Operators scroll past inapplicable surfaces all day.

2. **The verb groups don't match the spine.** XPMS is the canonical taxonomy of work — 10 Classes × 8 Phases, defined in [src/lib/xpms/index.ts:28](src/lib/xpms/index.ts:28) and the whitepaper. The current sidebar groups conflate classes (Commerce mixes MARKETING + EXECUTIVE-finance + EXPERIENCE-tickets in 18 leaves) and split classes (OPERATIONS sprayed across Run + Safety + Logistics + People as 4 separate sidebar groups).

Reference benchmarks:

- NetSuite (8–10 modules, drill-down)
- SAP S/4HANA Fiori (~10 catalog groups, tile-based launchpad)
- Workday (7 worklets, persona-pinned)
- Programa (5 features collapsed to 1 design-studio workflow)

None of these have a time axis. We can, because every project carries `xpms_phase`. That's a durable competitive moat.

## Decision

Adopt a **bi-axial XPMS-native nav** with two first-class axes both surfaced in chrome:

### Axis A — 10 XPMS Classes (the WHAT — sidebar)

The 10 classes from `XPMS_CLASSES` ([src/lib/xpms/index.ts:28](src/lib/xpms/index.ts:28)) become the sidebar groups, in published order:

| #   | Class       | Sidebar group                                                                                                                                                                                                                                                                     |
| --- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0   | EXECUTIVE   | Strategy · Finance · Procurement · Legal · HR · Compliance                                                                                                                                                                                                                        |
| 1   | CREATIVE    | Pinboards · Proposals · Templates · Branding · Schedules · Mood Boards                                                                                                                                                                                                            |
| 2   | TALENT      | Deal Tracker · Holds · Calendar · Settlements · Tours · Marketplace Talent · Offers · Rosters                                                                                                                                                                                     |
| 3   | MARKETING   | Leads · Clients · Campaigns · Sponsors · Marketing · Insights · Public Marketplace                                                                                                                                                                                                |
| 4   | BUILD       | Site Plans · Compounds · Yard · Fabrication · Structures · Wayfinding                                                                                                                                                                                                             |
| 5   | PRODUCTION  | Equipment · AV · Rentals · Run of Show · Live Dispatch                                                                                                                                                                                                                            |
| 6   | OPERATIONS  | Schedule · Look-ahead · Daily Log · Tasks · Annotations · RFIs · Punch · Workforce · Transport · Dispatch · Freight · Warehouse · Catering · Disposition · Visa · Delegations · Safety (Incidents · Crisis · Medical · Safeguarding · Inspections · OSHA · Briefings · Playbooks) |
| 7   | EXPERIENCE  | Hospitality · Tickets · Activations · Accreditation · Volunteer · Wayfind                                                                                                                                                                                                         |
| 8   | HOSPITALITY | F&B · Bar · Catering (artist/crew) · Lodging · VIP · Artist Hospitality                                                                                                                                                                                                           |
| 9   | TECHNOLOGY  | Automations · AI / Chat · Networking · IT/RF · Ticketing Connections · Data · API · Webhooks                                                                                                                                                                                      |

Class membership is determined by `XPMS_CLASSES[n].domain` ([src/lib/xpms/index.ts:31](src/lib/xpms/index.ts:31)). Where a single feature spans two classes (e.g. Catering spans OPERATIONS-flow and HOSPITALITY-care-of-body), the route surfaces in **both** sidebar groups; the canonical home is the class declared by the route's primary `xpms_atom_id` linkage.

### Axis B — 8 XPMS Phases (the WHEN — top chrome stepper)

The 8 phases from `XPMS_PHASES` ([src/lib/xpms/index.ts:118](src/lib/xpms/index.ts:118)) become a horizontal stepper at the top of the platform shell:

```
[ 1 Discovery ] · [ 2 Concept ] · [ 3 Development ] · [ 4 Advance ] · [ 5 Build ] · [ 6 Show ] · [ 7 Strike ] · [ 8 Wrap ]
```

The stepper is bound to the **active project's `projects.xpms_phase`** ([src/lib/xpms/index.ts:115](src/lib/xpms/index.ts:115) — enum: `discovery | concept | development | advance | build | show | strike | wrap`). When no project is selected, the stepper renders inactive.

Selecting a phase scopes the sidebar so that classes not live in that phase are dimmed with a "not in this phase" badge:

| Phase         | Live classes (highlighted)                                               |
| ------------- | ------------------------------------------------------------------------ |
| 1 Discovery   | EXECUTIVE (briefing) · CREATIVE (concept seed) · MARKETING (lead intake) |
| 2 Concept     | CREATIVE (full)                                                          |
| 3 Development | CREATIVE · PRODUCTION · BUILD (engineering) · EXECUTIVE (procurement)    |
| 4 Advance     | OPERATIONS · PRODUCTION · EXPERIENCE · HOSPITALITY                       |
| 5 Build       | BUILD · PRODUCTION · OPERATIONS                                          |
| 6 Show        | all 10 (peak operational state)                                          |
| 7 Strike      | BUILD · PRODUCTION · OPERATIONS                                          |
| 8 Wrap        | EXECUTIVE (financial close + archive)                                    |

### Cell — every workflow lives at one (Class × Phase) intersection

Every existing route gets a canonical `(class_code, phase_id)` home. Routes spanning multiple cells (e.g. `dashboard`, `cmd-k`) live in workspace chrome, not class sidebar.

A cell map appendix ([§Appendix A](#appendix-a--cell-map-existing-routes--class--phase)) below enumerates the 80 cells and which routes occupy each.

### Programa imports — each lands in a specific cell

| Programa primitive               | Cell                                                    | New table / surface                                                                                |
| -------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Pinboards / Mood Boards          | (CREATIVE × Concept)                                    | `pinboards`, `pinboard_items` (image / spec ref / note)                                            |
| Web Clipper + Product Library    | (EXECUTIVE × Development)                               | `vendor_products` (extends `vendors` with buyable rows + URL/spec/price/imagery)                   |
| Schedules as exportable artifact | (CREATIVE × Development) AND (PRODUCTION × Development) | extends `deliverables` with `rendered_pdf_path`, `rendered_xlsx_path`, `qr_token`                  |
| Branded Client Dashboard         | (MARKETING × Show)                                      | new `/p/[slug]/buyer` super-persona aggregating proposals + specs + budgets + approvals + comments |
| Approvals consolidation          | (EXECUTIVE × Development gate)                          | unified consumer of `approvals` table replacing per-domain primitives                              |

### Workspace chrome (right-hand)

- Project switcher (badge with phase chip: `MMW26 · Phase 4 Advance`)
- ⌘K universal jump
- XPMS Catalog chip (direct to `/console/xpms`)
- Workspace menu (Reference / Settings / Help)

### Settings stays its own shell

The dedicated 2-col `/console/settings/*` shell ([src/lib/nav.ts:316](src/lib/nav.ts:316)) keeps its 5-group structure (Workspace · Team & Access · Billing & Data · Integrations · Compliance). Workspace chrome only — not a class sidebar entry.

### Portal — collapse 12 personas → 4 super-personas (XPMS-class-aligned)

The 12 portal personas in `portalNav` ([src/lib/nav.ts:384](src/lib/nav.ts:384)) collapse to 4 super-personas, each aligned to its primary XPMS class:

| Super-persona | XPMS class            | Sub-personas                                         |
| ------------- | --------------------- | ---------------------------------------------------- |
| **buyer**     | MARKETING / EXECUTIVE | client, sponsor                                      |
| **talent**    | TALENT                | artist, athlete, delegation, vip, hospitality, media |
| **workforce** | OPERATIONS            | vendor, crew, volunteer                              |
| **audience**  | EXPERIENCE            | guest                                                |

Slug routing is preserved (`/p/[slug]/<sub-persona>` keeps working); the nav labels and dashboard layouts collapse to 4 templates.

## Migration sequence

1. **ADR + cell map** (this doc).
2. **Re-cluster `platformNav`** into 10 classes — one PR, URLs unchanged. The export name is preserved (`platformNav`); only the body changes. No alias, no deprecation cycle — the consumers (`PlatformSidebar`, layout) pass the array through unchanged, so a clean cut works.
3. **Phase stepper component** (`<PhaseStepper />`) reading `projects.xpms_phase`, mounted at the platform layout.
4. **Programa imports** — schemas first (`pinboards`, `vendor_products`, deliverable render columns), then surfaces.
5. **Portal super-persona collapse** — `portalNav` rewrite + 4 dashboard templates.
6. **Mobile** — phase-aware tools drawer order (Build phase → Punch / Daily Log / Driver first; Show phase → Gate / Incidents / Run of Show first).

## Consequences

**Wins:**

- Time-axis nav (the moat over NetSuite/SAP/Workday/Programa).
- Single canonical sidebar home per feature; no more cross-group conflation.
- New routes have an obvious cell to land in (Class × Phase grid is exhaustive).
- Programa parity gaps fall onto specific cells; adoption is additive, not parallel.
- Bi-axial nav matches the XPMS spine 1:1 — IA + schema + protocol all speak the same vocabulary.

**Costs:**

- Sidebar items per class go up (OPERATIONS now ~24 leaves under one collapsible group). Mitigated by phase filtering + within-group section headers + cmd-K.
- Dual-class features (Catering, Tickets, Hospitality, Wayfinding) appear in two groups. Acceptable — the cell map is the source of truth for which is canonical.
- Migrations require new schema for Programa imports (`pinboards`, `vendor_products`, deliverable render columns, `client_dashboards`).
- Portal slug paths preserved but labels rewritten — operator-side mental map shifts. Communication: changelog entry + in-app banner during transition.

**Non-goals:**

- Renaming routes. URLs stay stable.
- Replacing the `/console/xpms` Catalog page — it remains the atom registry browse.
- Touching the marketing or auth shells.

## Appendix A — cell map (existing routes → Class × Phase)

Phase column shows the **primary** phase a route is most often used in; cross-phase routes are common. `class_code` is canonical per route.

| Route                                   | Class            | Primary phase  |
| --------------------------------------- | ---------------- | -------------- |
| `/console`                              | workspace chrome | —              |
| `/console/projects`                     | EXECUTIVE        | Discovery      |
| `/console/programs`                     | EXECUTIVE        | Discovery      |
| `/console/programs/risk`                | EXECUTIVE        | Discovery      |
| `/console/programs/readiness`           | EXECUTIVE        | Show           |
| `/console/programs/reviews`             | EXECUTIVE        | Wrap           |
| `/console/proposals`                    | CREATIVE         | Concept        |
| `/console/proposals/templates`          | CREATIVE         | Concept        |
| `/console/leads`                        | MARKETING        | Discovery      |
| `/console/clients`                      | MARKETING        | Discovery      |
| `/console/marketing`                    | MARKETING        | Show           |
| `/console/insights`                     | MARKETING        | Wrap           |
| `/console/commercial/sponsors`          | MARKETING        | Discovery      |
| `/console/commercial/hospitality`       | EXPERIENCE       | Show           |
| `/console/commercial/tickets`           | EXPERIENCE       | Show           |
| `/console/marketplace`                  | MARKETING        | Discovery      |
| `/console/marketplace/postings`         | MARKETING        | Discovery      |
| `/console/marketplace/calls`            | MARKETING        | Discovery      |
| `/console/marketplace/talent`           | TALENT           | Discovery      |
| `/console/marketplace/offers`           | TALENT           | Concept        |
| `/console/bookings`                     | TALENT           | Discovery      |
| `/console/bookings/deals`               | TALENT           | Concept        |
| `/console/bookings/holds`               | TALENT           | Concept        |
| `/console/bookings/calendar`            | TALENT           | Concept        |
| `/console/bookings/settlements`         | TALENT           | Wrap           |
| `/console/agency/tours`                 | TALENT           | Concept        |
| `/console/subscriptions`                | EXECUTIVE        | Wrap           |
| `/console/finance/invoices`             | EXECUTIVE        | Wrap           |
| `/console/finance/pay-apps`             | EXECUTIVE        | Build          |
| `/console/finance/expenses`             | EXECUTIVE        | Show           |
| `/console/finance/budgets`              | EXECUTIVE        | Development    |
| `/console/finance/payouts`              | EXECUTIVE        | Wrap           |
| `/console/finance/time`                 | EXECUTIVE        | Show           |
| `/console/finance/periods`              | EXECUTIVE        | Wrap           |
| `/console/finance/reports`              | EXECUTIVE        | Wrap           |
| `/console/procurement/vendors`          | EXECUTIVE        | Development    |
| `/console/procurement/prequalification` | EXECUTIVE        | Development    |
| `/console/procurement/sourcing`         | EXECUTIVE        | Development    |
| `/console/procurement/requisitions`     | EXECUTIVE        | Development    |
| `/console/procurement/purchase-orders`  | EXECUTIVE        | Advance        |
| `/console/procurement/rfqs`             | EXECUTIVE        | Development    |
| `/console/submittals`                   | EXECUTIVE        | Development    |
| `/console/logistics/ratecard`           | EXECUTIVE        | Development    |
| `/console/site-plans`                   | BUILD            | Development    |
| `/console/production/compounds`         | BUILD            | Build          |
| `/console/production/warehouse`         | BUILD            | Build          |
| `/console/production/fabrication`       | BUILD            | Build          |
| `/console/production/equipment`         | PRODUCTION       | Advance        |
| `/console/production/av`                | PRODUCTION       | Advance        |
| `/console/production/rentals`           | PRODUCTION       | Advance        |
| `/console/production/logistics`         | PRODUCTION       | Advance        |
| `/console/production/dispatch/live`     | PRODUCTION       | Show           |
| `/console/production/ros`               | PRODUCTION       | Show           |
| `/console/schedule`                     | OPERATIONS       | Advance        |
| `/console/operations/look-ahead`        | OPERATIONS       | Advance        |
| `/console/operations/daily-log`         | OPERATIONS       | Show           |
| `/console/tasks`                        | OPERATIONS       | — (all phases) |
| `/console/annotations`                  | OPERATIONS       | —              |
| `/console/events`                       | OPERATIONS       | Show           |
| `/console/rfis`                         | OPERATIONS       | Development    |
| `/console/punch`                        | OPERATIONS       | Build          |
| `/console/people`                       | OPERATIONS       | Advance        |
| `/console/people/teams`                 | OPERATIONS       | Advance        |
| `/console/people/roles`                 | EXECUTIVE        | — (workspace)  |
| `/console/people/invites`               | EXECUTIVE        | — (workspace)  |
| `/console/workforce`                    | OPERATIONS       | Advance        |
| `/console/workforce/rosters`            | OPERATIONS       | Advance        |
| `/console/workforce/training`           | OPERATIONS       | Advance        |
| `/console/accreditation`                | EXPERIENCE       | Advance        |
| `/console/participants/delegations`     | OPERATIONS       | Advance        |
| `/console/participants/visa`            | OPERATIONS       | Advance        |
| `/console/transport`                    | OPERATIONS       | Advance        |
| `/console/transport/dispatch`           | OPERATIONS       | Show           |
| `/console/accommodation`                | OPERATIONS       | Advance        |
| `/console/logistics/freight`            | OPERATIONS       | Advance        |
| `/console/logistics/warehouse`          | OPERATIONS       | Advance        |
| `/console/logistics/services`           | HOSPITALITY      | Show           |
| `/console/logistics/disposition`        | OPERATIONS       | Strike         |
| `/console/safety/incidents`             | OPERATIONS       | Show           |
| `/console/safety/crisis`                | OPERATIONS       | Show           |
| `/console/safety/medical`               | OPERATIONS       | Show           |
| `/console/safety/safeguarding`          | OPERATIONS       | Show           |
| `/console/inspections`                  | OPERATIONS       | Build          |
| `/console/safety/osha`                  | OPERATIONS       | Wrap           |
| `/console/safety/briefings`             | OPERATIONS       | Advance        |
| `/console/safety/playbooks`             | OPERATIONS       | —              |
| `/console/venues`                       | EXECUTIVE        | Discovery      |
| `/console/locations`                    | EXECUTIVE        | — (workspace)  |
| `/console/knowledge`                    | TECHNOLOGY       | —              |
| `/console/guides`                       | TECHNOLOGY       | Show           |
| `/console/ai/automations`               | TECHNOLOGY       | —              |
| `/console/sustainability`               | EXECUTIVE        | Wrap           |
| `/console/xpms`                         | TECHNOLOGY       | — (workspace)  |

## Appendix B — new tables introduced

| Table                                | Cell                                | Purpose                                                         |
| ------------------------------------ | ----------------------------------- | --------------------------------------------------------------- |
| `pinboards`                          | (CREATIVE × Concept)                | Pinboard / mood board container, owned by project               |
| `pinboard_items`                     | (CREATIVE × Concept)                | Image / spec ref / note items on a pinboard                     |
| `vendor_products`                    | (EXECUTIVE × Development)           | Programa Product Library — buyable rows tied to a `vendors` row |
| `deliverables.rendered_pdf_path` etc | (CREATIVE/PRODUCTION × Development) | Schedule-as-artifact render targets                             |
| `client_dashboards`                  | (MARKETING × Show)                  | Branded share-link aggregator                                   |

Schemas land in their own ADRs / migrations as the migration sequence advances.

## Appendix C — open questions

1. Do we need a separate `xpms_division` axis in the sidebar (10 × 10 = 100 dimensions) or do we keep that as a within-class section header? Decision: section header. Surfacing all 100 divisions exceeds Miller's 7±2 even for power users.
2. Should the phase stepper be project-scoped or org-scoped? Decision: project-scoped (each project's `xpms_phase` differs). Org-scoped would require a "current project" cookie which we don't have today.
3. Cmd-K already supports atom-level jumps via `xpms.atoms`. Keep that surface; extend to phase-aware ranking (current-phase atoms ranked first).

---

End of ADR-0004.
