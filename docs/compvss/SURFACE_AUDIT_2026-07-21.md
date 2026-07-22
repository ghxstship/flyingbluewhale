# COMPVSS surface audit — detail pages, view-engine migration, CRUD (2026-07-21)

Line-by-line audit of every `/m` surface (3 parallel auditor passes) for: (a) the
advanced view-options toolbar (`NormalizedList`/`ActionBar`), (b) detail pages /
dead row-taps, (c) stubs & missing CRUD. This records what was remediated and the
precise spec for the remainder.

## ✅ Remediated this pass

- **Hub launchers deleted** → drawer/hub lands straight on the first role-visible
  member (no launcher, no redirect). `loading.tsx` added to 26 sidebar/hub routes
  (fixes the load-lag + Finance "won't open"). Pill vertical-stretch fixed
  (`.chips` `align-items`).
- **Projects module CRUD** — `projects/actions.ts`: `setTaskState` /
  `setMilestoneState` / `setEventState` (enum-guarded), `reassignTask`,
  `archiveTask`; wired into each RecordDetail (canManage-gated, RLS read-back for
  honest permission errors). Create stays console-side (XPMS spine authoring).
- **Marketplace detail** — `.mcard` opens a RecordDetail (photo gallery, full
  description, price/condition/seller); seller actions moved in.
- **Jobs detail** — gig card opens a RecordDetail (org/type/rate/when/applicants +
  cert/tag chips + Apply).
- **Punch List migrated** to `NormalizedList` (`PunchListView.tsx`) — search +
  drawers + typed pills (project) + list/table/board; rows open `/m/punch/[id]`.
  **This is the migration template for the remainder below.**
- **Aurora** dead "Attach" button removed; **Jobs** stale "placeholder" comment fixed.

## ✅ View-engine migration — DONE (all 10 surfaces)

All migrated onto `NormalizedList` (search + View Options / Share & Export drawers
+ context pill + list/table/board/calendar/gallery), server page signs photos +
resolves names + preformats dates → client `*View.tsx`. Pills are all **context**
fields, never status (repo canon):

| Surface | View | statusField | pill | detail-tap |
|---|---|---|---|---|
| **Snags** | SnagsListView | item_state | project | → /m/punch/[id] (shared store, org-scoped) |
| **Lost & Found** | LostFoundListView | incident_state (Held/Claimed) | location | none (no detail route — faithful) + gallery view |
| **Safety Briefings** | BriefingsListView | briefing_state | project | → /m/briefings/[briefingId] + calendar view |
| **Shift Handover** | HandoverListView | post_state | author | none (rows were static) — photos signed |
| **Purchase Requests** | RequisitionsView | requisition_state | none | none; numeric estimate sortable |
| **Daily Log** | DailyLogView | log_state | none | calendar default; inline draft-submit kept |
| **Mileage** | MileageView | — | none | table default; numeric miles sortable |
| **Chain of Custody** | CocView | — | catalog_kind | timeline preserved via `listWrapClassName="tl"` |
| **Onboarding** | OnboardingView | assignment_phase | none | → /m/onboarding/[assignmentId]; live-packet banner kept above |
| **Timesheets** (`/m/timesheets`) | TimesheetsView | state | none | confirmed distinct from `/m/time-sheets`; inline submit kept |

`connections` (My Network) left as-is — bespoke 3-section view with its own search;
maps poorly to a single NormalizedList, low value.

## ✅ Marketplace CRUD — DONE (edit + buyer contact)

- **Edit listing** — `updateListing` (case-tolerant condition parse; photos only
  replaced when re-attached; category left untouched since the form doesn't collect
  it; `.is("deleted_at", null)` guard). "Edit" action on `isMine` in the
  RecordDetail opens the `listing` form pre-filled.
- **Buyer → seller contact** — `contactSeller(listingId)`: resolves the seller
  server-side from the listing (never trusted from the client), then reuses the
  existing `findOrCreateDirectRoom` helper — the SAME one `/m/inbox`'s New DM uses,
  which creates the 2-party room under the **creator-bootstrap** RLS path the
  hardened `chat_room_members` policy already permits (no RLS change needed; the
  earlier "blocked" read was over-cautious — the buyer is the room creator, both
  parties are in the same org, and listings are org-scoped). A "Message Seller"
  action on non-own listings opens/reuses the DM and navigates to
  `/m/inbox/[roomId]`; the buyer writes the first message, so nothing is fabricated.

## ✅ P0 — RBAC verification + create-only CRUD (2026-07-22)

**RBAC: zero holes.** Four write actions had neither a role check nor an
ownership reference in the action body. All four cleared on inspection — the
guards live below the action, which a mechanical scan can't see:
- `submitTimesheet` → the `submit_timesheet` SECURITY DEFINER RPC explicitly
  checks `parties.auth_user_id = auth.uid()`, locks the row, and gates on
  submittable states. Correct.
