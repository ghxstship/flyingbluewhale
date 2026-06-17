# ATLVS Technologies — Full Ecosystem Sitemap

Complete page inventory across the **4-app ecosystem**, every route listed in its native home with its features, functionality, and interactive/CRUD elements. Generated from source (`src/app/**/page.tsx` + sibling `actions.ts`) — evidence-based, not aspirational.

> **1,084 page routes** across 6 route groups + **130 API route handlers**. Design kit **v6.3** · documents system **29 types** · reports & analytics engine **77 metrics / 43 reports**.

## The four apps + shared shells

| App | Shell · URL | Route group | Pages | Role |
|---|---|---|---|---|
| **ATLVS** (pink) | `/console` | `(platform)` | 732 | Experiential Productions: ERP × CRM × PM — the operator console |
| **LEG3ND** (orange) | `/console/legend/*` | `(platform)` | (subset of 732) | Knowledge · LMS · Resources (XPMS 2.0) |
| **GVTEWAY** (blue) | `/p/[slug]/*` | `(portal)` | 141 | Public interface & stakeholder portal (15 personas) |
| **COMPVSS** (amber) | `/m/*` | `(mobile)` | 75 | Site & venue field operations (offline-first PWA) |
| _Marketing_ | `/` | `(marketing)` | 86 | Public SEO site + public marketplace |
| _Auth_ | `/login …` | `(auth)` | 13 | Login, signup, SSO, magic-link, reset |
| _Personal_ | `/me/*` | `(personal)` | 25 | Any authed user — profile, settings, marketplace engagement |
| _Root_ | `/`, `/sitemap.xml`, `/api-docs` … | `root` | 12 | Cross-shell roots, sitemap, OpenAPI docs |

## Contents

