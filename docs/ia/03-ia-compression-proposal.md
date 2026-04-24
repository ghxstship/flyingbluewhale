# IA Compression — ATLVS Console

**Status:** approved 2026-04-24 · executing
**Author:** Claude × Julian · 2026-04-24
**Supersedes:** §4 of `02-navigation-redesign.md` (groups only — URL scheme stays)

## Approved shape

```
Dashboard · Projects · Operations · Logistics · People · Revenue · Finance · Procurement · Knowledge
```

9 conventional labels (top of Miller's 5–9 band). Settings extracted to a top-right avatar menu with its own 2-col layout. AI collapses into ⌘K. Inbox → notifications bell. Files → per-resource tabs. Sustainability → Knowledge.

**No Analytics group.** Modern SaaS (Linear, Notion, Stripe, Ramp, Attio) puts analytics inline in each domain (Finance → Reports, Operations → TOC dashboard, Projects → P&L per project), not in a separate top-level. Dashboard handles cross-cutting KPIs; if exploratory BI ever becomes a primary feature it earns `/console/insights` later — not from day one.

---

## The problem

Today's `platformNav` exposes **24 top-level groups** with **~160 items**
across them. Miller's rule (5–9) is blown by 3×; SaaS best-in-class (Linear,
Stripe, Attio, Ramp, Notion) sit at **5–8 primary destinations** and push depth
into ⌘K, contextual sub-nav, and settings areas.

Symptoms we are seeing:

- Collapsible sections patch the **symptom** (overwhelm) but not the **cause**
  (wrong shape). Even fully collapsed, 24 labels is a wall of text.
- SSOT violations bleed into UX: the same concept has 2–3 homes, which makes
  "where do I file this?" a coin-flip.
- Every new Olympic workflow pushed a new group. That's not a sidebar — it's
  a schema dump.

## 3NF SSOT violations in today's nav

| # | Conflict | Homes today | Canonical winner |
|---|---|---|---|
| 1 | Projects (the core unit) | `Work → Projects` only | Own top-level group |
| 2 | Schedule | `Work → Schedule` + `Programs → Master schedule` | One schedule, filterable by project/program |
| 3 | Incidents vs problems | `Safety → Incidents` + `Ops → Problems` | `Incidents` with a `kind` facet (safety / ops / IT) |
| 4 | Housing vs accommodation | `Workforce → Housing` + `Accommodation → Village/Blocks` | `Accommodation` — workforce are just one occupant class |
| 5 | Credentials vs accreditation | `People → Credentials` + `Accreditation/*` | `Accreditation` — it's the canonical access-pass domain |
| 6 | Workforce splits | `Workforce → Paid staff/Volunteers/Contractors/Services` (4 pages) | One list with a `type` filter |
| 7 | Rate card vs catalog | `Logistics → Rate card` + `Procurement → Catalog` | `Procurement → Rate card` (same table, `rate_card_items`) |
| 8 | Dispatch | `Production → Dispatch` + `Transport → Dispatch` | `Transport → Dispatch` (SSOT = `dispatch_runs`) |
| 9 | Logistics | `Production → Logistics` + top-level `Logistics` | top-level `Logistics` only |
| 10 | Brand config | `Commercial → Brand` + `Settings → Branding` | `Settings → Branding` (this is org-level config, not a project asset) |
| 11 | AI assistant | `AI → Assistant` (destination) + ⌘K (ambient) | ⌘K only; AI is a capability, not a place |
| 12 | Inbox & Files | `Collaboration → Inbox/Files` | Notifications bell (inbox) + per-resource files tabs |
| 13 | Sales pipeline vs leads | `Sales → Pipeline` + `Sales → Leads` | `Sales → Leads` rendered as pipeline; `/pipeline` becomes a saved view |
| 14 | Settings fan-out | 14 items at primary nav level | Move whole group to top-right avatar menu |

## Target shape: 7 primary groups + admin menu + ⌘K

Production-lifecycle organizing metaphor (matches brand voice: Depart → Sail
→ Return → Homecoming). Every everyday operator destination is reachable in
≤2 clicks from `/console`.

```
ATLVS Console
├── Dashboard                                  (1)
├── Plan             — projects, programs, venues, risk, readiness, reviews   (2)
├── Run              — schedule, tasks, events, ceremonies, incidents, crisis (3)
├── Logistics        — transport, accommodation, freight, dispatch, catering  (4)
├── People           — workforce, accreditation, delegations, visa, rosters   (5)
├── Commerce         — clients, leads, proposals, sponsors, hospitality,
│                      tickets, invoices, expenses, budgets, time, advances   (6)
├── Supply           — vendors, PO, requisitions, RFQ, rate card,
│                      equipment, rentals, fabrication                        (7)
└── Knowledge        — KB, guides, runbooks, automations                      (8*)
```

