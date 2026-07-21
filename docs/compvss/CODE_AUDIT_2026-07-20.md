# COMPVSS Code Audit — Antipatterns · 3NF/SSOT · Stubs (2026-07-20)

**Scope:** every line of `src/app/(mobile)/m/**`, `src/components/mobile/**`, `src/lib/mobile/**` — 376 files, ~49,505 lines — read line-by-line by 10 parallel auditors, plus a whole-surface machine sweep.

**Machine-checkable signatures = ZERO across all ~49.5k lines:** no raw `alert()`/`confirm()`, no dead `onClick={()=>{}}`, no hardcoded hex in string literals, no UI em-dash string literals, no `toLocaleString`/`toFixed` money, no `Date.now()`/`Math.random()` in `useState` initializers, no `TODO`/`coming soon`/`stub` strings, no `as any`, no `console.log`. The findings below are the subtler defects only a line-by-line read surfaces.

---

## P0 — Genuine functional defects (fix first)

1. **Notification preferences are cosmetic — HIGH.** `settings/notifications/constants.ts:6` persists title-case `CATEGORIES` (`"Shifts"/"Assignments"/"Reviews"/"Messages"/"Announcements"`) as `notification_preferences.matrix[category][channel]`, but the enforcement path `src/lib/push/send.ts:395` reads `matrix[kind]` where `kind` is a **lowercase `PushKind`** (`"announcement"`, `"assignment"`, `"chat"`, `"shift"`, `"kudos"`…). Keys never match → every toggle on this screen is inert (push stays default-on); `"Reviews"`/`"Messages"` map to no `PushKind`. **FIX:** derive the matrix rows from the `notification_kind_catalog`/`PushKind` SSOT and persist under the canonical lowercase kind keys the send path reads. (Related: [[project-notify-push-dead-store]].)
2. **Manager Time Sheets persists nothing — HIGH.** `time-sheets/TimeSheetsView.tsx` reads the `TIMESHEETS` seed; approve/flag and **Export → Payroll** mutate only a local `override` Map + `toast.success(...)` — nothing is written, no CSV/API is emitted. A real `timesheets` table already backs `/m/timesheets`. **FIX:** read org-scoped `timesheets`, wire the FSM server action, emit the real payroll export.
3. **Daily Report shows fabricated safety data as a real record — HIGH.** `daily-report/DailyReportView.tsx` renders ops-seed `SHIFT_NOTES`/`OPS_REPORTS`/`DELIVERIES`, including a live-styled **"Open Incidents"** danger count, as a filable operational handoff. **FIX:** back with org-scoped reads (`shift_notes`, incidents, deliveries).

---

## P1 — Stubs presented as working features

