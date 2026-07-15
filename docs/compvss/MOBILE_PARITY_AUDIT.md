# COMPVSS Mobile Self-Sufficiency Parity Audit

**Date**: 2026-07-15 · **Scope**: `src/app/(mobile)/m/**` vs `src/app/(platform)/studio/**`
**Question**: can every role complete 100% of their work on COMPVSS with no desktop session?
**Answer today**: no. Not one role can.

Every claim below cites the file that proves it. Nothing is reported closed or nonexistent without evidence.

---

## 0. Surface asymmetry (the baseline fact)

| Shell | Pages | `actions.ts` (mutation surfaces) |
| --- | --- | --- |
| `(platform)` /studio | 791 | 327 |
| `(portal)` /p | 152 | — |
| `(mobile)` /m | 54 | 25 |

COMPVSS carries 6.8% of the console's pages and 7.6% of its mutation surfaces. That ratio is not itself a defect (the field does not need a chart of accounts), but it bounds the answer: the console is where the platform's work actually happens.

---

## 1. Roles, derived from the codebase

Three orthogonal role axes exist. All are sourced from `src/lib/supabase/types.ts`.

### 1.1 `PlatformRole` — org-level, one per (org, user) · `types.ts:8`

```ts
export type PlatformRole = "owner" | "admin" | "manager" | "member";
```

### 1.2 `ProjectRole` — project-level, one per (project, user) · `types.ts:12`

```ts
export type ProjectRole = "lead" | "editor" | "contributor" | "viewer" | "vendor";
```

### 1.3 `Persona` — session-derived, drives shell + capability · `types.ts:32`

```
visitor · guest · owner · admin · manager · member
collaborator · contractor · crew · client · viewer · community
```

Adjacent taxonomies, out of COMPVSS scope but relevant to the exit test: `PortalPersona` (15 sub-personas, `nav.ts:1171`) is the GVTEWAY portal axis; `GuidePersona` (10, `src/lib/guides/types.ts:6`) skins event guides and **is** consumed by mobile at `m/guide/page.tsx:43`.

### 1.4 The structural finding: COMPVSS collapses all of it into two bands

The mobile tree contains exactly **one** role gate. `grep -rn "isManagerPlus|isAdmin|isOwner" src/app/(mobile)/` returns only `isManagerPlus` call sites:

- `m/more/page.tsx:33` — hides the Approvals row
- `m/requests/actions.ts:30, :80` — gates the two decision actions
- `m/tasks/[taskId]/{page.tsx:112, actions.ts:44}` — transition gate (manager+ **or** assignee)
- `m/advances/[assignmentId]/actions.ts:29` — fulfillment gate

**There is no `isAdmin` or `isOwner` call site anywhere in `(mobile)`.** `isManagerPlus` (`src/lib/auth.ts:306`) tests membership in `MANAGER_BAND_ROLES`, so owner, admin, and manager are indistinguishable on mobile, and collaborator/contractor/crew/viewer are indistinguishable from member.

`mobileTabs` (`nav.ts:1600`) is a single flat bar for every human. The persona-routed `/m/[role]` model was deliberately retired (`nav.ts:1711-1714`, KIT_CANON). That was a sound simplification for *crew*; it is why owner and admin have **no field surface at all**.

### 1.5 Field responsibilities per role

| Role | Core field responsibility | Has a COMPVSS surface for it? |
| --- | --- | --- |
| **owner** | Org config, billing, invites, roles, audit | **None.** Zero admin surface (A1) |
| **admin** | Members/invites, catalog, zones, integrations, exports | **None.** Zero admin surface (A1) |
| **manager** (crew lead, supervisor) | Approve, assign, triage incidents, move assets, clear queues | Partial: time-off + swaps + task transitions + advance fulfillment only |
| **member / crew** | Punch, scan, file, request, consume the plan | Best-served band, still gapped: no expense, no shift view, no photo |
| **contractor** (persona → portal `vendor`) | Deliver, receive, sign, invoice | Portal-served; COMPVSS gives them the crew bar |
| **collaborator** | Co-produce with project write authority | Indistinguishable from member on mobile |
| **client / viewer / community / guest / visitor** | Read-only stakeholders | Portal/marketing shells; correctly out of COMPVSS scope |

---

## 2. Role × gap matrix

`●` blocked · `◐` partial or degraded · `○` not applicable to this role · blank = no gap

| # | Gap | owner | admin | manager | member/crew | contractor | collaborator |
| --- | --- | :-: | :-: | :-: | :-: | :-: | :-: |
| G1 | Expense submit + receipt photo | ● | ● | ● | ● | ● | ● |
| G3 | Asset check-out/in custody + ledger | ● | ● | ● | ● | ● | ● |
| G6 | Own shift/call time (schedule is wrong data) | ◐ | ◐ | ● | ● | ● | ● |
| D3 | Photo capture faked (7 forms) | ● | ● | ● | ● | ● | ● |
| G36 | Offline mutations lose data | ● | ● | ● | ● | ● | ● |
| G22 | Timesheet submit/approve | ◐ | ◐ | ● | ● | ● | ● |
| G9 | Daily log submit/photo/sign | ○ | ○ | ● | ● | ● | ● |
| G5 | Goods receiving | ○ | ◐ | ● | ● | ● | ○ |
| G11 | Briefing / toolbox talk sign-in | ○ | ○ | ● | ● | ● | ● |
| G19 | Requisition create + approve | ◐ | ● | ● | ● | ● | ● |
| D2 | Time-off approve corrupts balances | ● | ● | ● | ◐ | ◐ | ◐ |
| D1 | Time-off decline is DB-rejected | ● | ● | ● | ○ | ○ | ○ |
| D4 | All field incidents land in Lost & Found | ◐ | ◐ | ● | ● | ● | ● |
| D8 | Crisis alerts never reach the field | ◐ | ◐ | ● | ● | ● | ● |
| G39 | Emergency is read-only (no declare/muster) | ● | ● | ● | ● | ● | ● |
| G2 | Approvals engine (`approval_instances`) | ● | ● | ● | ○ | ○ | ○ |
| G4 | Incident triage / close | ○ | ◐ | ● | ○ | ○ | ○ |
| G13 | Task create | ● | ● | ● | ● | ● | ● |
| G14 | My Work personal spine | ● | ● | ● | ● | ● | ● |
| G24 | Call sheet | ○ | ○ | ◐ | ● | ● | ● |
| G25 | Day sheets / run-of-show | ○ | ○ | ● | ● | ● | ● |
| G10 | Punch list (field snag) | ○ | ○ | ● | ● | ● | ● |
| G20 | IT & Facilities ticket | ● | ● | ● | ● | ● | ● |
| G15 | Start a DM / channel | ● | ● | ● | ● | ● | ● |
| G35 | Signature capture | ○ | ○ | ● | ● | ● | ● |
| G23 | Onboarding sign/upload steps | ○ | ○ | ○ | ● | ● | ● |
| G21 | Mileage capture | ○ | ○ | ◐ | ● | ● | ○ |
| G7 | Shift create/assign (no writer anywhere) | ● | ● | ● | ○ | ○ | ○ |
| G8 | Shift-swap request create | ○ | ○ | ○ | ● | ● | ● |
| G29 | Advance packet submission | ○ | ◐ | ◐ | ● | ● | ● |
| G12 | Guard tour / patrol execution | ○ | ○ | ● | ● | ○ | ○ |
| G30 | Dispatch runs | ○ | ○ | ● | ● | ● | ○ |
| G28 | Credential issue / bind at gate | ○ | ◐ | ● | ○ | ○ | ○ |
| G32 | Zone occupancy at the gate | ○ | ○ | ● | ◐ | ○ | ○ |
| G17 | Poll / survey respond | ● | ● | ● | ● | ● | ● |
| G16 | Announcement publish | ● | ● | ● | ○ | ○ | ○ |
| G27 | Own profile edit | ● | ● | ● | ● | ● | ● |
| G26 | Team roster CRUD | ● | ● | ● | ○ | ○ | ○ |
| G18 | Org admin (invite, roles, config, billing) | ● | ● | ◐ | ○ | ○ | ○ |
| G33 | Reports / exports | ● | ● | ● | ○ | ○ | ○ |
| G34 | Safeguarding / RAMS / SOP / ERP / threats | ◐ | ◐ | ● | ● | ● | ● |
| G31 | Permit check | ○ | ◐ | ● | ● | ● | ○ |
| G40 | OSHA classification (unwritable anywhere) | ◐ | ● | ● | ○ | ○ | ○ |

