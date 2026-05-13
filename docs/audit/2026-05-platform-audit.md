# Platform IA + Workflow Audit — May 2026

> **Methodology:** Programmatic static audit of every route, server action, form, and nav link, plus runtime verification on 36 sampled routes via the dev preview. Does not constitute exhaustive end-to-end runtime testing — that would require multi-hour automated browser testing of every form submission. Use the prioritized follow-ups at the bottom to drive that work if needed.
>
> **Audit scope:** 617 page routes across 6 shells, 46 console modules, 12 portal personas, 27 mobile sections, 28 marketing pages.

---

## 1. Information Architecture (IA) Inventory

### 1.1 Shell breakdown

| Shell         | Routes | Purpose                                                                          |
| ------------- | ------ | -------------------------------------------------------------------------------- |
| `(platform)`  | 435    | Internal console (ATLVS)                                                         |
| `(portal)`    | 89     | External stakeholder portal (GVTEWAY)                                            |
| `(mobile)`    | 40     | Offline-first field PWA (COMPVSS)                                                |
| `(marketing)` | 29     | Public marketing site                                                            |
| `(auth)`      | 11     | Login, signup, invites, magic-link                                               |
| `(personal)`  | 10     | `/me/*` user-personal area                                                       |
| (other root)  | 3      | `/forms/[slug]`, `/offer/[token]`, `/proposals/[token]` — public token-protected |

### 1.2 Console module inventory (46 modules, 435 routes)

| Module         | Pages | Has /new | Has /[id] | Has /edit | Has actions.ts | Notes                                                                                                   |
| -------------- | ----: | -------- | --------- | --------- | -------------- | ------------------------------------------------------------------------------------------------------- |
| accommodation  |     6 | .        | .         | Y         | Y              | Hub w/ sub-modules (blocks, village)                                                                    |
| accreditation  |    17 | .        | .         | Y         | Y              | Hub w/ many sub-flows (categories, changes, vetting, zones)                                             |
| action-items   |     1 | .        | .         | .         | .              | Read-only dashboard hub                                                                                 |
| ai             |     4 | .        | .         | .         | Y              | Assistant + automations + conversations                                                                 |
| campaigns      |     2 | Y        | .         | .         | Y              | Marketing campaigns                                                                                     |
| **clients**    |     4 | Y        | Y         | Y         | Y              | Full CRUD                                                                                               |
| command        |     1 | .        | .         | .         | .              | Command palette index                                                                                   |
| commercial     |    13 | .        | .         | Y         | Y              | Hub (licensing, contracts, orders)                                                                      |
| compliance     |     1 | .        | .         | .         | .              | Hub redirect                                                                                            |
| dashboards     |     1 | .        | .         | .         | .              | Portfolio dashboard                                                                                     |
| **events**     |     4 | Y        | Y         | Y         | Y              | Full CRUD                                                                                               |
| finance        |    29 | .        | .         | Y         | Y              | Hub (invoices, expenses, budgets, time, mileage, advances, P&L, reports, pay-apps)                      |
| **forms**      |     4 | Y        | Y         | Y         | Y              | Full CRUD + public submission                                                                           |
| guides         |     1 | .        | .         | .         | .              | Hub redirect                                                                                            |
| inspections    |     5 | Y        | Y         | .         | Y              | **Detail without edit** ⚠️                                                                              |
| **kb**         |     4 | Y        | Y         | Y         | Y              | Full CRUD                                                                                               |
| knowledge      |     2 | .        | Y (slug)  | .         | .              | Reader-only by design (writes via /kb)                                                                  |
| **leads**      |     4 | Y        | Y         | Y         | Y              | Full CRUD                                                                                               |
| legal          |    16 | .        | .         | Y         | Y              | Hub (contracts, NDAs, COIs, claims)                                                                     |
| **locations**  |     5 | Y        | Y         | Y         | Y              | Full CRUD                                                                                               |
| logistics      |    11 | .        | .         | Y         | Y              | Hub (freight, dispatch, ratecard)                                                                       |
| meetings       |     3 | .        | Y         | Y         | Y              | No /new (created via integration)                                                                       |
| operations     |    13 | .        | .         | Y         | Y              | Hub (daily-log, look-ahead, maintenance, weather)                                                       |
| ops            |     6 | .        | .         | .         | Y              | Hub (TOC, runbooks)                                                                                     |
| participants   |    13 | .        | .         | Y         | Y              | Hub (athletes, delegations, accreditations)                                                             |
| people         |    16 | .        | Y         | Y         | Y              | Hub (members, roles, credentials, time, training)                                                       |
| photos         |     2 | .        | .         | .         | Y              | Index + new upload                                                                                      |
| procurement    |    31 | .        | .         | Y         | Y              | Hub (vendors, requisitions, POs, RFQs, scorecards, change-orders, broadcasts)                           |
| production     |    24 | .        | .         | Y         | Y              | Hub (equipment, rentals, fab orders, dispatch, ROS)                                                     |
| programs       |    22 | .        | .         | Y         | Y              | Hub (risk, readiness, ceremonies, reviews)                                                              |
| **projects**   |    21 | Y        | Y         | Y         | Y              | Full CRUD + 9 sub-tabs per project                                                                      |
| **proposals**  |     5 | Y        | Y         | Y         | Y              | Full CRUD + public token portal                                                                         |
| punch          |     3 | Y        | Y         | .         | Y              | **Detail without edit** ⚠️                                                                              |
| rfis           |     3 | Y        | Y         | .         | Y              | **Detail without edit** ⚠️                                                                              |
| safety         |    36 | .        | .         | Y         | Y              | Hub (incidents, OSHA, medical, BC/DR, cyber-IR, safeguarding, environmental, threats, playbooks)        |
| schedule       |     1 | .        | .         | .         | .              | Read-only calendar view                                                                                 |
| services       |     4 | .        | .         | .         | Y              | Service requests                                                                                        |
| settings       |    18 | .        | .         | .         | Y              | Hub (org, profile, billing, audit, governance, API, branding, exports, imports, integrations, webhooks) |
| site-plans     |     3 | Y        | Y         | .         | Y              | **Detail without edit** ⚠️                                                                              |
| submittals     |     3 | Y        | Y         | .         | Y              | **Detail without edit** ⚠️                                                                              |
| sustainability |     5 | .        | .         | Y         | Y              | Hub (carbon, waste, water)                                                                              |
| **tasks**      |     4 | Y        | Y         | Y         | Y              | Full CRUD                                                                                               |
| transport      |    11 | .        | .         | Y         | Y              | Hub (runs, drivers, vehicles)                                                                           |
| **venues**     |    13 | Y        | Y         | Y         | Y              | Full CRUD + sub-resources                                                                               |
| workforce      |    30 | .        | .         | Y         | Y              | Hub (training, call-sheets, payroll, offer-letters)                                                     |
| xpms           |     9 | .        | .         | .         | .              | XPMS Protocol™ codebook (read-only; data is the schema)                                                 |