*Knowledge is the 8th primary group — still inside the 5–9 band, and it earns
the slot because it's a cross-cutting reference surface (every operator hits
KB/guides, and it has no natural home inside Plan/Run/Logistics/People/
Commerce/Supply).*

### Moved out of the primary sidebar

| Group | New home | Why |
|---|---|---|
| **Settings** (14 items) | Top-right avatar menu → `/console/settings` with its own 2-col layout | Admin ≠ everyday work. SaaS convention. |
| **AI** | Global ⌘K palette + inline composer hooks | AI is a capability, not a destination |
| **Collaboration → Inbox** | Bell icon in top bar | That's literally what notifications are |
| **Collaboration → Files** | Inside each resource's detail tabs | Files attach to things; a global file list is useless |
| **Sustainability** | Tab inside each project's detail view + an org-level report under Knowledge | Carbon is a facet of every project, not a standalone domain |
| **Operations → Integrations** | Moves to Settings → Integrations (already duplicated there) | Dedupe |
| **Legal** (5 items) | Move to `/console/settings/legal/*` | Admin fan-out, not daily ops |

### Inside each group

Groups are **collapsible** (the work we just did). New rules:

- **Active route auto-expands its group** — nav never hides where you are.
- **Search (`/`) still matches across all groups** — depth is one keystroke.
- **No "Hub" duplicates as separate items.** The group label itself links to
  the hub (`/console/plan` etc.). This removes ~10 items.
- **Max ~8 items per group.** If it grows past that, the landing page uses
  card-grid sub-nav (already the hub pattern).

## Proposed group × item map (exact)

```ts
{ label: "Dashboard", href: "/console" }

{ label: "Plan", href: "/console/plan", items: [
  { label: "Projects", href: "/console/projects" },
  { label: "Programs", href: "/console/programs" },
  { label: "Venues", href: "/console/venues" },
  { label: "Risk register", href: "/console/programs/risk" },
  { label: "Readiness", href: "/console/programs/readiness" },
  { label: "Reviews", href: "/console/programs/reviews" },
  { label: "Proposals", href: "/console/proposals" },    // draft = planning artefact
]}

{ label: "Run", href: "/console/run", items: [
  { label: "Schedule", href: "/console/schedule" },
  { label: "Tasks", href: "/console/tasks" },
  { label: "Events", href: "/console/events" },
  { label: "Ceremonies", href: "/console/programs/ceremonies" },
  { label: "Run of show", href: "/console/production/ros" },
  { label: "Incidents", href: "/console/ops/incidents" },  // unified
  { label: "Crisis", href: "/console/safety/crisis" },
  { label: "Services desk", href: "/console/services/requests" },
]}

{ label: "Logistics", href: "/console/logistics", items: [
  { label: "Transport", href: "/console/transport" },
  { label: "Accommodation", href: "/console/accommodation" },
  { label: "Freight", href: "/console/logistics/freight" },
  { label: "Warehouse", href: "/console/logistics/warehouse" },
  { label: "Dispatch", href: "/console/transport/dispatch" },
  { label: "Catering", href: "/console/logistics/services" },
  { label: "Disposition", href: "/console/logistics/disposition" },
]}

{ label: "People", href: "/console/people", items: [
  { label: "Directory", href: "/console/people" },
  { label: "Workforce", href: "/console/workforce" },       // single list, filterable
  { label: "Accreditation", href: "/console/accreditation" },
  { label: "Delegations", href: "/console/participants/delegations" },
  { label: "Visa", href: "/console/participants/visa" },
  { label: "Rosters", href: "/console/workforce/rosters" },
  { label: "Training", href: "/console/workforce/training" },
]}

{ label: "Commerce", href: "/console/commerce", items: [
  { label: "Leads", href: "/console/leads" },              // pipeline is a saved view here
  { label: "Clients", href: "/console/clients" },
  { label: "Sponsors", href: "/console/commercial/sponsors" },
  { label: "Hospitality", href: "/console/commercial/hospitality" },
  { label: "Tickets", href: "/console/commercial/tickets" },
  { label: "Invoices", href: "/console/finance/invoices" },
  { label: "Expenses", href: "/console/finance/expenses" },
  { label: "Budgets", href: "/console/finance/budgets" },
  { label: "Payouts", href: "/console/finance/payouts" },
  { label: "Time", href: "/console/finance/time" },
  { label: "Advances", href: "/console/finance/advances" },
]}

{ label: "Supply", href: "/console/supply", items: [
  { label: "Vendors", href: "/console/procurement/vendors" },
  { label: "Requisitions", href: "/console/procurement/requisitions" },
  { label: "Purchase Orders", href: "/console/procurement/purchase-orders" },
  { label: "RFQs", href: "/console/procurement/rfqs" },
  { label: "Rate card", href: "/console/logistics/ratecard" },
  { label: "Equipment", href: "/console/production/equipment" },
  { label: "Rentals", href: "/console/production/rentals" },
  { label: "Fabrication", href: "/console/production/fabrication" },
]}

{ label: "Knowledge", href: "/console/kb", items: [
  { label: "Articles", href: "/console/kb" },
  { label: "Guides", href: "/console/guides" },
  { label: "Automations", href: "/console/ai/automations" },
  { label: "Sustainability", href: "/console/sustainability" },
]}
```