**Read of the matrix**: owner and admin are blocked on nearly every row that is theirs, because COMPVSS has no admin surface class at all. Manager is the most-blocked *working* role: the app pushes them approvals it cannot let them clear. Crew — the band COMPVSS was built for — is still blocked on the two things a phone is uniquely good at: photographing a receipt and photographing an incident.

---

## 3. Ranked gap register

Score 1-5 per axis. **Impact = criticality + frequency + breadth + workaround cost** (max 20).
`Crit` = blocks work on-site with no laptop · `Freq` = how often · `Brd` = roles affected · `Wk` = workaround cost today.

### 3.1 Shipped defects (mobile code is wrong, not merely absent)

These are not parity gaps. They are live bugs, all personally verified against source.

| ID | Defect | Crit | Freq | Brd | Wk | **Impact** | Effort | Evidence |
| --- | --- | :-: | :-: | :-: | :-: | :-: | :-: | --- |
| **D3** | **Photo capture is faked across 7 forms.** The kit's `photo`/`file` control is a button that increments an integer: `onClick={() => setValue(((value as number) \|\| 0) + 1)}` and renders "N photos added". No `<input type=file>`, no camera, no upload. The incident form serializes `photo: 2` into FormData; the action hard-codes `photos: []`. A worker documenting an injury sees "3 photos added" and stores zero. Silent evidence loss on a safety surface. | 5 | 4 | 5 | 4 | **18** | M | `components/mobile/kit/FormScreen.tsx:175-181`; specs at `kit/forms.ts:68,81,93,163,190,248,257`; `m/incidents/new/page.tsx:21-24` → `m/incidents/actions.ts:66` |
| **D2** | **Mobile time-off approve corrupts balances.** Plain `UPDATE ... request_state='approved'`, bypassing the `approve_time_off_request` SECURITY DEFINER RPC. No balance decrement, no `pending` guard. Desktop explicitly forbids this fallback and says why in a comment. `/m/time-off/page.tsx:59-64` then renders the stale balance to every member. | 4 | 3 | 5 | 5 | **17** | S | `m/requests/actions.ts:43-52` vs `studio/workforce/time-off/actions.ts:49-65`; guard `src/lib/approve-time-off.test.ts` |
| **D4** | **Every field-filed incident lands in Lost & Found.** Lost & Found is the honest lens `incidents WHERE injury_type IS NULL` (`safety/lost-found/page.tsx:56`). `fileIncident` never sets `injury_type` — the injury switch only appends the string "Injuries involved." to the description. 100% of field incidents, injuries included, pollute the Lost & Found queue. | 4 | 4 | 5 | 3 | **16** | S | `m/incidents/actions.ts:47-53,56-67`; `m/incident/actions.ts:30-38` |
| **D8** | **Crisis alerts never reach the field.** `createCrisisAlertAction` inserts `crisis_alerts` and stops — no `notifications` row, no `sendPushBulk`. `/m/alerts` has a `KIND_TONE` map with `crisis`/`emergency`/`alert` entries that nothing ever produces. Console declares a crisis; the field is never told. Same for major-incident. | 5 | 2 | 5 | 4 | **16** | M | `studio/safety/crisis/new/actions.ts:23-38`; `m/alerts/page.tsx:22-32,77-83`; `studio/safety/major-incident/new/actions.ts` |
| **D9** | **"Scan To Check Out / In" cannot check out or in.** The CTA prompts for an asset tag (`placeholder "e.g. R7-014"`) and posts to `/api/v1/scan` → `scanAssignment`, which only reads `assignment_scan_codes`/`assignments`. An `assets.asset_tag` is not an `assignment_scan_codes.code`, so it returns `not_found`. | 3 | 4 | 5 | 3 | **15** | S (relabel) / L (wire) | `m/inventory/InventoryView.tsx:261-267` → `inventory/scan/InventoryScanner.tsx:62` → `lib/db/assignments.ts:260-320` |
| **D1** | **Time-off decline is rejected by the database.** Mobile writes `request_state: "declined"`; the CHECK allows only `pending\|approved\|denied\|cancelled`. Every decline raises 23514 and surfaces the raw Postgres error. Desktop and the push-action route both write `"denied"`. A field manager cannot deny time off at all. | 5 | 3 | 2 | 4 | **14** | S | `m/requests/actions.ts:14,46` vs `supabase/migrations/20260606230000_baseline.sql:2979`; `studio/workforce/time-off/actions.ts:71` |
| **D7** | **Every "pending approvals" count is structurally always 0.** `approval_instances.state` CHECK has no `pending` value (`initiated\|in_review\|escalated\|approved\|rejected\|returned\|closed\|cancelled`); `routeToApprovals` inserts `initiated`. Three surfaces query `.eq("state","pending")`. The approvals tile, home strip, and nav badge are permanently empty. **Fix before porting approvals to mobile or the port inherits a dead queue.** | 3 | 4 | 4 | 3 | **14** | S | `baseline.sql:6407`; `lib/approvals/queries.ts:11-20`; `lib/approvals/route.ts:76`; callers `studio/my-work/page.tsx:49`, `studio/page.tsx:133`, `lib/nav-counts.ts:86` |
| **D11** | **The one real upload path has zero callers.** `uploadPersonalDoc` is fully written (20MB, Supabase Storage, RLS-shaped path) and unreachable: no `/m/docs/new` route, no file input in `DocsView.tsx`, absent from nav and SITEMAP. `/m/docs` is download-only. CLAUDE.md documents `/m/docs/new` — the doc is wrong. | 3 | 3 | 5 | 3 | **14** | S | `m/docs/actions.ts:23-60` (only match repo-wide); `find m/docs` → no `new/` |
| **D5** | **Two dead quick actions ship on the COMPVSS home.** `/m/expenses` and `/m/swaps` both 404 — neither route exists, neither is in `mobileSurfaces`. Shown to every role on the primary screen. The sitemap guard missed them because `generate-sitemap.mjs` reconciles `nav.ts`, not hardcoded component hrefs. | 2 | 4 | 5 | 2 | **13** | S | `m/HomeShell.tsx:295-296`; `ls src/app/(mobile)/m/{expenses,swaps}` → absent |
| **D6** | **`/m/requests` leaks org-wide time-off reasons to non-managers.** Queries `time_off_requests` org-scoped with no `user_id` filter for non-managers; `manager` only gates the buttons. RLS permits the read (`is_org_member`), so there is no backstop. Reachable by any role via the home quick action, ⌘K, or direct URL. Desktop `my-work` filters correctly. | 3 | 3 | 5 | 1 | **12** | S | `m/requests/page.tsx:53-66`; `RequestsView.tsx:143`; `baseline.sql:38827`; contrast `studio/my-work/page.tsx:52` |
| **D10** | **`/m/punch` is the time clock, not the punch list.** Labeled "Punch" under Tools; `PHASE_PRIORITY_HREFS` floats it for `build`/`strike` as though it were the snag list. The actual punch list (`studio/punch/**`) is unreachable from the field. | 2 | 3 | 4 | 2 | **11** | S (rename) | `m/punch/page.tsx:31-50` (reads `time_entries`); `nav.ts:1641,1686,1688`; `nav.ts:653` |
| **D13** | **Avatar upload is a CSS-transform mock.** Crop/zoom/position `type="range"` sliders over a div, no file input. "Upload Photo" never reads a file. | 1 | 2 | 5 | 2 | **10** | M | `kit/FormScreen.tsx:96-128` |
| **D14** | **`lostfound` kit form is mounted nowhere.** Defined in `forms.ts:72`; no route mounts it; absent from `mobileSurfaces`. The console lens documents field crews filing through it. | 2 | 3 | 3 | 2 | **10** | S | `grep -rn lostfound src/` → single hit |
| **D12** | **`decideSwap` lacks the desktop's race guard.** Desktop predicates on `.in("swap_state",["requested","accepted"])` with a comment explaining it prevents concurrent approve+decline. Mobile updates unconditionally. Last-write-wins. | 2 | 2 | 2 | 2 | **8** | S | `m/requests/actions.ts:93-101` vs `studio/workforce/shift-swaps/actions.ts:35` |