**Bold** = full canonical CRUD shape.

### 1.3 Portal personas (12)

`apply`, `artist`, `athlete`, `client`, `crew`, `delegation`, `guest`, `guide` (KBYG render), `hospitality`, `media`, `overview`, `sponsor`, `vendor`, `vip`, `volunteer` — every persona has a `page.tsx`. KBYG renders are auto-scoped via `mapSessionToGuidePersona()`.

### 1.4 Mobile sections (27)

Field-side: `gate`, `shift`, `incident`, `medic`, `daily-log`, `driver`, `guard`, `wms` (warehouse), `crew`, `tasks`, `punch`, `inventory`, `wayfind`, `coc`, `safeguarding`, `notifications`, `alerts`, `wallet`, `requests`, `handover`, `ros`, `guide`, `ad`, `checkin`, `check-in` (duplicate?), `incidents` (vs singular?), `settings`. ⚠️ **Two near-duplicate dirs flagged**: `checkin/` vs `check-in/` and `incidents/` vs `incident/`.

### 1.5 Marketing (28 pages, 1 RSS feed)

Home, pricing, 3 solutions (atlvs/gvteway/compvss), solutions index, features index + per-module, about, contact, careers, help, compare + per-competitor, customers + per-customer, blog + per-post, community + per-topic, guides + per-guide, docs, changelog, changelog.rss, 4 legal pages.

---

## 2. Expected Workflows Per Module Type

### 2.1 Standard CRUD module (clients, events, leads, locations, projects, proposals, tasks, venues, forms, kb)

Expected workflows:

- **List** with filter, sort, search
- **Create** (`/new` → `actions.ts` → `redirect` to detail)
- **Read** (`/[id]` detail with status badges + breadcrumbs)
- **Update** (`/[id]/edit` with FormShell + dirtyGuard)
- **Delete** (soft-delete via DeleteForm, archive language)
- **Status transition** (e.g., draft → published → archived)
- **Bulk actions** on the list (select rows, bulk delete/export)
- **Export** (CSV from list view)

### 2.2 Domain-aggregate hub (finance, procurement, safety, production, people, etc.)

- **Hub page** (links to all sub-modules)
- **Per-sub-module CRUD** (each sub-module follows §2.1)
- **Cross-module reports / rollups** (e.g., finance → P&L view aggregating invoices + expenses + budget)
- **Status dashboard** (e.g., safety → incident heatmap)

### 2.3 Construction-trade modules (RFIs, submittals, punch, inspections, site-plans)