- **viewengine ShareSheet Export/Advanced panels (KIT-LEVEL, every normalized surface)** — `viewengine.tsx:672-709`: every export/print/embed/API row is `onClick={onClose}`, advanced toggles are `set={()=>{}}`, captions fabricated (`Daily · 07:00 to 3 recipients`). `viewengine.tsx:614` mints a fake share link (`atlvs.pro/s/…-8f2a1`). **FIX:** wire real export/schedule/webhook + a server-minted share token, or gate the panel as coming-soon.
- **ToolSheet fabricated live data** — `ToolSheet.tsx:349-378`: "Venue Weather" (`82°`, `9 mph ESE`) and Radio Channels ("you're on Ch 4") render hardcoded consts as the user's live state. **FIX:** wire real sources or drop the "yours/you're on" claims.
- **forms.ts demo options as real choices** — `forms.ts:143,189,195,203,223,270`: `swap.shift`, `access.supervisor`, `message.to`, `handover.relief`, `reassign.to`, `invite.target` ship hardcoded demo people/shifts/orgs (cost-code/company fields correctly inject `options:[]` at mount; these don't). **FIX:** inject real org-scoped options at mount.
- **CompvssOnboarding** — `Math.random()` fake single-use QR (retired by `RoseCard`) captioned "single-use, refreshes on open"; `DEMO_OFFER` ("GHXSTSHIP"/"Mara Voss"/"$32/hr") shown as the user's real First Assignment via `offer ?? DEMO_OFFER`; dead Terms/Privacy `<span className="link">` (no href); unregistered KIcon names `Bluetooth`/`Infinity`/`DollarSign` silently degrade to `HelpCircle`. **FIX:** real scan code or drop the claim; empty-offer state; real anchors; register the icons (or use `Banknote`/`Repeat`).
- **feed dead foot-actions** — `FeedView.tsx:226-231`: Comment button renders a hardcoded `0` count, Share button has no handler. **FIX:** wire or remove.
- **referrals dead "Share" CTA** — `ReferralInvite.tsx:42` (no onClick). **templates "Use Template"** — `templates/actions.ts:114` only bumps a usage counter (`config` always `{}`), never instantiates. **finance Sync** — `FinanceSyncButton.tsx:20` toast-only "Synced To Accounting/ERP" asserting a write that didn't happen. **Aurora** — canned fabricated data (documented roadmap).

---

## P1 — 3NF / SSOT violations

- **`src/lib/mobile/ops-seed.ts` is the root cause** — ~9 surfaces render Pirates fixtures as live field ledgers: Reports, Inspections, Logistics, Docks, Gate, Delivery, Travel, Permits (+ Daily Report, Time Sheets above) + `hub-metrics.ts`. Documented kit-33/34 roadmap ("until backing tables land, render the seed VERBATIM"). **FIX:** land backing tables + org-scoped reads; retire `OPS_*`.
- **AdvancesView `KIND_LABEL` diverged from the `catalog-kinds.ts` SSOT** — `AdvancesView.tsx:20`: `catering:"Catering"` (SSOT `"Catering item"`), `travel:"Travel"` (SSOT `"Travel itinerary"`), `labor:"Labor"` (SSOT `"Labor booking"`). The "can't import server-only" comment is stale — `catalog-kinds.ts` is the client-safe split. **FIX:** import `CATALOG_KIND_LABEL_SINGULAR`, delete the local map. (Also `KIND_ICON`/`STATE_TONE` duplicated across AdvancesView + the detail page.)
- **connections dead duplicate query** — `connections/page.tsx:96-134`: a second `crew_members` read (aliased "workforce") can never add a suggestion the first didn't; the merged-table comment is stale. **FIX:** drop it.
- **roster letter-state `status` smell** — `offer_letters_resolved` view exposes a column literally named `status` (base table is `letter_state`); `roster/page.tsx` + `reporting/page.tsx` read `l.status`. Plus `EXTENDED_STATE_LABEL`/`LETTER_STATE_TONE` duplicated between mobile + console. **FIX:** alias the view column to `letter_state`; hoist one shared label/tone map.
- **notifications relativeTime fork** — `notifications/page.tsx:48` hand-rolls `Date.now()` buckets instead of `getRequestFormatters().relative`. **AssetsView** field id `"status"` vs AdvancesView `"state"` (LDP prefers `state`).

---

## P2 — Antipatterns (correctness-adjacent)

- **Em-dashes in surfaced copy** (runtime-composed, missed by the literal sweep): `feed/page.tsx:175` (`\` — ${a.body}\``), `expenses/actions.ts:141` (stored description), `AccountActions.tsx:42,125`, `FinanceSyncButton.tsx:29`.
- **`mileage/new/page.tsx:23`** — `new Date()` in a client render `defaultValue` (#418 live-date-in-render). **FIX:** stable placeholder + effect.
- **money bypasses the formatter** — `scheduler/SchedulerView.tsx:512` (`toFixed` + hardcoded `$`), `market/MarketView.tsx:39` (inline `Intl.NumberFormat`), `MarketView.tsx:100` (`flash()` reimplements `useToast`).
- `ConnectionsView.tsx:62` manual `useCallback`/`useMemo` fighting the React Compiler; `ShiftNoteForm.tsx:26` magic-string `=== "As Manager"` (breaks when localized).

---

## P3 — Cosmetic / low (bulk)

- **Sub-11px UI text** (breaks the type floor): `MyShifts:80` (9.5), `changelog:87` (9), `MetricBar:74` (9), `RoseCard` (7.5–10), `ToolSheet:358` (10).
- **Off-grid px / radii** pervasive in kit + inline styles: `fontSize:13.5` (finance/page, AccountActions, about, SchedulerView, RecordDetail), `borderRadius:9/14`, off-grid paddings/gaps/dims across HomeShell, ApprovalsQuickSheet, GroupedList, ItemUnits, blocks, viewengine.
- **Non-token colors**: `rgba(255,255,255,.6/.7/.75)` (MyShifts, referrals), bespoke Rose-card hex gradients (`RoseCard`, duplicated inline in CompvssOnboarding), `#fff` fallback (`emergency/data.ts:126`).
- **i18n gaps** (hardcoded English, outside the 3 categories but real): FieldDef labels in Activity/Catalog/DailyReport, HomeShell aria-labels, SearchClient scopes, Aurora chat strings, mileage form.
- **Defence-in-depth**: `emergency/{data,page}` project/guide reads rely on RLS without an explicit `.eq("org_id")`.

---

## Notes

- The codebase is **exceptionally clean** — the guards (`capture-honesty`, `self-sufficiency-manifest`, voice/type/spacing/soft-delete CI tests) actively enforce anti-fabrication, and no machine-checkable antipattern survives.
- The dominant real theme is **`ops-seed.ts` mock-as-real** (documented roadmap, ~9 surfaces) and a handful of **genuine persist-nothing stubs** (P0.2, P1 ShareSheet/ToolSheet/templates/finance) that *look* functional but write nothing — those, plus the **notification-matrix key mismatch (P0.1)**, are the highest-value remediations.
- Per-source counts: ~91 findings (0 machine-sweep; ~30 antipattern, ~22 3NF/SSOT, ~24 stub, remainder cosmetic). Full per-file detail in the 10 auditor transcripts.

---

## Remediation status (2026-07-21)

Fixed + validated (tsc 0 · full vitest 1772/1772), across 4 commits:

**All genuine functional defects + fabricated-data surfaces:**
- ✅ **P0.1** Notification preferences re-keyed by real `PushKind` (toggles now gate push).
- ✅ **P0.2** Manager Time Sheets: real `timesheets` read + the shared `decideTimesheet` FSM (approve/flag) + real CSV export — no more seed/local-Map/fake-toast.
- ✅ **P0.3** Daily Report: real today's `shift_notes` + real open-incident count — no fabricated safety data.
- ✅ KIcon Bluetooth/Infinity/DollarSign registered (were degrading to HelpCircle).
- ✅ SSOT: AdvancesView → `catalog-kinds` SSOT; connections dead-dup query removed; notifications → `fmt.relative`.
- ✅ Dead affordances: feed Comment/Share removed; referrals Share → `navigator.share`; FinanceSync honest.
- ✅ Antipatterns: mileage `#418` date; scheduler money → `fmt.money`; ShareSheet Print → real `window.print()`.
- ✅ Fabrication tells: ToolSheet weather flagged sample, radio drops fake "you're on Ch 4"; onboarding dead Terms/Privacy → real `/legal/*` anchors, pass-QR caption no longer claims false single-use rotation.
- ✅ ~8 UI em-dashes → middot/periods.

**Remaining — scoped feature-builds, not quick fixes (documented kit roadmap):**
- **`ops-seed.ts` ledgers (8 surfaces)** — Reports/Inspections/Logistics/Docks/Gate/Delivery/Travel/Permits render seed rows. Real fix = 8 backing tables + resolvers + seed (a feature comparable to the reports/documents systems); emptying them instead would break the kit-34 e2e (which asserts rows). Documented ("render the seed VERBATIM until backing tables land").
- **forms.ts demo selects** (swap/access/message/handover/reassign/invite) — need real org-scoped option injection at mount (like cost-code fields).
- **ShareSheet Export/Advanced** — real export needs the view's data threaded through every caller + an export/share-token backend.
- **onboarding `DEMO_OFFER`** — the null-offer path needs an empty-state restructure. **Aurora** canned responses — pending the heybrio agent runtime.
- **Cosmetic** (sub-11px fonts, off-grid px, non-token bespoke card gradients, i18n label gaps) — prototype-fidelity choices, not test-failing; changing font/spacing blindly risks visual regressions, so deferred to a browser-verified pass.