### 3.2 Missing / degraded capabilities

| ID | Gap | Type | Crit | Freq | Brd | Wk | **Impact** | Effort | Evidence (desktop → mobile) |
| --- | --- | --- | :-: | :-: | :-: | :-: | :-: | :-: | --- |
| **G1** | **Expense submit + receipt photo.** The device with the camera cannot file an expense. `expenses.receipt_path` exists and **no surface in the entire repo writes it** — a desktop defect too. | MISSING | 5 | 5 | 5 | 5 | **20** | L | `studio/finance/expenses/new/`, `actions.ts:40` → absent |
| **G3** | **Asset check-out / check-in custody + movement ledger.** COMPVSS ships an "Assets" tab that reads `assets` once and can never write it. `asset_movements` is unwritable from the field. Compounded: `transitionAsset` refuses the member band (`"Only manager+ can move assets"`), so mobile custody needs a policy decision before it needs code. | MISSING | 5 | 5 | 5 | 5 | **20** | L | `studio/assets/actions.ts:38-45,47-112`; `lib/db/assets.ts:82-88` → `m/inventory/page.tsx:58` (read only, no `actions.ts`) |
| **G6** | **Own shift / call time.** `/m/schedule` lists org-wide `events` unfiltered by viewer, and treats every row as a shift. `shifts` is never queried on mobile. The GVTEWAY portal gives crew a real schedule; the field PWA does not. | DEGRADED | 5 | 5 | 5 | 4 | **19** | M | `studio/operations/schedule/page.tsx:144-176` (unions 6 stores); `p/[slug]/crew/schedule/page.tsx:12` → `m/schedule/page.tsx:49-54` |
| **G36** | **Every mobile mutation outside 5 endpoints loses data offline.** Time-off, handover, advances, incidents, market, docs are plain server actions with no queue. Fill a form with no signal → action throws → input lost. | MISSING | 5 | 4 | 5 | 4 | **18** | L | none of `m/{time-off,handover,advances,incidents}/actions.ts` import `lib/offline` |
| **G22** | **Timesheet submit/approve. Punch ≠ payroll.** `/m/clock` + `/m/punch` write `time_entries` only. No `timesheets` read or write on mobile. Punches never reach payroll from the phone. | MISSING | 4 | 4 | 5 | 5 | **18** | L | `studio/finance/timesheets/`, `[id]/actions.ts:27`; `lib/db/timesheets.ts` → absent |
| **G5** | **Goods receiving.** The most physical procurement act, at the loading dock, is desktop-only. Blocks 3-way match. | MISSING | 5 | 4 | 3 | 5 | **17** | M | `studio/procurement/receiving/{page,new,[id]}`, `new/actions.ts:25` → absent |
| **G9** | **Daily log submit / photo / sign.** Mobile has `saveDailyLog` only, hard-coded `log_state:"draft"`, no `[id]` route. The field authors the draft on site, then must find a desktop to submit it. | DEAD-END | 4 | 5 | 4 | 4 | **17** | M | `studio/operations/daily-log/[id]/actions.ts:38,89,190` → `m/daily-log/actions.ts` (save only) |
| **G11** | **Briefing / toolbox talk sign-in.** Desktop has the full attendance roll incl. `signature_path`, and its empty state promises "Crew acknowledges via mobile". No `/m/briefings` exists. An operator must proxy-sign every attendee by hand. | MISSING | 4 | 4 | 5 | 4 | **17** | M | `studio/safety/briefings/[briefingId]/actions.ts:9-107`, `briefings/page.tsx:95` → zero `safety_briefing` hits in `(mobile)` |
| **G19** | **Requisition create + approve.** The canonical "need it now from site" intake. Desktop's own One Front Door lists it as a Request. | MISSING | 4 | 4 | 4 | 5 | **17** | M | `studio/procurement/requisitions/{page,new}`, `actions.ts:24,236,240`; `CreateMenu.tsx:25` → absent |
| **G2** | **Approvals engine on mobile.** Zero `approval_instances` references in `(mobile)`. `/m/requests` is a hand-rolled two-table queue (time-off + swaps), not the engine. No generic approval can be decided from COMPVSS. Blocked by D7. | MISSING | 4 | 4 | 3 | 5 | **16** | L | `studio/governance/approvals/[id]/actions.ts:24`; `lib/approvals/**` → absent |
| **G10** | **Punch list (field snag).** The most field-native workflow in the domain, unreachable from the field. See D10 for the name collision that hides it. | MISSING | 4 | 4 | 4 | 4 | **16** | L | `studio/punch/{page,new,lists}`, `new/actions.ts:31` → absent |
| **G13** | **Task create.** Mobile is complete-only. (Completion itself is a non-gap: `[taskId]/actions.ts` has correct RBAC + journaling.) | MISSING | 3 | 5 | 5 | 3 | **16** | M | `studio/tasks/new/`, `actions.ts:25` → no `m/tasks/new/` |
| **G14** | **My Work personal spine.** No single "what do I owe / what owes me" view on mobile. Nearest is `/m/tasks` + `/m/time-off`. | MISSING | 3 | 5 | 5 | 3 | **16** | M | `studio/my-work/page.tsx` (unions 7 stores) → absent |
| **G20** | **IT & Facilities ticket.** The deskless worker is exactly who hits a broken radio or toilet. One of the 5 desktop One Front Door intakes. | MISSING | 4 | 3 | 5 | 4 | **16** | M | `studio/services/requests/{page,actions,[requestId]}`; `CreateMenu.tsx:28` → absent |
| ~~**G24**~~ | ~~**Call sheet.** Portal crew has it; the field PWA does not.~~ **CORRECTED 2026-07-15 — overstated.** The mobile home renders the next event as a shift card (`m/page.tsx:81` → `HomeShell.tsx` "Upcoming"). The real remainder is narrower: the portal lists the next **5** events + **5** day sheets, mobile shows **1** of each, and there is no dedicated call-sheet surface. Rescored as a depth gap, not an absence. | PARTIAL | 2 | 4 | 3 | 2 | **11** | S | `p/[slug]/crew/call-sheet/page.tsx:38` vs `m/page.tsx:81`, `HomeShell.tsx:331` |
| ~~**G25**~~ | ~~**Day sheets / run-of-show.** Kit 26 day sheets reach the portal, not COMPVSS.~~ **CORRECTED 2026-07-15 — wrong.** Day sheets **do** reach COMPVSS: `m/page.tsx:70-78` reads `day_sheets` filtered to `published`/`updated` (drafts correctly never reach crew) and `HomeShell.tsx:331-340` renders venue, crew call, doors, headline set, curfew, with an "updated" flag. The original finding cited "grep → `m/page.tsx` only" and I misread that as absence — `m/page.tsx` **is** the mobile surface. Only run-of-show detail (`studio/operations/ros`) is genuinely absent. | PARTIAL | 3 | 3 | 3 | 2 | **11** | M | `m/page.tsx:70-78`; `HomeShell.tsx:331-340` |
| **G39** | **Emergency is read-only.** No declare, no panic, no muster acknowledge, no mark-self-safe. The `CODES` array is static reference; rows render a `ChevronRight` that is not a link. | READ-ONLY | 5 | 2 | 5 | 4 | **16** | M | `studio/safety/crisis/new/`, `major-incident/new/` → `m/emergency/page.tsx` (no `actions.ts`, `:177`) |
| **G7** | **Shift create / assign / reassign — no writer in ANY shell.** `shifts.workforce_member_id` has no writer; the only write repo-wide is an attendance patch. Rows can only originate from seed/SQL. Root cause of G6/G8, not a mobile-only defect. | DEAD-END (cross-shell) | 4 | 4 | 3 | 5 | **16** | XL | sole write `api/v1/shifts/checkin/route.ts:95`; all other `from("shifts")` are `.select` |
| **G4** | **Incident triage / investigate / close.** Mobile is file-and-forget; list rows are not even links. The FSM `open→investigating→resolved→closed` is desktop-only. | MISSING | 4 | 4 | 3 | 4 | **15** | L | `studio/operations/incidents/actions.ts:17-67` → no `/m/incidents/[id]`; `IncidentsList.tsx:107` |
| **G15** | **Start a DM / channel.** Reply-only. The field can only talk in rooms someone on a desktop created for them. | MISSING | 3 | 4 | 5 | 3 | **15** | S | `studio/inbox/actions.ts:71,102` → `m/inbox/[roomId]/actions.ts` (`sendMessage` only) |
| **G35** | **Signature capture.** `SignaturePad` exists and is mounted only in offer/msa/personal shells. No field sign-off (delivery receipt, briefing ack, daily-log sign). | MISSING | 4 | 3 | 4 | 4 | **15** | M | `components/ui/SignaturePad.tsx` → no `(mobile)` consumer |
| **G23** | **Onboarding sign/upload steps are self-attest checkboxes.** Every `step_kind` (`read\|sign\|upload\|quiz\|course\|form`) renders as one badge + a MarkStepDone button; `completeStep` writes `progress[stepId]=true` with no artifact. Upload capability exists on mobile but is not wired into the step machine. | DEGRADED | 4 | 3 | 4 | 4 | **15** | M (upload) / L (sign) | `m/onboarding/[assignmentId]/page.tsx:92-113`, `actions.ts:15-60,64-98`; kinds at `baseline.sql:11103` |
| **G8** | **Shift-swap request cannot be created in ANY shell.** Both shells can *decide* swaps; neither can *file* one. All 5 `from("shift_swaps")` hits are select/update. | DEAD-END (cross-shell) | 3 | 3 | 4 | 4 | **14** | M | `studio/workforce/shift-swaps/actions.ts:15` (`decideSwap` only) |
| **G21** | **Mileage capture.** GPS is on the phone; `metersBetween` already exists in `lib/workforce.ts`. | MISSING | 3 | 4 | 3 | 4 | **14** | M | `studio/finance/mileage/{page,new}`, `actions.ts:24` → absent |
| **G12** | **Guard tour / patrol execution.** The console's empty state promises "mobile patrol scans them in order via /m/guard". `/m/guard` does not exist (retired role surface). `route: []` is inserted empty and has no editor anywhere. | MISSING (dangling ref) | 4 | 3 | 2 | 5 | **14** | XL | `studio/safety/guard-tours/page.tsx:88`, `new/actions.ts:46-55` → zero `guard_tour` hits in `(mobile)` |
| **G29** | **Advance packet submission.** `/m/advances` reads packets and renders a static card with no link and no submission grid. Zero `advance_submissions` hits in `(mobile)`. The only path is the GVTEWAY portal token URL. | MISSING | 4 | 3 | 4 | 3 | **14** | XL | kit 27 `/p/[slug]/advancing` → `m/advances/page.tsx:60-88,106-125` |
| **G30** | **Dispatch runs.** Zero `dispatch` hits in `(mobile)`. (Note `studio/production/dispatch` is a read-only derived board and is *not* the gap; `studio/transport/dispatch/**` is.) | MISSING | 4 | 3 | 3 | 4 | **14** | L | `studio/transport/dispatch/new/actions.ts`, `[runId]/edit/actions.ts:27,49` → absent |
| **G34** | **Safeguarding / environmental / threats / cyber-IR / BCDR / playbooks / RAMS / SOPs / ERPs.** Zero hits for each store under `(mobile)`. Safeguarding is the report type most needing discretion and immediacy, and it is desktop-only. `/m/docs` reads `deliverables`, not these. | MISSING | 4 | 2 | 4 | 4 | **14** | XL | `studio/safety/{safeguarding,environmental,threats,cyber-ir,bcdr,playbooks}/**`; doc types in `lib/documents/registry.ts` → absent |
| **G17** | **Poll / survey respond.** KIT_CANON claims `/m/polls` → `/m/feed`, but the feed reads only `recognition_posts` + `announcements`. The redirect target does not carry the function. Zero poll/survey hits in `(mobile)`. | MISSING (canon is wrong) | 2 | 3 | 5 | 3 | **13** | M | `studio/comms/{polls,surveys}/**`; `KIT_CANON.md:71` → `m/feed/page.tsx:13-14` |
| **G28** | **Credential issue / reissue / bind scan code at the gate.** `/m/wallet` is view-only. | READ-ONLY | 4 | 3 | 2 | 4 | **13** | M | `studio/people/credentials/new/actions.ts`, `asset-linker/actions.ts` → `m/wallet/page.tsx:46-78` |
| **G27** | **Own profile edit.** 334 lines of read-only profile; only links out. Cannot fix a phone number, uniform size, cert, or social link from the field. | READ-ONLY | 2 | 3 | 5 | 3 | **13** | M | `studio/people/[personId]/edit/actions.ts` → `m/profile/page.tsx` (no `actions.ts`) |
| **G16** | **Announcement publish.** `/m/feed` reads `published` announcements; `createPost` writes `recognition_posts` (kudos), not announcements. Manager+ cannot broadcast from the field. | READ-ONLY | 3 | 3 | 2 | 4 | **12** | M | `studio/comms/announcements/{new,[id],[id]/edit}/actions.ts` → `m/feed/actions.ts:19-28` |
| **G18** | **Org admin: invite, roles, config, billing, audit, integrations.** `settingsNav` carries ~45 items across 7 groups; `/m/settings` is entirely personal self-service. An owner on site cannot invite a member or change a role. | MISSING | 3 | 2 | 2 | 5 | **12** | XL (class) / S-M each | `nav.ts:1062-1160` → `m/settings/page.tsx:46-72`, `actions.ts:74` (`saveProfile` only) |
| **G32** | **Zone occupancy at the gate.** `/m/check-in` shows the last 8 raw scans; `/m/door` shows one listing's count. No zone occupancy — the one place it matters is standing at the gate. | MISSING | 4 | 3 | 2 | 3 | **12** | S | `studio/access-control/counts/page.tsx:54-75` → `m/check-in/page.tsx:21-28` |
| **G33** | **Reports / exports / documents.** Zero `/api/v1/exports` hits in `(mobile)`; no `@media print` under `.mobile-shell`. A field lead cannot pull a CSV of their own roster or open a doc-engine SOP. | MISSING | 2 | 3 | 3 | 3 | **11** | M / L | `lib/export/**`, `api/v1/exports/**`, `/studio/{documents,reports}` → absent; print CSS in 4 kits, not `kit-mobile.css` |
| **G38** | **`/m/coc` is not the console's Chain of Custody.** Console COC = `audit_log` over 7 `COC_TARGETS`, actor-attributed. Mobile = `assignment_events` only, no actor, no custody-transfer write. Same label, materially narrower data. | DEGRADED (name collision) | 3 | 2 | 3 | 3 | **11** | M | `studio/compliance/coc/page.tsx:24-80` → `m/coc/page.tsx:33-42` |
| **G40** | **OSHA classification unwritable anywhere.** `osha_classification`/`osha_recordable`/`days_away`/`body_part` are read-only across the whole repo; the desktop edit schema omits every OSHA column. The OSHA 300 log is populable only by direct DB writes. | DEAD-END (cross-shell) | 3 | 2 | 2 | 4 | **11** | M | `safety/incidents/[incidentId]/page.tsx:58-64`; `safety/osha/page.tsx:94`; edit schema `operations/incidents/[incidentId]/edit/actions.ts:11-18` |
| **G26** | **Team roster CRUD.** `/m/directory` actions are `tel:`/`mailto:` only. `teams`/`team_members` have zero mobile consumers. | READ-ONLY | 2 | 3 | 2 | 3 | **10** | L | `studio/people/teams/[teamId]/actions.ts:40-131` → `m/directory/DirectoryView.tsx:81-96` |
| **G31** | **Permit check.** Note: the register is reference-only (ADR-0014) — no operational permit store exists, so "verify a permit" is impossible on **either** shell. Mobile read access is the honest gap. | MISSING | 3 | 2 | 2 | 3 | **10** | M | `studio/compliance/permits/page.tsx:22-29,51-55` → zero `dim_permit` hits |
| **G37** | **`/m/onboarding` + 9 more surfaces unreachable from the More hub.** In `mobileSurfaces` but absent from `m/more`'s four groups; only reachable via ⌘K or a phase float. A new hire outside `advance`/`wrap` phase cannot find onboarding. Also affects `/m/punch`, `/m/incidents`, `/m/incident`, `/m/guide`, `/m/scan`, `/m/door`, `/m/check-in`, `/m/notifications`, `/m/advances`. | DEAD-END (nav) | 3 | 3 | 5 | 2 | **13** | S | `nav.ts:1663` vs `m/more/page.tsx:36-81`; `CommandPalette.tsx:313`; `nav.ts:1685,1689` |

