# ADR-0006 — Domain-noun console nav (7 groups, vertical-portable)

**Status:** Proposed
**Date:** 2026-06-04
**Owner:** Platform engineering
**Supersedes:** `docs/ia/03-ia-compression-proposal.md` (the lifecycle-verb 8-group shape: Plan · Run · Logistics · People · Commerce · Supply · Knowledge); ADR-0004 §"Sidebar groups are the 10 XPMS Classes" as the **operator-default** view (XPMS-numeric survives as a power-user toggle and as the data spine, see §Forward look).

## Context

ADR-0004 (2026-05-10) shipped the XPMS-native sidebar — 10 numbered classes (`0 EXECUTIVE` … `9 TECHNOLOGY`). ADR-0005 (2026-05-28) sub-sectioned the bloated classes, deduped orphan prefixes, and collapsed the portal personas. The console is internally consistent, but two structural problems remain:

1. **The labels are taxonomy, not vocabulary.** New operators cannot tell where to file work without learning the XPMS spine. `0 EXECUTIVE` reads as a permission level, not a domain; `9 TECHNOLOGY` reads as an IT department, not a catalog. Best-in-class peers (Stripe, Linear, Ramp, NetSuite, Salesforce, Procore) ship domain-noun labels.
2. **The lifecycle-verb compression proposal (Plan / Run / Commerce / Supply / Knowledge) doesn't generalize.** It encodes a live-events frame at a moment when the construction-tier surfaces (RFIs, submittals, transmittals, lien waivers, certified payroll, takeoffs, BIM) are already in the codebase and a fabrication / touring / corporate expansion is on the roadmap. Construction PMs do not call their work "Plan / Run" — they call it Preconstruction / Construction / Closeout. A vertical-neutral nav must use domain-nouns that survive a vertical pivot.

Critical evaluation of the lifecycle 8-group proposal (`docs/ia/03-ia-compression-proposal.md` §"Target shape") found three defects beyond the vertical-portability one:

- **"Commerce" merged CRM, AR, and AP** (Leads + Invoices + Expenses + Payouts + Time) into one 11-leaf group spanning three SaaS categories no peer combines.
- **"Supply" merged procure-to-pay with asset management** (Vendors + POs + Equipment + Rentals + Fabrication) — split for thirty years in SAP / Oracle / NetSuite.
- **The brand's flagship capability (Production) had no top-level door** — Equipment under Supply, ROS under Run, Dispatch under Logistics.

This ADR fixes those four defects.

## Decision

Adopt a 7-group **domain-noun** primary sidebar. Groups are labeled with terms an operator from any production-adjacent vertical recognizes without onboarding. Lifecycle context is provided by `<PhaseStepper />` (already shipped) and per-project breadcrumbs, not by the sidebar.

```
ATLVS Console
├── Dashboard                                  (workspace chrome — not a domain group)
├── Projects        — portfolio, authoring, design, estimating, governance
├── Production      — inventory, build, show systems
├── Workforce       — directory, engagement, development, time & recognition
├── Sales           — pipeline & partners, hospitality, marketplace, revenue
├── Finance         — receivables, payables, planning, time & payroll
├── Procurement     — sourcing, buying, reference
└── Operations      — coordination, communication, logistics, safety, guest experience, reporting
```

Settings remains in its own 2-column area under the avatar menu (per ADR-0005). The Dashboard pseudo-group (Overview · Notifications · Threads · Dashboards menu) survives at the top as workspace chrome — not a domain. **There is deliberately no Insights / Knowledge sidebar group** — Linear, Stripe, Notion, and Vercel all ship without one, and the former contents distribute to where they're actually used (see §"What moves" below).

### Complete leaf-by-leaf mapping

Every URL in today's `platformNav` finds a home below. **Zero URLs change**; only the grouping and labels move.

#### Projects (Portfolio · Authoring · Design · Estimating · Governance)

