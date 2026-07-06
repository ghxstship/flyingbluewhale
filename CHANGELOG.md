# Changelog

All notable changes to **ATLVS Technologies** (repo `flyingbluewhale`) are recorded here.

This log tracks both the **design system** (tokens, themes, typography, primitives, brand
assets) and the **platform** (shells, schema, routes, integrations) going forward. The
format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions track the
design-system kit line (v7.0 Monument 2.0 → v8.0 palette-lock → v8.1 OKLCH). Dates are
ISO-8601. Design-system versions are the unit of record; platform work lands under the kit
version current at merge.

## [Unreleased]

### Changed
- **v8.1 parity landing (kit 23 · `REPO_PARITY_HANDOFF`)** — bring the repo's token
  plumbing up to the kit's reconciled v8.1:
  - **Radius → v7.9 "machined" micro-scale** (`r-sm 2 · r 3 · r-md 4 · r-lg 6 · r-xl 10 ·
    r-pill 999`, was `6/8/10/12/16`) across `tokens.json#radii`, `atlvs-product.css`
    `--p-r-*`, and the `globals.css @theme inline` shim (large radii no longer collapse to
    `r-lg`). Modals/drawers already ride `--p-r-xl` (now 10px).
  - **Breakpoint `sm` → 480** in the `globals.css` Tailwind mirror (was the Tailwind
    default 640; SSOT `--bp-sm` was already 480), and the `.metric-grid-3/-5` `@media`
    literals moved with it. `.page-content` / `.module-header-inner` max-width routed to
    `var(--p-content-max)` (1200px, was 80rem/1280).
  - **Elevation → full 5-step utility ladder** (`.elevation-xs` + `.elevation-2xl` added;
    `.elevation-4`/`-float` now alias `-2xl`), matching the kit's 5-step token scale.
  - Cold-start `:root` comment corrected (ATLVS volcanic-red house accent; house green is
    retired for UI).
  - `tokens.json` stamped with `typeSystem`/`radiusSystem` for the mirror guard.

### Fixed
- **Document engine correctness pass (kit 25 · `design_handoff_document_engine`)** — the
  29-template document system was already at parity (format layer, white-label brand modes,
  merge contract, `DocToolbar` brand+merge controls); this cycle lands the two outstanding
  fixes:
  - **Cover title contrast** (`kit-documents.css`): `.doc-cover h1` now sets `color:var(--p-bg)`
    (+ new `.doc-cover--accent h1{color:var(--p-accent-contrast)}`). The `@layer base`
    `[data-theme="atlvs-product"] h1{color:var(--p-text-1)}` element rule was overriding the
    inherited light cover color, rendering titles dark-on-dark.
  - **Print page-break rules** (`kit-documents.css`): `break-inside:avoid` now also covers
    `.doc-phase` steps and individual `.doc-table tr` rows, and `thead{display:table-header-group}`
    repeats table headers on each printed page — aligning the print/PDF artifact to the kit.
  - **App-aware wordmark** (`kit-documents.css` + both renderers): the cover + letterhead
    wordmark now reflects the OWNING app (ATLVS · COMPVSS · GVTEWAY · LEG3ND) instead of a
    hardcoded "ATLVS" on every document (README §0.2). `--ob-name` defaults per `data-product`
    and the cover routes through `.doc-wm::after{content:var(--ob-name)}`; co/white still
    override `--ob-name` with the issuing org's name, so the white-label layer is unaffected.
    Both `render-html.ts` and `DocEngine.tsx` now emit an empty `.doc-wm` span. Guarded by
    new tests in `render-html.test.ts`.
  - Verified full template parity against the kit registry (all 29 templates): block structure,
    every heading/eyebrow/doctype, table columns, kv keys, and the 221-path merge contract are
    identical; and every `--p-*`/`--ob-*`/`--cl-*` token the format layer uses resolves. So the
    templates already match the kit; the items above are the format-layer + wordmark deltas.
  - **Eyebrow/heading de-dups** (`registry.ts`): headings no longer restate their eyebrow —
    Proposal §06 "Investment summary." → "What it costs."; §07 "Terms of engagement." → "How we
    bill."; Offer Letter §03 "Compensation & reimbursement." → "Pay & reimbursement."; Agreement
    Terms "Terms & conditions." → "What both sides agree to."

### Added
- **Unified Schedule (CP·3 + CP·4 · `REPO_UNIFIED_SCHEDULE_HANDOFF`)** — promotes the
  read-only Dispatch Matrix into the writable operational timeline at
  `/studio/operations/schedule`. Unions the `events` schedule store (typed activities) with
  shifts (crew), dispatch_runs (fleet), reservations (spaces), maintenance_jobs (asset service
  windows) and tasks onto one hour grid, grouped by lane kind; accepts `?day/lane/kind/state`
  deep-links. `operations/dispatch` now 301s here (sitemap-EXEMPT); a `Dispatch` rail item
  lands in the Operations group. **Drag-to-reschedule** (`ScheduleBlock.tsx`): events-sourced
  blocks drag horizontally (15-min snap) and commit via the reschedule action with the
  guardrail warn→override confirm inline.
  - **Store decision:** the facets land on **`events`** (the real "One Schedule Store"), not
    the CPM `schedule_activities` the handoff named — backfilling shifts/reservations into the
    baseline store would duplicate those nouns (violating the 3NF law the handoff invokes) and
    can't satisfy its NOT NULL `baseline_id`/`code`/`duration_days`. Migration
    `20260706183521_unified_schedule_events_facets` adds the `location_kind` enum +
    `location_kind`/`resource_ref` columns + two indexes, and extends `schedule_event_kind`
    with `rehearsal`/`changeover`. **No backfill / no duplication** — operational stores stay
    canonical and are read-projected onto the timeline.
  - **Guardrails (CP·4):** `src/lib/schedule/guardrails.ts` — expired-credential + cross-location
    double-book (block), minimum-rest + fair-workweek cap (warn); enforced in the create/
    reschedule server actions before write and surfaced as an in-grid digest. Guarded by
    `guardrails.test.ts`.
  - **Crew-writable:** migration `20260706183539_unified_schedule_events_rls_crew_grant` admits
    `crew` to the `events` insert/update bands (same app-vs-RLS inversion fixed for the
    compvss-field surfaces); guarded by `src/lib/schedule-rls-crew-canon.test.ts`. DELETE stays
    owner/admin.
  - Entry points: "Open in Schedule" actions on all six source surfaces — rosters,
    shift-swaps, deployment, call-sheets, reservations, maintenance (+ "Open in Timeline" on
    the programs Master Schedule), each deep-linking its lane/kind/state lens.
