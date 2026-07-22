# Lane D — COMPVSS field shell (`src/app/(mobile)/**` + `src/components/mobile/**`)

Audit date: 2026-07-22 · Auditor: lane D agent · Read-only.

## 1. Coverage statement

- **Files in lane: 395** (327 `.tsx`, 68 `.ts`) — enumerated via
  `find "src/app/(mobile)" src/components/mobile -type f`.
- **Mechanically swept: 395/395 (100%)** — sweeps: raw hex/rgb/hsl · retired token
  vocab (`--bg/--surface/--accent/--org-*/.badge-*`) · hand-set `text-Nxl font-bold` ·
  sub-11px font sizes · em/en dashes in labels vs prose · emoji · `t(` template-literal
  keys · icon-only buttons without aria-label (AST-ish python pass, false positives
  hand-cleared) · `<label>` without `htmlFor` · phantom `--p-*` tokens (every token
  used in lane cross-checked against `src/app/theme/**`) · hardcoded cross-shell URLs /
  `urlFor` usage · retired-surface / `ROLE_TABS` reintroduction · `alert()/confirm()` ·
  `dangerouslySetInnerHTML` · `pill=` status audit (all 26 usages read) · sheet-grammar
  conformance (every `className="sheet"` consumer read) · `loading.tsx` coverage vs
  server-fetching pages · direct `lucide-react` imports vs `KIcon`.
- **Judgment-read (~45 files):** all kit primitives in `src/components/mobile/kit/**`
  (Sheet, SheetHead, useDismissable consumers, NormalizedList, viewengine, ActionBar,
  GroupedList, DataTable, FormScreen, RoseCard, ToolSheet, icon), CompvssOnboarding,
  MobileAppBar, MobileSwitcherSheet, MobileNavDrawer, OfflineSyncBanner, HomeShell,
  ApprovalsQuickSheet, AuroraChat, IncidentsList, TimeOffList, FeedView, MarketView,
  RosterList, SpacesView, TimeView, DocsView, MyShifts, my-work, timesheets/notify,
  emergency/data, plus proxy/urls/push-send/service-worker for the NAV finding.
