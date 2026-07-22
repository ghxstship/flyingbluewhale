# Lane B — Studio core (home, sales/CRM, projects, talent, marketplace, advancing, scheduler, documents, reports)

Read-only audit per `CHECKLIST.md`. Date 2026-07-22.

## 1. Coverage

**290 / 290 files walked (100%).** Scope: `src/app/(platform)/studio/` root files
(`page.tsx`, `EventSpine.tsx` — no `layout.tsx` exists at the studio root) plus the
module trees `assistant`, `copilot`, `dashboards`, `my-work`, `inbox`, `sales`,
`crm`, `clients`, `leads`, `proposals`, `projects/**`, `marketplace/**` (incl.
`talent`), `bookings` + `agency/**` (the Talent nav group: roster/tours/routing —
"tours" lives at `agency/tours`), `advancing/**`, `scheduler/**`, `documents/**`,
`reports/**`. All `.tsx`/`.ts` (pages, layouts, actions, client islands,
loading/error). Method: mechanical greps per class over the full list + page reads
for judgment classes. File list snapshot: 228 tsx + 62 ts.

## 2. Summary table

| Class | Findings | Files touched | Top offenders |
|---|---|---|---|
| TYPE | 6 | ~44 | 39-file pseudo-eyebrow pattern; `documents/page.tsx`; roster drawers |
| TOKEN | 2 | 5 | `documents/page.tsx` (`border-ink` dead class); proposal/branding seed hexes |
| GRID | 2 | 3 | `inbox/NewThreadControls.tsx` (z-30); doc/report viewer max-widths |
| COMP | 3 | 16 | dead `.data-table` ×3 (user-visible); hand-rolled `.ps-input` clones ×4; loading.tsx gaps ×9 modules |
| PAT | 2 | 2 | `documents/page.tsx` (no ModuleHeader); `projects/[projectId]/overview` dead duplicate query |
| VOICE | 1 | 2 | `documents/page.tsx` manual ALL-CAPS; box-office listing casing drift |
| A11Y | 1 | 2 | roster drawers: no Escape / focus trap |
| I18N | 2 | ~30 | marketplace/discounts, sales/beos, sprints, documents, assistant composer |
| NAV | 0 | 0 | — |

## 3. Findings