- **`src/lib/theme/kit-mirror.test.ts`** — repo⇄kit drift guard: pins the machined radii,
  kit breakpoints, 5-step elevation, and version stamp across all three token sources.
- Governance docs to close the design-system inventory gaps: this `CHANGELOG.md` (repo
  root); the terminology `GLOSSARY.md`, the `MICROCOPY.md` playbook, `PHOTOGRAPHY.md`
  direction, and `CLEARSPACE.md` logo rules (`docs/brand/`); and the `DO-DONT.md` gallery
  (`docs/design-system/`, alongside `INVENTORY.md`).
- Brand visual library: tiling patterns (`grid`, `dots`, `diagonal`) and geometric spot
  art (`waypoint`, `signal`, `build`) under `public/brand/`, plus a brand-asset index
  (`public/brand/README.md`).

## [8.1] — 2026-06-24 — OKLCH

OKLCH design-system upgrade (kits 5+6) + full e2e suite remediation.

### Added
- OKLCH color seeds in `atlvs-product.css` with an sRGB mirror in `tokens.json`; the
  `--p-*` accent ramp derives per product from the OKLCH source.
- Data-viz sequential (`--chart-seq-1..6`) and diverging (`--chart-div-*`) ramps for
  single-hue and danger↔neutral↔success scales.
- Token-layer completion to inventory spec: border-width scale (`--p-border-width-*`),
  opacity scale (`--p-opacity-*`), aspect-ratio tokens (`--p-ar-*`), named gradients
  (`--p-gradient-*`).

### Changed
- COMPVSS `--p-accent-text` darkened to clear AA 4.5 on the `#F7F8FA` page background
  (4.40 → 4.64); `tokens.json` mirror + contrast pair synced.
- Home `/about` inline link switched to `underline` (no longer color-only) for axe a11y.

### Fixed
- E2E suite remediated end-to-end (49 failures → 0): `/console` → `/studio`, stale copy and
  routes, retired COMPVSS surfaces, handoff guide markers, the `/m` onboarding gate.
- `tg_action_item_to_task` meeting trigger repaired (2 production defects).

## [8.0] — 2026-06-24 — Palette-locked

Each product OWNS its accent; the GHXSTSHIP house accent is ATLVS volcanic red.

### Changed
- Per-product accent ownership: ATLVS volcanic red `#E23414`, COMPVSS signal yellow
  `#FFC400`, GVTEWAY blue `#2563EB`, LEG3ND molten orange `#ED6A1E` (+ extension accents
  CVRGO cyan, OPVS violet, GVLLEY magenta, Vault → ATLVS red).
- House / marketing default accent set to ATLVS volcanic red `#E23414`; the `ghxstship`
  accent token now mirrors the AA-certified ATLVS-red ramp. The `(marketing)` shell carries
  `data-product="ghxstship"`.
- All 46 `tokens.json#contrast` pairs recertified at AA (text/cta 4.5:1, focus 3:1).

### Removed
- The house green `#2EDB3A` (poor light-mode legibility) and the prior v8.0 mono-green
  experiment that unified all accents — superseded by per-product ownership.

### Added
- Tier 1+2 domains, IA wiring, DB optimization, XPMS cost-centers, festival demo seed.

### Removed (prior)
- The cosmic GHXSTSHIP token export (Big Shoulders / Space Grotesk / Silkscreen / void-ink
  palette / RRR project IDs) and the `/ghxstship` cosmic route — purged from the brand kit.

## [7.0] — Monument 2.0

Type + foundation normalization on top of v6.4.

### Changed
- Typography ratified as **MONUMENT 2.0**: Anton (display/headings, ALL-CAPS via
  `--p-display-case`) + Hanken Grotesk (body/UI) + Space Mono (eyebrows/labels) + IBM Plex
  Mono (data face for record IDs, code, table data) + Jost (wordmark lockup only).
- **Anton ceiling**: Anton drives display + `h1`/`h2` only; `h3`/`h4` drop to Hanken
  Grotesk 700, sentence case.
- Functional-mono split: Space Mono stays the eyebrow/label voice; IBM Plex Mono
  (`--p-mono-data`) is the data face. Metric values render in Hanken Grotesk 800 tabular.
- Foundation: 12-step neutral ramp (`--p-neutral-0..1000`), derived per-product accent ramp
  (`--p-accent-50..900`), paired type metrics (`--p-lh-*` / `--p-tracking-*`), completed 4px
  spacing scale, 5-step elevation (`--p-elev-xs..2xl`), semantic-collision retune with AA
  `--p-{semantic}-text` inks.

### Removed
- The v2 "Industrial Wide" stack (Archivo + Space Grotesk) plus Inter / JetBrains Mono —
  retired and guarded by `src/app/design-system.test.ts`.
