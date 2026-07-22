# Lane F — the shared vocabulary itself (src/components/** shared roots + theme layer)

Read-only UI/UX canon audit, 2026-07-22. Auditor: Lane F session.

## 1. Coverage statement

- **Lane scope:** `src/components/**` excluding `mobile/`, `portal/`, `guides/`, `signage/` (other lanes), plus the theme layer (`src/app/globals.css`, `src/app/theme/**` incl. `themes/atlvs-product.css`, `tokens.json` cross-checks) and `src/app/design-system.test.ts` / `src/lib/theme/*.test.ts` / `src/app/voice-and-type.test.ts` guard-hole analysis.
- **Files walked: 297 / 297 TS+TSX lane files (100%)** — full list enumerated via `find`, every file swept by per-class pattern passes (TOKEN raw hex/rgb/hsl · retired vocab · TYPE hand-set headings/arbitrary sizes · GRID off-grid px/radius · literal z-index · VOICE em/en-dash + emoji · I18N hardcoded defaults/toasts · NAV hardcoded URLs) — plus **15 / 15 theme CSS files (100%)** (`globals.css`, `theme/index.css`, 11 `kit-*.css`, `primitives.css`, `themes/atlvs-product.css`) and `tokens.json` cross-checks. ~45 files additionally read in depth (all ui/ primitives with findings, both DataViews, both RecordActionButtons, both FormFields, DocEngine/ReportEngine/charts, Shell/ModuleHeader/FormShell, workspace-chrome, email/social/pitch).
- Method honors the dedupe rule: repeated patterns are one finding row + the file list.
- **Not re-inventoried** (already mechanically enforced, verified green scope): Tailwind palette-class literals, `[data-theme="dark"]` selectors, `window.confirm`, dead fonts/retired cyan hexes, `--success/--warning`-bare tokens, 11px floor (`font-floor.test.ts`), 4px grid in hand-authored CSS (`spacing-grid.test.ts`), overlay ladder in the 12 audited overlay files, machined radius/breakpoints/elevation mirrors (`kit-mirror.test.ts`), 46 AA contrast pairs (`contrast.test.ts`). Where a guard has a **hole**, the hole itself is a finding (GH-1…GH-6 below).

## 2. Summary table

| Class | Findings (deduped) | Raw instances | Top offenders |
|---|---|---|---|
| COMP | 8 | ~25 components | duplicate DataView/RecordActionButton/FormField/ActivityTimeline; 15 zero-consumer ui primitives; two charting systems |
| TYPE | 4 | ~250 | `text-[11px]` ×234; hand-set `h1 text-2xl` in 15 shared components incl. ModuleHeader |
| TOKEN | 6 | ~30 | StagePlotCanvas raw slate hexes ×14; email/blocks.ts unmirrored hexes; elevation-fallback rgba restatements ×6 |
| VOICE | 2 | 62 strings / 30 files | stale t() fallbacks with em-dashes; email/pitch/ConsoleTour copy |
| I18N | 3 | ~25 | hardcoded English defaults in 8 ui primitives; 7 un-t() toasts |
| PAT | 2 | 8 overlays | literal z-index on fixed overlays outside the guard's 12-file allowlist |
| A11Y | 2 | 2 | SortableList drag-only; RouteTabs tab-role semantics |
| GRID | 2 | ~8 | `rounded-[7px]` ×2, `border-[3px]` ×2, `text-[13px]` |
| NAV | 0 | 0 | clean — no hardcoded cross-shell URLs anywhere in the lane |
| CSS layer | 4 | 237 rules + 3 dead blocks | dual-attribute specificity floor; kit-ai.css 0 consumers |
| Guard holes | 6 | — | see GH-1…GH-6 |

## 3. Findings

### 3a. Component vocabulary (COMP) — the lane's core mandate