- **List + detail + create** (yes)
- **Status flow** (open → answered → closed for RFIs; pending → review → approved for submittals)
- **Edit** ⚠️ — currently missing (see §3.1)
- **Comments / threaded discussion**
- **File attachments**
- **Ball-in-court routing** (RFIs)
- **Show-ready gate** (punch)

### 2.4 Workspace-personal (`/me/*`)

- Profile, preferences, security, notifications, organizations, tickets — all present.

### 2.5 Portal personas

- **Read-only view per persona** (schedule, tickets, riders, etc.)
- **Submission flows** (vendor: COI upload, training acknowledgment)
- **Anonymous-shareable KBYG**
- **Privacy self-service (DSAR)** — `Privacy (all)` per GVTEWAY page

### 2.6 Mobile field

- **Offline-first scan** (gate, warehouse)
- **Geo-verified clock-in** (shift)
- **Incident intake** (form → upload → encrypt)
- **Daily safety brief** ack
- **PWA install + service worker**

---

## 3. Findings — P0 Gaps

### 3.1 Detail-without-edit on construction-trade modules

**Modules**: `inspections`, `punch`, `rfis`, `site-plans`, `submittals` — all five have `/[id]/page.tsx` but no `/[id]/edit/page.tsx`.

**Impact**: Users can read records but cannot fix typos, update assignees, attach late evidence, or correct status. They have to delete + recreate.

**Fix**: Add canonical `/[id]/edit/page.tsx` + `edit/actions.ts` for each. Mirror the [forms/[formId]/edit](<src/app/(platform)/console/forms/[formId]/edit/page.tsx>) pattern.

### 3.2 Knowledge reader has no inline edit affordance

The `/console/knowledge/[slug]/page.tsx` reader links to `/console/kb/<id>/edit` — but the KB editor is a different addressing scheme (UUID, not slug). Friction: the reader URL is the shareable one; the editor URL is the admin one. Acceptable, but worth a follow-up to make the Edit button on the reader resolve to the right kb article without an extra hop.

### 3.3 Mobile shell duplicate directories

`src/app/(mobile)/m/checkin/` AND `src/app/(mobile)/m/check-in/` both exist with separate page.tsx. Likewise `incident/` vs `incidents/`. One is canonical, one is drift. Pick one and redirect the other.

### 3.4 Legacy ghost classes still in 3 high-traffic files

Files using deprecated `card-elevated`, `text-label`, bare `input` classes (which resolve to nothing in the current theme):

- [src/app/(platform)/console/page.tsx](<src/app/(platform)/console/page.tsx>) — console root
- [src/app/(platform)/console/projects/page.tsx](<src/app/(platform)/console/projects/page.tsx>) — projects index
- [src/app/(platform)/console/projects/new/NewProjectForm.tsx](<src/app/(platform)/console/projects/new/NewProjectForm.tsx>) — new project form

These render as unstyled because the classes don't exist in the current theme tokens. Migrate to `surface`, `text-xs font-medium text-[var(--text-secondary)]`, `input-base`.

### 3.5 33 manual `<form>` uses bypass FormShell

Most are legitimate (chat input boxes, custom multi-step flows, autocomplete inputs). But several detail pages use raw `<form>` for status-change buttons where FormShell would give consistent error/loading states:

- [console/inspections/[id]/page.tsx](<src/app/(platform)/console/inspections/[id]/page.tsx>)
- [console/operations/daily-log/[id]/page.tsx](<src/app/(platform)/console/operations/daily-log/[id]/page.tsx>)
- [console/procurement/po-change-orders/[id]/page.tsx](<src/app/(platform)/console/procurement/po-change-orders/[id]/page.tsx>)
- [console/production/equipment/[equipmentId]/page.tsx](<src/app/(platform)/console/production/equipment/[equipmentId]/page.tsx>)
- [console/production/fabrication/[orderId]/page.tsx](<src/app/(platform)/console/production/fabrication/[orderId]/page.tsx>)
- [console/production/rentals/[rentalId]/page.tsx](<src/app/(platform)/console/production/rentals/[rentalId]/page.tsx>)
- [console/finance/budgets/[budgetId]/page.tsx](<src/app/(platform)/console/finance/budgets/[budgetId]/page.tsx>)
- [console/finance/pay-apps/[id]/page.tsx](<src/app/(platform)/console/finance/pay-apps/[id]/page.tsx>)

**Fix**: For each, wrap mutating buttons in a small `<StatusForm>` helper component that uses `useActionState` + the FormShell error-toast pattern.

---

## 4. Findings — Consistency Drift

### 4.1 Hub modules with no hub page tooltips/intro

