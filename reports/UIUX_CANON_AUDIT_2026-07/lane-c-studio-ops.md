# Lane C — Studio ops trees (finance · procurement · production · people · operations · safety · comms · settings · workforce · compliance · access-control)

Read-only UI/UX canon audit, 2026-07-22. Classes and dedupe rules per `CHECKLIST.md`.

## 1. Coverage statement

- **Lane scope:** `src/app/(platform)/studio/{finance,procurement,production,people,operations,safety,comms,settings,workforce,compliance,access-control}/**`.
- **`studio/legend` does not exist.** LEG3ND was promoted out of the console into its own `(legend)` route group (`legendNav` in `src/lib/nav.ts`); there is no `src/app/(platform)/studio/legend` tree to audit. 0 files.
- **Files walked: 596 / 596 (100%).** Breakdown: 339 `page.tsx`, 152 `actions.ts`, 13 `loading.tsx`, 5 `layout.tsx`, 5 `error.tsx`, ~30 client components / colocated libs. Per tree: finance 123 · settings 102 · procurement 80 · workforce 65 · safety 56 · people 55 · operations 43 · production 34 · comms 31 · access-control 4 · compliance 3.
- **Method:** mechanical sweeps for every class ran against all 596 files (hex/rgb/palette-literal color, hand-set display type, sub-11px, tracking literals, off-grid px, retired vocab, em/en dash, emoji, competitor names, urlFor bypass, aria-live, htmlFor, t() coverage, raw table/button/input, z-index, transforms), plus full judgment reads of every flagged file, every non-page client component, the 8 redirect pages, and a stratified page sample across all 11 trees (list + detail + new + queue surfaces per tree). One tooling note for reproducers: BSD `xargs` has no `-a`; sweeps were re-run via `tr '\n' '\0' | xargs -0` after the first pass silently no-opped.

## 2. Summary table

| Class | Findings | Files touched | Top offenders |
|---|---|---|---|
| TYPE | 5 (3 deduped) | ~190 | `font-mono` data cells ×166 files · `text-[11px]` ×60 · ad-hoc eyebrows ×17 |
| TOKEN | 2 | 2 | `LiveDispatchMap.tsx` hex drift · `CueForm.tsx` `text-white` |
| GRID | 0 | 0 | clean (rounded-* utilities are token-mapped; arbitrary widths on-grid) |
| COMP | 6 (3 deduped) | ~50 | hand-rolled inputs ×22 · raw buttons ×19 · undefined `btn-xs` ×3 |
| PAT | 2 | 12 | unconfirmed one-click deletes ×9 · 3 trees missing `loading.tsx` |
| VOICE | 4 | ~30 | State/Status header split (38 vs 67) · 2 antithesis strings |
| A11Y | 3 (1 deduped) | ~65 | unassociated labels ×62 files · scanner log no aria-live |
| I18N | 5 (2 deduped) | ~90 | actions.ts English error strings ×82 · module-constant labels |
| NAV | 1 | 1 | sample URL literal in EmailTemplatesPanel (informational) |

Total: 28 distinct findings; the three systemic ones (TYPE-1, I18N-1, A11Y-1) account for ~310 of the file touches.

## 3. Findings

### TYPE

