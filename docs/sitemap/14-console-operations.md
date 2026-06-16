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