**Totals:** 8 groups, ~55 items (was 24 groups, ~160 items). **63% compression
with zero destinations removed** — every current URL still resolves, and only
the organizing labels change.

## Top-right avatar menu (new)

```
👤 [avatar]
├── Account              /console/account
├── Preferences          /console/account/preferences
├── Workspace            /console/settings/organization
├── ─────
├── Settings             /console/settings             ← full settings area
│   ├── Organization
│   ├── Governance
│   ├── Billing
│   ├── Integrations (+ Webhooks, API)
│   ├── Audit
│   ├── Compliance (+ Legal, Privacy, DSAR)
│   ├── Exports / Imports
│   ├── Email templates / Branding / Domains
├── ─────
├── Keyboard shortcuts   ?
├── What's new           /changelog
├── Help                 /help
└── Sign out
```

Settings gets its own 2-column layout (secondary nav on the left, content on
the right). This is how Stripe, Linear, Ramp, and Attio all structure admin.

## Migration rules (no regression)

1. **Every existing URL stays reachable.** This is a nav re-grouping, not a
   route rewrite. The proposed map above preserves 100% of current URLs.
2. **Group slugs get canonical landing pages.** `/console/plan`, `/console/run`,
   `/console/commerce`, `/console/supply` each render a hub card-grid (same
   pattern as today's `/console/programs`, `/console/safety`, etc.).
3. **Redirects for removed labels.** `/console/commercial` → `/console/commerce`,
   `/console/ai` → ⌘K-focused landing, `/console/collaboration/*` → contextual
   equivalents. All 301.
4. **Settings gets its own layout.** Extract the 14 Settings items out of
   `platformNav` and into a `settingsNav` shape consumed by `src/app/(platform)/
   console/settings/layout.tsx`.
5. **"Hub" items collapse into group labels.** A user clicking "Plan" lands on
   `/console/plan`; no separate "Hub" row.

## Acceptance checks

Before this ships we verify:

- [ ] Every URL in today's `platformNav` still resolves 200 (redirects count).
- [ ] Every sidebar label is reachable in ≤2 clicks from `/console`.
- [ ] Active-route auto-expands its group on every route.
- [ ] ⌘K search finds every item by label (navigable from zero sidebar use).
- [ ] `next build` is green; no dead imports; no orphaned pages.
- [ ] Inventory audit (`docs/ia/inventory/*`) shows 0 orphans after re-grouping.
- [ ] Screenshot diff: before/after sidebar for a fresh demo user.

## What this does NOT do

- No database changes. 3NF violations in the **data layer** are already
  corrected (one `accreditations` table, one `workforce_members`, one
  `dispatch_runs`). This proposal only re-maps **how the nav surfaces them**.
- No feature deletion. Every capability that exists today exists tomorrow.
- No URL-scheme churn beyond the few redirects listed in rule 3.

## Decision needed

Approve the 8-group shape (Plan / Run / Logistics / People / Commerce / Supply
/ Knowledge + Dashboard) and the top-right-avatar Settings extraction, and I
execute the re-grouping as one atomic PR:

1. Rewrite `src/lib/nav.ts#platformNav`.
2. Extract `settingsNav` + dedicated layout.
3. Add 4 new hub landing pages (Plan, Run, Commerce, Supply).
4. Add redirects listed in rule 3.
5. Re-run the inventory audit until 0 orphans.