| # | class | path:line | rule | suggested fix | effort | risk |
|---|---|---|---|---|---|---|
| TYPE-1 | TYPE | 166 files (list below); e.g. `src/app/(platform)/studio/finance/budgets/[budgetId]/page.tsx:256`, `finance/expenses/page.tsx:153` | Table data figures ride IBM Plex Mono + `tabular-nums` via `.ps-table .num` (`--p-mono-data`); `font-mono` maps to Space Mono (`--font-space-mono`, the eyebrow voice). 539 occurrences of `className: "font-mono text-xs"` on money/date/ID cells render data in the wrong face, left-aligned, without tabular figures. **Zero** uses of `.num` in the lane. Root cause is shared: `src/components/DataTable.tsx:305` — the typed `mono` flag (added to replace this exact stringly pattern, per its own comment at :53) composes `"font-mono text-xs"` instead of `"num"`. | Fix `DataTable.tsx` `mono` → `.num` (one-line, instantly corrects every `mono: true` column), then sweep the 539 stringly `font-mono text-xs` column literals to `mono: true` / `.num`. | M | Medium — misaligned money columns, off-canon data face on every ledger/table in the console |
| TYPE-2 | TYPE | 60 files (list below); e.g. `comms/channels/[id]/page.tsx:68`, `compliance/coc/page.tsx:163` | One ramp is the SSOT — micro-labels should read `--p-fs-eyebrow` (0.6875rem) via `.ps-caption`/`.eyebrow`, not a hand-set `text-[11px]` px literal (px also opts out of the ramp's rem/user-text-size intent). Value is at the 11px floor, so no floor violation. | Sweep `text-[11px]` → `.ps-caption` (muted micro-copy) or `.eyebrow` (uppercase labels); where the color differs keep the color utility. | S | Low — value-identical today; drifts if the ramp retunes |
| TYPE-3 | TYPE | 17 files: `access-control/AccessControlScanner.tsx:121` (0.08em) · `finance/budgets/[budgetId]/page.tsx` · `people/{credentials/asset-linker,msas/[id],offer-letters/[id]/LetterShareCard,page,roles/page}` (0.18/0.2em) · `production/{fabrication/[orderId],rentals/[rentalId]}` · `settings/{SettingsSidebar,billing,compliance,domains,imports,page}` · `workforce/{call-sheets/[memberId] (0.25em),page}` (0.4em ×2) | Tracking has one home (`--p-tracking-eyebrow`); `.eyebrow` exists precisely to replace the ad-hoc `text-xs … tracking-[0.25em] uppercase` pattern (globals.css:1150 comment). Six different literal tracking values are in play in this lane. | Replace the uppercase+tracking-literal label stacks with `.eyebrow` (or `.eyebrow` + color modifier). | S | Low — visual wobble between surfaces |
| TYPE-4 | TYPE | `workforce/call-sheets/[memberId]/page.tsx:101,112` | No hand-set `text-2xl font-bold` (member name should be a bare heading or `.hed-*`); metric values (Call/Wrap times, :112) are `font-mono text-2xl` — metric figures are Hanken 800 tabular, and Space Mono is not a metrics face. | Bare `h2` (or `.hed-lg`) for the name; `.ps-stat`-style value treatment for the times. | S | Low — print-facing call sheet, single surface |
| TYPE-5 | TYPE | `people/roles/page.tsx:65,97` | Semantic `h3` elements demoted to eyebrow styling (`text-xs tracking-[0.18em] uppercase`) — the ramp gives `h3` Hanken 700 18px; if the design intent is an overline, it shouldn't be a heading element carrying it. | Either bare `h3` on the ramp, or a `div.eyebrow` + keep a real heading for structure. | S | Low |

<details><summary>TYPE-1 full file list (166)</summary>

  - `src/app/(platform)/studio/access-control/counts/page.tsx`
  - `src/app/(platform)/studio/access-control/page.tsx` (via AccessControlScanner code cells)
  - …full list generated by `grep -l 'font-mono text-xs'` over the lane; per-tree counts: settings 31 · finance 31 · safety 24 · workforce 22 · procurement 18 · people 12 · production 10 · operations 10 · comms 4 · compliance 2 · access-control 2. Reproduce: `grep -rl "font-mono text-xs" "src/app/(platform)/studio/"{finance,procurement,production,people,operations,safety,comms,settings,workforce,compliance,access-control}`
</details>

<details><summary>TYPE-2 reproduce (60 files)</summary>

`grep -rl "text-\[11px\]" <lane trees>` — 60 files, heaviest in finance (ap-ocr, pay-apps, periods), settings (exports, domains, integrations), comms (channels), workforce (call-sheets).
</details>

### TOKEN

| # | class | path:line | rule | suggested fix | effort | risk |
|---|---|---|---|---|---|---|
| TOKEN-1 | TOKEN | `production/dispatch/live/LiveDispatchMap.tsx:102-115` | The canvas-paint hex escape hatch is legitimately documented (maplibre `line-color` can't resolve CSS vars) **but the hexes don't mirror the semantic tokens as the comment claims**: `in_transit #3b82f6` vs `--p-info #2596C4`, `delayed #f59e0b` vs `--p-warning #C8841A` (v7 semantic retune), `arrived #22c55e` / `cancelled #ef4444` are raw Tailwind palette values, not the token values. Marker colors (DOM, :84-97) are correct. | Swap the four hexes for the `tokens.json` sRGB mirror values of `--p-{info,success,warning,danger}`; leave the comment. | S | Medium — route lines visibly disagree with the marker/badge tones for the same state |
| TOKEN-2 | TOKEN | `production/ros/CueForm.tsx:100` | `text-white` hardcoded on the live-cue GO button over `--p-success`; the AA-certified ink for tinted semantic fills is `--p-success-text` / the token pair, and `white` isn't guaranteed against the retuned success value in both modes. | Use the semantic text token (or `.ps-btn--cta`-style tokenized pair). | S | Low |

### GRID

No findings. `rounded-md/lg/xl/full` utilities are remapped to `--p-r-*` in `globals.css:55-65`; all arbitrary widths found (`[480px]`, `[240px]`, `[220px]`, `[180px]`, `[160px]`, `[14rem]`) are on the 4px grid; zero off-grid px literals, zero ad-hoc z-index, zero ad-hoc transforms beyond one sanctioned `transition-transform` chevron nudge (`settings/page.tsx:176`).

### COMP

| # | class | path:line | rule | suggested fix | effort | risk |
|---|---|---|---|---|---|---|
| COMP-1 | COMP | 22 files (list below); e.g. `finance/budgets/new/NewBudgetForm.tsx:16`, `finance/entities/new/page.tsx:13` | Inputs/selects ride `.ps-input`; these files define local constants (`SELECT_CLASS`/`INPUT` = `"w-full rounded-md border border-[var(--p-border)] bg-[var(--p-surface|bg)] px-3 py-2 text-sm"`) that re-implement it by hand — losing focus ring, density tokens, disabled/size variants, and forking bg between `--p-surface` and `--p-bg` across files. Contrast: `finance/expenses/[expenseId]/edit/page.tsx:13` does it right (`SELECT_CLASS = "ps-input focus-ring w-full"`). | Replace the constants with `"ps-input w-full"`. | S | Medium — inconsistent focus/disabled behavior on ~22 create/edit forms |
| COMP-2 | COMP | 19 files / 30 occurrences: `finance/{budgets/[budgetId],wip,pay-apps/[id],periods/[periodId]/CloseChecklist}` · `people/{credentials/asset-linker,roles,offer-letters/[id]/LetterEmailComposer}` · `procurement/{purchase-orders/[poId]/checklist,requisitions/[reqId]/leveling}` · `production/{ros/CueForm,fabrication/[orderId],rentals/[rentalId]}` · `settings/{api,capabilities/CapabilitiesClient,domains,email-templates/EmailTemplatesPanel,exports/ExportCenter,integrations,integrations/accounting/[id]}` | Buttons ride `Button`/`.ps-btn` variants; these render raw `<button>` with hand-rolled border/hover stacks (e.g. `finance/wip/page.tsx:123-125`, `ExportCenter.tsx:242`). | Migrate to `Button` (size="sm"/variant) or `.ps-btn ps-btn--{ghost,secondary} ps-btn--sm`. | M | Low-medium — inconsistent hover/focus/press states |
| COMP-3 | COMP | `workforce/time-off/page.tsx:171` · `workforce/time-off/DecideButtons.tsx:52,57` · `workforce/shift-swaps/page.tsx` | `btn-xs` is **not a defined class anywhere in the CSS** (canonical small size is `.ps-btn--sm`); these buttons silently render at default size. Invented-class defect, same class as the COMPVSS kit-28 port-bug taxonomy. | s/btn-xs/ps-btn--sm/ (7 occurrences repo-wide, 3 files in lane). | S | Low — cosmetic, but it's dead vocabulary that reads as if it works |
| COMP-4 | COMP | `finance/accounts/page.tsx:79` · `finance/ledger/page.tsx:125` · `finance/ledger/[id]/page.tsx:138` · `finance/ap-ocr/[id]/page.tsx:198` · `procurement/receiving/[id]/page.tsx:166,255` | Hand-rolled `<table className="w-full text-sm">` / legacy `.data-table` wrapper instead of `.ps-table` (or `DataTable`) — loses head styling, `.num` numeric cells, `--sticky`/`--zebra`, hover canon. (`people/roles/page.tsx` shows the acceptable static-matrix pattern: raw `<table className="ps-table">`.) | Add `ps-table` (static tables) or migrate to `DataTable` (ledger/accounts are sortable-shaped). | S | Low-medium |
| COMP-5 | COMP | `access-control/AccessControlScanner.tsx:136-141` | Verdict pill is a hand-rolled `rounded-full px-2 py-0.5` span with inline style tones; `Badge`/`StatusChip` own this vocabulary (tones are at least token-based via `--p-*-text` + color-mix). | `<Badge variant={...}>` with the existing tone mapping. | S | Low |
| COMP-6 | COMP | `production/` · `compliance/` · `access-control/` (tree roots) | Skeleton/loading canon: 8 of 11 trees carry a group-level `loading.tsx`; these three have none at any level, so first navigation shows the parent shell's generic fallback (the COMPVSS audit's "Finance lag" fix pattern, unapplied here). | Add `loading.tsx` (PageSkeleton) at each tree root. | S | Low-medium — perceived lag on heavy pages (dispatch map, compliance hub) |

<details><summary>COMP-1 full file list (22)</summary>

  - `src/app/(platform)/studio/finance/ap-ocr/upload-client.tsx`
  - `src/app/(platform)/studio/finance/budgets/[budgetId]/edit/EditBudgetForm.tsx`
  - `src/app/(platform)/studio/finance/budgets/new/NewBudgetForm.tsx`
  - `src/app/(platform)/studio/finance/cost-codes/new/page.tsx`
  - `src/app/(platform)/studio/finance/entities/[id]/edit/page.tsx`
  - `src/app/(platform)/studio/finance/entities/new/page.tsx`
  - `src/app/(platform)/studio/finance/expenses/new/NewExpenseForm.tsx`
  - `src/app/(platform)/studio/finance/forecasts/new/page.tsx`
  - `src/app/(platform)/studio/finance/lien-waivers/[id]/page.tsx`
  - `src/app/(platform)/studio/finance/lien-waivers/new/page.tsx`
  - `src/app/(platform)/studio/finance/pay-apps/new/page.tsx`
  - `src/app/(platform)/studio/finance/payroll/new/page.tsx`
  - `src/app/(platform)/studio/operations/daily-log/new/page.tsx`
  - `src/app/(platform)/studio/procurement/po-change-orders/new/page.tsx`
  - `src/app/(platform)/studio/procurement/prequalification/new/page.tsx`
  - `src/app/(platform)/studio/procurement/prequalification/questionnaires/new/page.tsx`
  - `src/app/(platform)/studio/procurement/purchase-orders/[poId]/checklist/page.tsx`
  - `src/app/(platform)/studio/procurement/requisitions/[reqId]/leveling/new/page.tsx`
  - `src/app/(platform)/studio/procurement/wo-broadcasts/new/page.tsx`
  - `src/app/(platform)/studio/safety/briefings/new/page.tsx`
  - `src/app/(platform)/studio/settings/integrations/submissions/[id]/page.tsx`
  - `src/app/(platform)/studio/settings/organization/page.tsx`
</details>

### PAT

| # | class | path:line | rule | suggested fix | effort | risk |
|---|---|---|---|---|---|---|
| PAT-1 | PAT | 9 files: `operations/daily-log/[id]/page.tsx:299` (photo delete) · `people/roles/page.tsx:181` (custom role) · `procurement/po-change-orders/[id]/page.tsx` · `procurement/rfqs/[rfqId]/responses/[responseId]/page.tsx` · `production/fabrication/[orderId]/page.tsx` · `production/rentals/[rentalId]/page.tsx` · `production/ros/CueForm.tsx:145` (cue) · `settings/advancing/page.tsx` · `settings/domains/page.tsx:109` (custom domain!) | Destructive actions ride `DeleteForm` (confirm step) — 38 lane files use it correctly; these 9 post `delete*` server actions from bare one-click forms with no confirmation. Removing a custom domain or an RFQ response is one accidental click. | Wrap in `DeleteForm` (or add the confirm affordance for inline rows). | S | **High** — irreversible one-click data loss on 9 surfaces |
| PAT-2 | PAT | lane-wide (positive + residual) | Filter pills never status: **conformant** — the lane has no pill strips; status filtering goes through `FilterBar` native selects (sanctioned, URL-backed, announces result counts) and DataTable column filters. ModuleHeader: **100%** (322 direct, 8 via `DetailShell`, 1 via `AssetInventorySurface`, 9 redirects). List honesty: all MetricCards inspected compute from fetched rows; no fabricated counts found. Rows open details (`rowHref` everywhere sampled). | — | — | — |

### VOICE

| # | class | path:line | rule | suggested fix | effort | risk |
|---|---|---|---|---|---|---|
| VOICE-1 | VOICE | 105 column headers lane-wide: 67 label their `*_state` column **"Status"**, 38 **"State"** (e.g. `finance/expenses/page.tsx:158` "Status" vs `finance/entities/page.tsx:154` "State"; sometimes both in one tree — payroll says "State", expenses "Status") | Sentence/terminology consistency per surface: one console, one word for the same concept. (LDP renamed the columns; the UI vocabulary never converged.) | Pick one ("Status" is the human word; "State" currently leaks the schema vocabulary) and sweep the header strings + their catalog keys. | S | Low — reads as inconsistent, not broken |
| VOICE-2 | VOICE | `people/offer-letters/[id]/onboarding/page.tsx:223` ("…a template of four steps, not a new engine") · `settings/integrations/accounting/new/page.tsx:87` ("…exchanged out-of-band, not captured in this UI") | No "X, not Y" antithesis in copy. | Restructure ("Credentials are exchanged out-of-band."). | S | Low |
| VOICE-3 | VOICE | subtitle sample lane-wide | Subtitle punctuation/casing drifts: mixed trailing-period vs none ("Gate credential scanning" vs "Master cost-code list."), occasional Title Case sentences ("Heavy Fleet & Owned Gear · A Class Lens Over The Unified Asset Registry") beside sentence case. | One convention per slot (suggest: sentence case, no trailing period for fragments). | S | Low |
| VOICE-4 | VOICE | `operations/daily-log/[id]/{actions.ts:15,page.tsx:75,96}` · `procurement/vendors/[vendorId]/prequalification/[prequalId]/page.tsx:112,120` | Competitor name survives as the `procore-parity` storage-bucket identifier (code + comments only; never rendered). The competitor-scrub program missed infra identifiers. | Not remediable as copy — bucket rename is a storage migration; log for the infra backlog, rename the comments meanwhile. | M | Low — internal only |

Em/en dash: **clean** — every `—` found is the sanctioned null-value placeholder (matches the reports-engine `null → "—"` canon); the `·` separator and `→` directional glyphs are house style. No emoji anywhere in the lane.

### A11Y

| # | class | path:line | rule | suggested fix | effort | risk |
|---|---|---|---|---|---|---|
| A11Y-1 | A11Y | 62 files (reproduce below); e.g. `production/ros/CueForm.tsx:25→28` (label then sibling `<select>`), `comms/announcements/[id]/edit/page.tsx:61→64` | `htmlFor`/`id` on every input: the lane's dominant form idiom is `<label>` **closed** before a sibling `<select>`/`<textarea>`/`<input>` with no `htmlFor` — no programmatic association, no click-to-focus. (Wrapping-label forms — `comms/advances/new`, `NewAnnouncementForm` — are fine; whole lane has only 15 `htmlFor`s against 292 labels.) `TransitionControl.tsx:44-47` is the model implementation. | Sweep: wrap the control in the label or add `htmlFor`+`id` pairs. `Input`/`FormShell` already do this — prefer them. | M | Medium — every screen-reader/voice-control user on ~60 create/edit forms |
| A11Y-2 | A11Y | `access-control/AccessControlScanner.tsx:124-146` | aria-live on async result regions: gate-scan verdicts (Admitted / Already used / Voided…) resolve asynchronously into the log with **no live region**, on a surface where the operator may be looking at the gate, not the screen. FilterBar's `useAnnounce` pattern is right there to reuse. | `aria-live="polite"` (or `useAnnounce`) on verdict resolution. | S | Medium — operational surface |
| A11Y-3 | A11Y | `workforce/time-off/DecideButtons.tsx:44-50` | Deny-note input has placeholder-only labeling (no label/aria-label). | `aria-label={notePlaceholder}` at minimum. | S | Low |

Icon-only buttons: none found without accessible text (ExportCenter's Download button carries both text and `aria-label`). No drawers/sheets are hosted in this lane (overlay primitives live in shared components — lane A/B scope).

<details><summary>A11Y-1 reproduce (62 files)</summary>

Files where `</label>` is followed within 3 lines by a sibling `<select|<textarea|<input` and the file contains zero `htmlFor`. List saved from the sweep; heaviest: finance new/edit forms (entities, budgets, forecasts, lien-waivers, pay-apps, payroll), procurement new forms, comms polls/surveys/announcements, production ros/fabrication, settings organization/integrations.
</details>

### I18N

| # | class | path:line | rule | suggested fix | effort | risk |
|---|---|---|---|---|---|---|
| I18N-1 | I18N | 82 of 153 lane `actions.ts` (reproduce: `grep -rlE 'error: "[A-Z]' <lane>/**/actions.ts`); e.g. `comms/advances/new/actions.ts:45` "Only a live packet can be sent…" | Server-action `State.error` strings render directly in the UI (FormShell error surface) but are hardcoded English; only 1 lane actions file imports i18n. **Repo-wide convention, not lane drift** — zero `error: t(` exists anywhere under `/studio`. Flagged once as systemic; needs a program-level decision (getRequestT in actions vs error-code catalog). | Decide the pattern at plan level; don't fix per-file. | L | Medium — the only untranslated strings a localized operator will routinely see |
| I18N-2 | I18N | `people/roles/page.tsx:12-25` (role descriptions) · `production/ros/CueForm.tsx:71-83` (`NEXT_STATUS` labels "Standby"/"GO"/"Skip"/"Done"/"Reopen") · `TransitionControl`-style `*_STATE_LABELS` lib maps | Module-constant UI strings rendered untranslated in otherwise fully-t()'d components. | Move into the render path with t(), or catalog-key the label maps. | S | Low-medium |
| I18N-3 | I18N | `procurement/vendors/[vendorId]/onboarding/page.tsx` · `settings/impersonate/page.tsx` (dev-only, arguably exempt) · `settings/usage/page.tsx` · `workforce/call-sheets/[memberId]/page.tsx` · `workforce/forecast/[id]/page.tsx` | The only 5 non-redirect pages in the lane with zero i18n wiring (334/339 conform). | Wire `getRequestT`; call-sheets member page also carries "⌘P to print or save as PDF" + "Back" raw. | S | Low |
| I18N-4 | I18N | `people/roles/page.tsx:125-133` (bypassNote split into 5 keys: prefix/comma1/and/middle/suffix) · same idiom at :144-153 | Sentence fragments as separate catalog keys concatenate in English word order — untranslatable into languages with different syntax; commas-as-keys (`"…comma1"`) is extractor noise. | One key with `<code>`-safe interpolation or markdown-ish rendering. | S | Low |
| I18N-5 | I18N | `access-control/page.tsx:23` | Breadcrumb labels hardcoded (`{ label: "Operations" }, { label: "Access Control" }`) in a page where every other string is t()-wrapped. | t() the two labels. | S | Low |

### NAV

| # | class | path:line | rule | suggested fix | effort | risk |
|---|---|---|---|---|---|---|
| NAV-1 | NAV | `settings/email-templates/EmailTemplatesPanel.tsx:41` | `"https://gvteway.atlvs.pro/acme-26-tour"` literal — it is **sample data** for the `portal_url` merge-tag preview, not a link, so `urlFor` doesn't strictly apply; noted because it will read stale if the portal host scheme changes. | Optionally derive the sample from `urlFor("portal", …)`. | S | Informational |

### Redirect pages (one line each, per lane brief)

All 8 use `redirect(urlFor("legend", …))` — correct helper, correct targets:

- `settings/branding/page.tsx` → `/hub/brand` — correct.
- `settings/catalog/page.tsx` → `/hub/catalogs`, **carries `?filter=`/`?view=` params over** — correct, exemplary.
- `settings/catalog/new/page.tsx` → `/hub/catalogs/new` — correct.
- `settings/catalog/[id]/page.tsx` → `/hub/catalogs/{id}` — correct (awaits params).
- `settings/catalog/[id]/edit/page.tsx` → `/hub/catalogs/{id}/edit` — correct.
- `settings/job-templates/page.tsx` → `/hub/templates/job-templates` — correct.
- `settings/job-templates/new/page.tsx` → `/hub/templates/job-templates/new` — correct.
- (`studio/locations/*` sits outside this lane's trees but was named in the brief: its 3 redirect pages follow the same correct `urlFor("legend", …)` pattern; `locations/picker` remains a real page.)

## 4. Canon-positive notes (reference implementations)

- **`safety/lost-found/page.tsx`** — the model list page: ModuleHeader + honest MetricCards computed from rows, DataTable with `rowHref`, teaching EmptyState with action, `toneFor` badges, full t(). Documented honest-lens rationale in the header comment.
- **`workforce/time-off/page.tsx` + `DecideButtons.tsx`** — the model approval queue: bulk actions with an optional decision note that rides the push, two-step deny, toast-surfaced RPC failures, i18n interpolation in the subtitle (modulo the `btn-xs` defect, COMP-3).
- **`operations/reservations/[id]/TransitionControl.tsx`** — the model FSM transition control: reachable-states-only select, `htmlFor`/`id`, FormShell, server-side revalidation note.
- **`components/ui/FilterBar.tsx`** — status filtering done right (native selects, URL-backed, `useAnnounce` result counts); the reason this lane has zero pill=status violations.
- **`src/lib/tones.ts` + `StatusBadge`** — state→tone SSOT actually used everywhere; no hand-rolled tone maps found in the lane.
- **Color discipline is essentially perfect**: across 596 files, zero raw hex/rgb/palette-literal classes in UI markup (the two TOKEN findings are a documented canvas escape hatch with drifted values and one `text-white`), zero retired vocabulary, zero off-grid spacing.

## 10-line summary

1. 596/596 files audited (studio/legend does not exist — LEG3ND lives in its own route group; 0 files).
2. TYPE 5 findings (~190 files) · TOKEN 2 · GRID 0 · COMP 6 (~50 files) · PAT 2 (9 high-risk) · VOICE 4 · A11Y 3 (~65 files) · I18N 5 (~90 files) · NAV 1.
3. Worst systemic #1: data cells ride Space Mono via `font-mono text-xs` (166 files, 539 uses, zero `.num`) — root fixable in one line of `DataTable.tsx`.
4. Worst systemic #2: 82/153 `actions.ts` return hardcoded-English `State.error` strings that render in the UI — repo-wide convention needing a program-level i18n decision.
5. Worst systemic #3: 62 form files pair labels with sibling controls with no `htmlFor`/`id` — no programmatic label association across the lane's create/edit forms.
6. Highest user-visible risk: 9 surfaces perform one-click unconfirmed deletes (custom domains, RFQ responses, cues, photos) while 38 sibling files use `DeleteForm` correctly.
7. Concrete defects worth fast fixes: undefined `btn-xs` class (3 files), LiveDispatchMap route hexes that claim to mirror semantic tokens but are raw Tailwind palette values, 3 trees missing `loading.tsx`.
8. Terminology split: `*_state` columns labeled "Status" (67) vs "State" (38) across the same console.
9. Color/grid/retired-vocab discipline is exemplary — zero violations in 596 files; ModuleHeader coverage is 100%; filter-pills-never-status fully conformant.
10. Reference implementations for the remediation plan: `safety/lost-found`, `workforce/time-off`, `TransitionControl`, `FilterBar`, `lib/tones.ts`.
