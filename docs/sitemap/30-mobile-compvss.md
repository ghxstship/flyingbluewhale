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
