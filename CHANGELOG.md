# Changelog

All notable changes to **ATLVS Technologies** (repo `flyingbluewhale`) are recorded here.

This log tracks both the **design system** (tokens, themes, typography, primitives, brand
assets) and the **platform** (shells, schema, routes, integrations) going forward. The
format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions track the
design-system kit line (v7.0 Monument 2.0 → v8.0 palette-lock → v8.1 OKLCH). Dates are
ISO-8601. Design-system versions are the unit of record; platform work lands under the kit
version current at merge.

## [Unreleased]

### Added
- Governance docs to close the design-system inventory gaps: this `CHANGELOG.md`, the
  terminology `GLOSSARY.md`, the `MICROCOPY.md` playbook, `PHOTOGRAPHY.md` direction,
  `CLEARSPACE.md` logo rules, and the `DO-DONT.md` gallery (`docs/design-system/`).
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