| Section    | Items                                               |
| ---------- | --------------------------------------------------- |
| Portfolio  | Projects · Programs · Venues                        |
| Authoring  | Proposals · Proposal Templates · Project Templates  |
| Design     | Site Plans · Drawings · Specifications · BIM Models |
| Estimating | Takeoffs · Estimates                                |
| Governance | Risk Register · Risk Scores · Readiness · Reviews   |

16 items, 5 sections, max 4 per section. From XPMS classes 0 (Strategy) + 1 (Creative).

#### Production (Inventory · Build · Show)

| Section   | Items                                                                                   |
| --------- | --------------------------------------------------------------------------------------- |
| Inventory | Equipment · Equipment Utilization · AV Inventory · Rentals                              |
| Build     | Fabrication · Compounds · Yard · Punch List · Reality Captures · Photo Log · Warranties |
| Show      | Run of Show · Live Dispatch · Production Logistics                                      |

14 items, 3 sections. Promotes Production from "scattered across 3 other groups" to its own front door. From XPMS classes 4 (Build) + 5 (Production).

#### Workforce (Directory · Engagement · Development · Time & Recognition)

| Section            | Items                                                             |
| ------------------ | ----------------------------------------------------------------- |
| Directory          | Directory · Teams · Workforce                                     |
| Engagement         | Contracts (MSAs) · Offer Letters · Delegations · Visa · Rosters   |
| Development        | Training · Courses · Onboarding                                   |
| Time & Recognition | Time Off · Shift Swaps · Recognition · Badges · Resource Forecast |

16 items, 4 sections. Replaces the current "6 OPERATIONS → Workforce" + "Engagement" sub-sections with a single top-level home. From XPMS class 6 (Workforce + Engagement).

#### Sales (Pipeline & Partners · Hospitality · Marketplace · Revenue)

| Section             | Items                                                       |
| ------------------- | ----------------------------------------------------------- |
| Pipeline & Partners | Leads · Clients · Sponsors · Marketing                      |
| Hospitality         | Hospitality                                                 |
| Marketplace         | Marketplace hub · Bookings · Tours · Talent Roster · Offers |
| Revenue             | Tickets · Analytics                                         |

12 items, 4 sections. **Pipeline ceases to be a top-level entry** — it becomes the default saved view on `/console/leads` (kanban-by-stage). **Hospitality is the canonical Sales surface** at `/console/commercial/hospitality`, internally tabbed by hosted persona: Talent · Sponsors · Athletes · Industry · Media & Press · VVIP — the high-touch relationship management for revenue-adjacent personas. The Marketplace section is the canonical Marketplace home — `Settings > Marketplace` becomes a sub-tab inside `/console/marketplace`, killing the three-door problem. **Analytics** in the Revenue section points to `/console/insights` (the cross-cutting BI rollup, formerly under MARKETING) — Stripe pattern: per-domain analytics live inside the domain, not in a global Insights hub. From XPMS classes 2 (Talent — bookings) + 3 (Marketing).

#### Finance (Receivables · Payables · Planning · Time & Payroll)

| Section        | Items                                                                  |
| -------------- | ---------------------------------------------------------------------- |
| Receivables    | Invoices · Pay Apps · Lien Waivers · E-Sign Envelopes · AP Invoice OCR |
| Payables       | Expenses · Payouts                                                     |
| Planning       | Budgets · WIP · Forecasts (EAC) · Periods · Reports                    |
| Time & Payroll | Time · Certified Payroll · Subscriptions                               |

15 items, 4 sections. **Unchanged from ADR-0005's Finance sub-sectioning** — it already worked; just lifts to a top-level group instead of nesting under EXECUTIVE.

#### Procurement (Sourcing · Buying · Reference)

| Section   | Items                                              |
| --------- | -------------------------------------------------- |
| Sourcing  | Vendors · Prequalification · Sourcing · RFQs · ITB |
| Buying    | Requisitions · Purchase Orders · Contracts         |
| Reference | Rate Card · Submittals · Master Catalog            |

11 items, 3 sections. **Master Catalog moves from Settings here** — the XPMS atom registry is conceptually a sourcing-reference surface (vendor SKU canon), not an admin concern. `Contracts` is the unified contracts surface from round 49.