### 3.2b Found during remediation (not in the original audit)

Both surfaced by building the thing, not by reading the code — recorded because an audit that only lists what it predicted is marking its own homework.

| ID | Defect | Crit | Freq | Brd | Wk | **Impact** | Effort | Evidence |
| --- | --- | :-: | :-: | :-: | :-: | :-: | :-: | --- |
| **D15** | **Crew cannot create a task, and cannot finish one assigned to them.** `tasks_insert` excluded the `member` band outright, so `/m/tasks/new` failed with `new row violates row-level security policy` the moment it existed. Worse, `tasks_update` excludes members too — while `m/tasks/[taskId]/actions.ts:44` explicitly permits the ASSIGNEE to transition state. So a manager assigning a task to a member gives them a UI that offers "Mark Done" and a database that refuses it. Latent only because no member-band user currently has a task assigned. Fixed in `20260715140000_tasks_field_rls` — members may create only as themselves, assigned to themselves, and may update only while it stays theirs. | 5 | 4 | 4 | 5 | **18** | S | policy read at `pg_policies`; caught by `e2e/compvss-field-loop.spec.ts` |
| **D16** | **"My Tasks" showed everyone's tasks, and hid the viewer's own.** `/m/tasks` ran `listOrgScoped("tasks", orgId)` with no assignee predicate: on the seeded org, 201 rows of which 2 were the viewer's. Because tasks with no due date sort last under `orderBy: due_at`, the viewer's own work fell past the list cap — the page named for them could not display them. The home widget one tap earlier counts "tasks assigned to me", so the list contradicted its own entry point. Same class as D6; RLS is `is_org_member`, so no backstop. | 4 | 5 | 5 | 3 | **17** | S | `m/tasks/page.tsx` vs `m/page.tsx:38`; guarded by `src/lib/mobile/personal-scope.test.ts` |

