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

## ✅ Marketplace edit — DONE · ▢ buyer-DM remains

- **Edit listing** — `updateListing` added (case-tolerant condition parse; photos
  only replaced when re-attached; category left untouched since the form doesn't
  collect it; `.is("deleted_at", null)` guard). "Edit" action on `isMine` in the
  RecordDetail opens the `listing` form pre-filled.
- **▢ Buyer → seller contact** — the one remaining item. Needs `seller_user_id`
  threaded + a `contactSeller` action that opens a `chat_rooms` DM. **Blocked on an
  RLS decision**: the chat_room_members INSERT policy (hardened, ADR-0008 Am.5)
  forbids self-service member-adds, so a buyer can't add the seller to a new room
  without a deliberate "marketplace contact" RLS path or a service-role bootstrap.
  Deliberately NOT shipped as a fake button until that path exists.

## Notes

- No `alert()`, `onClick={() => {}}`, "not implemented", or fabricated-data
  surfaces remain in `/m` (the two dead card-taps — Market, Jobs — are fixed).
- The migrations are mechanical but each needs a verified server/client split;
  they're batched here so a focused follow-up can land them against this spec.