#### Operations (Coordination · Communication · Logistics · Safety · Guest Experience · Reporting)

| Section              | Items                                                                                                                         |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Coordination         | Operations Hub · Schedule · Schedule Baselines · Look-Ahead · Tasks · Daily Log · Action Items · Annotations · Forms · Guides |
| Communication        | Events · Meetings · Announcements · Polls · Surveys · Transmittals · Email Inbox · RFIs · Service Desk · TOC (ITIL)           |
| Logistics            | Transport · Dispatch · Freight · Warehouse · Disposition · Catering · Accommodation                                           |
| Safety / Operational | Incidents · Crisis · Medical · Safeguarding                                                                                   |
| Safety / Compliance  | Inspections · OSHA 300 · Briefings · Playbooks                                                                                |
| Guest Experience     | Accreditation · Guest Experience                                                                                              |
| Reporting            | Sustainability                                                                                                                |

39 items, 7 sections. **This is the largest group** — same scale as today's `6 OPERATIONS`. Sectioning preserves Miller's band per-section (2–10 per section, mostly under 8). **Guides** (Boarding Pass templates + org guide library) joins Coordination — they're operational reference, not knowledge-base reading. **Guest Experience** is the audience-facing operational surface (renamed from "Guest Hospitality") — distinct from Sales → Hospitality which manages revenue-adjacent persona relationships. **Reporting** holds Sustainability as a cross-cutting org-level metric rollup; per-project sustainability remains a tab on each project detail page. **Catering and Accommodation** sit in Logistics because they serve both workforce (crew lodging/meals) and audience (guest hospitality) — pulling them out into Guest Experience would have falsely implied audience-only scope. From XPMS class 6 (Coordination + Logistics + Safety + Communications) + 7 (Experience) + 8 (Hospitality) + cross-cutting Sustainability.

### What stays put

- **Settings rail** — unchanged. The 26 admin leaves stay under the avatar menu's 2-col layout per ADR-0005.
- **Dashboard chrome** — Overview / Notifications / Threads stay above the 7 groups as workspace chrome. **Dashboards menu** (chooser of saved dashboards) joins the chrome as a top-bar dropdown — Linear / Stripe pattern, never a sidebar item.
- **Phase stepper** — `<PhaseStepper />` continues to bind to `projects.xpms_phase` and dim groups not live in the current phase. The dimming map (group × phase) lives in `src/lib/nav.ts` next to `platformNav`.
- **Help affordance** — `?` icon in the workspace chrome opens a panel routing to `/console/knowledge` (Articles / KB) and external docs. Never a sidebar item — matches Linear, Notion, Stripe, Vercel.

### What moves

| From                                               | To                                                                            | Why                                                                            |
| -------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Settings → Workspace → Marketplace                 | Sales → Marketplace (sub-tab on hub)                                          | One marketplace home                                                           |
| Settings → Compliance → Marketplace Reviews        | Sales → Marketplace (sub-tab on hub)                                          | Same                                                                           |
| Settings → Catalog & Field → Master Catalog        | Procurement → Reference                                                       | Conceptual home is sourcing-reference                                          |
| 9 TECHNOLOGY → Catalog (XPMS atoms)                | Procurement → Reference                                                       | The atom registry IS a catalog                                                 |
| 9 TECHNOLOGY → Dashboards                          | Workspace chrome (top-bar Dashboards menu)                                    | SaaS convention — never a sidebar item                                         |
| 9 TECHNOLOGY → Assistant                           | ⌘K + right-rail drawer                                                        | AI is a capability, not a destination (ADR-0005 §"Move 1" rationale, extended) |
| 9 TECHNOLOGY → Automations                         | Settings → Integrations → Automations                                         | Automations are config, not knowledge                                          |
| 9 TECHNOLOGY → Articles (KB)                       | Workspace chrome → Help (`?`) → `/console/knowledge`                          | Help-affordance pattern; not sidebar real estate                               |
| 9 TECHNOLOGY → Guides                              | Operations → Coordination                                                     | Operational reference (Boarding Pass templates + org guide library)            |
| 0 EXECUTIVE → People & Compliance → Sustainability | Operations → Reporting                                                        | Cross-cutting org-level metric, not org-admin                                  |
| 3 MARKETING → Insights                             | Sales → Revenue → Analytics (same URL `/console/insights`)                    | Per-domain analytics inside their domain (Stripe pattern)                      |
| 7 EXPERIENCE → Guest Hospitality                   | Operations → Guest Experience (renamed; same URL)                             | Audience-facing ops, not the Sales relationship surface                        |
| 3 MARKETING → Pipeline                             | Removed as sidebar entry; survives as default kanban view on `/console/leads` | Pipeline is a view, not a domain                                               |
| Workspace chrome → "Inbox" pseudo-entry            | Notifications bell                                                            | Standard chrome                                                                |