- `moveAssetCustody` → `isManagerPlus(session) || can(session, "asset:custody")`.
- `redeemTicket` → `redeem_event_ticket` RPC.
- `moveIncident` → **no app-level gate BY DESIGN**, mirroring the console
  exactly (RLS grants crew alongside managers). The open question — "may the
  crew member who filed it also close it?" — is flagged in `incident-fsm.ts`.
  A policy decision, not a hole; tighten it there and both shells follow.

**CRUD: the six create-only records, resolved.**

| Record | Was | Now |
|---|---|---|
| **mileage** | insert only | edit + delete, owner-pinned (`user_id`), shared distance sanity so a fix can't become a typo the create refuses |
| **expenses** | insert only | correct (amount + date) + withdraw, owner (`submitter_id`) AND settle-state (`pending\|rejected`) guarded. Edit is deliberately narrow: `description` is stored composed and `category_code` is a finance-owned ref code — neither is safe to round-trip |
| **requisitions** | insert only | withdraw, owner + `draft\|submitted\|rejected`. No edit: a requisition is a structured document — correcting it is withdraw-and-re-raise |
| **snags / punch** | *(not actually a gap)* | worked via a cross-shell import of the console action; FSM extracted to `src/lib/db/punch-transition.ts`, both shells now thin wrappers |
| **lost-found** | insert only | Mark Claimed via the SHARED incident FSM (`transitionIncident(..., "closed")`) — not a bespoke write |
| **handover** | insert only | **unchanged, by design** — a shift handover is a point-in-time record; editing it after the fact undermines the trail |

Every one of these also gained the RecordDetail it lacked, so the detail gaps
for mileage / expenses / requisitions / lost-found closed with the same work.
Each write reads the row back, so an RLS- or state-refused write surfaces an
honest message instead of a silent success, and settled records hide their
actions rather than offering-then-refusing them.

## ✅ P1 — remaining detail views, resolved (2026-07-22)

Checked each against one rule: **a detail that only re-shows the row is
decoration, not a fix.** Verified per surface against what the page actually
fetches vs. what the row renders.

| Surface | Finding | Action |
|---|---|---|
| **daily-log** | `notes` — the site log everyone writes — was fetched and **never displayed** (the row line is weather-only; notes were used just as a 60-char fallback) | **Built.** Row opens the log: weather + full notes, plus the draft-submit action. Search now covers notes |
| **handover** | Row already renders the COMPLETE record — full summary (pre-wrap), open items, assets/keys, photos, author, relief, date | **No detail.** Nothing is hidden; an overlay would be decoration |
| **timesheets** | Row shows everything the page fetches (period, state, total, billable) | **No detail.** The genuinely useful addition would be a per-day *entries breakdown* — a new query and a feature, not a detail gap. Logged as a future idea, not shipped as padding |
| **connections** | Rows show all fetched data (name, role) and carry explicit accept/decline/connect buttons; plain `.item`, so no false affordance | **No detail.** Directory is the person-record surface; a thin overlay here would duplicate it |

Same standard already applied to `catalog` (Request is the action) and `coc`
(append-only events where the row *is* the record).

## ✅ Data-point lifecycle audit — dead WRITES + dropped INPUTS (2026-07-22)

The inverse of the dead-read pass: every column a /m action writes was checked
for a read path, and every zod-parsed form input for a write path. Findings, all
built out (never deleted):

| Data point | Was | Now |
|---|---|---|
| incidents `anon` (Submit Anonymously) | **parsed and dropped — reporter_id stamped anyway.** The UI promised an anonymity the NOT NULL column made impossible | migration `20260722210000`: reporter_id nullable; anon filing records NO identity on the row. Known limit (in-code): photo storage paths still carry the uploader's prefix |
| incidents `when` (Time Of Incident) | dropped — occurred_at = filing moment | composed onto the stated time; straddles midnight → yesterday |
| incidents `injury` switch | latent bug: switches serialize `"false"` (truthy) → toggled-then-untoggled read as ON | strict string match (shared `switchOn`) |
| expenses `billable` (Billable To Client) | parsed and dropped — no column existed | column added, written, filterable field + detail row |
| expenses `expense_type` (scanner intake) | written, never read | shown as Type on the record |
| job_postings `shift_starts_at/ends_at` | written by postJob, every card hardcoded "Open now" | cards show the real shift window |
| job_postings `gear_required` | written, never read | Gear Required on the gig detail |
| assignments `fulfilled_by/via` | written by check-in scan, never selected | in DETAIL_SELECT + provenance chip on the console assignment detail |
| catalog_item_gtins `bound_by/at` | written by the GTIN binder, never read | Bound Barcodes section (code · when · who) on the console catalog detail |
| time_entries `source_channel` | written, never read | non-`app` provenance badged on /m/time (Entered By Manager / Corrected / Imported / Offline Replay) |

