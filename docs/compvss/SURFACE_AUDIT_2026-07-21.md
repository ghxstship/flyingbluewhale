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

## ▢ Remaining — view-engine migration (mirror `PunchListView.tsx`)

Each is a flat list rendered with plain `.item`/`.mcard` markup and no toolbar.
Pattern: split into a server `page.tsx` (fetch + sign photos + resolve names +
preformat dates) and a client `*View.tsx` (`NormalizedList` with `fields`,
`search`, `renderRow`, `onRow`, `statusField`+`statusOrder` for board, and a
context `pill` — **never status** per repo canon). Ranked by impact:

| Surface | File | statusField | pill (context) | notes |
|---|---|---|---|---|
| **Snags** (My) | `snags/page.tsx` | item_state | project | shares Punch's schema/FieldDefs (self-scoped twin) |
| **Lost & Found** | `lost-found/page.tsx` | incident_state (Held/Claimed) | location | gallery view fits (photos); add a search box |
| **Safety Briefings** | `briefings/page.tsx` | briefing_state | project | calendar view natural (scheduled_for) |
| **Shift Handover** | `handover/page.tsx` | post_state (all_clear/watch/issues) | severity | board by post_state |
| **Purchase Requests** | `requisitions/page.tsx` | requisition_state | (none/project) | numeric estimate sortable |
| **Daily Log** | `daily-log/page.tsx` | log_state | — | calendar default (log_date); keep inline draft-submit in renderRow |
| **Mileage** | `mileage/page.tsx` | — | — | table view (numeric); date=logged_on |
| **Chain of Custody** | `coc/page.tsx` | — | catalog_kind | timeline — pass `listWrapClassName="tl"`, keep the `.tl` renderRow |
| **Onboarding** | `onboarding/page.tsx` | assignment_phase | — | keep the live-packet banner outside the list |
| **Timesheets** (`/m/timesheets`) | `timesheets/TimesheetsView.tsx` | state | — | **naming collision** with the migrated `time-sheets/` — confirm both are intended before migrating |

`connections` (My Network) is a bespoke 3-section view with its own search box +
per-section actions; it maps poorly to a single NormalizedList (low value — its
inline search already covers the main need). Leave as-is or split per-section later.

## ▢ Remaining — Marketplace CRUD (beyond detail)

- **Edit listing** — add `updateListing(prev, fd)` (mirror `markSold`) patching
  title/price/condition/description/category/photos; an "Edit" action on `isMine`
  in the new RecordDetail opening the `listing` FormScreen pre-filled.
- **Buyer → seller contact** — thread `seller_user_id` into the `Listing` type,
  add a `contactSeller(listingId)` action that finds/creates a `chat_rooms` DM
  (buyer+seller members) and returns the room id → `router.push('/m/inbox/<id>')`.
  Deliberately NOT shipped as a stub — no fake "Contact" button ships until the DM
  is real.

## Notes

- No `alert()`, `onClick={() => {}}`, "not implemented", or fabricated-data
  surfaces remain in `/m` (the two dead card-taps — Market, Jobs — are fixed).
- The migrations are mechanical but each needs a verified server/client split;
  they're batched here so a focused follow-up can land them against this spec.