### 3.3 Structural / platform-hygiene findings

| ID | Finding | Impact | Effort | Evidence |
| --- | --- | :-: | :-: | --- |
| **S1** | **Role model collapse.** 4 platform roles + 12 personas resolve to 2 bands on mobile. There is no `isAdmin`/`isOwner` call site in `(mobile)`. Any admin surface added later has no gate to hang on. | High | S (add gates) | `grep -rn "isAdmin\|isOwner" src/app/(mobile)/` → zero |
| **S2** | **Guards certify tokens, not usage.** contrast (`contrast.test.ts:5-17`) recomputes declared `tokens.json` pairs; font-floor (`font-floor.test.ts:25`) only catches arbitrary Tailwind classes like `text-[10px]`. Both are blind to inline `style={{}}`, which is the dominant mobile authoring style. Counter-examples ship today: `DoorScanner.tsx:188` `fontSize: 12`, `kit-mobile.css:178` `font-size: 11px`. | High | M | `src/lib/theme/` |
| **S3** | **No tap-target guard exists.** The 44px floor is real and enforced in CSS (`kit-mobile.css:408-435`) but nothing tests it. Any inline-styled control silently drops below it. | Med | S | `ls src/lib/theme/` — 12 guards, none for tap targets |
| **S4** | **No outdoor/glare contrast tier.** AA 4.5:1 is the ceiling; direct sunlight needs more. No token tier exists for it. | Med | M | `tokens.json#contrast` (46 pairs, all AA) |
| **S5** | **Two offline queues, one banner.** Durable IndexedDB outbox (`lib/offline/outbox.ts`) for 5 fetch endpoints; a separate evictable localStorage queue (`lib/offline/queue.ts`) for server-action surfaces (chat, daily-log). One `SyncBanner` reports both. | Med | M | `lib/offline/{outbox,queue}.ts`; `SyncBanner.tsx:16-17` |
| **S6** | **3 of 5 queueable endpoints are phantoms.** `/api/v1/shifts/checkin`, `/api/v1/accreditation/scan`, `/api/v1/equipment/scan` are in `QUEUEABLE_ENDPOINTS` with no caller. `PUNCH_ENDPOINT` is the SW's legacy-row default yet unreachable. | Low | S | `outbox.ts:27-33` vs grep |
| **S7** | **No bulk primitive in the mobile kit.** `/m/check-in/batch` and `TasksList` each hand-roll multi-select; ActionBar/DataTable/GroupedList/SwipeRow have none. Every new bulk surface reimplements it. | Med | M | `m/check-in/batch/BatchCheckIn.tsx:51,59`; `m/tasks/TasksList.tsx:250` |
| **S8** | **Hover-only row feedback in the mobile data table.** `.dt tbody tr:hover td` — touch has no hover. The `.dt` table is `width:max-content` + `nowrap`, forcing two-handed horizontal scroll on a 5-inch screen. | Med | S / M | `kit-mobile.css:176-182` |
| **S9** | **Sitemap guard does not see hardcoded component hrefs.** `generate-sitemap.mjs` reconciles `nav.ts` against the filesystem, so D5's two 404s passed CI. | Med | S | `scripts/generate-sitemap.mjs` |

### 3.4 Quick wins (high impact, S/M effort)

Ranked. All are S unless noted.

| Rank | ID | Fix | Impact | Effort |
| --- | --- | --- | :-: | :-: |
| 1 | **D2** | Swap the plain UPDATE for the `approve_time_off_request` RPC. It is `SECURITY DEFINER` and callable as-is. | 17 | S |
| 2 | **D4** | Set `injury_type` in `fileIncident`/`quickFileIncident` instead of appending a string to the description. | 16 | S |
| 3 | **D1** | `"declined"` → `"denied"` in the two mobile Zod enums + the i18n label. | 14 | S |
| 4 | **D7** | `.eq("state","pending")` → `.in("state", OPEN_INSTANCE_STATES)` at 3 call sites. Unblocks G2/G14. | 14 | S |
| 5 | **D11** | Wire a form to the already-written `uploadPersonalDoc`. The fix is a form, not a feature. | 14 | S |
| 6 | **D5** | Point `/m/expenses` at G1 (or remove) and `/m/swaps` at `/m/requests`. | 13 | S |
| 7 | **D6** | Add `.eq("user_id", session.userId)` when `!manager` in `/m/requests`. | 12 | S |
| 8 | **G24** | Mount the call sheet on mobile. The portal version already reads `events` + `day_sheets`. | 16 | S |
| 9 | **G15** | Port `createChannelAction`/`startDmAction` to a `/m/inbox/new` route. | 15 | S |
| 10 | **G32** | Mount the zone-occupancy read at the gate. | 12 | S |
| 11 | **D9** | Relabel the check-out/in CTA to what it actually does, pending the G3 wire. | 15 | S |
| 12 | **D10** | Rename `/m/punch` to Time Clock; free the name for the real punch list. | 11 | S |
| 13 | **G37** | Add the 10 orphaned surfaces to the More hub groups. | 13 | S |
| 14 | **P02** | Remount `ScheduleSurface` on mobile (it ships today, portal-only) as a stopgap for G6. | 19 | S |
| 15 | **D12** | Add the `swap_state` race predicate. | 8 | S |
| 16 | **D14** | Mount the `lostfound` form. | 10 | S |
| 17 | **S3** | Add the tap-target guard test. | — | S |
| 18 | **S9** | Extend the sitemap guard to scan component hrefs. | — | S |

