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

## Notes

- No `alert()`, `onClick={() => {}}`, "not implemented", or fabricated-data
  surfaces remain in `/m` (the two dead card-taps — Market, Jobs — are fixed).
- The migrations are mechanical but each needs a verified server/client split;
  they're batched here so a focused follow-up can land them against this spec.