| # | class | path:line | rule | suggested fix | effort | risk |
|---|---|---|---|---|---|---|
| F-01 | COMP | `src/components/views/DataView.tsx:14` vs `src/components/ui/DataView.tsx:7` | One canonical collection surface | **Canon inversion.** `views/DataView` self-describes as "the ONE canonical collection surface (ADR-0006)" yet has **2 importers**; `ui/DataView` is a same-named competing table/card toggle with **1 importer**; the actual workhorse is `DataTable` (**268 importers**). Three collection vocabularies, and the self-declared canon is the least used. Decide: either `DataTable` IS the canon (update views/DataView's claim + fold ui/DataView in), or drive `views/DataView` adoption. At minimum rename/absorb `ui/DataView` — a same-name duplicate in the primitive namespace is a trap. | M | low (read-only confusion today, fork risk tomorrow) |
| F-02 | COMP | `src/components/RecordActionButton.tsx:17` vs `src/components/ui/RecordActionButton.tsx:16` | One primitive per job | Two same-named RecordActionButtons: root "dumb trigger" (v7.8, 8 importers) vs ui/ declarative link/confirm affordance (P0.4, 1 importer). Same name, different APIs, different import paths. Merge into one (the ui/ version's modes are a superset) and re-point 9 importers. | M | med — record detail pages are the busiest operator surface |
| F-03 | COMP | `src/components/ui/FormField.tsx` (8 importers) vs `src/components/forms/FormField.tsx` (6 importers) | One form-row wrapper | Two live, competing FormFields: ui/ (generic clone-with-aria wrapper) vs forms/ (FormShell-integrated, reads `useFieldError`). Both actively used — a genuine 50/50 fork of the vocabulary. Canonize on the forms/ one (it closes the FormShell error loop) with ui/ becoming a re-export or absorbed. | M | med — new forms coin-flip which one they copy |
| F-04 | COMP | `src/components/ui/*` — 15 primitives with **zero consumers** | Dead vocabulary | `ButtonGroup, Carousel, DatePicker, DescriptionList, Divider, MediaCard, Meter, NumberInput, PinInput, RadioGroup, RecordHeader, RoleControl, Slider, TimePicker, UploadZone` — 0 JSX usages and 0 non-barrel imports across all of src (verified two ways). Several are marked **"stable"** in `component-maturity.json` (DatePicker, RadioGroup ui-primitive, ListRow-adjacent set). Notably `ui/Divider` is unused while `(auth)` ships its own `AuthDivider` (`src/components/auth/OAuthButtons.tsx`) — the duplicate outlived the primitive. Deprecate-or-adopt each; see GH-5. | M | low |
| F-05 | COMP | `src/components/charts/*` (ChartShell/Sparkline/BarChart/LineChart/DonutChart) vs `src/components/views/ChartView.tsx` (recharts) | One data-viz system | Two charting systems: hand-rolled token-pure SVG charts (8 app importers) and a recharts-based `ChartView` (2 view-engine importers + 2 direct recharts users in app/). Both read `--chart-*` correctly (canon-positive), but every new chart must pick a side. Document the split rule (e.g. charts/* = inline sparkline-class, ChartView = saved-view engine) or converge. | L | low |
| F-06 | COMP | `src/components/ui/Skeleton.tsx` (2 importers) vs raw `.ps-skel` markup in **25 files** | Primitive over raw kit class | The Skeleton React family lost to the raw class 25:2. Either bless raw `.ps-skel` as the canon (delete/demote the wrapper) or sweep the 25. The current state means two idioms in every loading.tsx review. | S | low |
| F-07 | COMP | `src/components/ui/ActivityTimeline.tsx` (1 importer) vs `src/components/gvteway/ActivityTimeline.tsx` (4 importers) + `src/components/collab/ActivityItem.tsx` | One timeline vocabulary | Same-named timeline components in ui/ and gvteway/; the product-specific one is winning. Rename or merge. | S | low |
| F-08 | COMP | `src/components/Shell.tsx:13-21` vs CLAUDE.md §Shell helpers | Docs = map of the vocabulary | Shell.tsx now exports only `MobileTabBar` + `PageSkeleton`; CLAUDE.md still lists 7 helpers "in src/components/Shell.tsx" (ModuleHeader, PlatformSidebar, PortalRail, AuthCard, MarketingHeader live in their own files). Doc drift on the vocabulary's front door. | S | low |

### 3b. Typography (TYPE)

| # | class | path:line | rule | suggested fix | effort | risk |
|---|---|---|---|---|---|---|
| F-09 | TYPE | `src/components/ModuleHeader.tsx:70` | Bare h1 lands on the ramp; tracking has one home | **The canonical page header itself is off-ramp**: `<h1 className="mt-1 … text-2xl font-bold tracking-[-0.01em]">`. `text-2xl` overrides `--p-fs-h1` and `tracking-[-0.01em]` hand-sets what `--p-heading-ls` owns — on every /studio page. Drop both; let the wired element rule paint it (or use the `.hed-*` scale if a smaller cut is intended, via a ramp token not an arbitrary utility). | S | med — visually re-sizes every console h1; do behind a before/after pass |
| F-10 | TYPE | 15 shared components hand-set heading size (pattern; full list below) | Bare h1–h4 on the ramp | `<h1 className="text-2xl font-semibold">` (or xl) instead of a bare ramp heading. These are *shared* components, so each instance propagates to a whole surface family. | M | med |
| F-11 | TYPE | `text-[11px]` ×234 across the lane | Sizes read `--p-fs-*`; 11px floor is a floor, not a size class | 234 hand-set floor-riding arbitrary values. Legal per the font-floor guard (≥11px) but every one bypasses the ramp — if the caption step ever moves, 234 spots stay frozen. Introduce/bless a `.ps-caption`-class (or `text-caption` theme utility) and sweep mechanically. | M | low |
| F-12 | TYPE | `src/components/NotificationsBell.tsx:239` (`text-[13px]`) | Ramp-only sizes | 13px is on no ramp step. Snap to `--p-fs-*`. | S | low |

<details><summary>F-10 full file list (hand-set h1/h2 sizing in shared components)</summary>

- `src/components/workforce/ScheduleSurface.tsx:133`, `DocsSurface.tsx:78`, `DirectorySurface.tsx:90`, `TimeOffSurface.tsx:90`, `ChatSurface.tsx:123`, `LearningSurface.tsx:80`, `FeedSurface.tsx:111`, `OnboardingSurface.tsx:98` (all `h1 text-2xl/xl font-semibold`)
- `src/components/auth/AuthCard.tsx:44`, `src/components/auth/AuthShell.tsx:104`, `src/components/auth/OnboardingStepper.tsx:74` (`h1 text-2xl font-semibold tracking-tight` — also hand-tracking)
- `src/components/msa/MSADocument.tsx:40`, `src/components/offer-letters/LetterDocument.tsx:52` (print-adjacent; verify before sweeping)
- `src/components/forms/PublicFormRenderer.tsx:127` (`h2 text-2xl`)
- `src/components/xpms/dashboards/BaseDashboard.tsx:51`
- (Sanctioned, not counted: `ui/MetricCard.tsx:51` — metric values are canonically Hanken 800 tabular; `Markdown.tsx:147-148` — prose renderer mapping is arguably its job, but consider mapping to `.hed-*` instead.)
</details>

### 3c. Color tokens (TOKEN)

| # | class | path:line | rule | suggested fix | effort | risk |
|---|---|---|---|---|---|---|
| F-13 | TOKEN | `src/components/stage-plots/StagePlotCanvas.tsx:56-65, 368, 375-376, 391` | No raw hex; charts/data-viz via tokens | ~14 raw Tailwind-slate hexes (`#64748b`, `#475569`, `#1e293b`, `#334155`, `#0f172a`, `#ca8a04`, `#78350f`, `#e2e8f0`) painting SVG stage items + grid. These are exactly the frozen-drift literals the palette guard exists for — they slipped because they're hex, not class names (GH-1). Mode-blind too (dark canvas keeps light-theme inks). Route through `--chart-*` / `--p-*`. | S | med — dark-mode legibility today |
| F-14 | TOKEN | `src/components/charts/MapShell.tsx:139` | Token fallbacks from the token set | `r.color ?? "#3b82f6"` — raw blue-500 default for map route lines. Use `var(--chart-1)`/GVTEWAY accent token. | S | low |
| F-15 | TOKEN | `src/components/email/blocks.ts:39,48` | tokens.json is the SSOT mirror for un-CSS-able surfaces | The email palette mirror is a sanctioned raw-hex spot (email clients can't read CSS vars) **but** 2 of its 11 hexes don't exist anywhere in `tokens.json` (`#B7270D` accentHover, `#F2F4F7` surfaceInset) — the mirror has already drifted from the SSOT and nothing guards it (GH-3). `SocialCard.tsx:48-64` is the same pattern currently in sync (all hexes present) but equally unguarded. Add both files to a mirror guard. | S | low |
| F-16 | TOKEN | `src/components/views/MapMarker.tsx:39,66`, `MapView.tsx:348`, `ui/FloorPlan.tsx:93-94`, `compliance/CookieConsent.tsx:104`, `PortalRailClient.tsx:90` | Elevation reads `--p-elev-*` | `var(--p-elev-*, 0 1px 2px rgba(...))` fallbacks restate shadow values inline. The tokens are unconditionally defined in the theme, so the fallbacks are dead weight that can silently drift. Drop the fallback arm. | S | low |
| F-17 | TOKEN | `src/components/auth/OAuthButtons.tsx:15-41` | Documented exceptions | Google/Microsoft logo hexes — third-party brand marks, correctly exempt. **No action**; listed so the next auditor doesn't re-litigate. | — | — |

### 3d. Voice (VOICE)

| # | class | path:line | rule | suggested fix | effort | risk |
|---|---|---|---|---|---|---|
| F-18 | VOICE | 62 em/en-dash UI strings across 30 lane files (pattern; list below) | NO em/en dashes in UI copy (emphatic standing rule) | The voice guard (`src/app/voice-and-type.test.ts`) covers `src/messages`, `src/app/(marketing)`, `src/app/(platform)` — **`src/components/**` is entirely outside its scope** (GH-4). Worse: several hits are **stale t() 3-arg fallbacks that diverge from already-cleaned catalog copy** — e.g. `PricingCalculator.tsx:105` fallback `"Current stack — monthly"` vs `en.json` `"Current stack, monthly"`. The catalog was swept; the inline fallbacks weren't. Sweep + extend the guard. | M | low (en locale masks most today; fallback locales / catalog misses expose them) |
| F-19 | VOICE | `src/components/email/templates.ts:53` | No AI-slop antithesis | "You didn't just sign up for software — you got the keys to a world" — em-dash + "didn't just X, Y" antithesis shape in the welcome email. Restructure per voice canon (world-builder wonder is fine; the construction isn't). | S | low |

<details><summary>F-18 representative offenders (30 files; full set = grep <code>[—–]</code> in string/JSX positions over the lane)</summary>

Stale-fallback subset (catalog already clean, fallback dirty): `marketing/PricingCalculator.tsx:105,135,140` · `DataTableInteractive.tsx:1029` · `automations/TriggerEditor.tsx:148,152`.
Hard-coded copy subset: `ConsoleTour.tsx:37,47,77` · `WorkspaceSwitcher.tsx:127,158` (toasts) · `scanners/CameraScanner.tsx:287` · `scanners/submitScanCode.ts:62` (`MISREAD_MESSAGE`) · `documents/DocToolbar.tsx:86,91` · `ldp/LdpStateTimeline.tsx:71,145` · `marketing/ProductPreview.tsx:27` (aria-label) · `marketing/PricingCalculator.tsx:73` · `email/templates.ts:53,64,334` · `pitch/templates.tsx:26,51,63` (+ more in pitch/slides) · `automations/TriggerEditor.tsx:43`.
(Excluded as sanctioned: the `"—"` empty-value placeholder idiom, e.g. `formatMetricValue` null → "—".)
</details>

### 3e. i18n (I18N)

| # | class | path:line | rule | suggested fix | effort | risk |
|---|---|---|---|---|---|---|
| F-20 | I18N | 8 ui primitives ship hardcoded English **defaults** | No hardcoded English in shared components | `ui/Combobox.tsx:30-32,163-165` ("Select…", "Search…", "No results") · `ui/DataView.tsx:28` ("Nothing here yet") · `ui/ActivityTimeline.tsx:25` ("No activity yet") · `ui/DatePicker.tsx:313` · `ui/FilterBar.tsx:29` ("Clear") · `ui/RoleControl.tsx:45` · `views/DataView` empty states. Props exist, so callers *can* localize — but the default leaks English into every non-en locale that forgets. Route defaults through `useT()` 3-arg fallbacks (FilterBar already imports it). | M | med for non-en locales |
| F-21 | I18N | 7 un-t() toast strings | User-facing strings t()-wrapped | `WorkspaceSwitcher.tsx:127,158` · `gvteway/ShareSheet.tsx` · `reports/ReportToolbar.tsx` · `ui/EditableCell.tsx`. Toasts are user-facing copy. | S | low |
| F-22 | I18N | `src/components/ui/RouteTabs.tsx:75,97` | — | Hardcoded `aria-label="Section"` / `"More Tabs"` (also read by AT — doubles as A11Y copy). | S | low |

### 3f. Patterns, a11y, grid (PAT / A11Y / GRID)

| # | class | path:line | rule | suggested fix | effort | risk |
|---|---|---|---|---|---|---|
| F-23 | PAT | 8 fixed/floating overlays on literal z-index (list below) | Overlay z-ladder (`--p-z-*`) | `CookieConsent.tsx:104` (`z-[60]`) · `home/CopilotSuggests.tsx:58` (`z-40` fixed panel) · `marketing/StickyCTABar.tsx:45` (`z-30`) · `DataTableInteractive.tsx:1392` (bulk bar, `z-40`) · `workspace-chrome/{AppSwitcher:53,CreateMenu:82,DashboardsMenu:42}` (`z-40` menus — should be `--p-z-dropdown`) · `MarketingHeader.tsx:74` (`z-40` — should be `--p-z-nav`). All outside the overlay guard's 12-file allowlist (GH-2). CookieConsent's 60 sits *below* the ladder's nav (200) — a consent bar that real overlays can bury. (In-flow sticky/stacking-context `z-10/20` uses inside components are fine and not counted.) | S | med — stacking bugs are user-visible |
| F-24 | A11Y | `src/components/ui/SortableList.tsx` | Keyboard parity for pointer interactions | Reorder is drag-only (`onKeyDown`/arrow handling absent). Add arrow-key + space grab pattern or an up/down button fallback. (1 importer, so cheap to fix now.) | M | med for keyboard/AT users of that surface |
| F-25 | A11Y | `src/components/ui/RouteTabs.tsx:75-99` | Correct ARIA pattern | `role="tablist"`/`role="tab"` on **links that navigate routes**, without arrow-key roving focus. For URL-backed tabs the canonical pattern is plain nav links + `aria-current="page"` (already present) — the tab roles promise keyboard behavior that isn't implemented. Drop the roles or implement roving tabindex. | S | low |
| F-26 | GRID | `MobileNavDrawer.tsx:77`, `PlatformSidebar.tsx:404` (`rounded-[7px]`); `views/KanbanCard.tsx:52`, `views/TimelineBar.tsx:109` (`border-[3px]`) | Machined radius scale (2/3/4/6/10); 4px grid | 7px is on no radius step (6 or the token). 3px borders are a deliberate board-chrome look — if intended, document; else 2px/4px. Small tail of other off-grid arbitrary px (`-[13px]`, `-[18px]` spacer in `TreeView.tsx:186`). | S | low |

### 3g. Theme/CSS layer

| # | class | path:line | rule | suggested fix | effort | risk |
|---|---|---|---|---|---|---|
| F-27 | CSS | `src/app/theme/themes/atlvs-product.css` — **237 rules** scoped `[data-ui="saas"] X, [data-theme="atlvs-product"] X` (e.g. `:1015-1022` ghost button, `:1568` avatar) | Selector-specificity trap — the /aurora ghost-button issue is systemic, not local | Every ps-* component rule carries a (0,2,0) specificity floor **and** both attribute scopes are always set together (`layout.tsx:211` + all shell layouts set `data-ui="saas"`; ThemeProvider mirrors it), so the `[data-theme="atlvs-product"]` twin selector is pure dead weight that doubles the sheet and keeps the floor high. Any page-level single-class override (0,1,0 or 0,2,0-earlier) silently loses — exactly the /aurora failure mode. Fix systemically: wrap component rules in `@layer` (page CSS outside the layer then always wins) or drop the redundant twin + the `data-ui` scoping now that it's globally true. **Yes — page-level overrides are a systemic need** (trend axis, product surfaces, print sheets all re-skin ps-*) and today each one must know the double-attribute incantation. | L | med — touch the cascade once, carefully, with visual regression |
| F-28 | CSS | `src/app/theme/kit-ai.css` (96 lines) | Shipped vocabulary must have consumers | `.ai-msg/.ai-stream/.ai-think/.ai-cite/.ai-cites/.ai-conf` — **zero consumers in all of src**. `ai/CopilotPanel.tsx` hand-rolls its confidence chip (token-correct, but off-kit) and `ConversationPanel` ignores the kit too. Either adopt the kit classes on the two AI surfaces or drop the file from the core CSS path. | S | low (dead bytes on every page) |
| F-29 | CSS | `src/app/globals.css:1186` (`.ps-lead`), `:1192` (`.ps-small`), `:614` (`.elevation-4` alias) | No unused rules; CLAUDE.md documents `.ps-lead/.ps-small` as live vocabulary | `.ps-lead` and `.ps-small` have **0 usages** in src (`.ps-body` 10, `.ps-caption` 12); `.elevation-4` back-compat alias 0 usages. Adopt or retire + update CLAUDE.md §Typography which prescribes them. | S | low |
| F-30 | CSS | `src/app/theme/kit-trends.css:57-59,155-156,222`; `kit-onboarding.css:255-316`; `kit-platform.css:97-98`; `kit-documents.css:160`; `kit-reports.css:199` | kit-*.css reads only `--p-*` | Verified: the raw values that exist are all **sanctioned classes** — trends re-skin `--p-elev-*` by design (hue-locked, documented), onboarding carries documented kit inks (header comment), platform/documents/reports `#fff` are print-sheet rules. `kit-layers.css:57-65` *defines* the CVD-safe `--chart-*` ramp (it's the definition layer, not a consumer). **No violations** — recorded so future audits don't re-flag. | — | — |

### 3h. Guard holes (meta-findings — the checklist asks where enforcement leaks)

| # | hole | evidence | fix |
|---|---|---|---|
| GH-1 | Palette guard matches Tailwind **class names** only (`design-system.test.ts:197` regex); raw hex/rgb in JSX, SVG attrs, and TS constants passes | F-13 StagePlotCanvas, F-14 MapShell | Add a hex/rgb sweep over TSX with the existing narrow allowlist mechanism (email/social/OAuth/print exempt) |
| GH-2 | Overlay z-ladder guard audits a fixed 12-file list (`overlay-audit.test.ts:17-34`) | F-23: 8 fixed overlays with literal z outside the list | Switch from allowlist-of-files to repo-wide `fixed` + literal-z detection with exemptions |
| GH-3 | `coldstart-fallback-tokens.test.ts` guards only `globals.css` + `theme/index.css` hex mirrors | F-15: `email/blocks.ts` already drifted (2 hexes not in tokens.json); `SocialCard.tsx` unguarded | Add both files to the mirror-containment guard |
| GH-4 | Voice guard (`voice-and-type.test.ts:25-26,81`) scopes em-dash checks to messages/(marketing)/(platform) — `src/components/**` unscanned | F-18: 62 hits, incl. fallbacks drifted from cleaned catalog values | Extend `PLATFORM_SRC`-style string-literal scan to `src/components` |
| GH-5 | `component-maturity.json` tracks existence + level but has **no adoption dimension** — zero-importer primitives sit at "stable" | F-04: 15 dead primitives | Add an importer-count check (level "stable" requires ≥N consumers, else auto-flag) |
| GH-6 | Nothing guards heading-ramp bypass (`text-Nxl` on h1-h4) outside `(marketing)` (`voice-and-type.test.ts:189` covers marketing only) | F-09/F-10: ModuleHeader + 15 shared components | Extend the marketing `.hed-*` type guard to shared components |

## 4. Canon-positive notes (reference implementations for the remediation plan)

- **`src/components/ui/FilterBar.tsx`** — exemplary primitive: URL-backed facets (shareable, server-filterable), `useT()` for labels, `aria-live` result-count announcements via the shared `LiveRegion`, token-only. Use as the bar for "what a shared primitive owes."
- **`src/components/charts/*`** — fully token-pure (`--chart-1..8`, `--chart-grid/axis/label`), zero literals; `kit-layers.css` chart ramp is CVD-safe oklch with documented hex equivalents.
- **`ui/Dialog` / `ui/Sheet` / `ui/Popover`** — Radix focus-trap + Esc + scroll lock, `onBeforeClose` dirty guards, ladder tokens, single `--overlay-backdrop` scrim; `Spinner`/`Skeleton` honor reduced motion (`motion-safe:` / shimmer stop).
- **Retired vocabulary is genuinely dead**: zero hits for `var(--bg)`/`var(--surface)`/`var(--accent)`/`--org-*`/`.badge-{ok,warn,…}` across the entire lane + theme layer.
- **NAV clean**: no hardcoded `*.atlvs.pro` URLs or `NEXT_PUBLIC_APP_URL` + shell-prefix concatenation anywhere in the lane.
- **`ui/Button`** — full canon variant set incl. `--cta`, `--tertiary`, `--link`, kit `--loading`; `secondary` correctly aliases ghost rather than forking a style.
- **`ai/CopilotPanel` confidence tones** read `--p-{success,warning,danger}-text` (token-correct even while off the kit-ai classes — F-28 is an adoption gap, not a color violation).

## 5. Three worst systemic patterns (for the plan's prioritization)

1. **The specificity floor generalizes the /aurora ghost-button bug (F-27).** 237 dual-attribute-scoped component rules mean every legitimate page/trend/product override must out-specificity `[data-ui="saas"]` — un-layered CSS with a redundant twin selector. One `@layer` decision fixes the whole class.
2. **The vocabulary is forking faster than it's canonizing (F-01…F-07).** Three collection surfaces (one self-declared canonical with 2 users vs 268), two RecordActionButtons, two FormFields, two timelines, two chart systems, 15 dead primitives, Skeleton losing 25:2 to its own kit class — the primitive layer has no adoption feedback loop (GH-5).
3. **Copy canon is enforced everywhere except the shared layer (F-18/GH-4).** The em-dash sweep cleaned catalogs and app shells but `src/components/**` — the layer that renders on every shell — is unguarded, and t() fallbacks have already drifted from their cleaned catalog twins.