- Ratified non-violations honored (not re-flagged): off-grid font/radius values in the
  kit; the fixed-dark `rgba(255,255,255,.x)` technique + `var(--p-accent-contrast,#fff)`
  fallback (CODE_AUDIT_2026-07-20 §"defensible"); deleted hub launchers; the kit's
  i18n-provider-free contract; Aurora as a route (RATIFIED KEEP); the kit-34 documented
  list-engine exceptions (Marketplace, Connections, Feed/Community, Spaces join-cards,
  Schedule's real-today weekstrip).

## 2. Summary table

| Class | Findings | Top offenders |
|---|---|---|
| TYPE | 0 | — (font-floor guard holds; zero sub-11px; zero hand-set display classes) |
| TOKEN | 0 | — (zero raw-hex violations outside ratified spots; zero phantom tokens; rose gradients SSOT'd) |
| GRID | 0 | — (kit off-grid values ratified; 4px/`--k-*` respected elsewhere) |
| COMP | 4 | missing `loading.tsx` ×18 routes · raw-sheet bypass ×4 · Rose-card clone · direct lucide ×21 files |
| PAT | 1 | incidents / time-off / roster lists off the view engine |
| VOICE | 1 | one "X, not Y" antithesis |
| A11Y | 2 | raw sheets without ESC/focus-trap ×4 · SpacesView chip group |
| I18N | 3 | Aurora surface 100% EN · app-bar aria-labels · kit chrome with no override props |
| NAV | 1 | push deep-link relative `/studio/...` |
| **Total** | **12** (deduped) | |

## 3. Findings

| # | Class | Path:line | Canon rule | Suggested fix | Effort | Risk |
|---|---|---|---|---|---|---|
| D-1 | A11Y | `src/app/(mobile)/m/HomeShell.tsx:274` · `src/app/(mobile)/m/spaces/SpacesView.tsx:168` · `src/app/(mobile)/m/time/TimeView.tsx:235` · `src/components/mobile/MobileSwitcherSheet.tsx:137` | Drawer canon (KIT_CANON §Drawer system): ESC / focus-trap / focus-restore ride `useDismissable`; scrim + Escape on every sheet (checklist A11Y). These four render raw `.sheet` markup with **no `useDismissable`** — no Escape (SwitcherSheet has its own Escape listener but no focus trap/restore), no focus containment, no focus return on close. The known scrim-a11y gotcha class. | Compose the kit `Sheet` shell (drop the hand-rolled overlay), or at minimum attach `useDismissable` to the panel ref as DocsView does | S | Med — keyboard/AT users can tab behind an open modal; regression of the kit-32 grammar on 3 surfaces + shared switcher |
| D-2 | COMP | same 4 files as D-1 | KIT_CANON: "ONE overlay grammar… the shared shell is `Sheet`"; new COMPVSS UI composes from `kit/**`, no forks | Same remediation as D-1 (one change closes both) | S | Low (dedupe of D-1's structural half) |
| D-3 | COMP | 18 fetching routes without `loading.tsx` — `timesheets` · `requisitions` · `handover` · `daily-log` · `briefings` · `lost-found` · `punch` · `snags` · `mileage` · `coc` · `onboarding` · `my-work` · `guide` · `settings` · `pass` · `clock` · `profile` · `door` (each `src/app/(mobile)/m/<dir>/page.tsx` awaits Supabase; no sibling `loading.tsx`) | COMP: Skeleton family + `loading.tsx`; SURFACE_AUDIT_2026-07-21 added 26 route boundaries to fix exactly this tap-lag ("Finance won't open"). The `(mobile)/loading.tsx` boundary does not re-trigger on sibling navigations under `/m`, so these routes show nothing until data lands. **All 10 kit-34-migrated view-engine surfaces are in this list** — they regressed out of the loading wave that preceded them. | Add the standard `PageSkeleton variant="list"` `loading.tsx` (copy the feed/incidents one) to each | S (mechanical ×18) | Med — venue-network tap-and-nothing-happens on the newest, most-used list surfaces |
| D-4 | PAT | `src/app/(mobile)/m/incidents/IncidentsList.tsx` · `src/app/(mobile)/m/time-off/TimeOffList.tsx` · `src/app/(mobile)/m/roster/RosterList.tsx` | Kit-34 canon: every record-list surface rides `NormalizedList`/`OpsLedgerConfig` (checklist PAT). These three carry the ActionBar but hand-roll query/sort/filter state — no View Options drawer, no Share & Export, no board/table views. They are NOT on the documented-exception list (Marketplace, Connections, Feed, Spaces, Schedule weekstrip). | Migrate on the `PunchListView` template (server page shapes rows → `*View.tsx` wraps `NormalizedList`); or add them to the documented exceptions with a reason | M | Low-med — inconsistent list vocabulary; crew learn two filter grammars |
| D-5 | COMP | `src/components/mobile/onboarding/CompvssOnboarding.tsx:960-1075` (Rose reveal step) | SSOT / KIT_CANON "do not fork kit primitives": the onboarding Rose preview hand-duplicates the `RoseCard` card markup (~100 lines — field, chip, barcode strip, QR well, footer). The 07-20 audit extracted only the two gradients (`--rose-gold`/`--rose-card-field`); the structure is still cloned, so any Rose change must be made twice | Extract a presentational `RoseCardFace` from `RoseCard.tsx` and render it in onboarding with preview props | M | Low — visual drift risk on the brand's flagship credential |
| D-6 | I18N | `src/app/(mobile)/m/aurora/AuroraChat.tsx` (whole file: greeting, "Aurora AI", "Field intelligence", 4 prompt cards, all canned answers, follow-ups, composer placeholder, "Preview…" footer, aria-labels) | Checklist I18N: user-facing strings t()-wrapped. This is the ONLY `/m` surface with zero i18n wiring (mechanical scan: 1 of ~200 surface files) — a top-level tab, so non-en crews get a fully English screen | Wrap with the 3-arg `t()` fallback pattern (`m.aurora.*` keys); canned answers can key off the same catalog | M | Med for non-en locales — it is the 5th tab |
| D-7 | I18N | `src/components/mobile/MobileAppBar.tsx:55,83,98,101,110` (aria-labels "Ask Aurora AI" / "Switch workspace or project" / "Search" / "Notifications" / "Profile & settings") · `src/components/mobile/MobileSwitcherSheet.tsx:137` | Shared mobile chrome (not `kit/**`, so the provider-free contract does not apply) mounts inside LocaleProvider yet hardcodes EN aria-labels | `useT()` with fallbacks (keys exist for most of these nouns) | S | Low — AT-only strings, but the global chrome |
| D-8 | I18N | `src/components/mobile/kit/GroupedList.tsx:43` ("Expand all"/"Collapse all") · `src/components/mobile/kit/viewengine.tsx:273,416,461,474,692` ("Where", "Sort", "Group by", "Add sub-group"/"Group by field", "Copied"/"Copy") · `src/components/mobile/kit/DataTable.tsx:339` ("Asc"/"Desc") · `src/components/mobile/kit/ActionBar.tsx:134-178` (aria "Search"/"Clear search"/"View options"/"Share & export") | The kit's provider-free contract says "callers pass translated labels" — but these have **no label prop**, so callers cannot. Every non-en locale gets EN chrome inside the View Options / Share drawers on all 38 normalized surfaces. The canon note ratifies "kit-internal English defaults", so this is flagged as a contract inconsistency, not a straight violation | Add optional `labels` props (EN defaults preserved — zero behavior change for current callers), thread from `NormalizedList` | M | Low-med — visible chrome, every locale, every list |
| D-9 | NAV | `src/app/(mobile)/m/timesheets/notify.ts:36` (`url: "/studio/finance/timesheets"`) | Cross-shell URLs via `urlFor()`. The SW (`public/service-worker.js:501-507`) opens `data.url` relative to its own origin — the compvss subdomain — so the manager lands on the console rendered under `compvss.atlvs.pro` (works only via the proxy's cross-shell pass-through; non-canonical host, console chrome on the field origin) | `urlFor("platform", "/finance/timesheets")` (absolute) | S | Low — functional today, wrong origin + brittle against proxy changes |
| D-10 | A11Y | `src/app/(mobile)/m/spaces/SpacesView.tsx:207-213` | Checklist A11Y (htmlFor/id; state on toggles): the "Kind" `<label>` labels nothing (chip group, not a control), and the kind chips lack `aria-pressed` — the ActionBar's own pills carry it (`ActionBar.tsx:266-270`) | `role="group"` + `aria-labelledby` on the wrap; `aria-pressed={kind===k}` on each chip | S | Low |
| D-11 | VOICE | `src/app/(mobile)/m/settings/account/AccountActions.tsx:135` ("Records are retained, not deleted.") | Checklist VOICE: no "X, not Y" antithesis | Restructure: "Your records stay in the org's books after archive." | S | Cosmetic |
| D-12 | COMP | 21 files import `lucide-react` directly instead of `KIcon` (`ChatRoom` · `RosterList` · `roster/page` · `roster/assign/page` · `activity/page` · `TimeOffList` · `ReferralInvite` · `referrals/page` · `DailyLogForm` · `BriefingsListView` · `SearchClient` · `connections/page` · `SnagForm` · `companies/page` · `IncidentsList` · `SyncStampBar` · `MobileAppBar` · `MobileSwitcherSheet` · `OfflineSyncBanner` · `WillSyncChip` · `PullToRefresh`) | KIT_CANON: `KIcon` is the kit icon primitive — and it is where the a11y wave put the blanket `aria-hidden`. Direct lucide usages need per-usage `aria-hidden`; sampled mixed (OfflineSyncBanner/IncidentsList have it; MobileAppBar `Sparkles`/`ChevronsUpDown`, connections `ChevronLeft` do not) | Mechanical swap to `KIcon` (all names are already in the registry), or add `aria-hidden` where text accompanies | S | Low — decorative-icon announcement noise for AT |

<details>
<summary>D-3 full route list (18)</summary>

`src/app/(mobile)/m/{timesheets,requisitions,handover,daily-log,briefings,lost-found,punch,snags,mileage,coc,onboarding,my-work,guide,settings,pass,clock,profile,door}/page.tsx` — each awaits Supabase reads with no sibling `loading.tsx`. Detail children of covered dirs (tasks/[taskId], inbox/[roomId], docs/[id], spaces/[id]) inherit their parent's boundary and are fine; `briefings/[briefingId]` and `punch/[itemId]` inherit nothing because their parents are themselves uncovered.
</details>

## 4. Canon-positive notes (reference implementations)

- **Touch floor** — `kit-mobile.css:486-530`: blanket ≥44×44 rule for every interactive
  control, with the transparent-`::after` overhang technique so the 38px painted kit
  controls keep their ink while the hit target meets WCAG 2.5.5/2.5.8. The best
  touch-target implementation in the repo; other lanes should copy it.
- **`Sheet` + `useDismissable`** (`kit/Sheet.tsx`, `kit/useDismissable.ts`) — scrim
  button + `role="dialog"` + `aria-modal` + ESC + focus trap + focus restore in ~25
  lines; `DocsView.tsx:204` shows the correct raw-markup-plus-hook variant when the
  shell doesn't fit.
- **Pill discipline is perfect** — all 26 `pill=` usages are context fields (project,
  worker, category, kind, team, trade, priority, location, author); zero status pills.
  `time-sheets` was de-statused in the 07-22 wave and stayed that way.
- **Token hygiene** — zero phantom `--p-*` tokens (all 37 distinct tokens used in lane
  resolve in the theme); zero retired vocab; rose gradients SSOT'd
  (`--rose-gold`/`--rose-card-field`); font floor guard-enforced with zero violations.
- **Aurora honesty framing** — "Preview · Aurora guides you to the right screen — live
  agent coming soon" footer, "See **{surface}**" pointer chips (never a fabricated
  "Consulted" trace), deterministic answers that only route to real screens. The honest
  way to ship a pre-agent chat surface (its i18n gap is D-6; the framing itself is
  exemplary).
- **No retirement regressions** — no `ROLE_TABS`/`RoleChooser`/role-surface routes, no
  GVTEWAY/consumer surfaces, no hub launchers reintroduced.
- **List honesty holds** — my-work rows are all real links to real records; no
  `alert()`/`confirm()`; ShareSheet exports are real CSV/JSON blobs
  (`viewengine.tsx:639-667`), not decorative buttons.
- **Offline affordances honest** — the queue (`WillSyncChip`/`SyncBanner`/
  `OfflineSyncBanner`) is wired only where replay actually exists (approvals, chat,
  check-in, crisis, daily-log, briefing sign-in, clock); banner labels are passed in
  translated.
- **Reduced motion** — kit animations gated behind
  `@media (prefers-reduced-motion: no-preference)`.

## 5. Systemic patterns (worst three)

1. **The newest wave misses the previous wave's fix.** All 10 kit-34-migrated list
   surfaces lack the `loading.tsx` the 07-21 wave added to 26 routes for exactly this
   bug (D-3); the three hand-rolled sheets escaped the kit-32 drawer grammar and the
   07-22 a11y wave (D-1/D-2). Remediation planning should add a "new surface checklist"
   (loading boundary · Sheet shell · NormalizedList · t()-wrap) so each program's floor
   applies to work landing after it.
2. **Drawer grammar drift** — the `Sheet` primitive exists and is exemplary, but 4 of
   8 `.sheet` consumers bypass it and silently lose ESC/focus semantics (the known
   scrim-a11y gotcha class, recurring).
3. **The i18n boundary is fuzzy at the kit edge** — "provider-free kit" is ratified,
   but it shades into untranslatable visible chrome (D-8), untranslated shared chrome
   that is NOT kit (D-7), and one whole surface (D-6). The remediation plan should
   draw the line explicitly: kit = overridable-label props with EN defaults; everything
   outside `kit/**` = t()-wrapped, no exceptions.
