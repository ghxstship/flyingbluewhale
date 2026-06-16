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