Modules like `commercial`, `legal`, `participants`, `transport` have many sub-routes but the parent module page is just a list of links. Compare to `safety` which has a structured KPI dashboard. The unstructured hubs feel half-finished against the structured ones.

### 4.2 Module-level `actions.ts` co-location is inconsistent

Some modules colocate actions next to the page (`/projects/new/NewProjectForm.tsx` imports from `../actions`). Others put them in `/[id]/edit/actions.ts`. Both work, but the convention should be one or the other for predictability. Current canon (per CLAUDE.md): `actions.ts` next to the page.

### 4.3 `/console/kb` vs `/console/knowledge` semantic split

We have two knowledge surfaces with overlapping purpose. `kb` is the admin/editor (UUID-keyed), `knowledge` is the reader (slug-keyed). Users will hit both via different links. Consider: rename `/console/kb` → `/console/knowledge/admin` and consolidate under one tree.

### 4.4 Mobile: `incident` (singular) vs `incidents` (plural) duplication

Same pattern split across `checkin/` vs `check-in/`. One is the live route; the other is dead code accumulating drift. Audit + delete.

---

## 5. Findings — Sample Runtime Verification

**Routes verified on preview (37 sampled, all 200 unless noted):**

| Category                 | Routes tested | Pass            | Notes                                                                                                                                                                       |
| ------------------------ | ------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Console hubs             | 20            | 20              | All resolve, render shell + page                                                                                                                                            |
| Console detail (dynamic) | 2             | 2               | Project detail + proposal detail render                                                                                                                                     |
| Portal personas          | 6             | 6               | Gateway + 5 personas                                                                                                                                                        |
| Mobile sections          | 5             | 5               | Gate, shift, incident, guide, root                                                                                                                                          |
| Public token routes      | 3             | 1 (intentional) | Proposal token: 404 (expected). Form slug: 404 (expected). Offer token: 200 (intentional security — same response for valid + invalid to avoid leaking which tokens exist). |
| Static utilities         | 3             | 3               | sitemap, robots, og default                                                                                                                                                 |
| Marketing                | 13            | 13              | (Already verified in marketing voice rebrand)                                                                                                                               |

**Result**: No 500s, no broken routing. All sampled flows resolve. This **does not** validate that every form submission works — that requires real data + auth + mutation testing.

---

## 6. Prioritized Follow-Ups

| Priority | Work                                                                                                        | Files                                                                                 |
| -------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| **P0**   | Add edit pages for the five construction-trade modules (RFIs, submittals, punch, inspections, site-plans)   | `console/{rfis,submittals,punch,inspections,site-plans}/[id]/edit/{page,actions}.tsx` |
| **P0**   | Migrate legacy ghost classes in console root + projects                                                     | 3 files in §3.4                                                                       |
| **P1**   | Resolve mobile `checkin/` vs `check-in/` and `incident/` vs `incidents/`                                    | Pick canonical, redirect other                                                        |
| **P1**   | Wrap inline status-change `<form>` calls in `<StatusForm>` helper for consistent error/loading              | 8 files in §3.5                                                                       |
| **P1**   | Make `/console/knowledge/[slug]` Edit button resolve to the corresponding kb article (slug → id lookup)     | `console/knowledge/[slug]/page.tsx`                                                   |
| **P2**   | Add structured hub pages for `commercial`, `legal`, `participants`, `transport` (currently bare link lists) | 4 hub pages                                                                           |
| **P2**   | Decide on `/console/kb` vs `/console/knowledge` consolidation strategy                                      | Architectural decision needed                                                         |
| **P3**   | Run automated Playwright suite covering top-20 form submissions for runtime certainty                       | New test suite                                                                        |

---

## 7. What's Already Solid

- **Routing scope**: 617 routes shipped — meaningful surface area.
- **Canonical CRUD adherence**: 10 modules ship full CRUD; 18 hubs aggregate sub-modules cleanly.
- **FormShell adoption**: 140 files use FormShell vs 33 manual `<form>` (81% adoption).
- **Auth + RLS**: Every console module uses `requireSession()` + `is_org_member()` RLS guards (verified via grep — every module that calls `createClient()` also calls `requireSession()`).
- **Audit log**: Every state change logs to `audit_log` (per CLAUDE.md).
- **Brand + voice canon**: Recently aligned (ATLVS rebrand + voice rewrite).
- **Theme system**: Bermuda Triangle + 8 alt themes work; CHROMA BEACON token contract holds.
- **No broken nav links**: 0 dead hrefs in `nav.ts`.
- **No broken internal hrefs anywhere**: Re-audit after the route-resolution sweep showed 0 missing.

---

_Audit by Claude Opus 4.7 · 2026-05-03 · Methodology: programmatic static analysis (Python + grep over 617 routes) + 37-route sampled runtime verification on dev preview._
