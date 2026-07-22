# UI/UX Canonization Audit — Master Inventory + Remediation Strategy

**Date:** 2026-07-22 · **Status: RATIFIED 2026-07-22 — remediation IN PROGRESS.**

**Owner rulings (2026-07-22):**
1. State.error mechanism: APPROVED as recommended — error CODES returned from
   server actions, client-side t() mapping renders them.
2. DataView vs DataTable: **OPTION B RATIFIED (2026-07-22)** — bless
   `views/DataView` as the one canonical collection surface (ADR-0006
   affirmed) and migrate all DataTable importers to it. Executed as a
   phased program (risk containment for the 268-site refactor):
   **B0 · Harden**: absorb/retire the same-named `ui/DataView` trap; bring
   `views/DataView` to full API parity with DataTable (columns, numeric/
   sticky/zebra, sorting, rowHref, skeleton/empty states, i18n-routed
   defaults, a11y) and apply the W2 root-cause fixes (IBM Plex data face +
   tabular-nums) natively so migrated surfaces land correct-by-default.
   **B1 · Pilot**: migrate a representative ~12-surface slice (finance +
   projects + people; numeric/sticky/zebra + record-tab cases), e2e + visual
   verification, harvest API gaps back into B0.
   **B2..n · Fan-out**: batch by module tree, one agent per tree, per-batch
   gates (tsc · vitest · render-e2e for that tree).
   **B-final · Ratchet**: guard forbids new DataTable imports; DataTable
   deleted when importers hit zero. Interim: the DataTable.tsx:305 mono-face
   bug still gets fixed NOW in W2 (the migration is long; the live bug
   doesn't ride).
3. Zero-consumer primitives: identified + confidently dispositioned below —
   ADOPT Divider (absorb AuthDivider) and ADOPT kit-ai.css (it is ratified
   v8.1 canon and Aurora AI is now a first-class identity; wire
   CopilotPanel/ConversationPanel/AuroraChat onto it); DELETE the other 14
   (ButtonGroup, Carousel, DatePicker, DescriptionList, MediaCard, Meter,
   NumberInput, PinInput, RadioGroup, RecordHeader, RoleControl, Slider,
   TimePicker, UploadZone) — native-control canon covers date/time/number/
   radio inputs, ProgressBar covers Meter, git history is the registry.
4. Stale seed hexes: RE-SEED to current canon.
5. UI label: "Status" everywhere in copy; LDP keeps governing schema names.

Six read-only lane audits walked 100% of the UI-bearing codebase (~2,106
files) against the shared checklist (CHECKLIST.md — 9 canon classes). Lane
detail lives in the six `lane-*.md` reports beside this file; this document
is the cross-lane synthesis and the execution plan.

| Lane | Files | Deduped findings | Report |
|---|---|---|---|
| A · marketing / auth / personal | 204 | 20 | lane-a-marketing-auth-personal.md |
| B · studio core | 290 | 18 | lane-b-studio-core.md |
| C · studio ops | 596 | 28 | lane-c-studio-ops.md |
| D · COMPVSS mobile + kit | 395 | 12 | lane-d-compvss.md |
| E · portal / legend / token surfaces | 324 | 22 | lane-e-portal-legend.md |
| F · shared vocabulary + theme layer | 297 + 15 CSS | 27 + 6 guard holes | lane-f-shared-vocabulary.md |

Overall shape: the newest, most-remediated surfaces (COMPVSS, the auth
suite, charts, FilterBar) are near-canon; the debt concentrates in (1) a
handful of LIVE rendering defects, (2) six cross-lane systemic patterns
that each admit a single root-cause fix or one mechanical sweep, and (3)
a component vocabulary that forked faster than it was adopted.

---

## P0 · Live defects (broken for users today — fix immediately, no review dependency)

| # | Defect | Where | Evidence lane |
|---|---|---|---|
| P0-1 | 14 `/me` pages consume undefined tokens (`--color-text-secondary`, `--brand-color`) + deleted classes (`text-label`, `card-elevated`) — 116 dead CSS lines; hierarchy/accents/cards visibly broken | (personal) marketplace-era pages | A |
| P0-2 | Retired `.data-table` class, CSS deleted → 3 tables render unstyled | sales/diary, sales/beos/[id], box-office GuestRoster | B |
| P0-3 | `var(--border-default)` undefined on the live `/offer` page; + duplicate `--p-text-2` property in the offer print palette | offer print/palette blocks | E |
| P0-4 | Undefined `btn-xs` class silently no-ops | 3 studio-ops files | C |
| P0-5 | Brand-kit foundations page publishes the RETIRED house-green accent hex for all products and omits LEG3ND | /brand-kit/foundations | A |
| P0-6 | `CartItemRow` silently swallows server-action errors in store checkout | GVTEWAY store | A |
| P0-7 | Timesheet push deep-link opens relative `/studio/...` on the compvss SW origin (wrong host) instead of `urlFor("platform", …)` | mobile push payload | D |
| P0-8 | `CookieConsent` `z-[60]` sits below the nav ladder step (200) — can render under the nav | shared | F |
| P0-9 | BrandingForm seeds off-canon `#DC2626` default accent | legend hub brand | E |

Effort: one focused wave, ~1 day of agent fan-out. Zero design decisions
required.

## Systemic waves (each is one root-cause fix or one mechanical sweep)

**W1 · CSS foundation first (unlocks everything else).**
`atlvs-product.css` dual-scopes 237 rules (`[data-ui="saas"], [data-theme=…]`)
creating a (0,2,0) specificity floor — the exact fight the /aurora ghost
button lost. Adopt `@layer` for the theme stack (tokens → theme → kits →
page), collapse the redundant twin selectors, and close the 6 documented
guard holes (hex-in-TSX blind spot, overlay z allowlist, mirror containment,
voice-guard scope, maturity-without-adoption, heading-ramp bypass). Also the
decide-intent item: kit-ai.css has zero consumers.

**W2 · Typography ramp conformance.** Root causes first: `DataTable.tsx:305`
composes the wrong mono face (one line; cascades to 539 uses/166 files —
Space Mono where IBM Plex data face + tabular-nums belongs) and
`ModuleHeader`'s own h1 is off-ramp (one component; every /studio page).
Then the mechanical sweep: ~190 hand-rolled eyebrows/headings (108 portal/
legend + 39 studio-core + 44 marketing) onto `.eyebrow`/bare headings, and
the 234 `text-[11px]` floor-riders normalized to the sanctioned tokens.

**W3 · Voice sweep (em-dashes + drifted fallbacks).** ~250 remaining em/en
dash strings (163 lane-A lines, 62 shared-component strings — several being
t() fallbacks that drifted from already-cleaned catalog values — ~25 legend)
restructured per the standing rule, then the voice guard's scope extended to
components/ + all shells so the class can never regrow (currently it only
scans messages/(marketing)/(platform)).

**W4 · i18n completion (app shells).** The marketing surface is done (this
week); the app shells are not: legend shell 12/121 files use t(), studio ops
~90 files, studio core ~30 files hardcoded EN, AuroraChat, MobileAppBar aria
labels, and kit list chrome with no translatable override props. One
program-level decision needed from the owner: **server-action `State.error`
strings** (82/153 studio actions return hardcoded English) — recommend
error-code returns + client-side t() mapping, decided once, applied
mechanically.

**W5 · Vocabulary consolidation (decide, then converge).** The fork points:
`views/DataView` ("the ONE canonical collection surface", 2 importers) vs
`DataTable` (268 importers) + a same-named ui/DataView; duplicate
RecordActionButton/FormField/ActivityTimeline pairs; 15 zero-consumer ui
primitives; 22+4 files hand-cloning `.ps-input`; 19 hand-styled buttons;
`Skeleton` losing 25:2 to raw `.ps-skel`; onboarding's ~100-line RoseCard
clone. Each needs a one-line owner ruling (adopt / retire), then mechanical
convergence.

**W6 · A11y floor.** 62 studio form files without `htmlFor`/`id` pairing;
drawer dismissability drift (4 COMPVSS sheets bypass the kit `Sheet`, studio
roster drawers lack Escape/focus-trap); 9 one-click unconfirmed destructive
deletes brought onto `DeleteForm` (38 siblings already conform).

**W7 · Interaction-pattern debt.** `loading.tsx` regression: the newest
kit-34 COMPVSS surfaces shipped without the boundary the 07-21 wave added
(18 routes) + 9 studio-core modules + 3 studio-ops trees; the Status/State
label split (67 "Status" vs 38 "State" for `*_state` columns — pick "Status"
as the human word, keep LDP for schema); token print surfaces hand-copy
private palette blocks (make one shared print-palette partial).

## Decide-intent items for the owner (blocking their waves only)

1. **State.error i18n mechanism** (W4): error codes + client t() map
   (recommended) vs t() in server actions.
2. **DataView vs DataTable** (W5): bless views/DataView and migrate, or
   retire the aspiration and canonize DataTable. Recommendation: canonize
   DataTable (268 importers is the vote), fold DataView's view-switching
   into it incrementally.
3. **Zero-consumer primitives + kit-ai.css** (W1/W5): keep-as-runway vs
   delete-until-needed. Recommendation: delete-until-needed; the registry
   is git history.
4. **Stale pre-v8.0 seed hexes** in proposal/branding defaults (B/E lanes):
   re-seed to current canon or leave historical rows.
5. **Status vs State** display label (W7): recommendation "Status" in UI
   copy everywhere (LDP naming governs schema, not labels).

## Execution shape (after owner review)

- **Order:** P0 wave immediately → W1 (foundation + guards) → W2/W3/W6/W7
  in parallel (disjoint file sets, one agent per lane-sized slice, the same
  orchestrator-owns-shared-files discipline used all program) → W4 and W5
  after their decisions land.
- **Ratchets:** every wave ends by extending/adding the corresponding guard
  (voice scope, heading-ramp, hex-in-TSX, overlay allowlist, loading.tsx
  presence, htmlFor pairing) so no class can regrow — the audit found that
  every past remediation that shipped WITH a guard held, and the two that
  didn't (loading.tsx, drawer grammar) regressed within one kit cycle.
- **Verification:** per-wave full gate (tsc · eslint · complete vitest ·
  sitemap/IA) + preview screenshots for the visually-affected slices +
  detached-worktree build before each push.
- **Reference implementations** (named by the lanes, used as the pattern
  source in agent briefs): FilterBar, charts/*, copilot page, ConsoleChat,
  my-work, safety/lost-found, workforce/time-off, TransitionControl,
  SignIcon/SignPanel, GuideView, the COMPVSS Sheet + 44px touch-floor
  technique, the (auth) form suite.

## Canon-positive (verified clean, no action)

Zero retired-vocabulary reappearance outside P0-2 · zero hardcoded
cross-shell URLs except P0-7 · filter-pills-never-status fully conformant
in all lanes · signage two-color rule passes everywhere · kit-20 rail
untouched · 4px grid near-perfect (one `[13px]` in EventSpine) · no emoji
anywhere · COMPVSS font floor holds.
