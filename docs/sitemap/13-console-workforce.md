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