1. [ATLVS Console — Projects & Production](#atlvs-console--projects--production)
2. [ATLVS Console — Finance & Procurement](#atlvs-console--finance--procurement)
3. [ATLVS Console — Sales & Marketplace](#atlvs-console--sales--marketplace)
4. [ATLVS Console — Workforce & People](#atlvs-console--workforce--people)
5. [ATLVS Console — Operations & Safety](#atlvs-console--operations--safety)
6. [ATLVS Console — Admin, AI & LEG3ND](#atlvs-console--admin-ai--leg3nd)
7. [GVTEWAY Portal](#gvteway-portal-p slug)
8. [COMPVSS Mobile](#compvss-mobile-m)
9. [Marketing · Auth · Personal · Root](#marketing-public)

## Legend

Each bullet: `` `/route` — purpose. **CRUD/interactive:** <elements>``. "read-only" = display/list with no mutation affordance on that page. Dynamic `[id]`/`/new`/`/edit` children are listed under their parent.

## Known link gaps

None. The two gaps flagged at first inventory have been remediated full-stack:

- `/console/contracts` — now has `[contractId]` detail, `[contractId]/edit`, and `/new` pages.
- `/console/email-inbox` — now has `[id]` detail page.

Every `rowHref`/link target in the console resolves to a real `page.tsx`. Verified by the always-on `e2e/nav-routes` no-404 guard and the opt-in full-sitemap crawl (`CRAWL=1`, see `e2e/sitemap-crawl.spec.ts`).

---



---

# ATLVS Console — Projects & Production

Page inventory for the ATLVS operator console (`/console`), covering the project-delivery, production, programs, venue, construction-document, and sales-document segments. One bullet per `page.tsx` route; dynamic detail/new/edit children are listed under their parent.

## Projects

- `/console/projects` — Project portfolio list. **CRUD/interactive:** DataTable (rowHref to detail), bulk-archive action, "+ New Project" link, EmptyState
- `/console/projects/new` — Create a project. **CRUD/interactive:** FormShell create action (`createProject`)
- `/console/projects/[projectId]` — Project detail / home. **CRUD/interactive:** status toggle (`ProjectStatusToggle`), Edit link, DeleteForm (delete project), links to child modules
- `/console/projects/[projectId]/overview` — Project overview dashboard. **CRUD/interactive:** read-only
- `/console/projects/[projectId]/edit` — Edit project. **CRUD/interactive:** FormShell update action
- `/console/projects/[projectId]/advancing` — Advancing landing (deliverable doc-specs). **CRUD/interactive:** read-only list, EmptyState
- `/console/projects/[projectId]/advancing/assignments` — Per-individual assignments (advancing). **CRUD/interactive:** DataTable + Kanban/Board view toggle (searchParams), kind filter, rowHref, "+ New" link
- `/console/projects/[projectId]/advancing/assignments/new` — New individual assignment. **CRUD/interactive:** FormShell create action (push-notifies party), party/kind selectors via searchParams
- `/console/projects/[projectId]/advancing/assignments/[assignmentId]` — Assignment detail. **CRUD/interactive:** fulfillment-state transition buttons (`advanceState`, guarded by `NEXT_FULFILLMENT_STATES`), per-kind detail forms (ticket/credential/lodging/travel/vehicle upserts), reassign form, DeleteForm, edit link, scan-event history
- `/console/projects/[projectId]/branding` — Project branding / co-brand editor. **CRUD/interactive:** BrandingForm (client) save action
- `/console/projects/[projectId]/budget` — Project budget. **CRUD/interactive:** "+ New" link, EmptyState (read-only otherwise)
- `/console/projects/[projectId]/crew` — Project crew roster. **CRUD/interactive:** read-only list, EmptyState
- `/console/projects/[projectId]/files` — Project files. **CRUD/interactive:** file upload, EmptyState
- `/console/projects/[projectId]/finance` — Project P&L. **CRUD/interactive:** MetricCards + DataTables with rowHref (read-only reporting)
- `/console/projects/[projectId]/finance/draws` — Draw schedule (XPMS-phase budget draws). **CRUD/interactive:** DrawScheduleClient (client island, interactive draw editing)
- `/console/projects/[projectId]/guides` — Event guides hub (per-persona). **CRUD/interactive:** persona tile links, custom-guide link
- `/console/projects/[projectId]/guides/[persona]` — Per-persona guide editor. **CRUD/interactive:** GuideEditor (client editor + save), access link
- `/console/projects/[projectId]/guides/[persona]/access` — Guide access tokens / public link. **CRUD/interactive:** access-token management action, link out
- `/console/projects/[projectId]/members` — Project members. **CRUD/interactive:** member add/remove actions, EmptyState
- `/console/projects/[projectId]/onboarding` — Onboarding / offer-letter tracking. **CRUD/interactive:** DataTable (rowHref)
- `/console/projects/[projectId]/photos` — Project photos. **CRUD/interactive:** upload, filter via searchParams, MetricCards, EmptyState
- `/console/projects/[projectId]/portal-preview` — Preview of the external portal for this project. **CRUD/interactive:** preview links (read-only)
- `/console/projects/[projectId]/roadmap` — Quarterly roadmap of tasks/milestones. **CRUD/interactive:** read-only, EmptyState
- `/console/projects/[projectId]/schedule` — Project schedule. **CRUD/interactive:** Calendar/Board view toggle (searchParams), "+ New" link, EmptyState
- `/console/projects/[projectId]/sprints` — Sprint board / burndown / velocity. **CRUD/interactive:** Kanban board, MetricCards, "+ New" link, EmptyState
- `/console/projects/[projectId]/sprints/new` — New sprint. **CRUD/interactive:** create action (manager+ gated; permission PageStub otherwise)
- `/console/projects/[projectId]/stage-plots` — Stage plots list. **CRUD/interactive:** list of plots with links (read-only index)
- `/console/projects/[projectId]/stage-plots/[stagePlotId]` — Stage plot detail (2D layout). **CRUD/interactive:** StagePlotCanvas (drag-and-drop editor), Edit link, DeleteForm
- `/console/projects/[projectId]/stage-plots/[stagePlotId]/edit` — Edit stage plot. **CRUD/interactive:** FormShell update action
- `/console/projects/[projectId]/sustainability` — Project sustainability / carbon metrics. **CRUD/interactive:** MetricCards (read-only), EmptyState
- `/console/projects/[projectId]/tasks` — Project tasks. **CRUD/interactive:** "+ New" link, EmptyState (read-only list)
- `/console/projects/[projectId]/tracker` — Tracker (XPMS link). **CRUD/interactive:** read-only, link to /console/xpms

## Production

- `/console/production` — Production hub. **CRUD/interactive:** tile links to sub-modules (read-only)
- `/console/production/av` — AV systems. **CRUD/interactive:** DataTable (rowHref), "+ New" link
- `/console/production/compounds` — Compounds. **CRUD/interactive:** DataTable (rowHref), "+ New" link
- `/console/production/dispatch` — Dispatch (next-48h). **CRUD/interactive:** read-only list, EmptyState
- `/console/production/dispatch/live` — Live dispatch map. **CRUD/interactive:** LiveDispatchMap (client map, read-only tracking)
- `/console/production/dispatch/[dispatchId]` — Dispatch run detail. **CRUD/interactive:** status Badge, MetricCards (read-only)
- `/console/production/equipment` — Equipment inventory. **CRUD/interactive:** DataTable (rowHref), "+ New" link
- `/console/production/equipment/new` — Add equipment. **CRUD/interactive:** FormShell create action
- `/console/production/equipment/[equipmentId]` — Equipment detail. **CRUD/interactive:** equipment-state transition buttons (`setEquipmentStatus`, `NEXT` map), Edit link, DeleteForm, movement history
- `/console/production/equipment/[equipmentId]/edit` — Edit equipment. **CRUD/interactive:** FormShell update action
- `/console/production/equipment/[equipmentId]/maintenance` — Maintenance log. **CRUD/interactive:** DataTable (read-only)
- `/console/production/equipment/[equipmentId]/qr` — Printable asset QR. **CRUD/interactive:** QR code for /m/inventory/scan (read-only print surface)
- `/console/production/equipment/[equipmentId]/rentals` — Booking history for asset. **CRUD/interactive:** DataTable (read-only)
- `/console/production/equipment/utilization` — Equipment utilization report. **CRUD/interactive:** MetricCards + DataTable (read-only reporting)
- `/console/production/fabrication` — Fabrication orders. **CRUD/interactive:** DataTable (rowHref), "+ New" link
- `/console/production/fabrication/new` — New fabrication order. **CRUD/interactive:** FormShell create action
- `/console/production/fabrication/[orderId]` — Fabrication order detail. **CRUD/interactive:** production-phase transition buttons (`setFabStatus`, `NEXT` map), Edit link, delete form, phase-transition history
- `/console/production/fabrication/[orderId]/edit` — Edit fabrication order. **CRUD/interactive:** FormShell update action
- `/console/production/logistics` — Logistics (week view). **CRUD/interactive:** read-only, EmptyState
- `/console/production/rentals` — Rentals list. **CRUD/interactive:** DataTable (rowHref), "+ New" link
- `/console/production/rentals/new` — New rental. **CRUD/interactive:** FormShell create action
- `/console/production/rentals/availability` — Rental availability. **CRUD/interactive:** "+ New" link, EmptyState (read-only availability view)
- `/console/production/rentals/[rentalId]` — Rental detail. **CRUD/interactive:** end-rental-now action, pull-sheet DownloadLink (`/api/v1/rentals/[id]/pull-sheet`), delete form
- `/console/production/rentals/[rentalId]/edit` — Edit rental. **CRUD/interactive:** FormShell update action
- `/console/production/ros` — Run of Show (cues grouped by day). **CRUD/interactive:** read-only
- `/console/production/warehouse` — Warehouse hub. **CRUD/interactive:** tile links (incl. mobile scan), MetricCards (read-only)
- `/console/production/warehouse/inventory` — Warehouse inventory. **CRUD/interactive:** DataTable (rowHref), "+ New" link
- `/console/production/warehouse/locations` — Warehouse locations. **CRUD/interactive:** DataTable (rowHref), "+ New" link

## Programs

- `/console/programs` — Programs hub. **CRUD/interactive:** tile links to sub-modules, MetricCards (read-only)
- `/console/programs/cases` — Cases. **CRUD/interactive:** DataTable (rowHref), "+ New" link
- `/console/programs/ceremonies` — Ceremonies. **CRUD/interactive:** DataTable (rowHref)
- `/console/programs/ceremonies/[ceremonyId]` — Ceremony record. **CRUD/interactive:** Edit link, DeleteForm, field dump (read-only body)
- `/console/programs/ceremonies/[ceremonyId]/edit` — Edit ceremony. **CRUD/interactive:** FormShell update action
- `/console/programs/pressconf` — Press conferences. **CRUD/interactive:** DataTable (rowHref), "+ New" link
- `/console/programs/protocol` — Protocol (VIP categories / T3 dispatch). **CRUD/interactive:** links to accreditation/transport modules, MetricCards, EmptyStates (read-only summary)
- `/console/programs/readiness` — Readiness exercises. **CRUD/interactive:** DataTable (rowHref), "+ New" link
- `/console/programs/readiness/new` — New exercise. **CRUD/interactive:** FormShell create action
- `/console/programs/readiness/[exerciseId]` — Exercise record. **CRUD/interactive:** Edit link, DeleteForm
- `/console/programs/readiness/[exerciseId]/edit` — Edit exercise. **CRUD/interactive:** FormShell update action
- `/console/programs/reviews` — Program reviews. **CRUD/interactive:** DataTable (rowHref), "+ New" link
- `/console/programs/reviews/new` — New review. **CRUD/interactive:** FormShell create action
- `/console/programs/reviews/[reviewId]` — Review record. **CRUD/interactive:** Edit link, DeleteForm
- `/console/programs/reviews/[reviewId]/edit` — Edit review. **CRUD/interactive:** FormShell update action
- `/console/programs/risk` — Program risk register. **CRUD/interactive:** DataTable (rowHref), "+ New" link
- `/console/programs/risk/new` — New risk. **CRUD/interactive:** FormShell create action
- `/console/programs/risk/[riskId]` — Risk record. **CRUD/interactive:** Edit link, DeleteForm
- `/console/programs/risk/[riskId]/edit` — Edit risk. **CRUD/interactive:** FormShell update action
- `/console/programs/schedule` — Master schedule. **CRUD/interactive:** DataTable (rowHref), MetricCards, "+ New" link
- `/console/programs/scope` — Program scope / participant entries. **CRUD/interactive:** links to participants/entries module, MetricCards, EmptyState (read-only summary)
- `/console/programs/sessions` — Sessions. **CRUD/interactive:** DataTable (rowHref), "+ New" link

## Venues

- `/console/venues` — Venues list. **CRUD/interactive:** DataTable (rowHref), "+ New" link
- `/console/venues/new` — New venue. **CRUD/interactive:** FormShell create action
- `/console/venues/[venueId]` — Venue record. **CRUD/interactive:** Edit link, DeleteForm, field dump (read-only body)
- `/console/venues/[venueId]/edit` — Edit venue. **CRUD/interactive:** FormShell update action
- `/console/venues/[venueId]/build` — Venue build log. **CRUD/interactive:** MetricCards + build-log entries (read-only)
- `/console/venues/[venueId]/certifications` — Venue certifications. **CRUD/interactive:** DataTable, MetricCards, document upload reference (read-mostly)
- `/console/venues/[venueId]/closeout` — Venue closeout. **CRUD/interactive:** DataTable, MetricCards (read-only)
- `/console/venues/[venueId]/design` — Venue design. **CRUD/interactive:** DataTable, MetricCards, document upload reference (read-mostly)
- `/console/venues/[venueId]/handover` — Venue handover. **CRUD/interactive:** DataTable, MetricCards (read-only)
- `/console/venues/[venueId]/ros` — Venue Run of Show. **CRUD/interactive:** cues grouped by day (read-only)
- `/console/venues/[venueId]/vop` — Venue Operations Plan. **CRUD/interactive:** ordered section render (read-only)
- `/console/venues/[venueId]/zones` — Venue zones. **CRUD/interactive:** DataTable (read-only/list)
- `/console/venues/training` — Training venues. **CRUD/interactive:** DataTable (rowHref)

## BIM

- `/console/bim` — BIM models list. **CRUD/interactive:** DataTable (rowHref), MetricCards, "+ New" link, upload context
- `/console/bim/new` — Register BIM model. **CRUD/interactive:** FormShell create action with file upload
- `/console/bim/[id]` — BIM model detail. **CRUD/interactive:** Open-3D-viewer link, model-state info, upload/processing state (read-mostly detail)
- `/console/bim/[id]/edit` — Edit BIM model. **CRUD/interactive:** FormShell update action with upload
- `/console/bim/[id]/view` — 3D model viewer. **CRUD/interactive:** ViewerLoader (IFC web viewer via `/api/v1/bim/[id]/download`); read-only viewer

## Site Plans

- `/console/site-plans` — Site plans (sheets) list. **CRUD/interactive:** DataTable (rowHref), MetricCards, "+ New" link
- `/console/site-plans/new` — New sheet. **CRUD/interactive:** FormShell create action
- `/console/site-plans/[id]` — Site plan detail. **CRUD/interactive:** document-state TransitionBar (`transitionsFromState`), add/delete forms for zone regions, bands, stations, placements; child-row delete forms
- `/console/site-plans/[id]/edit` — Edit sheet. **CRUD/interactive:** FormShell update action (atom-ID segments immutable)
- `/console/site-plans/[id]/markup` — PDF markup. **CRUD/interactive:** MarkupLoader (client markup tool over uploaded PDF in `site-plans` bucket)

## Drawings

- `/console/drawings` — Drawings (sheet sets) list. **CRUD/interactive:** DataTable (rowHref), MetricCards, "+ New" link
- `/console/drawings/new` — New sheet set. **CRUD/interactive:** FormShell create action
- `/console/drawings/[id]` — Sheet set detail. **CRUD/interactive:** add-version / add-member / publish-version / supersede-version actions, DataTable of versions/members, EmptyState
- `/console/drawings/[id]/edit` — Edit sheet set. **CRUD/interactive:** FormShell update action

## Specs

- `/console/specs` — Specifications list. **CRUD/interactive:** DataTable (rowHref), MetricCards, "+ New" link
- `/console/specs/new` — New spec section. **CRUD/interactive:** FormShell create action
- `/console/specs/[id]` — Spec section detail. **CRUD/interactive:** issue-section / supersede-section state actions
- `/console/specs/[id]/edit` — Edit spec section. **CRUD/interactive:** FormShell update action (issue/supersede state managed on detail page)

## Takeoffs

- `/console/takeoffs` — Takeoffs list. **CRUD/interactive:** DataTable (rowHref), MetricCards, "+ New" link
- `/console/takeoffs/new` — New takeoff. **CRUD/interactive:** FormShell create action
- `/console/takeoffs/[id]` — Takeoff detail. **CRUD/interactive:** Edit link, DeleteForm, DataTable of line items, MetricCards
- `/console/takeoffs/[id]/edit` — Edit takeoff. **CRUD/interactive:** FormShell update action

## Estimates

- `/console/estimates` — Estimates list. **CRUD/interactive:** DataTable (rowHref), MetricCards, "+ New" link
- `/console/estimates/new` — New estimate. **CRUD/interactive:** FormShell create action
- `/console/estimates/[id]` — Estimate detail. **CRUD/interactive:** Edit link, DeleteForm, field display (markup etc.)
- `/console/estimates/[id]/edit` — Edit estimate. **CRUD/interactive:** FormShell update action

## Captures

- `/console/captures` — Reality captures list. **CRUD/interactive:** DataTable (rowHref), MetricCards, "+ New" link, upload context
- `/console/captures/new` — Register reality capture. **CRUD/interactive:** FormShell create action

## Photos

- `/console/photos` — Project photos. **CRUD/interactive:** photo grid with upload, filter via searchParams, MetricCards, EmptyState
- `/console/photos/upload` — Upload photos. **CRUD/interactive:** photo upload action

## Warranties

- `/console/warranties` — Warranties list. **CRUD/interactive:** DataTable (rowHref), MetricCards, "+ New" link
- `/console/warranties/new` — New warranty. **CRUD/interactive:** FormShell create action

## Punch

- `/console/punch` — Punch list (show-ready gate). **CRUD/interactive:** PunchKanban board + DataTable, view toggle (searchParams), MetricCards, "+ New" link
- `/console/punch/new` — New punch item. **CRUD/interactive:** FormShell create action
- `/console/punch/[id]` — Punch item detail. **CRUD/interactive:** state transition actions (`transitionPunchItem` → in_progress / ready_for_review / complete), Edit link
- `/console/punch/[id]/edit` — Edit punch item. **CRUD/interactive:** FormShell update action
- `/console/punch/lists` — Punch lists. **CRUD/interactive:** DataTable, DeleteForm, toggle actions

## Risk

- `/console/risk` — Risk scores. **CRUD/interactive:** DataTable (rowHref), MetricCards (read-only scoring view)

## Proposals

- `/console/proposals` — Proposals list. **CRUD/interactive:** DataTable (rowHref), "+ New Proposal" link
- `/console/proposals/new` — New proposal. **CRUD/interactive:** create form, optional template prefill via `?templateId`/`?clientId` searchParams
- `/console/proposals/[proposalId]` — Proposal detail. **CRUD/interactive:** PDF DownloadLink (`/api/v1/proposals/[id]/pdf`), GenerateDraftButton (AI draft), ProposalConvertButton (signed → project), draft preview, EmptyState
- `/console/proposals/[proposalId]/edit` — Edit proposal. **CRUD/interactive:** edit form (save), share-link generation (client signature capture on shared view), back link
- `/console/proposals/templates` — Proposal templates list. **CRUD/interactive:** template cards linking to detail, "+ New Proposal" link, EmptyState
- `/console/proposals/templates/[templateId]` — Proposal template detail. **CRUD/interactive:** "Use template" link (`/console/proposals/new?templateId=`), block preview incl. signature_block (read-only preview)

## Templates

- `/console/templates` — Project templates gallery. **CRUD/interactive:** template cards with apply/use action, category grouping, EmptyState
- `/console/templates/[templateId]/new` — Create project from template. **CRUD/interactive:** form action (create project from template)


---

# ATLVS Console — Finance & Procurement

Page inventory for the `/console` platform shell, scoped to the `finance`, `subscriptions`, `procurement`, `contracts`, and `submittals` segments. One bullet per route (dynamic detail/new/edit collapsed under their parent). CRUD/interactive notes reflect what each `page.tsx` (and sibling `actions.ts`) actually wires up.

## Finance

- `/console/finance` — Finance hub: AR/AP, budgets, and reporting at a glance. **CRUD/interactive:** read-only (two streamed MetricCard grids: outstanding/paid/expenses/budget-total + counts; sub-module tiles link out).
- `/console/finance/ap-ocr` — AP Invoice OCR queue: upload vendor invoice PDFs, auto-extract, and promote to invoices. **CRUD/interactive:** DataTable (state-filtered list, rowHref to extraction), client file-upload form (`uploadAndExtract`, PDF only) with extraction confidence/state machine (queued→extracting→extracted→review→matched→promoted/rejected/failed), MetricCards.
- `/console/finance/budgets` — Budget register. **CRUD/interactive:** DataTable (filter, rowHref to detail), link to `/new`, link to `/import`.
  - `/console/finance/budgets/new` — Create budget. **CRUD/interactive:** create form (`"use server"` action).
  - `/console/finance/budgets/import` — Paste-import budget rows from CSV/TSV (XPMS Universal Budget Template). **CRUD/interactive:** client bulk-import form (`ImportBudgetForm`, header auto-detection).
  - `/console/finance/budgets/[budgetId]` — Budget detail. **CRUD/interactive:** reconcile action (form), edit link, DeleteForm.
  - `/console/finance/budgets/[budgetId]/edit` — Edit budget. **CRUD/interactive:** update FormShell.
  - `/console/finance/budgets/summary` — Budget summary rollups by department/XPMS class. **CRUD/interactive:** read-only (aggregate tables, filters).
- `/console/finance/cost-codes` — Master cost-code list. **CRUD/interactive:** DataTable (rowHref), link to `/new`.
  - `/console/finance/cost-codes/new` — Create cost code. **CRUD/interactive:** create FormShell.
- `/console/finance/entities` — Legal entities register. **CRUD/interactive:** DataTable (filter, rowHref), MetricCards, link to `/new`.
  - `/console/finance/entities/new` — Create legal entity. **CRUD/interactive:** create FormShell.
  - `/console/finance/entities/[id]` — Entity detail. **CRUD/interactive:** read-only (MetricCards, filters).
- `/console/finance/consolidation` — Multi-entity FX consolidation. **CRUD/interactive:** read-only dashboard (MetricCards, EmptyState, references `POST /api/v1/integrations/fx/refresh` and links to create entities).
- `/console/finance/expenses` — Expense register. **CRUD/interactive:** DataTable (filter, rowHref), StatusBadge, link to `/new`.
  - `/console/finance/expenses/new` — Log expense. **CRUD/interactive:** create form.
  - `/console/finance/expenses/[expenseId]` — Expense detail. **CRUD/interactive:** StatusBadge, edit link, DeleteForm.
  - `/console/finance/expenses/[expenseId]/edit` — Edit expense. **CRUD/interactive:** update FormShell.
- `/console/finance/forecasts` — EAC forecasts. **CRUD/interactive:** DataTable (filter, rowHref), MetricCards, link to `/new`.
  - `/console/finance/forecasts/new` — Create EAC forecast. **CRUD/interactive:** create FormShell.
- `/console/finance/invoices` — Invoice register. **CRUD/interactive:** DataTable (filter, rowHref), StatusBadge, link to `/new`.
  - `/console/finance/invoices/new` — Create invoice. **CRUD/interactive:** create form.
  - `/console/finance/invoices/[invoiceId]` — Invoice detail. **CRUD/interactive:** StatusBadge, PDF DownloadLink (`/api/v1/invoices/[id]/pdf`), document-view link, edit link, DeleteForm.
  - `/console/finance/invoices/[invoiceId]/edit` — Edit invoice. **CRUD/interactive:** update FormShell.
  - `/console/finance/invoices/[invoiceId]/line-items` — Invoice line items. **CRUD/interactive:** DataTable.
  - `/console/finance/invoices/[invoiceId]/activity` — Invoice audit trail. **CRUD/interactive:** read-only DataTable (filter).
- `/console/finance/lien-waivers` — Lien waiver register. **CRUD/interactive:** DataTable (filter, rowHref), MetricCards, link to `/new`.
  - `/console/finance/lien-waivers/new` — Create lien waiver. **CRUD/interactive:** create FormShell.
  - `/console/finance/lien-waivers/[id]` — Lien waiver detail with e-sign lifecycle (drafted→sent→signed→returned→released/voided). **CRUD/interactive:** send action, record-signature form (signer name/title), mark-returned, release, void (reason) — each a server-action form; linked pay-app.
- `/console/finance/mileage` — Mileage log. **CRUD/interactive:** DataTable (rowHref), link to `/new`.
  - `/console/finance/mileage/new` — Log mileage. **CRUD/interactive:** create form.
  - `/console/finance/mileage/[mileageId]` — Mileage detail. **CRUD/interactive:** DeleteForm.
  - `/console/finance/mileage/[mileageId]/edit` — Edit mileage. **CRUD/interactive:** update FormShell.
- `/console/finance/pay-apps` — Pay applications register. **CRUD/interactive:** DataTable (filter, rowHref), MetricCards, link to `/new`.
  - `/console/finance/pay-apps/new` — Create pay application. **CRUD/interactive:** create FormShell.
  - `/console/finance/pay-apps/[id]` — Pay app detail with state machine. **CRUD/interactive:** PDF download (`/api/v1/pay-apps/[id]/pdf`, signed URL), transition controls (submit/approve/reject/paid via `transitionPayApp`), inline per-line edit forms (`updatePayAppLine`).
- `/console/finance/payouts` — Stripe Connect onboarding status per vendor. **CRUD/interactive:** read-only DataTable (Connect account column).
- `/console/finance/payroll` — Certified payroll runs. **CRUD/interactive:** DataTable (filter), MetricCards, per-row PDF + state-XML DownloadLinks (`/api/v1/payroll-runs/[id]/pdf`, `/state-xml`), link to `/new`.
  - `/console/finance/payroll/new` — Create payroll run. **CRUD/interactive:** create FormShell.
- `/console/finance/periods` — Accounting periods. **CRUD/interactive:** DataTable (filter, rowHref), link to `/new`.
  - `/console/finance/periods/new` — Open accounting period (month/quarter/fiscal). **CRUD/interactive:** create FormShell.
  - `/console/finance/periods/[periodId]` — Period detail with recent state transitions. **CRUD/interactive:** read-only (transition journal preview, link to full transitions log).
  - `/console/finance/periods/[periodId]/transitions` — Append-only state-transition log. **CRUD/interactive:** read-only table.
- `/console/finance/reports` — Live P&L / financial reports from current books. **CRUD/interactive:** read-only (MetricCards, AR-aging table).
- `/console/finance/time` — Time tracking entries. **CRUD/interactive:** DataTable (rowHref, searchParams filter), link to `/new`.
  - `/console/finance/time/new` — Log time. **CRUD/interactive:** create form.
  - `/console/finance/time/[entryId]` — Time entry detail. **CRUD/interactive:** DeleteForm.
  - `/console/finance/time/[entryId]/edit` — Edit time entry. **CRUD/interactive:** update FormShell.
- `/console/finance/timesheets` — Timesheets register. **CRUD/interactive:** DataTable (filter, rowHref), StatusBadge.
  - `/console/finance/timesheets/[id]` — Timesheet detail with approvals. **CRUD/interactive:** read-only (StatusBadge, per-approver decision list).
- `/console/finance/treasury` — Cash position, receivables, payables. **CRUD/interactive:** read-only (MetricCards, EmptyState, filter).
- `/console/finance/wip` — Work-in-progress (WIP) snapshots per project. **CRUD/interactive:** DataTable (filter), MetricCards, generate-snapshots action (`generateOrgWipSnapshots` form), snapshot PDF DownloadLink (`/api/v1/wip/snapshot-pdf`), link to `/new`.

## Subscriptions

- `/console/subscriptions` — Recurring subscriptions (members, retainers, sponsors). **CRUD/interactive:** DataTable (filter, rowHref), link to `/new`.
  - `/console/subscriptions/new` — Create subscription. **CRUD/interactive:** create FormShell.
  - `/console/subscriptions/[subscriptionId]` — Subscription detail with recent state transitions. **CRUD/interactive:** read-only (transition journal preview, link to full transitions log).
  - `/console/subscriptions/[subscriptionId]/transitions` — Append-only state-transition log (incl. Stripe event column). **CRUD/interactive:** read-only table.

## Procurement

- `/console/procurement` — Procurement hub (vendors, requisitions, POs). **CRUD/interactive:** read-only (MetricCards + sub-module tiles).
- `/console/procurement/catalog` — Approved item catalog. **CRUD/interactive:** read-only (EmptyState; list view).
- `/console/procurement/itb` — Invitations to Bid (ITB phase tracking). **CRUD/interactive:** DataTable (filter, rowHref to RFQ detail), MetricCards, link to create RFQ.
- `/console/procurement/po-change-orders` — PO change orders register. **CRUD/interactive:** DataTable (filter, rowHref), MetricCards, link to `/new`.
  - `/console/procurement/po-change-orders/new` — Create PO change order. **CRUD/interactive:** create FormShell.
  - `/console/procurement/po-change-orders/[id]` — Change-order detail with approval state machine. **CRUD/interactive:** transition controls (submit/approve/reject via `transitionPoChangeOrder`), add-line form (`addCoLine`) + delete-line (`deleteCoLine`); lines lock once in review/approved/rejected/void.
- `/console/procurement/prequalification` — Vendor prequalification pipeline. **CRUD/interactive:** DataTable (filter, rowHref), MetricCards, links to invite-vendor `/new` and `/questionnaires/new`.
  - `/console/procurement/prequalification/new` — Invite vendor to prequalify. **CRUD/interactive:** create FormShell.
  - `/console/procurement/prequalification/questionnaires` — Prequal questionnaires. **CRUD/interactive:** DataTable (rowHref), link to `/new`.
  - `/console/procurement/prequalification/questionnaires/new` — Create questionnaire. **CRUD/interactive:** create FormShell.
- `/console/procurement/purchase-orders` — Purchase orders register. **CRUD/interactive:** DataTable (filter, rowHref), StatusBadge, link to `/new`.
  - `/console/procurement/purchase-orders/new` — Create purchase order. **CRUD/interactive:** create form.
  - `/console/procurement/purchase-orders/[poId]` — PO detail. **CRUD/interactive:** StatusBadge, edit link, DeleteForm.
  - `/console/procurement/purchase-orders/[poId]/edit` — Edit PO. **CRUD/interactive:** update FormShell.
  - `/console/procurement/purchase-orders/[poId]/checklist` — PO closeout checklist. **CRUD/interactive:** complete-item / skip-item forms (`completeChecklistItem`, `skipChecklistItem`), add-item form (`addChecklistItem`), filter.
- `/console/procurement/requisitions` — Requisitions register. **CRUD/interactive:** DataTable (filter, rowHref), StatusBadge, link to `/new`.
  - `/console/procurement/requisitions/new` — Create requisition. **CRUD/interactive:** create form.
  - `/console/procurement/requisitions/[reqId]` — Requisition detail. **CRUD/interactive:** edit link, DeleteForm.
  - `/console/procurement/requisitions/[reqId]/edit` — Edit requisition. **CRUD/interactive:** update FormShell.
  - `/console/procurement/requisitions/[reqId]/leveling` — Bid leveling / comparison. **CRUD/interactive:** DataTable (filter), award-response form per row (`awardResponse`).
  - `/console/procurement/requisitions/[reqId]/leveling/new` — Add bid response. **CRUD/interactive:** create FormShell.
- `/console/procurement/rfqs` — RFQs register. **CRUD/interactive:** DataTable (filter, rowHref into requisitions), MetricCards, link to create requisition.
  - `/console/procurement/rfqs/new` — Create RFQ. **CRUD/interactive:** create FormShell.
  - `/console/procurement/rfqs/[rfqId]` — RFQ detail with responses summary. **CRUD/interactive:** read-only (StatusBadge, MetricCards incl. lowest-bid, response list, link to requisitions).
  - `/console/procurement/rfqs/[rfqId]/publish` — Publish RFQ to the public marketplace. **CRUD/interactive:** publish FormShell.
  - `/console/procurement/rfqs/[rfqId]/responses` — RFQ responses list. **CRUD/interactive:** DataTable (filter), MetricCards.
  - `/console/procurement/rfqs/[rfqId]/responses/[responseId]` — Response detail with line items. **CRUD/interactive:** MetricCards, add-line form (`addResponseLine`), delete-line (`deleteResponseLine`).
- `/console/procurement/scorecards` — Supplier scorecards overview. **CRUD/interactive:** read-only (MetricCards, EmptyState, link to vendors).
- `/console/procurement/sourcing` — Sourcing overview (requisition→PO conversion funnel). **CRUD/interactive:** read-only (MetricCards, EmptyState, link to create requisition).
- `/console/procurement/vendors` — Vendors register. **CRUD/interactive:** DataTable (filter, rowHref), link to `/new`.
  - `/console/procurement/vendors/new` — Create vendor. **CRUD/interactive:** create form.
  - `/console/procurement/vendors/[vendorId]` — Vendor detail. **CRUD/interactive:** edit link, DeleteForm.
  - `/console/procurement/vendors/[vendorId]/edit` — Edit vendor. **CRUD/interactive:** update FormShell.
  - `/console/procurement/vendors/[vendorId]/onboarding` — Vendor onboarding checklist (required-item progress). **CRUD/interactive:** read-only (item-state progress view, filter).
  - `/console/procurement/vendors/[vendorId]/pos` — Vendor's purchase orders. **CRUD/interactive:** read-only DataTable (filter, rowHref), StatusBadge.
  - `/console/procurement/vendors/[vendorId]/prequalification` — Vendor prequalification submissions. **CRUD/interactive:** DataTable (filter, rowHref).
  - `/console/procurement/vendors/[vendorId]/prequalification/[prequalId]` — Prequal submission detail. **CRUD/interactive:** read-only (MetricCards, signed-URL attachment download links via `procore-parity` storage).
  - `/console/procurement/vendors/[vendorId]/scorecard` — Per-vendor scorecard. **CRUD/interactive:** read-only (MetricCards, submittal-rate stats, EmptyState).
  - `/console/procurement/vendors/[vendorId]/submittals` — Vendor's submittals. **CRUD/interactive:** read-only DataTable (filter, rowHref), StatusBadge.
- `/console/procurement/wo-broadcasts` — Work-order broadcasts register. **CRUD/interactive:** DataTable (filter, rowHref), MetricCards, link to `/new`.
  - `/console/procurement/wo-broadcasts/new` — Create WO broadcast. **CRUD/interactive:** create FormShell.
  - `/console/procurement/wo-broadcasts/[broadcastId]` — Broadcast detail with vendor invites. **CRUD/interactive:** transition controls (`transitionBroadcast`), invite-vendor form (`inviteVendor`), award-to-invite (`awardToInvite`), remove-invite (`removeInvite`), MetricCards, filter.

## Contracts

- `/console/contracts` — Contracts register. **CRUD/interactive:** DataTable (filter, rowHref to `/console/contracts/[id]`), MetricCards, link to `/console/contracts/new`. _(Note: the referenced `/new` and `/[id]` detail routes have no `page.tsx` under this segment — only the list page exists here.)_

## Submittals

- `/console/submittals` — Submittals register (vendor packages with stamps + revision rounds). **CRUD/interactive:** DataTable (filter, rowHref), MetricCards, link to `/new`.
  - `/console/submittals/new` — Create submittal register entry. **CRUD/interactive:** create FormShell.
  - `/console/submittals/[id]` — Submittal detail with revision rounds. **CRUD/interactive:** stamp-revision form (`stampRevision` — approved / approved-with-comments / revise-resubmit / rejected + notes), add-next-round (`addNextRound`), close-submittal (`closeSubmittal`).
  - `/console/submittals/[id]/edit` — Edit submittal (title, status, vendor, ball-in-court). **CRUD/interactive:** update FormShell.


---

# ATLVS Console — Sales & Marketplace

Inventory of every `page.tsx` under the in-scope `/console` segments: marketplace, sales, bookings, commercial, clients, agency, leads, pipeline, campaigns, marketing. CRUD/interactive notes reflect the actual server actions, forms, tables, and controls wired into each page (dynamic children collapsed under their parent where natural).

## Marketplace

- `/console/marketplace` — Marketplace overview hub: metric cards (live postings, open calls, active offers, new applicants) linking into sub-modules, plus tiles for postings, calls, talent, offers, RFQ marketplace, inquiries, reviews. **CRUD/interactive:** read-only dashboard; metric cards + tiles are nav links, with inline `+ New` shortcuts to each create route.
- `/console/marketplace/settings` — Marketplace take-rate and public visibility settings for the org. **CRUD/interactive:** form (`FormShell` → `updateMarketplaceSettingsAction`) — enable/disable public surfaces toggle + take-rate (bps) input; owner/admin-gated.
- `/console/marketplace/inquiries` — Inbox of quote/booking inquiries from public profiles and RFQs. **CRUD/interactive:** per-row state controls (Mark Responded, Close) via `setInquiryState` bound forms; new/responded/closed lifecycle.
- `/console/marketplace/reviews` — Bidirectional review moderation list (hidden until both sides post). **CRUD/interactive:** read-only `DataTable` with filterable/groupable subject, tx, released columns.
- `/console/marketplace/offers` — Talent offer list with active-offer count. **CRUD/interactive:** `DataTable` with `rowHref` to detail, filterable/groupable status; `+ New Offer` link.
- `/console/marketplace/offers/new` — Create a talent offer (talent, optional project, date, slot, fee/currency/deposit, balance terms). **CRUD/interactive:** create form (`FormShell` → `createOfferAction`); native selects for talent/project/balance-terms; 60/40 default.
- `/console/marketplace/offers/[offerId]` — Offer detail: terms, deposit/balance split, timeline. **CRUD/interactive:** offer state machine via `OfferControls` (Send Offer / Accept / Decline → `sendOfferAction`/`acceptOfferAction`/`declineOfferAction`); draft→sent→countered→accepted→contracted.
- `/console/marketplace/postings` — Public crew job-board postings list with live/draft counts + metric card. **CRUD/interactive:** `DataTable` with `rowHref`, filterable status; `+ New Posting` link.
- `/console/marketplace/postings/new` — Create a job posting. **CRUD/interactive:** create form (`createPostingAction`); selects for posting type + employment type; drafts private until published.
- `/console/marketplace/postings/[postingId]` — Posting detail (roles, certifications, unions). **CRUD/interactive:** `PublishControls` (publish/close FSM via `publishPostingAction`/`closePostingAction`); links to Applicants + Edit.
- `/console/marketplace/postings/[postingId]/edit` — Edit a posting. **CRUD/interactive:** update form (`updatePostingAction`); type/employment selects.
- `/console/marketplace/postings/[postingId]/applicants` — Applicant list (ATS) for a posting. **CRUD/interactive:** `DataTable` with `rowHref` to applicant detail.
- `/console/marketplace/postings/[postingId]/applicants/[applicationId]` — Applicant detail. **CRUD/interactive:** application status-transition form (`transitionApplicationAction`) via native select.
- `/console/marketplace/calls` — Open calls / casting list with live + submission counts + metric card. **CRUD/interactive:** `DataTable` with `rowHref`; `+ New` link.
- `/console/marketplace/calls/new` — Create an open call (casting / RFP / audition). **CRUD/interactive:** create form (`createCallAction`); kind select.
- `/console/marketplace/calls/[callId]` — Open-call detail. **CRUD/interactive:** publish/close FSM (`publishCallAction`/`closeCallAction`); links to Submissions + Edit.
- `/console/marketplace/calls/[callId]/edit` — Edit an open call. **CRUD/interactive:** update form (`updateCallAction`); kind select.
- `/console/marketplace/calls/[callId]/submissions` — Submission list for a call. **CRUD/interactive:** `DataTable` with `rowHref` to submission detail.
- `/console/marketplace/calls/[callId]/submissions/[submissionId]` — Submission detail. **CRUD/interactive:** submission status-transition form (`transitionSubmissionAction`) via native select.
- `/console/marketplace/talent` — Talent EPK roster list with public count. **CRUD/interactive:** `DataTable` with `rowHref`; `+ New` link.
- `/console/marketplace/talent/new` — Create a talent profile / EPK. **CRUD/interactive:** create form (`createTalentAction`).
- `/console/marketplace/talent/[talentId]` — Talent detail (bio, genres, riders summary). **CRUD/interactive:** `TalentVisibility` publish/unpublish toggle (`publishTalentAction`/`unpublishTalentAction`); links to Riders + Edit + add rider.
- `/console/marketplace/talent/[talentId]/edit` — Edit a talent profile. **CRUD/interactive:** update form (`updateTalentAction`).
- `/console/marketplace/talent/[talentId]/riders` — Rider list for a talent profile. **CRUD/interactive:** read-only list; `+ New Rider` link.
- `/console/marketplace/talent/[talentId]/riders/new` — Attach a rider (kind, version, file URL). **CRUD/interactive:** create form (`createRiderAction`); kind select.
- `/console/marketplace/talent/[talentId]/riders/[riderId]` — Rider detail. **CRUD/interactive:** read-only; external file-URL link if present.
- `/console/marketplace/discounts` — Discount-code list (Commerce). **CRUD/interactive:** `DataTable` with `rowHref`; links to Promoters + `+ New Code`.
- `/console/marketplace/discounts/new` — Create a discount code. **CRUD/interactive:** create form (`createDiscountAction`).
- `/console/marketplace/discounts/[discountId]` — Discount-code detail. **CRUD/interactive:** state-transition buttons (`setDiscountStateAction` bound forms) + `DeleteForm` (`deleteDiscountAction`).
- `/console/marketplace/discounts/promoters` — Affiliate/promoter list. **CRUD/interactive:** `DataTable` with `rowHref`; `+ New Promoter` link.
- `/console/marketplace/discounts/promoters/new` — Create a promoter. **CRUD/interactive:** create form (`createPromoterAction`).
- `/console/marketplace/discounts/promoters/[promoterId]` — Promoter detail with attribution ledger. **CRUD/interactive:** state-transition buttons (`setPromoterStateAction`) + `DeleteForm` (`deletePromoterAction`) + Record-Attribution form (`AttributionForm` → `createAttributionAction`).
- `/console/marketplace/box-office` — Box-office hub: guest lists with check-in metrics. **CRUD/interactive:** `DataTable`; `+ New Guest List` link; guest-code scan + check-in actions exposed (`scanGuestCodeAction`, `checkInEntryAction`).
- `/console/marketplace/box-office/new` — Create a guest list (name + event). **CRUD/interactive:** create form (`createGuestListAction`); event select.
- `/console/marketplace/box-office/[listId]` — Guest-list detail: entries, scan codes, check-in metrics. **CRUD/interactive:** add-guest form (`addGuestEntryAction`) + per-entry check-in / deny / reset controls (`checkInEntryAction`/`denyEntryAction`/`resetEntryAction`).

## Sales

- `/console/sales` — Sales hub linking to leads (pipeline kanban + saved views), clients, sponsors, marketing, bookings. **CRUD/interactive:** read-only card grid of nav links.
- `/console/sales/beos` — Banquet Event Orders (BEOs) list. **CRUD/interactive:** `DataTable` with `rowHref`; `+ New BEO` link.
- `/console/sales/beos/new` — Create a BEO. **CRUD/interactive:** create form (`createBeoAction`).
- `/console/sales/beos/[id]` — BEO detail (event, headcount, line items). **CRUD/interactive:** `BeoStateControls` state machine (`setBeoStateAction`); add/delete line items (`addBeoLineAction`/`deleteBeoLineAction`).
- `/console/sales/diary` — Function Diary calendar (spaces × dates) with prev/today/next navigation. **CRUD/interactive:** calendar view with date-range nav; links to Spaces + `+ New Booking`; empty-state CTA.
- `/console/sales/diary/new` — Create a booking against a space. **CRUD/interactive:** create form (`createBookingAction`); empty-state if no spaces.
- `/console/sales/diary/[bookingId]` — Booking detail. **CRUD/interactive:** state-transition select form (`transitionBookingAction`) + `DeleteForm` (`deleteBooking`) + Edit link.
- `/console/sales/diary/[bookingId]/edit` — Edit a booking. **CRUD/interactive:** update form (`updateBookingAction`).
- `/console/sales/diary/spaces` — Bookable spaces list. **CRUD/interactive:** `DataTable`; `+ New Space` link.
- `/console/sales/diary/spaces/new` — Create a space. **CRUD/interactive:** create form (`createSpaceAction`).

## Bookings

- `/console/bookings` — Bookings overview: deal/hold/settlement metrics (tier-1 holds, finalized, settled GBOR) + tiles. **CRUD/interactive:** read-only dashboard with nav tiles.
- `/console/bookings/calendar` — Calendar of upcoming tiered holds + booking milestones. **CRUD/interactive:** read-only calendar/list view.
- `/console/bookings/deals` — Deal-tracker list (sourced from talent offers). **CRUD/interactive:** `DataTable` with `rowHref`; `+ New` routes to offers/new.
- `/console/bookings/deals/[offerId]` — Deal detail: walkout threshold, co-promoter partners/splits, settlement link. **CRUD/interactive:** co-promoter partner forms (`addCoProPartnerAction`/`removeCoProPartnerAction` from `co-pro/actions`); links to source offer + create/open settlement.
- `/console/bookings/deals/[offerId]/settlement` — Post-show reconciliation (NBOR, balance due, ancillary). **CRUD/interactive:** upsert form (`upsertSettlementAction`) + finalize action (`finalizeSettlementAction`); read-only once final.
- `/console/bookings/holds` — Tiered holds list (active). **CRUD/interactive:** `DataTable`; `+ New Hold` link; release action available (`releaseHoldAction`).
- `/console/bookings/holds/new` — Place a tiered hold (tier 1/2/3, first-refusal). **CRUD/interactive:** create form (`createTieredHoldAction`); tier select.
- `/console/bookings/settlements` — Settlements list with GBOR/NBOR/final/draft metrics. **CRUD/interactive:** `DataTable` with `rowHref`; read-only roll-up.
- `/console/bookings/settlements/[id]` — Settlement detail with itemized lines. **CRUD/interactive:** add/delete settlement-line forms (`addSettlementLine`/`deleteSettlementLine`); state badge; Edit-on-deal link.

## Commercial

- `/console/commercial` — Commercial revenue hub linking sponsors, ticketing, hospitality, licensing, brand. **CRUD/interactive:** read-only card grid of nav links.
- `/console/commercial/licensing` — Trademark / licensing roll-up with active + expiring-soon counts. **CRUD/interactive:** read-only; links to `/console/legal/ip`; empty-state CTA.
- `/console/commercial/hospitality` — Hospitality packages + entitlements roll-up (seats, allocation). **CRUD/interactive:** read-only aggregator; links to Sponsors + package detail; empty-state CTAs.
- `/console/commercial/hospitality/[packageId]` — Hospitality package detail. **CRUD/interactive:** read-only display + `DeleteForm` (`deleteHospitalityPackage`) + Edit link.
- `/console/commercial/hospitality/[packageId]/edit` — Edit a hospitality package. **CRUD/interactive:** update form (`updateHospitalityPackage`).
- `/console/commercial/sponsors` — Sponsor entitlements list. **CRUD/interactive:** `DataTable` with `rowHref`; `+ New` link.
- `/console/commercial/sponsors/new` — Create a sponsor entitlement. **CRUD/interactive:** create form (`createEntitlement`); status select.
- `/console/commercial/sponsors/[sponsorId]` — Sponsor entitlement detail. **CRUD/interactive:** read-only display + `DeleteForm` (`deleteSponsorEntitlement`) + Edit link.
- `/console/commercial/sponsors/[sponsorId]/edit` — Edit a sponsor entitlement. **CRUD/interactive:** update form (`updateSponsorEntitlement`); status select.

## Clients

- `/console/clients` — Clients list with saved DataTable views. **CRUD/interactive:** `DataTable` with `rowHref`, saved-view config (save/delete/set-default via `saveClientsView`/`deleteClientsView`/`setDefaultClientsView`) + bulk delete (`bulkDeleteClients`); `+ New Client` link.
- `/console/clients/new` — Create a client. **CRUD/interactive:** create form (`createClientAction`).
- `/console/clients/[clientId]` — Client detail. **CRUD/interactive:** `DeleteForm` (`deleteClient`); shortcut buttons to new proposal / new invoice (prefilled) + Edit.
- `/console/clients/[clientId]/edit` — Edit a client. **CRUD/interactive:** update form (`updateClient`); also exposes `deleteClient`.
- `/console/clients/[clientId]/branding` — Client co-brand logo + colors editor. **CRUD/interactive:** branding form (`updateClientBrandingAction`) for proposal/invoice co-brand lockup.
- `/console/clients/[clientId]/invoices` — Invoices for this client. **CRUD/interactive:** read-only `DataTable` with `rowHref` to finance/invoices.
- `/console/clients/[clientId]/projects` — Projects linked to this client. **CRUD/interactive:** read-only `DataTable` with `rowHref` to projects.
- `/console/clients/[clientId]/proposals` — Proposals sent to this client. **CRUD/interactive:** read-only `DataTable` with `rowHref` to proposals.

## Agency

- `/console/agency` — Agency overview: roster/tours/commission cards + counts. **CRUD/interactive:** read-only nav cards; `+ New Tour` link.
- `/console/agency/commissions` — Commission tracking list. **CRUD/interactive:** read-only `DataTable` with `rowHref`.
- `/console/agency/roster` — Agency artist roster list. **CRUD/interactive:** `DataTable` with `rowHref`; links to talent/new.
- `/console/agency/roster/[agencyArtistId]` — Roster-entry detail (signed/ended dates). **CRUD/interactive:** update form (`updateAgencyArtistAction`) + end-representation form (`endAgencyArtistAction`).
- `/console/agency/tours` — Tours list (multi-date P&L roll-up). **CRUD/interactive:** `DataTable` with `rowHref`; `+ New Tour` link.
- `/console/agency/tours/new` — Create a tour (routing container). **CRUD/interactive:** create form (`createTourAction`); talent + agency selects.
- `/console/agency/tours/[tourId]` — Tour detail: multi-date P&L roll-up with deal links. **CRUD/interactive:** read-only; status badge + links to deals.

## Leads

- `/console/leads` — Leads list (stage column, value, source). **CRUD/interactive:** `DataTable` with `rowHref` + `StatusBadge` stages; `+ New Lead` link (stage moves happen on detail).
- `/console/leads/new` — Create a lead. **CRUD/interactive:** create form (`createLeadAction`).
- `/console/leads/[leadId]` — Lead detail (stage, notes). **CRUD/interactive:** `LeadStageMover` stage transitions (`moveLeadStageAction`) + `DeleteForm` (`deleteLead`) + Edit link.
- `/console/leads/[leadId]/edit` — Edit a lead. **CRUD/interactive:** update form (`updateLead`); stage changes deferred to detail.
- `/console/leads/[leadId]/activity` — Audit trail for the lead. **CRUD/interactive:** read-only `DataTable` over `audit_log`.
- `/console/leads/[leadId]/proposals` — Proposals sourced from this lead. **CRUD/interactive:** read-only `DataTable`.

## Pipeline

- `/console/pipeline` — CRM deal pipeline board: opportunities grouped into stage lanes, open-value metrics, multi-pipeline switcher. **CRUD/interactive:** read-only board view; pipeline switcher links (`?pipeline=slug`); no inline mutations.
- `/console/pipeline/[dealId]` — Opportunity detail with stage badge + activity timeline. **CRUD/interactive:** read-only display of deal fields + logged activities.

## Campaigns

- `/console/campaigns` — Marketing campaigns list with live count + budget/spend roll-up. **CRUD/interactive:** `DataTable` with filterable/groupable columns; `+ New Campaign` link (list-only, no detail route).
- `/console/campaigns/new` — Create a campaign (channel, kind, budget). **CRUD/interactive:** create form (`createCampaign`); channel + kind selects.

## Marketing

- `/console/marketing` — Marketing overview: metric cards + on-sales / calendar nav cards. **CRUD/interactive:** read-only dashboard with nav links.
- `/console/marketing/calendar` — Two-week marketing-milestone calendar. **CRUD/interactive:** read-only calendar/list view.
- `/console/marketing/onsales` — On-sale schedule list. **CRUD/interactive:** read-only `DataTable` with filterable/groupable columns.


---

# ATLVS Console — Workforce & People

Page inventory for the ATLVS `/console` platform shell, Workforce & People domain. Scope: every `page.tsx` under the `workforce`, `people`, `accreditation`, `participants`, `goals`, `schedule`, `tasks`, `events`, `forms`, and `guides` segments. CRUD/interactive notes reflect the server actions (`"use server"`) and UI primitives actually present in each route.

## Workforce

- `/console/workforce` — Workforce hub: tabbed list of all workforce members (`workforce_members`), filterable by kind (Paid Staff / Volunteers / Contractors / Officials / All), plus tile links to Planning, Deployment, Call Sheets, Housing, Uniforms, Services. **CRUD/interactive:** `<DataTable>` (filterable + groupable kind tabs); links into sub-modules. No inline create/edit.
- `/console/workforce/staff` — Paid-staff roster list. **CRUD/interactive:** `<DataTable>` (filterable, groupable, rowHref); "+ New" link.
- `/console/workforce/staff/new` — Create staff member. **CRUD/interactive:** `<FormShell>` → `createStaff`.
- `/console/workforce/staff/[staffId]` — Staff member detail. **CRUD/interactive:** Edit link + `<DeleteForm>` → `deleteStaffMember`.
- `/console/workforce/staff/[staffId]/edit` — Edit staff member. **CRUD/interactive:** `<FormShell>` → `updateStaffMember` (also exports `deleteStaffMember`).
- `/console/workforce/volunteers` — Volunteer roster list. **CRUD/interactive:** `<DataTable>` (filterable, groupable, rowHref); onboarding/sign signals surfaced as columns.
- `/console/workforce/volunteers/new` — Create volunteer. **CRUD/interactive:** `<FormShell>` → `createVolunteer`.
- `/console/workforce/volunteers/[volunteerId]` — Volunteer detail. **CRUD/interactive:** Edit link + `<DeleteForm>` → `deleteVolunteer`.
- `/console/workforce/volunteers/[volunteerId]/edit` — Edit volunteer. **CRUD/interactive:** `<FormShell>` → `updateVolunteer`.
- `/console/workforce/contractors` — Contractor roster list. **CRUD/interactive:** `<DataTable>` (filterable, groupable, rowHref).
- `/console/workforce/contractors/new` — Create contractor. **CRUD/interactive:** `<FormShell>` → `createContractor`.
- `/console/workforce/contractors/[contractorId]` — Contractor detail. **CRUD/interactive:** Edit link + `<DeleteForm>` → `deleteContractor`.
- `/console/workforce/contractors/[contractorId]/edit` — Edit contractor. **CRUD/interactive:** `<FormShell>` → `updateContractor`.
- `/console/workforce/rosters` — Rosters list. **CRUD/interactive:** `<DataTable>` (filterable, groupable, rowHref).
- `/console/workforce/rosters/new` — Create roster. **CRUD/interactive:** `<FormShell>` → `createRoster`.
- `/console/workforce/rosters/[rosterId]` — Roster detail. **CRUD/interactive:** Edit link + `<DeleteForm>` → `deleteRoster`.
- `/console/workforce/rosters/[rosterId]/edit` — Edit roster. **CRUD/interactive:** `<FormShell>` → `updateRoster`.
- `/console/workforce/deployment` — Deployment list (`workforce_deployments`). **CRUD/interactive:** `<DataTable>` (rowHref); "+ New" link.
- `/console/workforce/deployment/new` — Create deployment. **CRUD/interactive:** `<FormShell>` → `createDeployment`.
- `/console/workforce/deployment/[deploymentId]` — Deployment detail. **CRUD/interactive:** Edit link + `<DeleteForm>` → `deleteDeployment`.
- `/console/workforce/deployment/[deploymentId]/edit` — Edit deployment. **CRUD/interactive:** `<FormShell>` → `updateDeployment`.
- `/console/workforce/planning` — Capacity & needs dashboard over `workforce_deployments` (planned vs actual FTE, fill rate, by-functional-area breakdown). **CRUD/interactive:** read-only metrics + `<MetricCard>`/`<EmptyState>`; links to deployment.
- `/console/workforce/forecast` — Resource forecast list (`resource_forecasts`, gap rollups, horizon tabs 30d/90d/1y/5y). **CRUD/interactive:** `<DataTable>` (filterable, groupable, rowHref), `<MetricCard>`; "+ New Forecast" link.
- `/console/workforce/forecast/[id]` — Forecast detail (lines from `resource_forecast_lines`, gap badges). **CRUD/interactive:** read-only (metrics + badges).
- `/console/workforce/call-sheets` — Day-of-show call-sheet index (joins `shifts` + `workforce_members`, call/wrap times). **CRUD/interactive:** read-only; rows link to per-member sheet.
- `/console/workforce/call-sheets/[memberId]` — Per-member call sheet (shifts for one member). **CRUD/interactive:** read-only.
- `/console/workforce/housing` — Crew accommodation list (`accommodation_blocks`, rooms/dates). **CRUD/interactive:** `<DataTable>` (rowHref); "+ New Block" link to `/console/accommodation/blocks/new`.
- `/console/workforce/uniforms` — Uniform SKU catalog (`rate_card_items`, issue/return, active/retired). **CRUD/interactive:** `<DataTable>` (rowHref); "+ New SKU" link to `/console/logistics/ratecard/new`.
- `/console/workforce/services` — Service-request / meal-break dashboard over `shifts` (meal credits 7d, break minutes, checked-in-now, by-day chart). **CRUD/interactive:** read-only metrics.
- `/console/workforce/shift-swaps` — Shift-swap request queue. **CRUD/interactive:** `<DataTable>` (filterable, groupable), `<MetricCard>`; approve/deny via `decideSwap`.
- `/console/workforce/time-off` — Time-off request queue. **CRUD/interactive:** `<DataTable>` (filterable, groupable, bulkActions), `<MetricCard>`; decide via `decideTimeOff` + `bulkDecideTimeOff`.
- `/console/workforce/courses` — LMS course list. **CRUD/interactive:** `<DataTable>` (rowHref); "+ New" link.
- `/console/workforce/courses/new` — Create course. **CRUD/interactive:** `<FormShell>` → `createCourseAction`.
- `/console/workforce/courses/[courseId]` — Course detail: lessons, quiz questions, assignees, completion badge. **CRUD/interactive:** add-lesson / add-quiz-question / assign / publish / set-completion-badge inline forms + `<DeleteForm>` (`addLesson`, `addQuizQuestion`, `publishCourse`, `assignCourse`, `setCompletionBadge`, `deleteCourse`).
- `/console/workforce/courses/[courseId]/edit` — Edit course. **CRUD/interactive:** `<FormShell>` → `updateCourseAction`.
- `/console/workforce/training` — Training course list (distinct from LMS courses). **CRUD/interactive:** `<DataTable>` (filterable, groupable, rowHref).
- `/console/workforce/training/[courseId]` — Training course detail. **CRUD/interactive:** Edit link + `<DeleteForm>` → `deleteTrainingCourse`.
- `/console/workforce/training/[courseId]/edit` — Edit training course. **CRUD/interactive:** `<FormShell>` → `updateTrainingCourse`.
- `/console/workforce/onboarding` — New-hire onboarding flow list. **CRUD/interactive:** `<DataTable>` (rowHref); "+ New" link.
- `/console/workforce/onboarding/new` — Create onboarding flow. **CRUD/interactive:** `<FormShell>` → `createFlowAction`.
- `/console/workforce/onboarding/[flowId]` — Flow builder: ordered steps (sign / quiz / etc.), publish, assignees. **CRUD/interactive:** add-step / publish / assign inline forms (`addStep`, `publishFlow`, `assignFlow`); step-board UI.
- `/console/workforce/recognition` — Kudos / recognition feed (`recognition_posts`, 90-day leaderboard). **CRUD/interactive:** "+ Give Kudos" link; read-only feed + leaderboard.
- `/console/workforce/recognition/new` — Give kudos. **CRUD/interactive:** form → `createKudosFromConsole`.
- `/console/workforce/badges` — Badge catalog list. **CRUD/interactive:** `<DataTable>` (rowHref); "+ New" link.
- `/console/workforce/badges/new` — Create badge. **CRUD/interactive:** `<FormShell>` → `createBadgeAction`.
- `/console/workforce/badges/[badgeId]` — Badge detail: award form + recent awards list. **CRUD/interactive:** award-badge form + `<DeleteForm>` (`awardBadge`, `deleteBadge`).

## People

- `/console/people` — Member directory (`memberships`). **CRUD/interactive:** `<DataTable>` (filterable, groupable, rowHref) with offer/signed column signals; "+ Invite member" link; related-sections links.
- `/console/people/[personId]` — Person detail (role, email, joined). **CRUD/interactive:** Edit-role link + `<DeleteForm>` → `removePerson`; tabbed sub-board into assignments/credentials/documents/time.
- `/console/people/[personId]/edit` — Edit person/role. **CRUD/interactive:** `<FormShell>` → `updatePerson` (also exports `removePerson`).
- `/console/people/[personId]/assignments` — Per-person crew advancing assignments. **CRUD/interactive:** `<DataTable>` (filterable, groupable), read-only roster.
- `/console/people/[personId]/credentials` — Per-person certifications/licenses/IDs. **CRUD/interactive:** `<DataTable>` (filterable), read-only.
- `/console/people/[personId]/documents` — Per-person offer letters + signed agreements. **CRUD/interactive:** `<DataTable>` (filterable, groupable), read-only.
- `/console/people/[personId]/time` — Per-person time entries. **CRUD/interactive:** `<DataTable>` (filterable), read-only.
- `/console/people/credentials` — Org-wide credentials list with scan-code support. **CRUD/interactive:** `<DataTable>` (filterable, groupable, rowHref); link to Scan Code Linker.
- `/console/people/credentials/new` — Create credential. **CRUD/interactive:** `<FormShell>` → `createCredential`.
- `/console/people/credentials/[credentialId]` — Credential detail. **CRUD/interactive:** Edit link + `<DeleteForm>` → `deleteCredential`.
- `/console/people/credentials/[credentialId]/edit` — Edit credential. **CRUD/interactive:** `<FormShell>` → `updateCredential`.
- `/console/people/credentials/asset-linker` — Scan-code / asset binding tool (bind barcode/QR/NFC to an assignment; active-codes list). **CRUD/interactive:** link + revoke forms (`linkAssetAction`, `revokeLinkAction`).
- `/console/people/invites` — Pending org invitations. **CRUD/interactive:** create + revoke (`createInviteAction`, `revokeInviteAction`); `<EmptyState>`.
- `/console/people/roles` — Role matrix (custom-role management). **CRUD/interactive:** create + delete custom roles (`createCustomRole`, `deleteCustomRole`).
- `/console/people/teams` — Teams list. **CRUD/interactive:** `<DataTable>` (filterable, rowHref), `<EmptyState>`.
- `/console/people/teams/[teamId]` — Team detail + membership management (add/remove members, change role, danger-zone delete). **CRUD/interactive:** add-member / update-role / remove-member / edit-team / delete forms (`createTeamAction`, `updateTeamAction`, `deleteTeamAction`, `addMemberAction`, `updateMemberRoleAction`, `removeMemberAction`).
- `/console/people/msas` — Master Services Agreements (contracts) list. **CRUD/interactive:** `<DataTable>` (filterable, groupable, rowHref) with signed status.
- `/console/people/msas/new` — Create MSA. **CRUD/interactive:** form → `createMsa` (e-sign / signer flow).
- `/console/people/msas/[id]` — MSA detail with signer link + "Preview as signer" + signature state. **CRUD/interactive:** `markSent`, `revokeAction`; signer-link e-sign flow.
- `/console/people/offer-letters` — Offer-letter list. **CRUD/interactive:** `<DataTable>` (filterable, groupable, rowHref) with offer status.
- `/console/people/offer-letters/[id]` — Offer-letter detail (signing authority, print / save-as-PDF). **CRUD/interactive:** save / send / withdraw / rotate-signer-code (`saveLetter`, `sendLetter`, `withdrawLetter`, `rotateLetterCode`); e-sign flow + PDF export.
- `/console/people/offer-letters/[id]/onboarding` — Engagement onboarding board for a signed offer (step states: Pending / In Progress / Done / Waived / Blocked). **CRUD/interactive:** onboarding step board (status-driven); read-only display of step progression.
- `/console/people/crew` — Crew member list. **CRUD/interactive:** `<DataTable>` (filterable, groupable, rowHref); "+ New" via `createCrewAction`.
- `/console/people/crew/new` — Create crew member. **CRUD/interactive:** form → `createCrewAction`.
- `/console/people/crew/[crewId]` — Crew member detail. **CRUD/interactive:** Edit link + `<DeleteForm>` → `deleteCrewMember`.
- `/console/people/crew/[crewId]/edit` — Edit crew member. **CRUD/interactive:** `<FormShell>` → `updateCrewMember`.

## Accreditation

- `/console/accreditation` — Accreditation hub: tile links to Policy, Categories, Zones, Vetting, Print queue, Scans, Changes. **CRUD/interactive:** navigation only (read-only).
- `/console/accreditation/policy` — Category × Zone access matrix (`accreditation_categories` × `venue_zones`, coverage %). **CRUD/interactive:** read-only matrix; "Manage Categories" link (edits happen via venue Zones tab).
- `/console/accreditation/categories` — Categories list. **CRUD/interactive:** `<DataTable>` (filterable columns); "+ New Category" link.
- `/console/accreditation/categories/new` — Create category. **CRUD/interactive:** `<FormShell>` → `createCategory`.
- `/console/accreditation/categories/[categoryId]` — Category detail. **CRUD/interactive:** Edit link + `<DeleteForm>` → `deleteCategory`.
- `/console/accreditation/categories/[categoryId]/edit` — Edit category (optimistic concurrency). **CRUD/interactive:** `<FormShell>` → `updateCategory`.
- `/console/accreditation/zones` — Venue zones list (`venue_zones`, parent hierarchy). **CRUD/interactive:** `<DataTable>`; read-only (authoring lives in venue Zones tab).
- `/console/accreditation/vetting` — Vetting queue (`accreditations` filtered to `state='vetting'`). **CRUD/interactive:** `<DataTable>` (rowHref), read-only list.
- `/console/accreditation/vetting/[applicationId]` — Vetting application detail. **CRUD/interactive:** Edit link + `<DeleteForm>` → `deleteVettingApp`.
- `/console/accreditation/vetting/[applicationId]/edit` — Edit vetting application (vetting state select, validity dates). **CRUD/interactive:** `<FormShell>` → `updateVettingApp` (status transition pending → in_progress → clear/flagged/failed).
- `/console/accreditation/print` — Print queue of approved badges (`accreditations` where `state='approved'`). **CRUD/interactive:** `<DataTable>` (filterable); "Print sheet" link.
- `/console/accreditation/print/sheet` — Multi-up ID-1 badge sheet with server-rendered QR codes for ⌘P batch print. **CRUD/interactive:** read-only / print-only output.
- `/console/accreditation/scans` — Gate-scan log (`access_scans`, result/reason/gate/time). **CRUD/interactive:** `<DataTable>`, read-only.
- `/console/accreditation/changes` — Accreditation change requests list (re-issue/role-change/revocation). **CRUD/interactive:** `<DataTable>` (filterable, groupable, rowHref); "+ Request change" link.
- `/console/accreditation/changes/new` — Request a change against an accreditation. **CRUD/interactive:** `<FormShell>` (accreditation select + kind select) → `createChange`.
- `/console/accreditation/changes/[changeId]` — Change request detail. **CRUD/interactive:** Edit link + `<DeleteForm>` → `deleteAccreditationChange`.
- `/console/accreditation/changes/[changeId]/edit` — Edit change request (change_state: pending/approved/rejected/applied). **CRUD/interactive:** `<FormShell>` → `updateAccreditationChange` (status transition control).

## Participants

- `/console/participants` — Participants hub: tile links to Delegations, Entries, Visa (with open counts). **CRUD/interactive:** navigation only (read-only).
- `/console/participants/delegations` — Delegations list. **CRUD/interactive:** `<DataTable>` (rowHref); "+ New" link.
- `/console/participants/delegations/new` — Create delegation. **CRUD/interactive:** `<FormShell>` → `createDelegation`.
- `/console/participants/delegations/[delegationId]` — Delegation detail. **CRUD/interactive:** Edit link + `<DeleteForm>` → `deleteDelegation`.
- `/console/participants/delegations/[delegationId]/edit` — Edit delegation. **CRUD/interactive:** `<FormShell>` → `updateDelegation`.
- `/console/participants/entries` — Entries list. **CRUD/interactive:** `<DataTable>` (filterable, groupable, rowHref); "+ New" link.
- `/console/participants/entries/new` — Create entry. **CRUD/interactive:** `<FormShell>` → `createEntry`.
- `/console/participants/entries/[entryId]` — Entry detail. **CRUD/interactive:** Edit link + `<DeleteForm>` → `deleteEntry`.
- `/console/participants/entries/[entryId]/edit` — Edit entry. **CRUD/interactive:** `<FormShell>` → `updateEntry`.
- `/console/participants/visa` — Visa cases list. **CRUD/interactive:** `<DataTable>` (filterable, groupable, rowHref); "+ New" link.
- `/console/participants/visa/new` — Create visa case. **CRUD/interactive:** `<FormShell>` → `createVisaCase`.
- `/console/participants/visa/[caseId]` — Visa case detail. **CRUD/interactive:** Edit link + `<DeleteForm>` → `deleteVisaCase`.
- `/console/participants/visa/[caseId]/edit` — Edit visa case. **CRUD/interactive:** `<FormShell>` → `updateVisaCase`.

## Goals

- `/console/goals` — OKR / goals list. **CRUD/interactive:** `<DataTable>` (rowHref), `<EmptyState>`, `<StatusBadge>`; "+ New" link.
- `/console/goals/new` — Create goal. **CRUD/interactive:** `<FormShell>` → `createGoalAction`.
- `/console/goals/[id]` — Goal detail with key results, progress, and state control. **CRUD/interactive:** key-result create/update/delete + goal state transition + `<DeleteForm>` (`setGoalStateAction`, `createKeyResultAction`, `updateKeyResultAction`, `deleteKeyResultAction`, `deleteGoalAction`).
- `/console/goals/[id]/edit` — Edit goal. **CRUD/interactive:** `<FormShell>` → `updateGoalAction`.

## Schedule

- `/console/schedule` — Master schedule with calendar + list views over `events`; supports inline reschedule. **CRUD/interactive:** `<DataTable>` (filterable, groupable, rowHref) + calendar view + `<StatusBadge>`; "Export .ics" download; "+ New Event" link; drag/reschedule via `rescheduleEvent`.
- `/console/schedule/baselines` — Schedule baselines list. **CRUD/interactive:** `<DataTable>` (filterable, groupable, rowHref), `<MetricCard>`; "+ New" link.
- `/console/schedule/baselines/new` — Create baseline. **CRUD/interactive:** `<FormShell>` → `createBaseline`.
- `/console/schedule/baselines/[id]` — Baseline detail: activities table, CPM, activate/archive, schedule import. **CRUD/interactive:** activate / archive / re-run CPM / import (file upload) (`activateBaseline`, `archiveBaseline`, `runCpm`, `importSchedule`); "Open Gantt" link; `<MetricCard>`.
- `/console/schedule/baselines/[id]/gantt` — Gantt chart view of baseline activities. **CRUD/interactive:** read-only Gantt visualization (`<EmptyState>` when no activities).

## Tasks

- `/console/tasks` — Tasks list with Kanban + table views. **CRUD/interactive:** `<DataTable>` (filterable, groupable, rowHref) + Kanban board + `<StatusBadge>`; status moves via `setTaskStatusAction`; create via `createTaskAction`.
- `/console/tasks/new` — Create task. **CRUD/interactive:** form → `createTaskAction`.
- `/console/tasks/[taskId]` — Task detail. **CRUD/interactive:** Edit link + `<DeleteForm>` → `deleteTask`; `<StatusBadge>`.
- `/console/tasks/[taskId]/edit` — Edit task. **CRUD/interactive:** `<FormShell>` → `updateTask`.

## Events

- `/console/events` — Events list. **CRUD/interactive:** `<DataTable>` (filterable, groupable, rowHref, bulkActions), `<StatusBadge>`; bulk-cancel via `bulkCancelEvents`; "+ New Event" link.
- `/console/events/new` — Create event (client `NewEventForm`, project + location selects, date-range validation). **CRUD/interactive:** form → `createEventAction`.
- `/console/events/[eventId]` — Event detail (`<DetailShell>`, status badge, start/end). **CRUD/interactive:** Edit link + `<DeleteForm>` → `deleteEvent`.
- `/console/events/[eventId]/edit` — Edit event (event_state: draft/scheduled/live/complete/cancelled, optimistic concurrency, date-range refine). **CRUD/interactive:** `<FormShell>` → `updateEvent`.

## Forms

- `/console/forms` — Form definitions list (`form_defs`). **CRUD/interactive:** `<DataTable>` (rowHref); "+ New" link.
- `/console/forms/new` — Create form. **CRUD/interactive:** `<FormShell>` → `createFormDefAction`.
- `/console/forms/[formId]` — Form detail: field count/status/created metrics, public response URL (`/forms/<slug>`), JSON schema view. **CRUD/interactive:** Submissions + Edit links + status badge; read-only display.
- `/console/forms/[formId]/edit` — Form-builder editor (title/slug/description, draft/published/archived radio, JSON schema textarea with field-type validation). **CRUD/interactive:** `<FormShell>` (dirtyGuard) → `updateFormDefAction` (also exports `deleteFormDefAction`).
- `/console/forms/[formId]/submissions` — Submissions list for a form (`form_submissions`). **CRUD/interactive:** `<DataTable>` (rowHref), read-only.
- `/console/forms/[formId]/submissions/[submissionId]` — Single submission detail (submitter, user-agent, per-field answers). **CRUD/interactive:** read-only.

## Guides

- `/console/guides` — Boarding-Pass / event-guides index (`event_guides`, one row per project × persona). **CRUD/interactive:** read-only list with per-row "Edit →" links into the per-project guide CMS (`/console/projects/[projectId]/guides`); `<EmptyState>` links to Projects. No inline create/edit at this route.


---

# ATLVS Console — Operations & Safety

Page inventory for the `/console` platform shell, scoped to the `safety`, `operations`, `transport`, `logistics`, `comms`, `accommodation`, `inspections`, `ops`, `meetings`, `locations`, `sustainability`, `services`, `rfis`, `transmittals`, `annotations`, `action-items`, `import`, and `email-inbox` segments. One bullet per route (dynamic detail/new/edit collapsed under their parent). CRUD/interactive notes reflect what each `page.tsx` (and sibling `actions.ts`) actually wires up.

## Safety

- `/console/safety` — Safety & Incidents hub. **CRUD/interactive:** read-only (tile grid linking to all safety sub-modules).
- `/console/safety/threats` — Threat register (severity/likelihood/treatment/classification). **CRUD/interactive:** DataTable (filter/group on severity + threat_state, no rowHref), link to `/new`.
  - `/console/safety/threats/new` — New threat. **CRUD/interactive:** create FormShell (`createThreat`, enum selects), inserts `threat_state='active'`.
- `/console/safety/playbooks` — ConOps/crisis playbooks register. **CRUD/interactive:** DataTable (filter/group on kind + playbook_state, no rowHref), by-kind aggregate panel, link to `/new`.
  - `/console/safety/playbooks/new` — New playbook. **CRUD/interactive:** create FormShell (`createPlaybook`, slug/kind).
  - `/console/safety/playbooks/[slug]` — Playbook detail (renders JSONB content blocks in Guide layout). **CRUD/interactive:** read-only.
- `/console/safety/guard-tours` — Patrol-plan register (cadence, next-run, state). **CRUD/interactive:** DataTable (filter/group on tour_state), link to `/new`.
  - `/console/safety/guard-tours/new` — New guard tour. **CRUD/interactive:** create FormShell (`createGuardTour`, optional venue select); waypoints added later.
- `/console/safety/incidents` — Unified cross-domain incident feed (last 30 days). **CRUD/interactive:** MetricCards, drill-into-domain tiles (ops log / cyber IR / medical), DataTable (filter/group on severity + incident_state, rowHref to `/console/operations/incidents/[id]`), "Report incident" link to ops new-incident form. Read-only feed; all writes route to operations/incidents.
- `/console/safety/osha` — OSHA 300 log for a year (29 CFR 1904 recordables). **CRUD/interactive:** year prev/next nav, **CSV export** (`/api/v1/exports/osha?year=`), fatality alert banner, MetricCards, DataTable (filter/group on classification + injury type, rowHref to incidents). Read-only + download.
- `/console/safety/cyber-ir` — Cyber Incident Response (incidents regex-filtered for cyber keywords, last 90 days). **CRUD/interactive:** MetricCards, DataTable (filter/group, rowHref to incidents), "Report incident" link. Read-only view over incidents.
- `/console/safety/bcdr` — BC/DR continuity runbooks + readiness exercises. **CRUD/interactive:** MetricCards, crisis-playbook list (links to playbook detail), exercises list, link to `/console/safety/playbooks/new` + `/console/programs/readiness`. Read-only aggregation.
- `/console/safety/major-incident` — Major-incident register. **CRUD/interactive:** DataTable (filter/group on incident_state, rowHref), link to `/new`.
  - `/console/safety/major-incident/[eventId]` — Major-incident detail (generic field dl-dump). **CRUD/interactive:** edit link, DeleteForm (`deleteMajorIncident`).
  - `/console/safety/major-incident/[eventId]/edit` — Edit (sibling actions.ts: `updateMajorIncident` with optimistic concurrency via `_updated_at`).
- `/console/safety/crisis` — Crisis-alert register. **CRUD/interactive:** DataTable (filter/group on severity, rowHref), link to `/new`.
  - `/console/safety/crisis/[alertId]` — Crisis-alert detail (generic dl-dump). **CRUD/interactive:** edit link, DeleteForm (`deleteAlert`).
  - `/console/safety/crisis/[alertId]/edit` — Edit (sibling actions: optimistic-concurrency update).
- `/console/safety/environmental` — Environmental-event register (heat/cold/wind/storm/wildlife). **CRUD/interactive:** DataTable (filter/group on kind + severity, rowHref), link to `/new`.
  - `/console/safety/environmental/[eventId]` — Detail (dl-dump) + edit/DeleteForm.
  - `/console/safety/environmental/[eventId]/edit` — Edit (optimistic-concurrency update).
- `/console/safety/safeguarding` — Safeguarding-report register (sensitive disclosures for triage). **CRUD/interactive:** DataTable (filter/group on status, rowHref), link to `/new`.
  - `/console/safety/safeguarding/[reportId]` — Detail + edit/DeleteForm.
  - `/console/safety/safeguarding/[reportId]/edit` — Edit (optimistic-concurrency update).
- `/console/safety/briefings` — Safety-briefing (toolbox-talk) register. **CRUD/interactive:** MetricCards, DataTable (filter/group on status, rowHref), link to `/new`.
  - `/console/safety/briefings/new` — Schedule briefing. **CRUD/interactive:** create FormShell (`createBriefing`, project select, datetime), cross-tenant FK guard.
  - `/console/safety/briefings/[briefingId]` — Briefing detail with attendance roll. **CRUD/interactive:** "Mark Conducted" transition (`markConducted`), per-attendee Sign-In (`acknowledgeAttendee`) + Remove (`removeAttendee`), add-attendee form (`addAttendee`, org-member or crew select + ack checkbox).
- `/console/safety/medical` — Medical hub. **CRUD/interactive:** MetricCards (encounters 24h/7d, active env events), open-env-events list, drill-in tiles, "New encounter" link. Read-only hub.
- `/console/safety/medical/plan` — Games medical-services plan (venue medical-capacity rollup + medical playbooks). **CRUD/interactive:** read-only table over venues (kind-filtered, metadata.medical) + playbook list; links to venue detail + new playbook.
- `/console/safety/medical/encounters` — PHI clinical-encounter register. **CRUD/interactive:** DataTable (rowHref), link to `/new`.
  - `/console/safety/medical/encounters/new` — Log encounter. **CRUD/interactive:** create FormShell (`createMedicalEncounter`).
  - `/console/safety/medical/encounters/[encounterId]` — Encounter detail + edit/DeleteForm.
  - `/console/safety/medical/encounters/[encounterId]/edit` — Edit.

## Operations

- `/console/operations` — Operations hub. **CRUD/interactive:** read-only (tile grid: dispatch / maintenance / incidents / service requests / TOC / safety incidents).
- `/console/operations/dispatch` — Day dispatch matrix (Gantt-style lanes: venues + vehicles × hours from shifts/tasks/dispatch_runs). **CRUD/interactive:** prev/next day nav, blocks link to roster/task/transport-run. Read-only matrix.
- `/console/operations/look-ahead` — 21-day look-ahead (merged tasks/events/briefings/inspections/dispatch, bucketed by day). **CRUD/interactive:** read-only timeline.
- `/console/operations/daily-log` — Daily-log register (weather/manpower/notes per project per day, last 30 days). **CRUD/interactive:** MetricCards, DataTable (filter/group on status, rowHref), link to `/new`.
  - `/console/operations/daily-log/new` — New log. **CRUD/interactive:** create form (`createDailyLog`, project + date, dup-key handling), cross-tenant FK guard.
  - `/console/operations/daily-log/[id]` — Log detail (weather/manpower/equipment/deliveries/visitors/photos). **CRUD/interactive:** Presence island, status transitions draft→submitted→approved (`transitionDailyLog`, FSM-guarded), **photo upload** (`uploadDailyLogPhoto`, signed-URL render, locked once approved) + delete (`deleteDailyLogPhoto`), ConversationPanel, ActivityDrawer.
- `/console/operations/dispatch` *(see above)*
- `/console/operations/incidents` — Incident register (field safety + near-miss). **CRUD/interactive:** **list/kanban view toggle** (`?view=`), Kanban with drag-drop status moves (`setIncidentStatus`, FSM-guarded), DataTable (filter/group on severity + status, DueDateBadge, rowHref), "Log incident" link.
  - `/console/operations/incidents/new` — Report incident. **CRUD/interactive:** create form.
  - `/console/operations/incidents/[incidentId]` — Incident detail (StatusChip + generic dl-dump). **CRUD/interactive:** edit link, DeleteForm (`deleteIncident`).
  - `/console/operations/incidents/[incidentId]/edit` — Edit.
- `/console/operations/maintenance` — PPM + credential-renewal queue (bucketed overdue/today/this-week/later; jobs synthesized from schedules + credential expiry). **CRUD/interactive:** read-only bucketed list (rows link to job detail / credential detail), "New schedule" link.
  - `/console/operations/maintenance/[jobId]` — Maintenance-job detail. **CRUD/interactive:** "Complete" form (`completeJob`, outcome pass/partial/fail + notes; spawns next job from schedule cadence).
  - `/console/operations/maintenance/schedules/new` — New recurring schedule. **CRUD/interactive:** create FormShell (`createSchedule`, kind/target-kind/cadence-days; materializes first job).
- `/console/operations/reservations` — Venue reservations + floor plan. **CRUD/interactive:** MetricCards, interactive FloorPlan (client component over venue_tables), DataTable (filter/group on table + state, rowHref), "New Table" + "New Reservation" links.
  - `/console/operations/reservations/new` — New reservation. **CRUD/interactive:** create form (`createReservation`, manager+ gated, optional table assignment, FK guard).
  - `/console/operations/reservations/[id]` — Reservation detail. **CRUD/interactive:** TransitionControl (client lifecycle booked→seated→completed via `transitionReservation`, FSM-guarded), DeleteForm (`deleteReservation`, soft-delete, manager+).
  - `/console/operations/reservations/tables/new` — New venue table. **CRUD/interactive:** client NewTableForm (`createVenueTable`, manager+, seats/zone/x-y floor coords).

## Transport

- `/console/transport` — Transport hub. **CRUD/interactive:** streamed MetricCards (dispatch runs / A&D manifests / fleets / vehicles, derived from dispatch_runs), nav tiles. Read-only hub.
- `/console/transport/dispatch` — Ground-transport dispatch-run register. **CRUD/interactive:** DataTable (filter/group on status, rowHref), link to `/new`.
  - `/console/transport/dispatch/new` — New run. **CRUD/interactive:** create form (`createDispatchRun`, fleet enum t1/t2/t3/media/workforce/spectator + depart/arrive).
  - `/console/transport/dispatch/[runId]` — Run detail (generic dl-dump) + edit/DeleteForm (`deleteDispatchRun`).
  - `/console/transport/dispatch/[runId]/edit` — Edit (sibling actions: optimistic-concurrency `updateDispatchRun` incl. actual depart/arrive).
- `/console/transport/ad` — Arrivals & Departures manifest register. **CRUD/interactive:** DataTable (filter/group on kind + status, rowHref), link to `/new`.
  - `/console/transport/ad/new` — New manifest. **CRUD/interactive:** create form (`createAdManifest`).
  - `/console/transport/ad/[manifestId]` — Manifest detail (dl-dump) + edit/DeleteForm (`deleteAdManifest`).
  - `/console/transport/ad/[manifestId]/edit` — Edit (optimistic-concurrency update).
- `/console/transport/fleets` — Fleet rollup (projection of dispatch_runs grouped by fleet → vehicle). **CRUD/interactive:** read-only grouped tables (status badges per vehicle), "Schedule run" link.
- `/console/transport/workforce` — Workforce-shuttle view (dispatch_runs filtered to workforce/t3/spectator, today + 3 days, grouped by day). **CRUD/interactive:** read-only day tables, "Schedule run" link.

## Logistics

- `/console/logistics` — Logistics hub. **CRUD/interactive:** read-only (tile grid: rate card / freight / warehouse / services / disposition).
- `/console/logistics/freight` — Freight (A&D manifests + rate-card orders). **CRUD/interactive:** MetricCards, read-only manifest + orders tables, links to A&D / rate card / integrations settings. Detail route reuses `purchase_orders`.
  - `/console/logistics/freight/[shipmentId]` — Shipment detail (dl-dump over `purchase_orders`) + edit/DeleteForm (`deleteShipment`).
  - `/console/logistics/freight/[shipmentId]/edit` — Edit (optimistic-concurrency update of purchase_orders).
- `/console/logistics/ratecard` — Rate-card item register (SKU + unit price). **CRUD/interactive:** DataTable (rowHref), link to `/new`.
  - `/console/logistics/ratecard/new` — New rate. **CRUD/interactive:** create FormShell (`createRateCardItem`, dollars→cents).
  - `/console/logistics/ratecard/[itemId]` — Item detail + edit/DeleteForm.
  - `/console/logistics/ratecard/[itemId]/edit` — Edit (optimistic-concurrency update).
- `/console/logistics/warehouse` — Warehouse hub (equipment/locations/maintenance counts + by-status breakdown). **CRUD/interactive:** MetricCards, status aggregation, drill-in tiles, mobile-scan link. Read-only hub.
- `/console/logistics/services` — Logistics service-requests view (service_requests filtered to cleaning/repair/other). **CRUD/interactive:** MetricCards (open / SLA-breached), DataTable (filter/group on category + severity + state, rowHref to services/requests detail), "New Service" link → services/requests/new. Read-only filtered view.
- `/console/logistics/disposition` — Asset disposition queue (equipment in maintenance/retired). **CRUD/interactive:** MetricCards, DataTable (filter/group on category + equipment_state, rowHref to production/equipment detail). Read-only view; status changes happen in production/equipment.

## Comms

- `/console/comms/announcements` — Announcement register. **CRUD/interactive:** DataTable (rowHref), link to `/new`.
  - `/console/comms/announcements/new` — New announcement. **CRUD/interactive:** create FormShell (`createAnnouncementAction`, manager+, audience enum, optional project/team scope, pin, publish-now); publish fans out push + inbox to filtered cohort.
  - `/console/comms/announcements/[id]` — Detail. **CRUD/interactive:** read-count badge, edit link, Publish (`publishAnnouncement`, push fan-out), Archive (`archiveAnnouncement`), DeleteForm (`deleteAnnouncement`, soft-delete).
  - `/console/comms/announcements/[id]/edit` — Edit (sibling actions.ts: `updateAnnouncement`).
- `/console/comms/polls` — Poll register. **CRUD/interactive:** DataTable (rowHref), link to `/new`.
  - `/console/comms/polls/new` — New poll. **CRUD/interactive:** create form (`createPoll`).
  - `/console/comms/polls/[id]` — Poll results (per-option tally + bars). **CRUD/interactive:** "Close Poll" form (`closePoll`, manager+, live→closed). Read-only results otherwise.
- `/console/comms/surveys` — Survey register. **CRUD/interactive:** DataTable (rowHref), link to `/new`.
  - `/console/comms/surveys/new` — New survey. **CRUD/interactive:** create form (`createSurvey`).
  - `/console/comms/surveys/[id]` — Survey builder + results (per-question tally/text-samples). **CRUD/interactive:** add-question form while draft (`addQuestion`, kind + options), Publish (`publishSurvey`), Close (`closeSurvey`); all manager+.

## Accommodation

- `/console/accommodation` — Accommodation hub. **CRUD/interactive:** read-only (tile grid: group blocks / village).
- `/console/accommodation/blocks` — Hotel room-block register. **CRUD/interactive:** DataTable (rowHref), link to `/new`.
  - `/console/accommodation/blocks/new` — New block. **CRUD/interactive:** create FormShell (`createBlock`).
  - `/console/accommodation/blocks/[blockId]` — Block detail (dl-dump) + edit/DeleteForm (`deleteBlock`).
  - `/console/accommodation/blocks/[blockId]/edit` — Edit (optimistic-concurrency `updateBlock` + date-range refine).
- `/console/accommodation/village` — Village view (venues kind=village). **CRUD/interactive:** DataTable (StatusBadge handover, rowHref to venue detail), "New Venue" link → `/console/venues/new`. Read-only filtered view.

## Inspections

- `/console/inspections` — Inspection register (template-driven checklists). **CRUD/interactive:** MetricCards (open/passed/failed), DataTable (filter/group on status, rowHref), "Templates" + "New Inspection" links.
  - `/console/inspections/new` — Schedule inspection. **CRUD/interactive:** create FormShell (`createInspection`).
  - `/console/inspections/[id]` — Inspection detail + checklist. **CRUD/interactive:** state transitions scheduled→in_progress→passed/failed/cancelled (`transitionInspection`, FSM-guarded; Pass gated on zero fails), per-item pass/fail/na buttons (`setInspectionItemResult`), edit link, ConversationPanel.
  - `/console/inspections/[id]/edit` — Edit (sibling actions.ts: `updateInspection`).
- `/console/inspections/templates` — Inspection-template register (reusable checklists, item-count rollup). **CRUD/interactive:** card grid, link to `/new`.
  - `/console/inspections/templates/new` — New template. **CRUD/interactive:** create FormShell (`createInspectionTemplateAction`, category enum + newline-separated prompts bulk-inserted as template items).

## Ops (TOC / ITIL)

- `/console/ops` — Operations/TOC hub. **CRUD/interactive:** read-only (tile grid: TOC / problems / changes / integrations).
- `/console/ops/toc` — TOC hub. **CRUD/interactive:** read-only (tiles: problems / changes).
- `/console/ops/toc/problems` — ITIL problem register. **CRUD/interactive:** MetricCards (open/known-errors/P1), DataTable (filter/group on priority + status + owner, rowHref), link to `/new`.
  - `/console/ops/toc/problems/new` — New problem. **CRUD/interactive:** create FormShell (`createProblem`, priority enum, inserts `problem_state='new'`).
- `/console/ops/toc/changes` — ITIL change register. **CRUD/interactive:** MetricCards (open/emergency/failed), DataTable (filter/group on type + owner + status, rowHref), link to `/new`.
  - `/console/ops/toc/changes/new` — New change. **CRUD/interactive:** create FormShell (`createChange`, type/risk/impact enums, planned window, backout plan; inserts `change_state='proposed'`).

## Meetings

- `/console/meetings` — Meeting register (with attendee + open-action counts). **CRUD/interactive:** MetricCards, DataTable (filter/group on kind + project + state, rowHref), link to `/new`.
  - `/console/meetings/new` — New meeting. **CRUD/interactive:** create FormShell (`createMeeting`).
  - `/console/meetings/[meetingId]` — Meeting detail (generic dl-dump over `events`). **CRUD/interactive:** Huddle link, edit link, DeleteForm (`deleteMeeting`).
  - `/console/meetings/[meetingId]/edit` — Edit (sibling actions.ts: `updateMeeting`).
  - `/console/meetings/[meetingId]/huddle` — Video huddle room (video_calls + participants). **CRUD/interactive:** participant grid + full roster, Start huddle (`ensureCall`, manager+), lifecycle transitions (`transitionCall` scheduled→live→ended), Join/Leave (`joinCall`/`leaveCall`); degrades gracefully without a video provider.
- `/console/meetings/notes` — Meeting-notes register (transcript → AI summary → action items). **CRUD/interactive:** MetricCards, DataTable (filter/group on meeting + state, rowHref), link to `/new`.
  - `/console/meetings/notes/new` — New note. **CRUD/interactive:** create form (`createNote`, optional meeting link + transcript paste).
  - `/console/meetings/notes/[id]` — Note detail (transcript / AI summary / action items). **CRUD/interactive:** Summarize/Re-summarize (`summarizeNote`, Anthropic), "Create tasks" from unlinked action items (`createTasksFromActionItems`), Archive (`archiveNote`), DeleteForm (`deleteNote`); all manager+.

## Locations

- `/console/locations` — Location register (addresses/venues/depots). **CRUD/interactive:** DataTable (rowHref), link to `/new`.
  - `/console/locations/new` — Add location. **CRUD/interactive:** create FormShell (`createLocationAction`).
  - `/console/locations/[locationId]` — Location detail (DetailShell field list). **CRUD/interactive:** edit link, DeleteForm (`deleteLocation`).
  - `/console/locations/[locationId]/edit` — Edit (sibling actions.ts: `updateLocation`).
  - `/console/locations/picker` — Internal dev reference for the async location-picker Combobox (not in nav). **CRUD/interactive:** interactive demo (`LocationPickerDemo`) + copy-paste code sample. Read-only sample.

## Sustainability

- `/console/sustainability` — Sustainability hub. **CRUD/interactive:** read-only (tile: carbon).
- `/console/sustainability/carbon` — Carbon-measurement register (Scope 1/2/3, by-month + by-scope charts). **CRUD/interactive:** MetricCards (with sparkline), recharts CarbonCharts (lazy client), DataTable (filter/group on scope + source + method, rowHref), link to `/new`.
  - `/console/sustainability/carbon/new` — Record measurement. **CRUD/interactive:** create FormShell (`createMetric`).
  - `/console/sustainability/carbon/[metricId]` — Metric detail (dl-dump) + edit/DeleteForm (`deleteMetric`).
  - `/console/sustainability/carbon/[metricId]/edit` — Edit (optimistic-concurrency update).

## Services (Service Desk)

- `/console/services` — Service-desk hub. **CRUD/interactive:** read-only (tile: requests).
- `/console/services/requests` — Service-request register (P1–P4, SLA tracking). **CRUD/interactive:** MetricCards-in-subtitle, DataTable (filter/group on severity + category + state, live SLA chips, rowHref), link to `/new`.
  - `/console/services/requests/new` — Open request. **CRUD/interactive:** create form (`createServiceRequest`, category/severity enums, optional project+venue FK guards, shell-aware redirect to mobile; writes an `opened` event row).
  - `/console/services/requests/[requestId]` — Request detail + SLA + event timeline. **CRUD/interactive:** state-transition forms (`transitionRequest`, FSM-guarded open→acknowledged→in_progress→resolved/cancelled, conditional update against TOCTOU, optional resolution note, writes event rows).

## RFIs

- `/console/rfis` — RFI register (production queries with binding answers). **CRUD/interactive:** MetricCards (open/overdue/answered), DataTable (filter/group on priority + status, DueDateBadge, rowHref), link to `/new`.
  - `/console/rfis/new` — New RFI. **CRUD/interactive:** create FormShell (`createRfi`).
  - `/console/rfis/[id]` — RFI detail (question + official answer). **CRUD/interactive:** Presence island, edit link, post-answer form (`answerRfi`, open→answered, guarded), Close RFI (`closeRfi`, answered/open→closed), ConversationPanel.
  - `/console/rfis/[id]/edit` — Edit (sibling actions.ts: `updateRfi`).

## Transmittals

- `/console/transmittals` — Transmittal register (audit-grade correspondence envelopes). **CRUD/interactive:** MetricCards (total/sent/acknowledged/draft), DataTable (filter/group on project + state, DueDateBadge, rowHref), link to `/new`.
  - `/console/transmittals/new` — New transmittal. **CRUD/interactive:** create FormShell (`createTransmittal`).
  - `/console/transmittals/[id]` — Transmittal detail (items + recipients + read-receipts). **CRUD/interactive:** Send (`sendTransmittal`, draft→sent, requires ≥1 recipient, stamps delivery), Mark Closed (`closeTransmittal`), add-item form (`addItem`, type enum + UUID), add-recipient form (`addRecipient`, user/vendor/external-email) — item/recipient forms only while draft.

## Annotations

- `/console/annotations` — Polymorphic annotation register (flag/note/comment/tag across any entity). **CRUD/interactive:** DataTable (filter/group on severity + kind + target + state, confirmation column, rowHref). List read-only (creation is API/SQL-driven).
  - `/console/annotations/[id]` — Annotation detail + replies. **CRUD/interactive:** AnnotationActions (client: acknowledge/resolve/dismiss/confirm via `acknowledgeAction`/`resolveAction`/`dismissAction`/`confirmAction`), ReplyForm (`replyAction`).

## Action Items

- `/console/action-items` — Cross-module ball-in-court rollup (view `v_action_items` spanning RFIs/submittals/punch/inspections/tasks). **CRUD/interactive:** dashboard RouteTabs, "Mine only" filter toggle (`?mine=1`), MetricCards, DataTable (filter/group/sort on kind + status + priority + due, rowHref dispatched per kind). Read-only aggregation.

## Import

- `/console/import` — Import Center: observability for async CSV import jobs. **CRUD/interactive:** read-only job list (state badges, per-job progress bar, error details `<details>`); "New Import" links to `/console/settings/imports` (the actual upload/run flow lives there).

## Email Inbox

- `/console/email-inbox` — Inbound project-email register (`inbound_email_messages`, captured at `{slug}@in.atlvs.pro`). **CRUD/interactive:** MetricCards (unrouted/promoted/total), DataTable (filter/group on from + project + routed-to, rowHref to `/console/email-inbox/[id]`). List is read-only; routing/promotion is done by a separate worker + (per the in-page note) a human promotes each message to an RFI/submittal/transmittal/note. *Note: rowHref points at `/console/email-inbox/[id]` but no detail `page.tsx` exists in this segment.*


---

# ATLVS Console — Admin, AI & LEG3ND

Page inventory for the admin, AI, knowledge, and LEG3ND segments of the `(platform)` console. Every `page.tsx` under the in-scope `/console` segments is listed; dynamic children (`[id]`, `/new`, `/edit`) are collapsed under their parent route where the detail/CRUD behavior naturally belongs to the same resource. CRUD is sourced from the colocated `"use server"` `actions.ts` exports and the page's own forms/tables/buttons.

## Settings

- `/console/settings` — Settings hub; renders a card per `settingsNav` destination (the SSOT) grouped by section, with per-href descriptions. **CRUD/interactive:** read-only index (navigation links only).
- `/console/settings/organization` — Org profile: name, tier, member/invite/project counts. **CRUD/interactive:** rename org (`updateOrgName`, admin-gated); links to members/invites.
- `/console/settings/branding` — White-label appearance (logo, accent/secondary colors, favicon, hero/OG images) applied across shells + PDF exports. **CRUD/interactive:** branding form (`updateBrandingAction`).
- `/console/settings/domains` — Custom domains for portals (CNAME/TXT verification, auto-TLS). **CRUD/interactive:** add domain (`addDomainAction`), verify (`verifyDomainAction`), delete (`deleteDomainAction`).
- `/console/settings/email-templates` — Transactional email template catalog (slug/subject/active). **CRUD/interactive:** edit templates via `EmailTemplatesPanel` (client island).
- `/console/settings/sso` — SAML/OIDC SSO providers; email-domain login redirect. **CRUD/interactive:** DataTable; upsert (`upsertSsoProvider`), toggle enable (`toggleSsoProvider`), delete via DeleteForm (`deleteSsoProvider`).
- `/console/settings/account-managers` (+ `/new`, `/[id]`) — Pair portal contacts with org-side account managers per persona × project; drives portal `/messages`. **CRUD/interactive:** DataTable list; create (`createAssignment`), toggle active (`toggleActive`), delete (`deleteAssignment`).
- `/console/settings/governance` — Governance committees + policies (cadence, charter, review dates). **CRUD/interactive:** create committee (`createCommittee`), create policy (`createPolicy`) via forms; tables read-only.
- `/console/settings/time-clock-zones` (+ `/new`, `/[id]`) — Geofenced punch-in zones for the COMPVSS field app. **CRUD/interactive:** DataTable; create (`createZoneAction`), archive (`archiveZone`), reactivate (`reactivateZone`).
- `/console/settings/catalog` (+ `/new`, `/[id]`, `/[id]/edit`) — Master catalog of reusable SKUs (credential/catering/radio/tool/equipment/uniform/travel/lodging/vehicle). **CRUD/interactive:** table + gallery view switcher; create (`createCatalogItem`), update (`updateCatalogItem`), toggle active (`toggleActive`), soft-delete (`deleteItem`).
- `/console/settings/sequences` — Auto-number sequences (invoice/PO/proposal/RFQ/etc. formats) with live preview + scope hints. **CRUD/interactive:** DataTable; upsert format (`upsertSequence`), reset counter (`resetSequence`).
- `/console/settings/sla-policies` — Service SLA policies per severity (P1–P4 response/resolution targets). **CRUD/interactive:** DataTable; upsert (`upsertSlaPolicy`), toggle (`toggleSlaPolicy`), delete (`deleteSlaPolicy`).
- `/console/settings/governance` — see above.
- `/console/settings/api` — API key management + endpoint reference docs. **CRUD/interactive:** create key (`createApiKeyAction`, via `CreateApiKeyForm`), revoke (`revokeApiKeyAction`); endpoint docs read-only.
- `/console/settings/webhooks` (+ `/new`, `/[webhookId]`) — Outgoing webhook endpoints with subscribable event list, delivery health. **CRUD/interactive:** list with status chips; new-endpoint form + per-endpoint detail (event subscription, delivery status).
- `/console/settings/rate-limits` — Per-bucket rate-limit overrides (ai/scan/webhook/auth). **CRUD/interactive:** DataTable; upsert (`upsertRateLimitOverride`), delete (`deleteRateLimitOverride`).
- `/console/settings/billing` — Subscription tiers (access/core/professional/enterprise), payment methods, invoices. **CRUD/interactive:** open Stripe customer portal (`OpenPortalButton`); tier cards read-only.
- `/console/settings/usage` — AI + API usage metrics (requests, tokens) over trailing 14 days, manager-gated. **CRUD/interactive:** read-only (MetricCards + sparklines).
- `/console/settings/imports` — Import Centre (crew roster, vendors, project tasks) + recent run history. **CRUD/interactive:** upload/import via `ImportForm`; run table read-only.
- `/console/settings/exports` — Export Centre; pull tables as CSV/JSON/XLSX/ZIP, poll in-flight runs, re-download completed. **CRUD/interactive:** create/poll/download exports via `ExportCenter` (client island).
- `/console/settings/compliance` — Workspace compliance settings (retention, encryption-at-rest, DPA, residency) + platform control summary. **CRUD/interactive:** settings form (`saveComplianceSettings`); platform-controls panel read-only.
- `/console/settings/audit` — Audit log viewer, cursor-paginated (100/page). **CRUD/interactive:** read-only viewer; export via `/api/v1/compliance/audit-export` download link.
- `/console/settings/integrations` — Connector catalog (Stripe/Slack/Google/ClickUp/etc.) with env-detected status. **CRUD/interactive:** install (`installConnector`), uninstall (`uninstallConnector`).
- `/console/settings/integrations/marketplace` — Discoverable integrations grid (known + coming-soon). **CRUD/interactive:** install state surfaced; connect buttons route to install flow.
- `/console/settings/integrations/accounting` — Accounting connection status (connected/expired/revoked) + last sync. **CRUD/interactive:** connect/manage buttons; status read-only.
- `/console/settings/integrations/ticketing` (+ `/new`, `/[connectionId]`) — External ticketing-provider sync connections. **CRUD/interactive:** create connection (`createTicketingConnectionAction`), deactivate (`deactivateTicketingConnectionAction`), record sales snapshot (`recordSalesSnapshotAction`).
- `/console/settings/integrations/submissions` (+ `/[id]`) — Partner integration submissions with certification-tier workflow (submitted→reviewing→verified→certified/rejected). **CRUD/interactive:** DataTable; transition tier (`transitionTier`).

## LEG3ND (legend)

- `/console/legend` — LEG3ND hub; tile grid for The Standard, Courses, Certifications, Resources, Catalog, Signage, Compliance Engine, Safety. **CRUD/interactive:** read-only index (tile navigation).
- `/console/legend/signage` (+ `/new`, `/[signId]`, `/[signId]/edit`, `/[signId]/placements/new`) — ISO 7010 / DOT-AIGA signage library + sign detail with placements. **CRUD/interactive:** create sign (`createSignAction`), update (`updateSignAction`), delete via DeleteForm (`deleteSign`), add placement (`createPlacementAction`); detail shows placements DataTable.
- `/console/legend/resources` (+ `/new`, `/[id]`, `/[id]/edit`) — Resources hub (links/files by kind, tags, state). **CRUD/interactive:** DataTable; create (`createResourceAction`), update (`updateResourceAction`), set state (`setResourceStateAction`), delete (`deleteResourceAction`).
- `/console/legend/resources/collections` (+ `/new`, `/[collectionId]`) — Resource collections grouping. **CRUD/interactive:** DataTable; create (`createCollectionAction`), update (`updateCollectionAction`), delete (`deleteCollectionAction`).
- `/console/legend/engine` — XMCE compliance-engine overview. **CRUD/interactive:** read-only landing (EmptyState/links into rules + runs).
- `/console/legend/engine/rules` (+ `/new`, `/[id]`, `/[id]/edit`) — Compliance rules (code/severity/category/state). **CRUD/interactive:** DataTable; create (`createRuleAction`), update (`updateRuleAction`), delete (`deleteRuleAction`).
- `/console/legend/engine/runs` (+ `/[id]`) — Compliance run history + per-run findings detail. **CRUD/interactive:** DataTable list; run the engine (`runEngineAction`), set finding state (`setFindingStateAction`) on detail.

## Legal

- `/console/legal` — Legal hub; section cards (IP, Privacy, DSAR, Consent, Data Map, Insurance). **CRUD/interactive:** read-only index.
- `/console/legal/ip` (+ `/new`, `/[markId]`, `/[markId]/edit`) — Trademark register. **CRUD/interactive:** DataTable; create (`createTrademark`), update (`updateTrademark`), delete (`deleteTrademark`).
- `/console/legal/insurance` (+ `/new`, `/[policyId]`, `/[policyId]/edit`) — Insurance policy register. **CRUD/interactive:** DataTable; create (`createPolicy`), update (`updatePolicy`), delete (`deletePolicy`).
- `/console/legal/privacy` — Privacy section landing. **CRUD/interactive:** read-only (links into datamap/consent/dsar).
- `/console/legal/privacy/datamap` — Data-processing register; live row counts per org table. **CRUD/interactive:** read-only.
- `/console/legal/privacy/consent` — Consent records (purpose, etc.). **CRUD/interactive:** read-only DataTable.
- `/console/legal/privacy/dsar` (+ `/new`, `/[requestId]`, `/[requestId]/edit`) — Data-subject access requests. **CRUD/interactive:** DataTable; create (`createDsar`), update (`updateDsarRequest`), delete (`deleteDsarRequest`).

## XPMS

- `/console/xpms` — XPMS hub (atomic production catalog overview). **CRUD/interactive:** read-only index.
- `/console/xpms/atoms` — Atom catalog (atomic production-system records). **CRUD/interactive:** read-only DataTable.
- `/console/xpms/variance` — Variance ledger (planned vs. actual delta + reason codes). **CRUD/interactive:** read-only DataTable.
- `/console/xpms/classes` (+ `/[code]`) — XTC Protocol classes; class detail. **CRUD/interactive:** read-only (card grid + detail).
- `/console/xpms/tiers` — Six Tiers of Experience composition + atom-share charts. **CRUD/interactive:** read-only (reference + charts).
- `/console/xpms/provenance` — Provenance graph (atom relationship edges). **CRUD/interactive:** read-only DataTable.
- `/console/xpms/phases` — Eight Production Phases (8PP) temporal-spine reference. **CRUD/interactive:** read-only (card grid).
- `/console/xpms/codebook` — XTC Protocol codebook (line codes). **CRUD/interactive:** read-only DataTable.

## Collaborate

- `/console/collaborate/sheets` (+ `/new`, `/[id]`) — Collaborative spreadsheets (columns + rows). **CRUD/interactive:** DataTable list + `SheetGrid` editor; create (`createSheetAction`), save grid (`saveSheetAction`), set state (`setSheetStateAction`), delete (`deleteSheetAction`).
- `/console/collaborate/docs` (+ `/new`, `/[id]`) — Collaborative rich-text documents. **CRUD/interactive:** DataTable list + `DocEditorIsland` editor; create (`createDoc`), save (`saveDoc`), delete (`deleteDoc`).
- `/console/collaborate/whiteboards` (+ `/new`, `/[id]`) — tldraw whiteboard canvases (plots, seating, signal flow, run-of-show). **CRUD/interactive:** DataTable list + `WhiteboardCanvas` editor; create (`createWhiteboardAction`), save snapshot (`saveWhiteboardSnapshotAction`), set state (`setWhiteboardStateAction`), delete (`deleteWhiteboardAction`).

## AI

- `/console/ai` — AI hub; section cards (Automations, RAG Corpus, Field Agents). **CRUD/interactive:** read-only index.
- `/console/ai/corpus` — RAG corpus index health (docs/chunks by source type). **CRUD/interactive:** reindex deliverables/submittals/RFIs on demand (`reindexCorpus`, via `ReindexButton`).
- `/console/ai/agents` (+ `/new`, `/[agentId]`) — Field agents roster. **CRUD/interactive:** create (`createAgentAction`), toggle (`toggleAgentAction`), delete via DeleteForm (`deleteAgentAction`).
- `/console/ai/automations` (+ `/new`, `/[automationId]`, `/[automationId]/runs`, `/[automationId]/runs/[runId]`) — Automation rules (domain-event/scheduled/webhook triggers) + run history. **CRUD/interactive:** create (`createAutomationAction`); on detail: save steps (`saveStepsAction`), save trigger (`saveTriggerAction`), generate webhook secret (`generateWebhookSecretAction`), toggle (`toggleAutomationAction`), record manual run (`recordManualRunAction`); runs list + run detail read-only.

## Assistant

- `/console/assistant` (+ `/[conversationId]`) — AI assistant conversation list + threaded chat. **CRUD/interactive:** conversation DataTable; live chat via `ChatComposer` (streams to AI chat API), project-scoped.

## Knowledge

- `/console/knowledge` (+ `/new`, `/[slug]`, `/[slug]/edit`) — Knowledge base articles with body preview. **CRUD/interactive:** list; create (`createKnowledgeArticleAction`, via FormShell), update (`updateKnowledgeArticle`), delete (`deleteKnowledgeArticle`); article view read-only.

## Dashboards

- `/console/dashboards` (+ `/[id]`, `/[id]/edit`) — Custom dashboards (KPI / Markdown / Chart / Saved-View widgets). **CRUD/interactive:** create (`createDashboardAction`); editor: save layout (`saveLayoutAction`), add widget (`addWidgetAction`), remove widget (`removeWidgetAction`), update meta (`updateMetaAction`); view route renders resolved widget data (read-only).

## Documents

- `/console/documents` — Documents hub; the 29 v6.2 templates grouped by owning app, rendered via the shared DocEngine (token-driven, print-ready, `data-path` merge contract). **CRUD/interactive:** read-only index (template navigation).
- `/console/documents/[docType]` — Per-document preview/print route; renders a template, optionally binding a live org-scoped record via `?recordId=<uuid>` (`resolveDocData` / `supportsRecordBinding`); brand-aware (`resolveDocBrand`); print/PDF via `@media print`. **CRUD/interactive:** preview + browser print/PDF; record-binding via query param (no inline writes).

## Reports & Analytics (kit v6.3)

- `/console/reports` — Reports & Analytics hub; the **43-report library** grouped by the four apps (ATLVS · COMPVSS · GVTEWAY · LEG3ND), each report bound to the canonical **77-metric registry** (`metrics.json`) and rendered live from org data via the shared ReportEngine. **CRUD/interactive:** read-only index (report navigation); turnkey-template dot marks the 8 `status:"template"` reports; shows `{kind} · {cadence} · {n} KPIs` per card.
- `/console/reports/[reportId]` — Parametric report viewer; metrics resolved live from the caller's org (`resolveMetrics`), org/client white-label brand applied (`resolveDocBrand`), KPI tiles with delta pills / sparklines / bullet-vs-target. The rendered markup *is* the print/PDF artifact. **CRUD/interactive:** brand toggle (atlvs/co/white) + Print/PDF (`ReportToolbar`); no inline writes (reports are computed, never stored).

## Insights

- `/console/insights` — Booking Pool; anonymized monthly aggregates by genre. **CRUD/interactive:** read-only DataTable.

## Inbox

- `/console/inbox` — ATLVS-side messages; the operator counterpart to `/m/inbox` over the same `chat_rooms` surface (RLS-scoped to the caller's rooms). **CRUD/interactive:** read-only room list (links into threads); messaging happens in the linked thread surfaces.

## Trash

- `/console/trash` — Soft-delete recycle bin across trash-eligible tables; manager+-gated. **CRUD/interactive:** type switcher + `TrashTable`; restore deleted records (manager+, server-gated).

## Compliance

- `/console/compliance/coc` — Chain of Custody; audit-log-derived custody events + MetricCards. **CRUD/interactive:** read-only; links to the COMPVSS `/coc` field surface.

## Envelopes

- `/console/envelopes` — E-Sign envelopes across providers (DocuSign/Adobe Sign/HelloSign/PandaDoc/manual) targeting proposals/offer letters/MSAs/contracts, with signer-count rollups + envelope state. **CRUD/interactive:** DataTable + MetricCards; read-only list (signing/sending handled by provider/target flows).


---

# GVTEWAY Portal (/p/[slug])

Inventory of every `page.tsx` under `src/app/(portal)/`. The portal is the `(portal)` shell (`data-platform="gvteway"`, blue). Routes live under `/p/[slug]/...` where `slug` is the project + authorization boundary; one static sibling page lives at `/p/select`.

Per-persona portals are organized as a tile-grid root page plus sub-routes. Almost all surfaces are **read-only** (RLS-scoped lists, status badges, metric cards) — the production team authors in `/console`, the portal displays. The interactive exceptions are concentrated in **Client** (proposal sign/decide/lifecycle), **Artist advancing** (deliverable submit + state machine), **Privacy panels** (DSAR/export), **Messages** (AM chat), and the shared **Connecteam surfaces** (feed/kudos/docs reused in crew + vendor). Many crew/vendor pages link out to the COMPVSS `/m` shell for the actual create action (e.g. time-off, docs upload, requests).

Conventions used below: `<PortalDocVault>` = read-only deliverables table (file-centric doc-specs, no download control). `<PortalPrivacyPanel>` = DSAR list + consent ledger + data-export/erasure request links. Connecteam `*Surface` = shared components reused from the COMPVSS PWA.

---

## Shared workspace (persona-less)

- `/p/[slug]` — persona gateway; tile grid linking to artist/vendor/client/sponsor/guest/crew portals. **CRUD/interactive:** read-only (navigation links only).
- `/p/[slug]/overview` — alternate project chooser tile grid (artist/vendor/client/sponsor/guest/crew). **CRUD/interactive:** read-only (links).
- `/p/[slug]/guide` — Boarding Pass event guide auto-scoped to viewer's session persona (`<GuideView>`); persona preview switcher (`?as=`), inline `<GuideComments>`, PDF download link. **CRUD/interactive:** post guide comments; preview-as persona switch; download guide PDF; redirects to unlock if persona needs a code; read-only guide content.
- `/p/[slug]/guide/unlock` — access-code entry for internal guide personas (`<UnlockForm>`). **CRUD/interactive:** submit access code to redeem persona unlock.
- `/p/[slug]/schedule` — read-only project calendar (`<CalendarView>`, month mode) of `events`. **CRUD/interactive:** read-only (no reschedule/create callbacks).
- `/p/[slug]/announcements` — portal-wide announcements feed (`announcements` table, audiences all/contractors/vendors). **CRUD/interactive:** read-only.
- `/p/[slug]/inbox` — personal notifications inbox (`notifications`), unread count, links to notification hrefs. **CRUD/interactive:** read-only (deep-links only).
- `/p/[slug]/tasks` — unified "what do I owe?" inbox aggregating assignments + pending proposal approvals + onboarding. **CRUD/interactive:** read-only (links to advances/approval/onboarding routes).
- `/p/[slug]/messages` — list of account-manager DM threads (`account_manager_assignments`); link to existing rooms, "Start Thread" form posts to `messages/start` (route.ts) to mint a `chat_rooms` row. **CRUD/interactive:** start a new AM chat thread (POST); open existing thread.
- `/p/[slug]/messages/[roomId]` — portal-native AM chat room (`chat_messages` + `<RealtimeRefresh>`). **CRUD/interactive:** post messages (`postPortalMessage`), mark room read (`markPortalRoomRead`); realtime refresh.
- `/p/[slug]/apply` — viewer's own accreditation applications list (`accreditations`), state + vetting badges. **CRUD/interactive:** read-only list; link to card-changes page.
- `/p/[slug]/apply/changes` — viewer's accreditation change requests (`accreditation_changes`: upgrade/zone/reissue/etc.), state badges. **CRUD/interactive:** read-only list.
- `/p/select` *(static sibling, not under [slug])* — portal project chooser; lists projects via `project_members` + org membership; single project auto-redirects. **CRUD/interactive:** read-only (project navigation links).

---

## Artist

- `/p/[slug]/artist` — artist portal home; tile grid (advancing, catering, venue, schedule, travel, privacy) + `<PortalDocVault>`. **CRUD/interactive:** read-only (nav + doc vault list).
- `/p/[slug]/artist/advancing` — deliverable submission hub (riders, input lists, stage plots, guest lists) with state machine. **CRUD/interactive:** submit deliverable (`submitDeliverableAction`), change fulfillment state (`setDeliverableStatusAction`); StatusBadge.
- `/p/[slug]/artist/catering` — catering / dietary / green-room info. **CRUD/interactive:** read-only.
- `/p/[slug]/artist/schedule` — show-day timing / set times. **CRUD/interactive:** read-only (StatusBadge).
- `/p/[slug]/artist/travel` — travel itinerary. **CRUD/interactive:** read-only.
- `/p/[slug]/artist/venue` — load-in, power, dimensions. **CRUD/interactive:** read-only.
- `/p/[slug]/artist/privacy` — `<PortalPrivacyPanel persona="artist">`. **CRUD/interactive:** submit DSAR / consent request; data-export + erasure request links; read-only DSAR + consent lists.

---

## Athlete

- `/p/[slug]/athlete` — athlete portal home; tile grid (requests, training, visa, safeguarding, privacy) with counts. **CRUD/interactive:** read-only (nav).
- `/p/[slug]/athlete/requests` — athlete service requests list, metrics. **CRUD/interactive:** read-only; "New request" links out to COMPVSS `/m/requests/new`.
- `/p/[slug]/athlete/training` — training schedule / sessions, metrics. **CRUD/interactive:** read-only.
- `/p/[slug]/athlete/visa` — visa case status (approved/denied/pending), metrics. **CRUD/interactive:** read-only (status display only).
- `/p/[slug]/athlete/safeguarding` — safeguarding reporting info + welfare channel copy. **CRUD/interactive:** read-only.
- `/p/[slug]/athlete/privacy` — `<PortalPrivacyPanel persona="athlete">`. **CRUD/interactive:** submit DSAR / export request; read-only ledgers.

---

## Delegation

- `/p/[slug]/delegation` — delegation portal home; metrics + `<PortalDocVault>`. **CRUD/interactive:** read-only (nav + doc vault).
- `/p/[slug]/delegation/accommodation` — accommodation bookings (`<DataTable>`), metrics. **CRUD/interactive:** read-only.
- `/p/[slug]/delegation/bookings` — booking summary, metrics. **CRUD/interactive:** read-only.
- `/p/[slug]/delegation/cases` — case tracking, metrics. **CRUD/interactive:** read-only.
- `/p/[slug]/delegation/entries` — athlete entries against disciplines/events (`<DataTable>`), approved count. **CRUD/interactive:** read-only (status display).
- `/p/[slug]/delegation/meetings` — meetings list, metrics. **CRUD/interactive:** read-only.
- `/p/[slug]/delegation/ratecard` — rate card, metrics. **CRUD/interactive:** read-only.
- `/p/[slug]/delegation/transport` — transport bookings, metrics. **CRUD/interactive:** read-only.
- `/p/[slug]/delegation/visa` — visa cases (`<DataTable>`), approved count. **CRUD/interactive:** read-only (status display).
- `/p/[slug]/delegation/privacy` — `<PortalPrivacyPanel persona="delegation">`. **CRUD/interactive:** submit DSAR / export request; read-only ledgers.

---

## Client

- `/p/[slug]/client` — client portal home; tile grid (proposals, deliverables, invoices, files). **CRUD/interactive:** read-only (nav).
- `/p/[slug]/client/deliverables` — project deliverables (`<DataTable>`, StatusBadge). **CRUD/interactive:** read-only.
- `/p/[slug]/client/files` — shared files list. **CRUD/interactive:** download files (`/api/v1/deliverables/[id]/download`); read-only otherwise.
- `/p/[slug]/client/invoices` — invoices (`<DataTable>`, StatusBadge). **CRUD/interactive:** download invoice/receipt; (copy references paying — no in-page pay control found, read-only list + download).
- `/p/[slug]/client/messages` — client message thread surface. **CRUD/interactive:** read-only wrapper (no markers; thread display).
- `/p/[slug]/client/privacy` — `<PortalPrivacyPanel persona="client">`. **CRUD/interactive:** submit DSAR / export request; read-only ledgers.
- `/p/[slug]/client/proposals` — proposals list (`<DataTable>`, StatusBadge). **CRUD/interactive:** read-only (links to detail).
- `/p/[slug]/client/proposals/[proposalId]` — proposal detail overview, metrics, sub-route links. **CRUD/interactive:** read-only (navigation hub).
- `/p/[slug]/client/proposals/[proposalId]/activity` — proposal activity log. **CRUD/interactive:** read-only.
- `/p/[slug]/client/proposals/[proposalId]/lifecycle` — 8-phase progression with milestone gates (`<PhaseGateForm>`). **CRUD/interactive:** toggle gate items (`toggleGateAction`), approve phase (`approvePhaseAction`).
- `/p/[slug]/client/proposals/[proposalId]/files` — proposal files list. **CRUD/interactive:** read-only.
- `/p/[slug]/client/proposals/[proposalId]/approvals` — approval/signature requests list. **CRUD/interactive:** read-only (links to detail).
- `/p/[slug]/client/proposals/[proposalId]/approvals/[approvalId]` — approval detail with `<ApprovalSignBlock>`. **CRUD/interactive:** counter-sign approval (`signApprovalAction`), decline (`declineApprovalAction`).
- `/p/[slug]/client/proposals/[proposalId]/change-orders` — change-orders list. **CRUD/interactive:** read-only (links + link to new).
- `/p/[slug]/client/proposals/[proposalId]/change-orders/new` — create change order (`<FormShell>`). **CRUD/interactive:** create change order (`createChangeOrderAction`).
- `/p/[slug]/client/proposals/[proposalId]/change-orders/[coId]` — change-order detail with `<ChangeOrderDecision>`. **CRUD/interactive:** decide (approve/reject) change order (`decideChangeOrderAction`).
- `/p/[slug]/client/proposals/[proposalId]/revisions` — revision rounds list. **CRUD/interactive:** read-only (links + link to new).
- `/p/[slug]/client/proposals/[proposalId]/revisions/new` — start revision round (`<FormShell>`). **CRUD/interactive:** create revision round (`createRevisionRoundAction`).
- `/p/[slug]/client/proposals/[proposalId]/revisions/[revisionId]` — revision detail with `<RevisionDecision>`. **CRUD/interactive:** decide revision (`decideRevisionAction`).

---

## Sponsor

- `/p/[slug]/sponsor` — sponsor portal home; tile grid (activations, assets, entitlements, reporting). **CRUD/interactive:** read-only (nav).
- `/p/[slug]/sponsor/activations` — activation list. **CRUD/interactive:** read-only.
- `/p/[slug]/sponsor/assets` — brand assets list. **CRUD/interactive:** read-only.
- `/p/[slug]/sponsor/entitlements` — entitlements (`<DataTable>`), metrics. **CRUD/interactive:** read-only.
- `/p/[slug]/sponsor/reporting` — sponsorship reporting. **CRUD/interactive:** read-only.
- `/p/[slug]/sponsor/privacy` — `<PortalPrivacyPanel persona="sponsor">`. **CRUD/interactive:** submit DSAR / export request; read-only ledgers.

---

## Media

- `/p/[slug]/media` — media portal home; metrics + `<PortalDocVault>`. **CRUD/interactive:** read-only (doc vault list).
- `/p/[slug]/media/accommodation` — media accommodation (`<DataTable>`), metrics. **CRUD/interactive:** read-only.
- `/p/[slug]/media/info` — editorial info, metrics. **CRUD/interactive:** read-only.
- `/p/[slug]/media/pressconf` — press-conference schedule, metrics. **CRUD/interactive:** read-only.
- `/p/[slug]/media/services` — media services, metrics. **CRUD/interactive:** read-only.
- `/p/[slug]/media/transport` — media transport, metrics. **CRUD/interactive:** read-only.
- `/p/[slug]/media/privacy` — `<PortalPrivacyPanel persona="media">`. **CRUD/interactive:** submit DSAR / export request; read-only ledgers.

---

## Guest

- `/p/[slug]/guest` — guest portal home; tile grid (tickets, schedule, logistics). **CRUD/interactive:** read-only (nav).
- `/p/[slug]/guest/tickets` — guest tickets (`<DataTable>`, StatusBadge), backed by `assignments`. **CRUD/interactive:** read-only.
- `/p/[slug]/guest/schedule` — guest schedule (`<DataTable>`). **CRUD/interactive:** read-only.
- `/p/[slug]/guest/logistics` — arrival / logistics info. **CRUD/interactive:** read-only.
- `/p/[slug]/guest/privacy` — `<PortalPrivacyPanel persona="guest">`. **CRUD/interactive:** submit DSAR / export request; read-only ledgers.

---

## Hospitality

- `/p/[slug]/hospitality` — hospitality portal home, metrics. **CRUD/interactive:** read-only (nav).
- `/p/[slug]/hospitality/guests` — guest roster (`<DataTable>`), metrics. **CRUD/interactive:** read-only.
- `/p/[slug]/hospitality/itinerary` — itinerary, metrics. **CRUD/interactive:** read-only.
- `/p/[slug]/hospitality/privacy` — `<PortalPrivacyPanel persona="hospitality">`. **CRUD/interactive:** submit DSAR / export request; read-only ledgers.

---

## VIP

- `/p/[slug]/vip` — VIP portal home (concierge / transport / hosting), metrics. **CRUD/interactive:** read-only (nav).
- `/p/[slug]/vip/accommodation` — VIP accommodation (`<DataTable>`), metrics. **CRUD/interactive:** read-only.
- `/p/[slug]/vip/itinerary` — VIP itinerary, metrics. **CRUD/interactive:** read-only.
- `/p/[slug]/vip/transport` — dedicated transport, metrics. **CRUD/interactive:** read-only.
- `/p/[slug]/vip/privacy` — `<PortalPrivacyPanel persona="vip">`. **CRUD/interactive:** submit DSAR / export request; read-only ledgers.

---

## Crew

- `/p/[slug]/crew` — crew portal home; tile grid (call-sheet, time, advances, feed, etc.). **CRUD/interactive:** read-only (nav).
- `/p/[slug]/crew/advances` — per-individual advances/assignments (`listMyAssignments` across catalog kinds). **CRUD/interactive:** read-only list (entitlement tracking).
- `/p/[slug]/crew/call-sheet` — call sheet. **CRUD/interactive:** download call-sheet PDF; read-only otherwise.
- `/p/[slug]/crew/chat` — `<ChatSurface variant="portal">` (lists chat rooms). **CRUD/interactive:** open room → routes to `/m/inbox/[id]` for messaging; read-only room list here.
- `/p/[slug]/crew/feed` — `<FeedSurface variant="portal">` + `<RealtimeRefresh>`. **CRUD/interactive:** post to feed (inline form action); realtime refresh.
- `/p/[slug]/crew/kudos` — `<KudosSurface variant="portal">`. **CRUD/interactive:** create kudos post (form with select/textarea), add reactions.
- `/p/[slug]/crew/docs` — `<DocsSurface variant="portal">`. **CRUD/interactive:** download personal documents (signed URLs); upload links out to `/m/docs/new`.
- `/p/[slug]/crew/directory` — `<DirectorySurface variant="portal">` (project members). **CRUD/interactive:** read-only.
- `/p/[slug]/crew/learning` — `<LearningSurface variant="portal">` (course assignments). **CRUD/interactive:** read-only list; deep-links to course detail / mobile quiz surface.
- `/p/[slug]/crew/schedule` — `<ScheduleSurface variant="portal">` (shifts). **CRUD/interactive:** read-only list; "Swap shift" links out to swap form.
- `/p/[slug]/crew/time-off` — `<TimeOffSurface variant="portal">`. **CRUD/interactive:** read-only list; "New request" links out to `/m/time-off/new`.
- `/p/[slug]/crew/time` — time-clock summary. **CRUD/interactive:** read-only.
- `/p/[slug]/crew/timesheets` — timesheets (StatusBadge). **CRUD/interactive:** read-only.
- `/p/[slug]/crew/privacy` — `<PortalPrivacyPanel persona="crew">`. **CRUD/interactive:** submit DSAR / export request; read-only ledgers.

---

## Vendor

- `/p/[slug]/vendor` — vendor portal home; tile grid (submissions, POs, invoices, credentials, etc.). **CRUD/interactive:** read-only (nav).
- `/p/[slug]/vendor/submissions` — vendor submissions (StatusBadge). **CRUD/interactive:** read-only (status display).
- `/p/[slug]/vendor/purchase-orders` — purchase orders (StatusBadge). **CRUD/interactive:** read-only.
- `/p/[slug]/vendor/invoices` — vendor invoices (StatusBadge). **CRUD/interactive:** read-only.
- `/p/[slug]/vendor/credentials` — vendor credentials list. **CRUD/interactive:** read-only.
- `/p/[slug]/vendor/equipment-pull-list` — equipment pull list. **CRUD/interactive:** download pull-list PDF; read-only otherwise.
- `/p/[slug]/vendor/training` — training articles index, metrics. **CRUD/interactive:** read-only (links to course).
- `/p/[slug]/vendor/training/[course]` — training article detail. **CRUD/interactive:** read-only (back button).
- `/p/[slug]/vendor/chat` — `<ChatSurface variant="portal">`. **CRUD/interactive:** open room → `/m/inbox/[id]`; read-only room list.
- `/p/[slug]/vendor/feed` — `<FeedSurface variant="portal">` + realtime. **CRUD/interactive:** post to feed; realtime refresh.
- `/p/[slug]/vendor/kudos` — `<KudosSurface variant="portal">`. **CRUD/interactive:** create kudos post, add reactions.
- `/p/[slug]/vendor/docs` — `<DocsSurface variant="portal">`. **CRUD/interactive:** download documents; upload links out to `/m/docs/new`.
- `/p/[slug]/vendor/directory` — `<DirectorySurface variant="portal">`. **CRUD/interactive:** read-only.
- `/p/[slug]/vendor/schedule` — `<ScheduleSurface variant="portal">`. **CRUD/interactive:** read-only; swap-shift link out.
- `/p/[slug]/vendor/time-off` — `<TimeOffSurface variant="portal">`. **CRUD/interactive:** read-only; "New request" links to `/m/time-off/new`.
- `/p/[slug]/vendor/privacy` — `<PortalPrivacyPanel persona="vendor">`. **CRUD/interactive:** submit DSAR / export request; read-only ledgers.

---

## Producer

All producer surfaces are read-only executive dashboards (PortalRail + EmptyState/metric panels).

- `/p/[slug]/producer` — producer portal home. **CRUD/interactive:** read-only (nav).
- `/p/[slug]/producer/approvals` — approvals overview. **CRUD/interactive:** read-only.
- `/p/[slug]/producer/pnl` — P&L view. **CRUD/interactive:** read-only.
- `/p/[slug]/producer/portfolio` — portfolio view. **CRUD/interactive:** read-only.
- `/p/[slug]/producer/readiness` — readiness dashboard. **CRUD/interactive:** read-only.
- `/p/[slug]/producer/reviews` — reviews. **CRUD/interactive:** read-only.
- `/p/[slug]/producer/risk` — risk register. **CRUD/interactive:** read-only.
- `/p/[slug]/producer/tracker` — production tracker. **CRUD/interactive:** read-only.
- `/p/[slug]/producer/privacy` — `<PortalPrivacyPanel persona="producer">`. **CRUD/interactive:** submit DSAR / export request; read-only ledgers.

---

## Promoter

Read-only promoter dashboards (PortalRail + EmptyState panels).

- `/p/[slug]/promoter` — promoter portal home. **CRUD/interactive:** read-only (nav).
- `/p/[slug]/promoter/approvals` — approvals overview. **CRUD/interactive:** read-only.
- `/p/[slug]/promoter/co-pro` — co-promotion view. **CRUD/interactive:** read-only.
- `/p/[slug]/promoter/marketing` — marketing view. **CRUD/interactive:** read-only.
- `/p/[slug]/promoter/settlements` — settlements. **CRUD/interactive:** read-only.
- `/p/[slug]/promoter/tour-pnl` — tour P&L. **CRUD/interactive:** read-only (navigation links).
- `/p/[slug]/promoter/privacy` — `<PortalPrivacyPanel persona="promoter">`. **CRUD/interactive:** submit DSAR / export request; read-only ledgers.

---

## Stakeholder

Read-only governance/finance dashboards (PortalRail + EmptyState panels).

- `/p/[slug]/stakeholder` — stakeholder portal home. **CRUD/interactive:** read-only (nav).
- `/p/[slug]/stakeholder/audit` — audit view. **CRUD/interactive:** read-only.
- `/p/[slug]/stakeholder/governance` — governance view. **CRUD/interactive:** read-only.
- `/p/[slug]/stakeholder/pnl` — P&L view. **CRUD/interactive:** read-only.
- `/p/[slug]/stakeholder/portfolio` — portfolio view. **CRUD/interactive:** read-only.
- `/p/[slug]/stakeholder/sustainability` — sustainability metrics. **CRUD/interactive:** read-only.
- `/p/[slug]/stakeholder/privacy` — `<PortalPrivacyPanel persona="stakeholder">`. **CRUD/interactive:** submit DSAR / export request; read-only ledgers.

---

## Volunteer

- `/p/[slug]/volunteer` — volunteer portal home, metrics + membership status badge. **CRUD/interactive:** read-only (nav).
- `/p/[slug]/volunteer/application` — volunteer application status, metrics + status badge. **CRUD/interactive:** read-only (status display).
- `/p/[slug]/volunteer/schedule` — volunteer shift schedule, metrics. **CRUD/interactive:** read-only.
- `/p/[slug]/volunteer/training` — volunteer training, metrics. **CRUD/interactive:** read-only.
- `/p/[slug]/volunteer/uniform` — uniform/kit info, metrics. **CRUD/interactive:** read-only.
- `/p/[slug]/volunteer/privacy` — `<PortalPrivacyPanel persona="volunteer">`. **CRUD/interactive:** submit DSAR / export request; read-only ledgers.


---

# COMPVSS Mobile (/m)

The amber `(mobile)` shell — COMPVSS field/venue operations, an offline-first PWA. 75 `page.tsx` routes under `src/app/(mobile)/`. Inventoried from each `page.tsx` plus its sibling `actions.ts` and client islands. Every route is auth-gated via `requireSession()` unless noted; most list pages are org-scoped and self-scoped to the caller.

## Core field ops

- `/m` — Mobile home. Today/Tools/Reports tab grid (Hick's-law tile launcher) over every field surface; redirects to `/m/[role]` when the user has chosen a `mobile_role`. **CRUD/interactive:** navigation tiles; floating scan FAB; tab switching (client `MobileHomeTabs`).
- `/m/clock` — Today's scheduled shifts with attendance state, resolved from `workforce_members` → `shifts`. **CRUD/interactive:** clock in/out + break start/end via `CheckInControls` (POST `/api/v1/shifts/checkin`); captures browser GPS on in/out; offline-queue aware.
- `/m/crew/clock` — Field clock with server-restored open-shift timer (`time_entries`). **CRUD/interactive:** clock-in / clock-out server actions (`clockInAction`/`clockOutAction`); idempotent open-shift guard; optional geo coords (lat/lng/accuracy) in metadata.
- `/m/punch` — Punch list of open `tasks` assigned to the caller, priority-sorted with overdue count. **CRUD/interactive:** read-only (links to Tasks).
- `/m/gate` — Gate/access summary; today's `access_scans` with granted/denied tallies. **CRUD/interactive:** read-only list; links to the scanner.
- `/m/gate/scan` — Accreditation gate scanner. **CRUD/interactive:** keyboard-wedge + camera (`CameraScanner` / BarcodeDetector) barcode capture POSTing to `/api/v1/accreditation/scan`; allow/deny/warn decisions logged server-side; offline-queue replay.
- `/m/check-in` — Ticket check-in scanner (camera QR/barcode, network-only). **CRUD/interactive:** `CheckInScanner` camera scan POSTing to ticket-validation endpoint; accepted/duplicate/voided/not_found results; offline-queue shim.
- `/m/check-in/manual` — Manual ticket-code lookup when QR is unreadable. **CRUD/interactive:** same `CheckInScanner` (type-a-code path).
- `/m/check-in/scan/[slug]` — Slug-scoped scan entry (paste/scan code for a specific gate). **CRUD/interactive:** `CheckInScanner` code submit.
- `/m/checkin` — Read-only meal-credit + break summary for today's shifts (verify lunch credit before punch-out). **CRUD/interactive:** read-only.
- `/m/daily-log` — Daily log quick-capture from the floor + 7 most recent logs. **CRUD/interactive:** `quickCreateDailyLog` server action (project / weather / notes); upsert by (org, project, date); redirects to console detail.
- `/m/handover` — Per-venue commissioning-walk handover state, bucketed needs-walk vs done. **CRUD/interactive:** read-only (links to console venue detail to change state).
- `/m/driver` — Today's dispatch runs assigned to the driver, upcoming vs completed. **CRUD/interactive:** read-only list; links to run detail.
- `/m/driver/run/[runId]` — Run detail with manifest + waypoints. **CRUD/interactive:** depart / arrive / cancel run-state transitions (`transitionRun`, server-validated FSM with concurrency guard) via `RunActions`.
- `/m/medic` — Clinician's medical encounters in last 24h with triage tones. **CRUD/interactive:** read-only list; links to new encounter.
- `/m/medic/new` — New clinical encounter intake (pseudonymous patient ref). **CRUD/interactive:** `logEncounter` server action (triage / chief complaint / disposition) via `MedicForm`; clinician signature capture (typed or canvas) stored in PHI-encrypted column.
- `/m/guard` — Guard tour list scoped to the caller (in-progress / overdue / scheduled). **CRUD/interactive:** read-only.
- `/m/ros` — Today's run-of-show cues across the org, time-ordered with live/standby/done tones. **CRUD/interactive:** read-only.
- `/m/ros/[showId]` — Per-show cue sheet (event + its cues). **CRUD/interactive:** read-only.
- `/m/wms` — Warehouse/equipment view: items in maintenance + upcoming rental returns. **CRUD/interactive:** read-only; links to inventory scanner.
- `/m/inventory/scan` — Equipment asset-tag scanner. **CRUD/interactive:** `InventoryScanner` (scan/type tag) POSTing to `/api/v1/equipment/scan` for toggle / check-in / check-out; offline-queue aware.
- `/m/incidents` — Org-wide incident queue (last 30 days) with severity + open counts. **CRUD/interactive:** read-only list; links to new incident.
- `/m/incidents/new` — Full incident report form (severity, location, body part, photos, OSHA fields). **CRUD/interactive:** shared `IncidentForm` (server action); notifies admin + EHS lead.
- `/m/incident` — "My Incidents" — only incidents the caller filed. **CRUD/interactive:** read-only list; quick-file CTA.
- `/m/incident/new` — Express one-field incident quick-file. **CRUD/interactive:** `quickFileIncident` server action (single summary field; defaults severity=minor, state=open); fans out push to org admins.
- `/m/wallet` — Caller's own accreditation credential cards (issued vs other states). **CRUD/interactive:** read-only; displays card barcode (no live QR render).
- `/m/requests` — Active org service requests, severity-coded. **CRUD/interactive:** read-only list; "+ Open" link.
- `/m/requests/new` — Open a service request from the field. **CRUD/interactive:** `createServiceRequest` (console action) via `FormShell` — severity / category / summary selects.
- `/m/requests/[requestId]` — Service-request detail. **CRUD/interactive:** `transitionRequest` state changes (acknowledge / start work / resolve / cancel) per allowed-next-states map.
- `/m/advances` — Cross-project view of every assignment to the caller (tickets, credentials, lodging, travel, catering, radios), grouped by catalog kind. **CRUD/interactive:** read-only (`listMyAssignments`).
- `/m/ad` — Arrivals & departures manifest tracking (flights/carriers, scheduled vs actual). **CRUD/interactive:** read-only.
- `/m/wayfind` — Venue/site directory with kind tones (map + parking). **CRUD/interactive:** read-only; links to console venues.
- `/m/schedule` — Read-only cross-project calendar (shared `CalendarView`, agenda default). **CRUD/interactive:** read-only; view-mode toggle (agenda/calendar) client-side.
- `/m/tasks` — Tasks assigned to the caller, due-date ordered. **CRUD/interactive:** `TasksList` client list (filtering/interaction); detail links.
- `/m/tasks/[taskId]` — Task detail. **CRUD/interactive:** `setTaskStatus` transitions (todo / in_progress / blocked / review / done) via `TaskTransitions`.
- `/m/crew` — Crew home tile launcher (Clock, Tasks). **CRUD/interactive:** navigation only.
- `/m/coc` — Chain-of-custody audit trail (last 7 days) over evidence/credential/incident tables. **CRUD/interactive:** read-only.
- `/m/safeguarding` — Caller's submitted safeguarding reports with review-state tones. **CRUD/interactive:** read-only list.
- `/m/guide` — Boarding-pass event guide auto-scoped to the viewer's session persona (`GuideView`). **CRUD/interactive:** read-only render; `GuideComments` (comment thread); PDF download link.
- `/m/alerts` — Crisis alerts (last 14 days) with acknowledgement receipts. **CRUD/interactive:** `acknowledgeAlert` server action via `AcknowledgeButton` (upserts a receipt; cross-tenant guarded).
- `/m/notifications` — In-app notification list (read/unread, deep-link hrefs). **CRUD/interactive:** read-only (renders kind/title/body/relative time).
- `/m/shift` — Shift schedule (shared `ScheduleSurface`, mobile variant). **CRUD/interactive:** links to clock-in and shift-swap; surface-level interactions only.
- `/m/shift/swap` — Request a shift swap. **CRUD/interactive:** `requestSwap` server action (pick shift + reason) via `FormShell`; duplicate-request guard; notifies admins.
- `/m/gigs` — Public open-gigs board for crew on the road (reads anon `public_job_board` view). **CRUD/interactive:** read-only list.

## Connecteam parity

- `/m/feed` — Announcements feed (shared `FeedSurface`, mobile). **CRUD/interactive:** `markAnnouncementRead` server action; Realtime refresh subscription.
- `/m/inbox` — Chat rooms list with unread markers (shared `ChatSurface`). **CRUD/interactive:** read-only list; deep-links into rooms.
- `/m/inbox/[roomId]` — Chat room thread (`ChatRoom`, paginated, "Load Older" cursor). **CRUD/interactive:** `postMessage` server action with optimistic echo + membership guard; `markRoomRead`; Realtime message subscription.
- `/m/learning` — Assigned courses / LMS list (shared `LearningSurface`). **CRUD/interactive:** read-only list; deep-links to courses.
- `/m/learning/[courseId]` — Course player: lessons + quiz. **CRUD/interactive:** `submitQuiz` server action (scored server-side; auto-awards completion badge on pass) via `FormShell`.
- `/m/time-off` — Time-off balances + requests (shared `TimeOffSurface`). **CRUD/interactive:** links to new request; surface interactions.
- `/m/time-off/new` — New time-off request. **CRUD/interactive:** `createTimeOffRequest` server action (policy / dates / hours / reason) with date-range validation; cross-tenant policy guard; push fan-out.
- `/m/kudos` — Recognition feed (shared `KudosSurface`). **CRUD/interactive:** `createKudos` (give-kudos form) + `toggleReaction` (emoji reactions) server actions.
- `/m/polls` — Live polls with the caller's existing votes. **CRUD/interactive:** `castVote` server action (poll must be live + same-org; option-belongs-to-poll guard).
- `/m/surveys` — Published surveys + which the caller has answered. **CRUD/interactive:** read-only list; deep-links to survey.
- `/m/surveys/[surveyId]` — Survey form (questions: single/multi-select, text). **CRUD/interactive:** `submitSurvey` server action (collates `q_<id>` answers, handles multi-select; anonymous-aware).
- `/m/docs` — Personal documents vault (shared `DocsSurface`). **CRUD/interactive:** read-only list; signed-URL download via `/api/v1/me/documents/[id]/download`; upload link.
- `/m/docs/new` — Upload a personal document. **CRUD/interactive:** `uploadPersonalDoc` server action (multipart; label + doc_kind; 20 MB cap; private bucket via service client).
- `/m/directory` — Org people directory (shared `DirectorySurface`). **CRUD/interactive:** read-only.
- `/m/onboarding` — New-hire flow assignments for the caller (phase + progress). **CRUD/interactive:** read-only list; deep-links to assignment.
- `/m/onboarding/[assignmentId]` — Onboarding flow detail: steps checklist. **CRUD/interactive:** `completeStep` (mark step done) + finalize actions via `MarkStepDoneButton` / `FinalizeButton`; step-belongs-to-flow guard.
- `/m/tracker` — Cross-project WBS budget/progress/variance rollup cards (`v_xpms_atom_rollup_recursive`). **CRUD/interactive:** read-only; links to desktop tracker.

## Role-routed

`/m/[role]` matches the six `MobileRole` values (performer / crew / driver / medic / guard / admin); static routes keep priority so only role names fall here. Sub-routes are ADR-0009 URL-flip aliases that re-export the canonical `/m/<surface>` page body (same data fetch + CRUD as the canonical route).

- `/m/[role]` — Per-role home dashboard: role-scoped link grid (performer/crew/driver/... each get a tailored tile set). **CRUD/interactive:** navigation only.
- `/m/[role]/alerts` — Alias of `/m/alerts`. **CRUD/interactive:** acknowledge alerts (see `/m/alerts`).
- `/m/[role]/directory` — Alias of `/m/directory`. **CRUD/interactive:** read-only.
- `/m/[role]/docs` — Alias of `/m/docs`. **CRUD/interactive:** download (see `/m/docs`).
- `/m/[role]/feed` — Alias of `/m/feed`. **CRUD/interactive:** mark-as-read + Realtime.
- `/m/[role]/inbox` — Alias of `/m/inbox`. **CRUD/interactive:** read-only list (see `/m/inbox`).
- `/m/[role]/kudos` — Alias of `/m/kudos`. **CRUD/interactive:** give kudos + reactions.
- `/m/[role]/learning` — Alias of `/m/learning`. **CRUD/interactive:** read-only list (see `/m/learning`).
- `/m/[role]/settings` — Alias of `/m/settings`. **CRUD/interactive:** push toggle, locale (see `/m/settings`).
- `/m/[role]/shift` — Alias of `/m/shift`. **CRUD/interactive:** schedule surface (see `/m/shift`).
- `/m/[role]/time-off` — Alias of `/m/time-off`. **CRUD/interactive:** new request link (see `/m/time-off`).

## Settings

- `/m/settings` — Field PWA settings hub. **CRUD/interactive:** `PushToggle` (web-push subscribe/unsubscribe over registered `push_subscriptions` devices); `LocaleSwitcher`; links to notification + role settings.
- `/m/settings/notifications` — Per-kind notification matrix (push/email per `notification_kind_catalog`). **CRUD/interactive:** `savePreferences` server action (upsert flat jsonb matrix + digest cadence) via `FormShell`.
- `/m/settings/role` — Mobile role chooser (persists to `user_preferences.ui_state.mobile_role`). **CRUD/interactive:** `RoleChooser` client picker that saves the chosen role and refreshes the route.


---

# Marketing / Auth / Personal page inventory

Inventory of every `page.tsx` under `src/app/(marketing)/`, `src/app/(auth)/`, `src/app/(personal)/`, and the root-level (non-route-group) pages directly under `src/app/`. One bullet per distinct route; `[slug]`/`[id]`/`[handle]`/`[token]` children collapsed under their parent where natural. i18n: the marketing shell is locale-aware via `getRequestT()` + `hreflang` alternates; full localized home variants exist at `/es-ES` and `/pt-BR`.

# Marketing (public)

- `/` — Home: ATLVS ecosystem (ATLVS · COMPVSS · GVTEWAY · LEG3ND) overview, industries, XPMS phases, FAQ, CTAs. i18n via `getRequestT`, hreflang to `/es-ES` + `/pt-BR`. **CRUD/interactive:** read-only (CTA links only).
- `/es-ES` — Spanish localized marketing home variant. **CRUD/interactive:** read-only.
- `/pt-BR` — Brazilian-Portuguese localized marketing home variant. **CRUD/interactive:** read-only.
- `/about` — Company / about page. Static, pre-rendered. **CRUD/interactive:** read-only.
- `/ai` — AI capabilities landing; lists AI use-cases linking to `/ai/[slug]`. **CRUD/interactive:** read-only.
- `/ai/[slug]` — Individual AI use-case detail page. **CRUD/interactive:** read-only.
- `/alternatives` — "Alternatives to X" index. **CRUD/interactive:** read-only.
- `/alternatives/[competitor]` — Long-form narrative alternatives page per competitor. **CRUD/interactive:** read-only.
- `/blog` — Blog index (ISR, 5-min revalidate). **CRUD/interactive:** read-only.
- `/blog/[slug]` — Blog post detail (ISR). **CRUD/interactive:** read-only.
- `/brand-kit` — Brand kit landing hub. **CRUD/interactive:** read-only.
- `/brand-kit/foundations` — Brand foundations reference (color, type, tokens). **CRUD/interactive:** read-only.
- `/brand-kit/logo-kit` — Logo/wordmark reference + downloads. **CRUD/interactive:** read-only (download links).
- `/careers` — Careers / open-roles page. Static. **CRUD/interactive:** read-only.
- `/changelog` — Product changelog. Static. **CRUD/interactive:** read-only.
- `/community` — Community hub index. **CRUD/interactive:** read-only.
- `/community/[slug]` — Community resource/post detail. **CRUD/interactive:** read-only.
- `/compare` — Competitor comparison index (ISR). **CRUD/interactive:** read-only.
- `/compare/[competitor]` — Side-by-side comparison vs a named competitor (ISR). **CRUD/interactive:** read-only.
- `/contact` — Contact / sales page. **CRUD/interactive:** contact form (name/email/company/scale `<select>`) — plain `method="post" action="mailto:sales@atlvs.pro"` (no server action); plus `mailto:` links.
- `/customers` — Customer / case-study index, filterable by industry label. **CRUD/interactive:** read-only.
- `/customers/[slug]` — Case-study detail (reads from DB). **CRUD/interactive:** read-only.
- `/demo` — Demo landing; lists demo personas (`DEMO_PERSONAS`) + booking CTA. **CRUD/interactive:** read-only (CTA links).
- `/demo/[persona]` — Persona-scoped demo page (static-generated per persona). **CRUD/interactive:** read-only.
- `/docs` — Documentation landing. Static. **CRUD/interactive:** read-only.
- `/features` — Features index (ISR). **CRUD/interactive:** read-only.
- `/features/[module]` — Per-module feature page. **CRUD/interactive:** read-only.
- `/features/[module]/[industry]` — Programmatic module×industry SEO feature farm. **CRUD/interactive:** read-only.
- `/glossary` — Glossary index (terms from `@/lib/marketing/glossary`, categorized). **CRUD/interactive:** read-only.
- `/glossary/[slug]` — Glossary term detail. **CRUD/interactive:** read-only.
- `/guides` — Guides index (ISR). **CRUD/interactive:** read-only.
- `/guides/[slug]` — Guide article detail (ISR). **CRUD/interactive:** read-only.
- `/help` — Help center landing. Static. **CRUD/interactive:** read-only.
- `/integrations` — Integrations directory (static catalog `@/lib/marketing/integrations`, categorized). **CRUD/interactive:** read-only.
- `/integrations/[slug]` — Integration detail. **CRUD/interactive:** read-only.
- `/integrations/partners` — Partner integrations directory (reads DB). **CRUD/interactive:** read-only.
- `/integrations/partners/[slug]` — Partner integration detail (reads DB). **CRUD/interactive:** read-only.
- `/integrations/submit` — Submit-a-partner-integration form. **CRUD/interactive:** server action (`submitPartnerIntegration`) inserts into `partner_integrations`.
- `/integrations/submit/thanks` — Post-submit confirmation. **CRUD/interactive:** read-only.
- `/legal/dpa` — Data Processing Addendum. **CRUD/interactive:** read-only.
- `/legal/privacy` — Privacy policy. **CRUD/interactive:** read-only.
- `/legal/sla` — Service Level Agreement. **CRUD/interactive:** read-only.
- `/legal/terms` — Terms of Service. **CRUD/interactive:** read-only.
- `/partners` — Partner program landing. **CRUD/interactive:** read-only.
- `/press` — Press / media page. **CRUD/interactive:** read-only.
- `/pricing` — Pricing tiers (Free/etc., i18n tier copy). Static. **CRUD/interactive:** read-only.
- `/roadmap` — Public product roadmap (quarters × in_flight/next/exploring). **CRUD/interactive:** read-only (no voting).
- `/solutions` — Solutions index (ISR). **CRUD/interactive:** read-only.
- `/solutions/atlvs` — ATLVS solution page (ISR). **CRUD/interactive:** read-only.
- `/solutions/compvss` — COMPVSS solution page (ISR). **CRUD/interactive:** read-only.
- `/solutions/gvteway` — GVTEWAY solution page (ISR). **CRUD/interactive:** read-only.
- `/solutions/[industry]` — Per-industry solution page (ISR). **CRUD/interactive:** read-only.
- `/status` — Platform status / service health board (per-service operational/degraded/outage). **CRUD/interactive:** read-only (static state, no live incident feed).
- `/teams` — Teams / by-role index. **CRUD/interactive:** read-only.
- `/teams/[role]` — Per-role team page. **CRUD/interactive:** read-only.
- `/templates` — Template gallery index, categorized. **CRUD/interactive:** read-only.
- `/templates/[slug]` — Template detail. **CRUD/interactive:** read-only.
- `/tools` — Free tools hub (links to calculators). **CRUD/interactive:** read-only.
- `/tools/capacity-calculator` — Venue capacity / max-occupancy calculator (interactive `CapacityCalculator` client component). **CRUD/interactive:** client-side calculator (inputs → computed result; no persistence).
- `/tools/per-diem-calculator` — Crew/talent per-diem travel-allowance calculator (interactive `PerDiemCalculator` client component). **CRUD/interactive:** client-side calculator (no persistence).

## Marketplace (public discovery — `(marketing)/marketplace/*`)

Anon-readable discovery surfaces driven by `public_*` Supabase views. List pages support filtering; inquire/apply/submit pages write via server actions.

- `/marketplace` — Marketplace hub linking to all discovery sub-surfaces. **CRUD/interactive:** read-only.
- `/marketplace/agencies` — Agency directory (`public_agency_directory`). **CRUD/interactive:** read-only.
- `/marketplace/agencies/[handle]` — Agency profile detail. **CRUD/interactive:** read-only.
- `/marketplace/agencies/[handle]/inquire` — Contact/inquiry form for an agency. **CRUD/interactive:** server action `submitMarketplaceInquiry` → inserts `marketplace_inquiries` (via shared `InquirePanel`).
- `/marketplace/crew` — Crew directory (public crew view). **CRUD/interactive:** read-only.
- `/marketplace/crew/[handle]` — Crew profile detail. **CRUD/interactive:** read-only.
- `/marketplace/crew/[handle]/inquire` — Crew inquiry form. **CRUD/interactive:** server action → `marketplace_inquiries`.
- `/marketplace/talent` — Talent directory / EPK roster (public talent view). **CRUD/interactive:** read-only.
- `/marketplace/talent/[handle]` — Talent EPK detail. **CRUD/interactive:** read-only.
- `/marketplace/talent/[handle]/inquire` — Talent inquiry form. **CRUD/interactive:** server action → `marketplace_inquiries`.
- `/marketplace/vendors` — Vendor directory (public vendor view). **CRUD/interactive:** read-only.
- `/marketplace/vendors/[handle]` — Vendor profile detail. **CRUD/interactive:** read-only.
- `/marketplace/vendors/[handle]/inquire` — Vendor inquiry form. **CRUD/interactive:** server action → `marketplace_inquiries`.
- `/marketplace/gigs` — Public job board (`public_job_board`), filterable (location etc.). **CRUD/interactive:** read-only (filters).
- `/marketplace/gigs/[slug]` — Gig/job posting detail. **CRUD/interactive:** read-only.
- `/marketplace/gigs/[slug]/apply` — Job application form. **CRUD/interactive:** server action `applyToGig` → inserts `job_applications`.
- `/marketplace/calls` — Open calls / casting list (`public_open_calls`). **CRUD/interactive:** read-only.
- `/marketplace/calls/[slug]` — Open call detail. **CRUD/interactive:** read-only.
- `/marketplace/calls/[slug]/submit` — Open-call submission form (dup-guarded, one live submission per user). **CRUD/interactive:** server action `submitToCall` → inserts `open_call_submissions`, redirects to `/me/submissions`.
- `/marketplace/rfqs` — Public RFQ marketplace (`public_rfq_marketplace`). **CRUD/interactive:** read-only.
- `/marketplace/rfqs/[slug]` — RFQ detail. **CRUD/interactive:** read-only.
- `/marketplace/rfqs/[slug]/inquire` — RFQ inquiry form. **CRUD/interactive:** server action → `marketplace_inquiries`.
- `/marketplace/calendar` — Event calendar of on-sales + announce milestones (`public_event_calendar`). **CRUD/interactive:** read-only.
- `/marketplace/store` — GVTEWAY commerce storefront product grid (DB-backed). **CRUD/interactive:** server action `addToCart` (writes `store_cart_items`).
- `/marketplace/store/[slug]` — Store product detail with variant picker. **CRUD/interactive:** add-to-cart form (`AddToCartForm` → `addToCart`).
- `/marketplace/store/cart` — Shopping cart review + checkout. **CRUD/interactive:** cart line edit/remove (`CartItemRow`) + `CheckoutButton`; reads current cart.

# Auth

All auth screens render under the `(auth)` shell (`AuthShell`/`AuthCard`). Most page files are thin servers delegating to client form components; OAuth/SSO via `OAuthButtons`.

- `/login` — Sign in. **CRUD/interactive:** `LoginForm` — password sign-in (`signInWithPassword`), OAuth/SSO buttons, links to `/forgot-password` and `/magic-link`.
- `/signup` — Create account. **CRUD/interactive:** `SignupForm` — `signupAction` (email/password `signUp`) + OAuth buttons; links to login.
- `/forgot-password` — Request password reset email. **CRUD/interactive:** `ForgotPasswordForm` (`resetPasswordForEmail`).
- `/reset-password` — Set a new password after reset-token verification. **CRUD/interactive:** `ResetPasswordForm` (`updateUser` password).
- `/reset-password/[token]` — Token-landing variant that verifies the reset OTP/token. **CRUD/interactive:** `verifyOtp` flow → password set.
- `/magic-link` — Request a magic sign-in link. **CRUD/interactive:** `MagicLinkForm` (`signInWithOtp` email).
- `/magic-link/[token]` — Magic-link consume/verify landing. **CRUD/interactive:** `verifyOtp` (magiclink) → session.
- `/verify-email` — Post-signup "confirm your email" screen with resend. **CRUD/interactive:** `VerifyEmailScreen` (resend confirmation; reads `?email`).
- `/verify-email/[token]` — Email-confirmation token consume landing. **CRUD/interactive:** `verifyOtp` (email) → verifies + session.
- `/accept-invite/[token]` — Accept an org invitation. **CRUD/interactive:** `AcceptInviteForm` — accepts invite, joins org (server `AcceptInvite` action).
- `/sso/[provider]` — SSO entrypoint; initiates OAuth handshake for google/github/azure/apple/linkedin_oidc (404s on unsupported). **CRUD/interactive:** `signInWithOAuth` redirect (no form).
- `/mfa/challenge` — Two-factor verification step (TOTP) after password; redirects to enroll if no verified factor. **CRUD/interactive:** `MfaChallengeForm` + actions (`challenge`/`verify`/`enroll`).
- `/onboarding/org` — Post-auth org creation for users without a real org. **CRUD/interactive:** `OnboardingOrgForm` (server action creates org; reads `?name`).

# Personal (/me)

Authed self-service shell. All read `requireSession()` + Supabase; degrade gracefully when Supabase unconfigured.

- `/me` — Personal dashboard; role-adaptive card grid with live counts (offers, applications, etc.). **CRUD/interactive:** read-only (navigation hub).
- `/me/profile` — Edit personal profile (avatar, name, public handle, EPK link). **CRUD/interactive:** `FormShell` + server action (updates profile, `public_handle`).
- `/me/settings` — Account settings (density, locale, timezone). **CRUD/interactive:** `updateSettings` server action; `ThemeToggle`.
- `/me/settings/appearance` — Color mode + density picker. **CRUD/interactive:** `ThemeToggle` + `DensityToggle` (client, persisted via theme axes; no server action).
- `/me/preferences` — Notification + theme/locale preferences. **CRUD/interactive:** `savePreferencesAction` server action.
- `/me/privacy` — Privacy & data controls: export data, cookie consent, delete account (30-day grace). **CRUD/interactive:** `PrivacyControls` (client; export/delete/consent actions).
- `/me/security` — Security overview: password change + 2FA enrollment status. **CRUD/interactive:** password update + 2FA/TOTP entry points.
- `/me/security/two-factor` — Manage TOTP two-factor (enroll/verify, factors). **CRUD/interactive:** server actions (`enroll`/verify TOTP).
- `/me/notifications` — Notification preference matrix (per-kind toggles). **CRUD/interactive:** `FormShell` + server action saving the preference matrix.
- `/me/notifications/inbox` — In-app notification inbox. **CRUD/interactive:** server action (mark-read / accept).
- `/me/notifications/push` — Web-push subscription management. **CRUD/interactive:** `PushToggle` (subscribe/unsubscribe).
- `/me/organizations` — List org memberships + roles/tiers. **CRUD/interactive:** read-only.
- `/me/applications` — My job applications list (marketplace). **CRUD/interactive:** mutation present (withdraw-type action); filterable.
- `/me/applications/[applicationId]` — Application detail (stage/status). **CRUD/interactive:** read-only.
- `/me/submissions` — My open-call submissions list. **CRUD/interactive:** mutation present (withdraw).
- `/me/submissions/[submissionId]` — Submission detail. **CRUD/interactive:** read-only.
- `/me/offers` — Talent booking offers with state machine. **CRUD/interactive:** server actions — accept / decline / counter offer.
- `/me/inquiries` — Marketplace inquiries I've sent/received. **CRUD/interactive:** read-only (list).
- `/me/availability` — Booking availability calendar / slots. **CRUD/interactive:** server actions (manage availability slots).
- `/me/reviews` — Reviews received + written. **CRUD/interactive:** read-only (list).
- `/me/reviews/new` — Write a review for a counterpart booking/transaction. **CRUD/interactive:** server action (create review).
- `/me/talent` — Self-managed talent EPK editor (publish toggle, public handle). **CRUD/interactive:** server actions (edit/publish EPK, `public_handle`).
- `/me/crew` — Self-managed crew profile editor (public profile toggle/handle). **CRUD/interactive:** server actions (edit/publish crew profile).
- `/me/saved-searches` — Saved marketplace searches. **CRUD/interactive:** server actions (create/delete saved search).
- `/me/tickets` — My ticket/credential assignments (`listMyAssignments`). **CRUD/interactive:** read-only (data table).

# Root

Public/standalone routes directly under `src/app/` (no route group). Most `[token]` pages are public, unauthenticated, cookie-gated document surfaces.

- `/api-docs` — REST API reference rendered from the OpenAPI 3.1 registry (`buildOpenAPI`). **CRUD/interactive:** read-only (generated reference).
- `/forms/[slug]` — Public form renderer for a published form definition (schema-driven fields). **CRUD/interactive:** `PublicFormSubmit` + server action `submitFormAction` (inserts a submission).
- `/proposals/[token]` — Public proposal viewer (block-rendered) with signature block + view analytics. **CRUD/interactive:** `SignatureBlock` (e-sign / accept) + view tracking; share-link token resolution.
- `/proposals/heat` — Hard-coded "Miami HEAT × Agora" pop-up activation demo proposal (`HeatProposalView`). **CRUD/interactive:** read-only demo (static showcase).
- `/offer/[token]` — Public offer-letter viewer; cookie-gated by access code. **CRUD/interactive:** server actions — accept / decline / countersign (signature); links to MSA signer if active.
- `/msa/[token]` — Public Master Service Agreement document viewer; cookie-gated by access code. **CRUD/interactive:** `SignForm` server action (sign / countersign MSA).
- `/share/[token]` — Public unauthenticated share-link landing (viewer/commenter); verifies + consumes share token. **CRUD/interactive:** mostly placeholder — renders a "shared resource" card for resource types whose public renderer isn't wired yet (`share_links` is a primitive); token verify/consume only.