Items 1-7 are correctness fixes to shipped code. **They should land before any new surface is built** — several of the roadmap's targets would otherwise inherit a broken store (D7 → the approvals queue; D2 → balances; D4 → the incident lens).

---

## 4. Phased roadmap

### Sequencing rationale

The dependency graph has one dominant node: **capture**. Photo, file, signature, and GPS are prerequisites for expense (G1), incident evidence (D3), daily log (G9), onboarding (G23), briefings (G11), and delivery receipt (G5). Building any of those before the capture layer means building each one's uploader twice. So capture is Phase 1, immediately after the correctness fixes.

The second structural node is **offline durability** (G36). It is deliberately *not* last: every surface built in Phases 2-3 would otherwise ship a lossy submit path and need retrofitting. It moves to Phase 2 as a wrapper the later phases adopt for free.

**Design law for every phase**: this is not a shrunken console. Each item below specifies a mobile-native form. Field conditions assumed throughout — one hand, gloves, direct sun, intermittent LTE, a device that may be at 8% battery.

---

### Phase 0 — Stop the bleeding (1 sprint, S throughout)

**Rationale**: 14 shipped defects, all cheap, several silently corrupting data. Nothing else should be built on top of them.

| Item | Approach | Acceptance |
| --- | --- | --- |
| D2 | Call `approve_time_off_request` RPC | Approving decrements `time_off_balances`; a second approve of a decided row is refused; `approve-time-off.test.ts` extended to cover the mobile action |
| D1 | `"declined"` → `"denied"` | A manager denies time off from `/m/requests`; row reaches `denied`; requester is notified; no 23514 |
| D4 | Set `injury_type` from the injury switch | An injury-flagged field incident does **not** appear in `/studio/safety/lost-found`; a lost-property report does |
| D7 | `.in("state", OPEN_INSTANCE_STATES)` ×3 | The approvals tile, home strip, and nav badge show non-zero when an instance is `initiated` |
| D6 | `.eq("user_id", …)` when `!manager` | A member hitting `/m/requests` directly sees only their own rows; add an RLS-level backstop |
| D5 | Repoint/remove the two dead QAs | No 404 reachable from `/m` home; sitemap guard extended (S9) to catch hardcoded hrefs |
| D9, D10, D14, D12, D11 | Relabel, rename, mount, guard, wire | Each per its register row |
| S3, S9 | Add tap-target + href guards | CI fails on a sub-44px control or an unrouted component href |

**Exit**: `npm test` green with new guards; zero known data-corrupting writes on mobile.

---

### Phase 1 — The capture layer (2 sprints)

**Rationale**: the single highest-leverage unlock. The phone's advantage over the laptop *is* its sensors, and today they are faked. Blocks G1, G5, G9, G11, G23, G35, D3.

| Item | Mobile-native approach | Offline handling | Acceptance |
| --- | --- | --- | --- |
| **D3 → real photo capture** | Replace `FormScreen.tsx:175-181`. `<input type="file" accept="image/*" capture="environment">` for the one-tap path; thumbnail strip with delete; client-side downscale to ~1600px before upload (battery + data). Full-bleed shutter target, not a 44px button — a gloved thumb on a 5-inch screen wants the bottom third of the display. | Photos written to IndexedDB with the form payload; uploaded by the outbox on reconnect; thumbnails render from the local blob so the user sees their evidence offline. | Tap capture 3×, submit, `incidents.photos` has 3 storage paths. Airplane mode: same, deferred, visible in the sync banner, survives an app kill. |
| **D13 → real avatar upload** | File input behind the existing crop/zoom UI. | Queue. | Photo persists to storage. |
| **G35 → signature on mobile** | Mount `SignaturePad`. Landscape-hinted, full-width canvas, thick stroke (a gloved finger is a wide brush), Clear + Confirm as thumb-reachable bottom bar. | Sign offline, queue the artifact. | A briefing ack signed on mobile writes `signature_path`. |
| **D11 → wire `uploadPersonalDoc`** | `/m/docs/new` with the file input. | Queue. | A doc uploaded from the field appears in `/m/docs` and the console. |
**Exit**: no faked capture control remains in `components/mobile/kit/**`; a grep for the counter pattern returns zero.

**Moved to Phase 2 — S5 (unify the queues) + offline photo durability.** These were originally scoped here. They belong with G36 (universal offline), and doing them properly means changing `lib/offline/queue.ts` from a synchronous localStorage API to an async IndexedDB one, which ripples into every consumer (chat, daily-log, SyncBanner, useOfflineQueue). Bundling that with the capture rewrite would have put two independent risks in one commit and jeopardised the offline paths that already work. Capture is now real and online-verified; durability follows in Phase 2 as one deliberate change.

---

### Phase 2 — The daily field loop (3 sprints)

**Rationale**: what crew touches every shift. G6 is the sharpest: COMPVSS cannot tell a worker when and where they work — and the portal already can, which makes it a mount, not a build.

| Item | Mobile-native approach | Offline | Acceptance |
| --- | --- | --- | --- |
| **G6 + P02 — own shift** | Immediate: remount `ScheduleSurface` (ships today, portal-only) at `/m/schedule`, filtered to the viewer. Then: "Today" as a single glanceable card — call time, venue, role, meet point — in display type readable at arm's length in sun. Not a calendar grid. | Precache the next 7 days on last sync; stale badge. | A crew member sees their own call time offline; `/m/schedule` queries `shifts`, not org-wide `events`. |
| **G24 — call sheet** | The Today card's detail view. Tap-to-call every contact. | Cached. | Reachable offline from the home tab in ≤2 taps. |
| **G25 — day sheet / ROS** | Vertical now/next timeline anchored to current time, auto-scrolling. Not the console's horizontal grid. | Cached. | Crew reads the running order with no signal. |
| **G3 + D9 — asset custody** | Scan-first: camera scanner → asset → one thumb button, "Take" or "Return". The scan **is** the intent; no form. Writes `asset_movements`. **Policy decision required first**: `transitionAsset` refuses the member band — decide whether crew self-checkout is permitted, or whether custody requires a manager's device. | Queue via the existing outbox; the scan path is already queueable. | Crew scans a tag offline, takes custody, ledger row lands on reconnect. Resolve `assets.asset_tag`, not `assignment_scan_codes.code`. |
| **G9 — daily log** | Author → photo → sign → submit in one thumb-flow. Voice-to-text on the narrative field (gloves). | Queue whole. | Log reaches `submitted` from the field with photos + signature attached. |
| **G10 — punch list** | Photo-first snag: capture → pin location → assign → done. The snag *is* the photo. Requires D10's rename. | Queue. | A snag raised on site appears in `/studio/punch` with its photo. |
| **G13 — task create** | The one-tap "+" on the Tasks tab, minimal fields, assignee defaulted to self. | Queue. | Task created offline, syncs. |
| **G23 — onboarding steps honest** | Branch by `step_kind`: `upload` → the Phase 1 file input; `sign` → SignaturePad; `read` → scroll-to-end gate. Remove the blanket self-attest checkbox. | Queue. | A `sign` step cannot be completed without a `signature_path`. |
| **G8 + G7 — shift swap + assign** | G8: "Can't make it" on the Today card → swap request. G7 is XL and cross-shell (no writer exists in any shell) — desktop-first, then mirror. | Queue. | A crew member files a swap; a manager decides it on mobile (already works). |
| **G36 — universal offline** | Wrap every mobile server action in the outbox pattern established in Phase 1. | — | Airplane-mode submit on **every** `/m` form persists and drains. |