### What the operator gains

- **All seven group labels are plain English** an operator from construction, touring, corporate, or live-events recognizes without onboarding.
- **Production has a front door** — the flagship capability is one click, not three.
- **Marketplace has one home** — three doors collapse to one tabbed hub.
- **Sales / Finance / Procurement are visibly separated** — three SaaS categories, three rooms.
- **Hospitality is correctly disambiguated** — Sales Hospitality (revenue-adjacent personas) and Operations Guest Experience (audience) stop sharing a label.
- **No graveyard group** — Knowledge/Insights doesn't exist as a sidebar room; its former contents live where they're actually used.
- **Vertical-portable** — relabeling for a construction-only deployment (e.g. "Drawings & Models" elevated) is a section-level edit, not a top-level rewrite.

## Migration rules (no regression)

1. **Every existing URL stays reachable.** This is nav re-grouping, not route rewrite. The mapping above preserves 100% of today's URLs.
2. **Group landing pages are new orchestration pages**, not redirects. `/console/projects`, `/console/production`, `/console/workforce`, `/console/sales`, `/console/finance`, `/console/procurement`, `/console/operations`, `/console/insights` each render a card-grid hub linking to their sections.
3. **Active-route auto-expands its group.** Same rule as ADR-0005.
4. **No legacy redirects required for URL changes** — there are none. The five entries that change _group_ (Marketplace, Sustainability, Master Catalog, Catalog, Assistant) keep their URL.
5. **`platformNav` is rewritten in one PR** — no dual-rendering, no feature flag. Sidebar is a layout concern with no data dependencies; staging it would create twin nav graphs and audit drift.
6. **XPMS-numeric view survives as a power-user toggle.** Add `settings.preferences.navMode: "domain" | "xpms"` per user. Default `"domain"`. The `xpms` mode renders the ADR-0004 sidebar verbatim — operators who learned the spine keep it. Implementation: `platformNav` becomes `platformNavDomain` + `platformNavXpms`; `PlatformSidebar` picks one based on the session preference. No URL impact either way.
7. **ADR-0004 forward-look intact.** Numbered XPMS classes remain the **data spine** (the dashboard skin selection, `classOfPersona`, `projects.xpms_phase`, `xpms_classes` table, dimming map). They cease to be the **navigation taxonomy** only.

## Acceptance checks

- [ ] Every URL in today's `platformNav` resolves 200 from the new sidebar (no orphans).
- [ ] Every new group label (`Projects`, `Production`, `Workforce`, `Sales`, `Finance`, `Procurement`, `Operations`) is reachable in ≤ 2 clicks from `/console`.
- [ ] Each section within a group sits at ≤ 10 items (Miller ceiling); Operations / Coordination and Operations / Communication are the worst at 10.
- [ ] No section exceeds Miller's band internally.
- [ ] ⌘K finds every leaf by label, including the leaves migrated out of sidebar (Articles, Dashboards, Assistant, Automations).
- [ ] Help (`?`) affordance opens to `/console/knowledge` (Articles).
- [ ] Top-bar Dashboards menu lists saved dashboards (existing `/console/dashboards` data, surfaced from chrome).
- [ ] Hospitality (`/console/commercial/hospitality`) renders persona tabs (Talent / Sponsors / Athletes / Industry / Media & Press / VVIP) when entered from Sales rail; renders audience filter when entered from Operations rail (or 301 to dedicated URL — pending implementation choice).
- [ ] `next build` is green.
- [ ] Inventory audit (`docs/ia/inventory/*`) shows 0 orphans after re-grouping.
- [ ] Sidebar screenshot diff (today vs ADR-0006) attached to the PR.
- [ ] `navMode: "xpms"` toggle renders the ADR-0004 sidebar verbatim — manual smoke test on a single user.

