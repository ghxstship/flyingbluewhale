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