**Exit**: a crew member completes a full shift — see call time, punch, scan, take gear, file a snag with photo, log the day, sign out — with the device in airplane mode for the middle 4 hours.

---

### Phase 3 — The manager band (3 sprints)

**Rationale**: today COMPVSS pushes managers approvals it cannot let them clear. That is the worst state: notified, unable to act. Depends on D7 (Phase 0) — porting the engine before that fix would ship a permanently empty queue.

| Item | Mobile-native approach | Offline | Acceptance |
| --- | --- | --- | --- |
| **G2 — approvals engine** | One card per decision, swipe right approve / left reject, tap for detail. Not a table. `/m/requests` becomes a view over `approval_instances` rather than a hand-rolled two-table query. | Decisions queue; optimistic UI with rollback on conflict. | A manager clears a requisition, expense, and PO approval from the phone; each writes `approval_decisions`. |
| **G14 — My Work** | Port `studio/my-work`'s 7-store union as the Home tab's spine. | Cached. | One screen answers "what do I owe / what owes me". |
| **G1 — expense + receipt** | Camera-first: shoot the receipt, amount + category, done. OCR-assisted amount (reuse the ap-ocr path). Also fixes the desktop defect that `expenses.receipt_path` is written by no surface. | Queue with the image. | Crew photographs a receipt at a truck stop offline; expense + image land on reconnect; a manager approves it from the field. |
| **G19 — requisition** | The One Front Door "need it now" intake, mirrored from mobile's own advance-request form (which is already good). | Queue. | Raised from site, approved from site. |
| **G5 — goods receiving** | Scan the PO/delivery, tap received quantities, photo the pallet, sign. The dock is the most physical procurement act. | Queue. | Receipt lands; 3-way match unblocks. |
| **G22 — timesheets** | Period view over the punches already captured; submit as one action. Manager approves in the same swipe deck as G2. | Queue. | Punch → timesheet → approval completes without a desktop. |
| **G21 — mileage** | Start/stop trip using the GPS already wired for clock-in; `metersBetween` exists. | Log locally, sync. | A trip logged in a dead zone syncs whole. |
| **G20 — IT & Facilities** | Photo + one line + location. The deskless worker is exactly who finds the broken thing. | Queue. | Ticket filed from the field. |
| **G13/G15/G16/G17/G27** | Task create (P2), DM/channel start, announcement publish, poll/survey respond, profile edit. G17 also corrects `KIT_CANON.md:71`, which documents a redirect that does not carry the function. | Queue. | Each per its register row. |
| **S7 — bulk primitive** | One multi-select in the kit (long-press to enter selection, count in the ActionBar), adopted by check-in/batch, tasks, approvals. | — | Bulk-approve works on mobile; no surface hand-rolls selection. |
| **S1 — real role gates** | Introduce `isAdmin`/`isOwner` gates in `(mobile)` ahead of Phase 5. | — | Gates exist and are tested. |

**Exit**: a manager runs a full day — clear the approval queue, approve an expense and a timesheet, raise and approve a requisition, receive a delivery — with no desktop.

---

### Phase 4 — Safety and compliance depth (2 sprints)

**Rationale**: the highest-consequence, lowest-frequency work. Deliberately after capture and offline, because every item here needs a photo, a signature, or a submit that survives a dead zone. D3, D4, and D8 (Phase 0/1) are prerequisites: the evidence has to actually store before the workflow around it means anything.

| Item | Mobile-native approach | Offline | Acceptance |
| --- | --- | --- | --- |
| **D8 → G39 — crisis reaches the field** | `createCrisisAlertAction` fans out to `notifications` + `sendPushBulk`. `/m/alerts` already has the tone map written for `crisis`/`emergency`/`alert`. Then make `/m/emergency` actionable: declare, muster-acknowledge, mark-self-safe as full-width thumb targets, red, reachable from a locked-ish state, high-contrast for glare. | Alert cached on receipt; **acknowledge queues**. Assume the person is in a stairwell. | Console declares a crisis → every field device shows it within push latency. A worker marks self-safe from the phone. |
| **G4 — incident triage** | Make list rows links. Detail with state FSM as a bottom sheet, photos, comments. | Queue transitions. | An incident is filed, triaged, and closed without a desktop. |
| **G11 — briefing sign-in** | The deliverer opens the talk; crew signs in by scanning a rotating QR or tapping their name, then signs. Replaces one operator hand-keying an attendance roll. | Queue signatures. | 20 crew sign into a toolbox talk offline; roll reconciles on reconnect. |
| **G12 — guard tour** | Scan checkpoints in order; the console's own empty state already promises this. Requires a `route` editor, which exists nowhere. | Fully offline; a patrol is exactly a no-signal task. | A patrol completes offline and closes the tour. |
| **G32 — occupancy** | Live zone count on the gate screen, big figure. | Last-known + stale badge. | A gate lead reads occupancy while standing at the gate. |
| **G28 — credential issue/bind** | Scan the badge, bind the code, done. | Queue. | A badge is reissued at the gate. |
| **G38 — COC name collision** | Either widen `/m/coc` to the console's 7 `COC_TARGETS` with actor attribution, or rename the mobile surface to what it is (assignment history). Decide; do not ship both meanings under one label. | — | One definition of Chain of Custody across shells. |
| **G34 — safeguarding + RAMS/SOP/ERP** | Safeguarding: discreet, one-tap-from-anywhere, no confirmation theatre. RAMS/SOP/ERP: read-only, cached, searchable — the doc you need is the doc you have no signal to fetch. | Precache the active project's set. | A safeguarding report is filed discreetly from the field; the RAMS for today's task opens offline. |
| **G40 — OSHA classification** | Cross-shell defect: unwritable on desktop too (the edit schema omits every OSHA column). Fix desktop first, then mobile. | — | A recordable can be classified without a direct DB write. |
| **G31 — permits** | Read-only register. Honest scope: no operational permit store exists on either shell — do not imply verification. | Cached. | The register is readable on site. |
| **S4 — glare tier** | Add an outdoor contrast tier above AA to `tokens.json#contrast`; apply to gate/emergency/scan surfaces. | — | Guard certifies the new tier. |

**Exit**: every safety workflow completes on the device the worker is holding, in a dead zone, in the sun.

---

### Phase 5 — The admin tail (2 sprints)

**Rationale**: last, deliberately. Lowest frequency, highest complexity, and the roles it serves (owner/admin) are the most likely to have a laptop. But the exit test says *every* role, *including* edge-case admin tasks — and the honest position is that an owner on site today has literally zero admin surface. Depends on S1 (real role gates).