## Resolved decisions (formerly open questions)

1. **Pipeline demoted** ✓ — removed as sidebar entry; becomes the default kanban view on `/console/leads`. No URL change.
2. **Hospitality split** ✓ — Sales side keeps the single "Hospitality" entry at `/console/commercial/hospitality`, surfacing internal tabs for **Talent · Sponsors · Athletes · Industry · Media & Press · VVIP**. Operations side renames "Guest Hospitality" → **"Guest Experience"** at the same URL `/console/commercial/hospitality` (surface is one record set, two filtered entry points). If implementation pressure pushes us toward two distinct surfaces, the operations-side gets a new URL `/console/operations/guest-experience` — capture as a follow-up if it lands.
3. **Insights group killed** ✓ — dropped to 7 groups. Articles → Help (`?`) affordance; Guides → Operations → Coordination; Dashboards → workspace chrome (top-bar menu); Assistant → ⌘K + right-rail; Automations → Settings → Integrations; Sustainability → Operations → Reporting. Matches Linear / Stripe / Notion / Vercel — none ship a Knowledge / Insights sidebar group.
4. **`/console/insights` URL** ✓ — stays as the per-domain BI rollup; surfaced as "Analytics" in Sales → Revenue. Stripe pattern: per-domain analytics live in their domain, never in a global Insights hub.
5. **Phase dimming map** ✓ — separate follow-up PR after this rewrite lands. New map keys on the 7 domain groups instead of XPMS classes 0–9; estimated ~1 hour.

## Out of scope

- **Portal and mobile shells.** This ADR touches only the console sidebar. Portal super-personas (ADR-0005) and mobile tabs are separate decisions.
- **Settings rail.** Stays as ADR-0005 left it.
- **Database / schema.** No table or column changes. XPMS classes remain in the data layer for dashboard skinning, persona mapping, and catalog.
- **i18n.** Sidebar labels go through the existing `t()` infrastructure — no new keys are introduced by this change beyond the 8 group names and section names.

## Forward look

The XPMS spine survives where it earned its keep: as the data taxonomy for dashboards, the persona → class mapping, the catalog atom registry, and the per-phase dimming logic. It loses the sidebar because the sidebar is the operator's first contact with the product, and first contact wants plain English. Power users who internalized the 0–9 classes get the `navMode: "xpms"` toggle and lose nothing.

If we later add a vertical (construction-only, touring-only, corporate-only) the 7 domain-nouns survive — only the section composition inside each group shifts. Construction would promote `Projects → Design` (Drawings, Specs, BIM) and `Procurement → Sourcing` (RFIs, Submittals) above other sections; touring would emphasize `Sales → Marketplace` and `Production → Show`. The labels do not need to change.

## Decision needed

Approve the 7-group domain-noun shape and the leaf-by-leaf mapping above. On approval I execute:

1. Rewrite `src/lib/nav.ts#platformNav` (rename to `platformNavDomain`, add `platformNavXpms` preserving ADR-0004).
2. Add `settings.preferences.navMode` plumbing + `PlatformSidebar` switch.
3. Create 7 new hub landing pages (Projects, Production, Workforce, Sales, Finance, Procurement, Operations).
4. Wire workspace chrome additions: top-bar Dashboards menu, `?` Help affordance routing to `/console/knowledge`, right-rail Assistant drawer.
5. Move Automations into `settingsNav` under Integrations.
6. Rebuild phase dimming map against the new groups (follow-up PR).
7. Re-run the inventory audit until 0 orphans.

One PR for items 1–5 (one commit on `main` per project convention); follow-up PR for item 6.