Post-fix: dead reads 0 · dropped inputs 0 · remaining dead-write candidates are
tool false-negatives (FK filter reads, `select("*")` helpers, concatenated
select constants) — each hand-verified.

## ✅ Normalization / a11y / privacy / security / SSOT wave (2026-07-22)

Six fixer agents + orchestrator swept every `/m` surface, the shared kit, and
`src/lib/mobile` line by line across six dimensions. 114 files, all violations
resolved in-wave (nothing deferred). Highlights, by severity:

**Security / privacy**
- check-in `importScanToBudget` accepted an arbitrary client `receiptPath` into
  `expenses.receipt_path` (cross-tenant evidence pointer) → prefix-validated to
  `field-scans/{orgId}/{userId}/`.
- Approval decision/escalation pushes carried NO `kind` → bypassed the
  notification opt-out matrix with no switch to find. New `approval` PushKind
  across all three taxonomy mirrors + catalog migration `20260722230000`.
- Emergency need-help push and timesheet-submission push identified people by
  raw email → display name (email fallback only when unset).
- `removeConnection` deleted by bare id → explicit two-party pin + read-back.
- Marketplace `markSold`/`withdraw` wrote blind → read-backs (RLS refusal
  surfaces honestly), `deleted_at`-guarded.

**RBAC display** — `HubChrome canManage` hardcoded `true` on inventory,
advances, catalog, scheduler (crew saw manager-only hub links; scheduler's
capability-granted members likewise) → threaded from `isManagerPlus(session)`.

**Correctness** — schedule live-bar dead branch (`e.state === "live"` never
matched a title-cased value); crew catalog listed inactive SKUs whose Add To
Request dead-ends (`.eq("active", true)`); notification toggles revalidated the
surface's OLD route; requisitions quote-upload warning was silently dropped;
lost-found/handover partial-photo warnings surfaced; kit-switch `"false"`-is-
truthy hardening; AvatarField `createObjectURL` leaked per render → effect-managed.

**i18n (international)** — the systemic bug: tone/order maps keyed on ENGLISH
labels while `stateOf()` translates → under any non-en locale badges fell to
neutral and boards broke. All 8 affected views re-keyed on raw states (en output
byte-identical). Notification matrix rows re-keyed by stable id so labels can
translate without breaking the wire contract. Emergency codes converted to a
`getEmergencyCodes(t)` factory (50 keys; deep-link anchors now locale-stable).
Hundreds of chrome strings wrapped across projects/*, settings, documents/new,
companies, directory, mileage/new, finance, advances, plus loading skeletons.

**Accessibility (WCAG 2.1 AA)** — FormScreen: real label↔control association
(`htmlFor`/`id`) for every field type, keyboard-reachable photo/file/avatar
pickers (were `display:none`), seg groups + `aria-pressed`, `aria-required`;
`KIcon` now `aria-hidden` (silences every decorative icon); DataTable
`scope="col"` + keyboard row-tap parity (tabIndex + Enter/Space, table
semantics intact); SwipeRow accessible-name fix; ActionBar labeled search/clear;
~50 form controls associated across snag/daily-log/roster/settings/check-in
forms; drawers/toggles `aria-expanded`/`aria-pressed` throughout.

**SSOT / 3NF** — `toneToBadge()` kit helper replaces 9 copy-pasted ternaries;
incident tone canon in `incident-states.ts` (list and detail previously painted
the SAME state different colors); advances `_shared.ts` (KIND_ICON/STATE_TONE/
state-prettifier were triplicated); time-sheets quick pill de-statused (pills
are never status) → worker context.

**Deliberate canon (not violations)** — the kit is i18n-provider-free BY
CONTRACT (callers pass translated labels; kit-internal English defaults +
aria-labels remain — wiring `useT` into primitives would break provider-free
consumers). Push payload copy is server-side English repo-wide. Stored display
values (`project_tasks.task_state` etc.) are data, not chrome — translating
them is a data-model decision. `emergency` maps links are fixed-host + escaped.

## Notes

- No `alert()`, `onClick={() => {}}`, "not implemented", or fabricated-data
  surfaces remain in `/m` (the two dead card-taps — Market, Jobs — are fixed).
- ~~The migrations are mechanical but each needs a verified server/client split;
  they're batched here so a focused follow-up can land them against this spec.~~
  **RESOLVED (2026-07-22):** all 11 migrations (the 10 batched + punch, the
  template) landed and the split is mechanically verified per surface — every
  `page.tsx` is a server component owning the fetch (session + query + photo
  signing + name resolution + date preformatting), every `*View.tsx` is a
  `"use client"` leaf wrapping `NormalizedList`. Each landing passed the full
  gate (tsc · vitest · eslint), and the normalization wave above re-audited
  all of them line-by-line afterward (a11y, i18n raw-state keying, SSOT).
  Nothing from this note remains outstanding.