| Item | Mobile-native approach | Acceptance |
| --- | --- | --- |
| **G18 — org admin** | Do **not** port ~45 `settingsNav` items. Ship the ~8 that are plausibly urgent on site: invite a member, change a role, toggle a zone, flip a catalog item, view the audit tail, manage account managers, advancing presets, API keys. Each a single-purpose card. The rest stay console-only **by documented decision**, not by omission. | An owner invites a member and changes a role from the phone. |
| **G26 — team roster CRUD** | Add/remove member, change role — from the directory row's swipe action. | A crew lead adds a member on site. |
| **G4x — time-clock zones** | Geofence config for the mobile punch surface should not require a desk. Map-based, drag the radius. | A zone is retuned from the site it governs. |
| **G33 — reports/exports** | Not the console's `.rpt-grid` reflowed. A KPI-tile view of the handful of field-relevant reports + a share-sheet export (the phone's native share target, not a download). Add `@media print` under `.mobile-shell` for the 2-3 artifacts worth printing. | A field lead shares a roster CSV from the phone. |
| **G29 — advance packet submission** | Bring the kit 27 token flow into COMPVSS for authenticated crew; today `/m/advances` renders a static card and the only path is the GVTEWAY portal URL. | A packet submission completes in COMPVSS. |
| **G30 — dispatch** | Driver's run as a Today-card variant: stops, ETA, proof-of-delivery photo + signature. | A driver completes a run from the phone. |
| **G16/G17 remainder** | Announcement publish, poll authoring. | Per register. |
| **Documented non-goals** | Billing, chart of accounts, GL, subscriptions, RFQ/ITB authoring, org branding, integrations config, impersonation. **Record these in KIT_CANON as deliberate console-only**, with the reason. A documented non-goal is not a gap; an undocumented absence is. | KIT_CANON lists them with rationale. |

---

### Global exit test

> **Every role completes 100% of their workflows end to end on COMPVSS with no desktop session — from onboarding, through daily operations, to edge-case admin tasks.**

Operationalized as a per-role e2e suite (the repo's existing per-persona harness is the vehicle — see `docs/` e2e canon and the persona suites already running against prod):

1. **Per-role journey specs**, one per role from §1.5, each running the role's full arc:
   - **crew**: accept invite → onboard (read + sign + upload, real artifacts) → see call time → punch in → scan gear → take custody → file a snag with photo → file an expense with receipt → log the day → sign → punch out → request time off.
   - **manager**: everything crew does → clear the approval deck → approve an expense + timesheet → triage and close an incident → raise and approve a requisition → receive a delivery → deliver a briefing and collect signatures.
   - **admin**: → invite a member → change a role → retune a zone → read the audit tail.
   - **owner**: → the admin arc → plus whatever Phase 5 admits, with the documented non-goals explicitly asserted as console-only.
   - **contractor / collaborator**: their portal-adjacent arc, asserting the COMPVSS surfaces they legitimately need.
2. **The suite runs with the network disabled for a contiguous middle segment** of each journey. Any step that loses data fails the suite. This is the test that G36 exists to pass.
3. **A desktop-session tripwire**: the suite asserts no journey step requires a `/studio` or `/p` URL. Any redirect off `/m` mid-journey is a failure.
4. **A coverage manifest guard** (the pattern already used for e2e coverage in this repo): every role × workflow cell is either covered by a passing spec or listed as a documented console-only non-goal with a reason. **No blank cells.** This is what keeps the audit from silently rotting.
5. **Standing CI guards** from this audit: tap-target (S3), component-href sitemap (S9), no-faked-capture grep (Phase 1), inline-style contrast/font-floor coverage (S2), glare tier (S4).

The suite is the durable artifact. This document is a snapshot; the manifest is the thing that stays true.

---

## 5. Verified non-gaps

Recorded so they are not re-audited. Each was checked against source.

- **Offline plumbing is real, not a veneer**: service worker with IndexedDB outbox, FIFO-per-endpoint, background-sync plus a `QUEUE_DRAIN` fallback for iOS (`public/service-worker.js:26-32,160-234,259-307`; `lib/offline/outbox.ts:27-33,108-187`).
- **Camera barcode scanning is real**: `getUserMedia` + native `BarcodeDetector` with a `@zxing/browser` dynamic-import fallback, permission-gated (`components/scanners/CameraScanner.tsx:187-197,262-265`).
- **GPS is real**: clock-in captures geolocation when granted and degrades honestly when not (`components/mobile/useClockPunch.ts:43,58`).
- **44px tap floor is enforced in CSS** for buttons, `.tap`, inputs, selects, tabbar (`kit-mobile.css:408-435`) — though untested (S3).
- **`/m/door` refuses offline redeems honestly** — copy states "This scan was NOT recorded" (`m/door/DoorScanner.tsx:118-123,184-190`).
- **Assignment scanning has genuine parity**: `/m/scan` and `/m/check-in` post to the queueable `/api/v1/scan`; the console's `verifyAccessCode` uses the same `scanAssignment` resolver (`studio/access-control/actions.ts:14-27`).
- **Advance request authoring on mobile is arguably better than desktop's**: `m/advances/actions.ts:41` find-or-creates a catalog SKU and inserts an `assignments` row; desktop's `/studio/advancing/request` is a redirect handler.
- **Advance fulfillment transitions mirror the admin action exactly**: manager+ gate, `NEXT_FULFILLMENT_STATES` guard, CAS update, `assignment_events` row, inbox ping (`m/advances/[assignmentId]/actions.ts:27-69`).
- **Task state + comments**: correct RBAC (manager+ **or** assignee) and `task_events` journaling (`m/tasks/[taskId]/actions.ts:22,43-46,89`).
- **Time-off submit** is the better intake on mobile; desktop's CreateMenu only links to the list (`m/time-off/actions.ts:46-98` vs `CreateMenu.tsx:26`).
- **Handover** writes real rows + manager push (`m/handover/actions.ts`).
- **Record-ref chips in chat are at parity**: same `resolveRecordRefs` (`m/inbox/[roomId]/page.tsx:6,59`).
- **Notification preference matrix** is mobile-canonical; desktop has no equivalent (`m/notifications/{page,actions}`).
- **`/m/guide`** renders real persona-scoped `event_guides` (`m/guide/page.tsx:43-56`) and **`/m/emergency`** reads real assignment + evacuation data rather than fabricating a station (`m/emergency/page.tsx:55-81`).
- **No keyboard-only affordances** in the mobile tree — all `onKeyDown` are a11y Enter/Space handlers on `role=button` rows, not shortcuts.
- **Shift-swap decide works on mobile** (both enum values legal); **poll on the console**, RFQ/ITB/sourcing, billing/subscriptions are defensible console-only scope pending the Phase 5 documentation decision.

## 5b. Corrections to this audit

Kept in the document rather than quietly edited away — a register that only accumulates confirmations is marking its own homework.

| ID | Original claim | Reality | Why it slipped |
| --- | --- | --- | --- |
| **G25** | "Day sheets / run-of-show absent on mobile." | Wrong. `m/page.tsx:70-78` reads published day sheets and `HomeShell.tsx:331-340` renders them (venue · crew call · doors · headline set · curfew, plus an updated flag). Only run-of-show detail is absent. | The finding cited `grep day_sheets in (mobile) → m/page.tsx only` and I read "only" as "not really there". `m/page.tsx` **is** the mobile home. A grep hit is evidence *for* a surface, not against it. |
| **G24** | "Call sheet absent on mobile." | Overstated. The home renders the next event as a shift card. The genuine remainder is depth (1 event vs the portal's 5) and the lack of a dedicated surface. | Same root: judged from a grep count rather than reading the render path. |

Both were rescored (16 → 11) rather than deleted: a depth gap is still a gap, just not the one originally claimed. The lesson generalises — every remaining MISSING in §3.2 that rests on a grep count alone should be confirmed against the render path before anyone builds against it.

## 6. Unverified

Stated explicitly rather than assumed:

- ~~Whether `shifts` rows exist in the prod seed (would change G7 from "no writer" to "no *UI* writer"). Swept `src/` only.~~ **Resolved 2026-07-15**: 16 `shifts` rows exist in prod, none in the next 7 days. So G7 is confirmed as "no UI writer, seed-only rows" — the table is populated but nothing in any shell can create or assign a shift.
- Whether `assets.asset_tag` values are ever mirrored into `assignment_scan_codes` (would partially rescue D9). No code path does so; the live DB was not queried.
- Whether OSHA columns are seed-populated by design (G40).
- Whether the retired `/m/kudos` function was absorbed by `/m/feed` (`createPost` writes `recognition_posts`, which suggests yes, but the trace was not completed).