| # | Class | Path:line | Rule | Suggested fix | Effort | Risk |
|---|---|---|---|---|---|---|
| T1 | TYPE | 39 files (list below), e.g. `bookings/deals/[offerId]/page.tsx:108` | Eyebrows/section overlines have one home: `.eyebrow` (Space Mono, tracked); tracking lives in `--p-heading-ls`/`--p-tracking-*`, never hand-set | Systemic: `<h2 className="text-sm font-semibold tracking-wide uppercase">` (and `text-xs … tracking-wider uppercase`, `tracking-[0.2em]` variants) is the de-facto section header across the lane. Replace with `.eyebrow` (overline) or a bare `h2`/`.hed-*` (real section title). Only 5 lane files use `.eyebrow` today | M | Low (visual nudge; Bebas h2 would be a bigger shift — decide overline-vs-heading per instance) |
| T2 | TYPE | `documents/page.tsx:30` | Bare h1 lands on the ramp (Bebas is already caps); don't hand-set `text-3xl font-semibold tracking-tight` or manually uppercase | `<h1>Document Library</h1>` (drop manual "DOCUMENT LIBRARY" caps + size/tracking classes); ditto `:46` h2, `:29` hand eyebrow | S | Low |
| T3 | TYPE | `projects/[projectId]/roster/AssignDrawer.tsx:98`, `projects/[projectId]/roster/reporting/EditReportsDrawer.tsx:52` | Bare h2 on the ramp, not `text-lg font-bold` | Drop the size/weight classes (or `.hed-sm` if the ramp h2 is too large for a drawer) | S | Low |
| T4 | TYPE | `EventSpine.tsx:176` | One ramp is the SSOT — every size reads `--p-fs-*`; `text-[13px]` is off-ramp (the file's own comment handles the *face* rule but not the size) | Move to the nearest ramp step (`text-xs`/`--p-fs-*`) | S | Low |
| T5 | TYPE | `dashboards/page.tsx:321`, `documents/page.tsx:46,57` | Tracking has one home; no hand `tracking-tight` on titles | Remove `tracking-tight`; use bare heading or `.hed-*` | S | Low |
| T6 | TYPE | `projects/[projectId]/overview/page.tsx:101,110` (+ hand eyebrows `:98,:107` `text-[11px] tracking-[0.2em]`) | Metric values are Hanken 800 **tabular** (MetricCard / `.ps-stat .v`), not ad-hoc `text-2xl font-semibold` | Replace the two hand-rolled stat tiles with `MetricCard` (used correctly in 26 other lane files) | S | Low |
| K1 | TOKEN | `documents/page.tsx:28` (`border-ink border-b-3`) | No undefined/retired color vocabulary; borders read `--p-border` | `border-ink` resolves to nothing (no `ink` token exists in the Tailwind v4 theme) — the 3px rule renders in the default border color. Use `border-[var(--p-border)]` or the sanctioned section treatment. Cross-lane note: same dead class in `templates/page.tsx`, `templates/[templateId]/new/page.tsx`, `import/page.tsx` (lane C) | S | Low (silent fallback today) |
| K2 | TOKEN | `proposals/actions.ts:93`, `proposals/[proposalId]/edit/page.tsx:74`, `proposals/[proposalId]/edit/actions.ts:80`, `projects/[projectId]/branding/BrandingForm.tsx:21-23` | Raw hex is sanctioned only for white-label *data* — but the seed defaults `#D4782A`/`#6D4A2A`/`#DC2626` are pre-v8.0 copper/red values, not the ATLVS cold-start `#E23414` | Confirm intent: if these seed "your brand starts as ATLVS", update the defaults to the v8.0 accent; if they're neutral placeholder brand data, document as such | S | Low |
| G1 | GRID | `inbox/NewThreadControls.tsx:37,63` | Overlay z-ladder tokens, not literals | `z-30` → `z-[var(--p-z-overlay)]` (or the popover step of the ladder) | S | Low |
| G2 | GRID | `documents/[docType]/page.tsx:90,100` (`max-w-[860px]`), `reports/[reportId]/page.tsx:34` (`max-w-[1040px]`), `EventSpine.tsx:157` (`min-w-[118px]`), `projects/[projectId]/schedule/CalendarGrid.tsx:104` (`min-h-[90px]`) | 4px grid / `--p-content-max` for content widths | Doc/report stage widths should reference the doc-stage width token (or a shared const, since both mirror the print sheet); 118/90 → 120/88 or a token | S | Low |
| C1 | COMP | `sales/diary/page.tsx:139`, `sales/beos/[id]/page.tsx:107`, `marketplace/box-office/[listId]/GuestRoster.tsx:57` | `.ps-table` is the table primitive; **`.data-table` CSS was retired** (`globals.css:869` — "consumers now use the kit's .ps-table") | These three tables ship with a dead class — they render as unstyled HTML tables in prod. Swap to `.ps-table` (+ `--zebra`/numeric as fits). Highest user-visible item in the lane | S | **Med — visible today** |
| C2 | COMP | `projects/[projectId]/finance/draws/DrawScheduleClient.tsx:22` (`INPUT_CLASS`), `projects/[projectId]/roster/AssignDrawer.tsx:16` + `projects/[projectId]/roster/reporting/EditReportsDrawer.tsx:13` (`inputCls`), `projects/[projectId]/members/MembersClient.tsx:71,…` (inline) | Inputs/selects use `.ps-input` (+`--sm`/`--lg`), not hand-rolled `w-full rounded-md border border-[var(--p-border)] bg-[var(--p-surface)] p-2 text-sm` clones | Delete the local constants; `className="ps-input"` (drops focus-ring/disabled/density drift for free) | S | Low |
| C3 | COMP | Missing `loading.tsx`: `projects/` (list root), `my-work/`, `dashboards/`, `bookings/`, `agency/`, `advancing/`, `scheduler/`, `assistant/`, `copilot/` | Skeleton family + `loading.tsx` on data-heavy routes (the COMPVSS audit added 26 for exactly this lag class) | Add `loading.tsx` with `PageSkeleton`/`SkeletonTableRows` per module; `my-work` (5-query union) and `bookings`/`agency` ledgers first. 14 lane modules already have them | M | Med (blank flash on slow orgs) |
| P1 | PAT | `documents/page.tsx:27-36` | Module list pages carry `ModuleHeader` (+ the PlatformTabsAuto shelf keys off it) | Replace the hand-rolled `<header>` with `ModuleHeader eyebrow="Documents" title=… subtitle=…`. Note: `documents/[docType]` and `reports/[reportId]` intentionally render minimal print-stage chrome — treat those as exempt, not violations | S | Low |
| P2 | PAT | `projects/[projectId]/overview/page.tsx:34-38` + `:111-119` | List honesty / no dead reads | The deliverables count is fetched `head:true` but destructured as `data` (always null), then the *identical query re-runs inline* in JSX via `(deliverables ? 0 : null) ?? (await …).count`. Value shown is correct but one query is dead and the fallback chain is misleading. Destructure `count` from the parallel fetch and render it | S | Low (perf/clarity, not correctness) |
| V1 | VOICE | `documents/page.tsx:30` ("DOCUMENT LIBRARY"), `marketplace/box-office/listings/[listingId]/page.tsx:186` ("New ticket type" vs Title Case siblings) | Casing consistency per surface; caps come from the face/class, never typed | Sentence/Title Case source strings; let Bebas/`.eyebrow` do the uppercasing | S | Low |
| A1 | A11Y | `projects/[projectId]/roster/AssignDrawer.tsx:83-108`, `projects/[projectId]/roster/reporting/EditReportsDrawer.tsx` | Drawers/sheets: scrim + **Escape** + **focus trap** | Both have `role="dialog" aria-modal` + a scrim close-Link (good), but zero `Escape` handling and no focus management (0 focus refs). Keyboard users can tab behind the sheet and can't dismiss without reaching the close link. Wrap in the shared Dialog primitive or add keydown + trap | M | Med (keyboard/SR users) |
| I1 | I18N | 30 non-skeleton tsx files with zero `t()` — full list below; whole subtrees: `marketplace/discounts/**` (8), `sales/beos/**` (5), `projects/[projectId]/sprints/**` (5), `documents/**` (2), plus `assistant/[conversationId]/ChatComposer.tsx`, `advancing/deliverables/[deliverableId]/ReviewPanel.tsx`, `projects/[projectId]/timeline/TimelineGantt.tsx`, `projects/[projectId]/advancing/assignments/AssignmentsKanban.tsx` | User-facing strings t()-wrapped (3-arg fallback) | Sweep the subtrees with the established pattern; client islands take a translated `labels` prop (see `inbox/ConsoleChat.tsx` as the reference implementation) | M-L | Low (English-only fallback) |
| I2 | I18N | `marketplace/box-office/listings/[listingId]/page.tsx` | Same | Partially wired: imports `t`, uses it once, ~15 hardcoded headings/labels ("Revenue & Capacity", "Inventory & Pricing", table heads) | S | Low |

<details><summary>T1 full file list (39)</summary>

`page.tsx` (root), `agency/page.tsx`, `agency/tours/[tourId]/page.tsx`,
`bookings/deals/[offerId]/page.tsx`, `bookings/deals/[offerId]/settlement/page.tsx`,
`bookings/page.tsx`, `bookings/settlements/[id]/page.tsx`, `documents/page.tsx`,
`marketplace/box-office/[listId]/DoorScanner.tsx`, `marketplace/box-office/[listId]/GuestRoster.tsx`,
`marketplace/box-office/[listId]/page.tsx`, `marketplace/calls/[callId]/CallControls.tsx`,
`marketplace/calls/[callId]/page.tsx`, `marketplace/calls/[callId]/submissions/[submissionId]/page.tsx`,
`marketplace/discounts/promoters/[promoterId]/page.tsx`, `marketplace/offers/[offerId]/OfferControls.tsx`,
`marketplace/offers/[offerId]/page.tsx`, `marketplace/page.tsx`,
`marketplace/postings/[postingId]/PublishControls.tsx`,
`marketplace/postings/[postingId]/applicants/[applicationId]/page.tsx`,
`marketplace/postings/[postingId]/edit/page.tsx`, `marketplace/postings/[postingId]/page.tsx`,
`marketplace/postings/new/page.tsx`, `marketplace/settings/page.tsx`,
`marketplace/talent/[talentId]/TalentVisibility.tsx`, `marketplace/talent/[talentId]/page.tsx`,
`marketplace/talent/[talentId]/riders/[riderId]/page.tsx`, `marketplace/talent/[talentId]/riders/page.tsx`,
`projects/[projectId]/advancing/cart/CartClient.tsx`, `projects/[projectId]/branding/BrandingForm.tsx`,
`projects/[projectId]/files/page.tsx`, `projects/[projectId]/finance/draws/DrawScheduleClient.tsx`,
`projects/[projectId]/overview/page.tsx`, `projects/[projectId]/roadmap/page.tsx`,
`projects/[projectId]/roster/reporting/page.tsx`, `projects/[projectId]/schedule/page.tsx`,
`proposals/[proposalId]/edit/ProposalEditor.tsx`, `proposals/templates/[templateId]/page.tsx`,
`sales/page.tsx`
</details>

<details><summary>I1 full file list (30 non-skeleton; loading.tsx/error.tsx with no strings excluded)</summary>

`advancing/deliverables/[deliverableId]/ReviewPanel.tsx`, `assistant/[conversationId]/ChatComposer.tsx`,
`documents/[docType]/page.tsx`, `documents/page.tsx`,
`marketplace/discounts/[discountId]/page.tsx`, `marketplace/discounts/new/NewDiscountForm.tsx`,
`marketplace/discounts/new/page.tsx`, `marketplace/discounts/page.tsx`,
`marketplace/discounts/promoters/[promoterId]/AttributionForm.tsx`,
`marketplace/discounts/promoters/new/NewPromoterForm.tsx`, `marketplace/discounts/promoters/new/page.tsx`,
`marketplace/discounts/promoters/page.tsx`,
`projects/[projectId]/advancing/assignments/AssignmentsKanban.tsx`,
`projects/[projectId]/sprints/BurndownChart.tsx`, `projects/[projectId]/sprints/KanbanBoard.tsx`,
`projects/[projectId]/sprints/SprintForms.tsx`, `projects/[projectId]/sprints/new/page.tsx`,
`projects/[projectId]/sprints/page.tsx`, `projects/[projectId]/timeline/TimelineGantt.tsx`,
`sales/beos/[id]/AddBeoLineForm.tsx`, `sales/beos/[id]/BeoStateControls.tsx`,
`sales/beos/new/NewBeoForm.tsx`, `sales/beos/new/page.tsx`, `sales/beos/page.tsx`
(+ `documents/error.tsx`, `marketplace/error.tsx` and the four projects error.tsx files if they carry copy —
inbox client comps `ConsoleChat`/`NewThreadControls`/`ThreadMenu`/`RoomPinButton` are NOT violations:
they take translated `labels` props)
</details>

## 4. Canon-positive notes (reference implementations)

- **NAV is clean.** Zero hardcoded cross-shell URLs, zero `NEXT_PUBLIC_APP_URL` concat, zero `/m/`–`/p/` leaks in 290 files.
- **VOICE is clean on dashes/emoji.** The 265 em-dash grep hits are all the sanctioned `"—"` null placeholder or `·`/`→` glyphs; zero em/en dashes inside copy, zero emoji (ConsoleChat `REACTIONS` are user-content emoji, exempt).
- **No status-valued filter pills found** anywhere in the lane; tabs are all `RouteTabs`/`RecordTabs` fed (`clients/[clientId]/layout.tsx`, `leads/[leadId]/layout.tsx`, `projects/[projectId]/layout.tsx`, advancing packet) — no hand-rebuilt PlatformTabsAuto shelf.
- **ModuleHeader coverage 100% minus one:** only `documents/page.tsx` (P1) plus the two intentionally chrome-less print viewers lack it.
- **Grid discipline is excellent:** the only arbitrary font size besides the sanctioned `[11px]` floor (75 uses) is EventSpine's `[13px]`; no ad-hoc shadows, no arbitrary radii, no hover/active transform hacks (all `hover-lift`/`press-scale`).
- **Reference implementations for the plan:** `copilot/page.tsx` (labels-prop i18n + ModuleHeader), `inbox/ConsoleChat.tsx` (aria-live log, ps-btn, focus-visible, reaction aria-labels), `my-work/page.tsx` + `dashboards/page.tsx` (MetricCard usage), `marketplace/discounts/**` (structure: ModuleHeader/DataTable/StatusBadge — needs only i18n), `inbox/NewThreadControls.tsx` (native `<details>` popover with htmlFor + role=alert), `projects/[projectId]/advancing/packet/page.tsx` (RouteTabs + full t() coverage + aria-labeled matrix buttons).
- Anton ceiling respected: zero display-face misuse on metrics/labels; `EventSpine.tsx:174` even documents the rule inline.
