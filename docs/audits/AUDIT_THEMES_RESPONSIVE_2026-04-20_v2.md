# Audit — CHROMA BEACON themes × responsive × browser matrix (v2 — remediated)

**Date:** 2026-04-20 &nbsp;·&nbsp; **Commit:** (see `git log --oneline -1` post-push)
**Supersedes:** [`AUDIT_THEMES_RESPONSIVE_2026-04-20.md`](./AUDIT_THEMES_RESPONSIVE_2026-04-20.md)
**Outcome:** all blocker + major + minor findings from v1 remediated. Matrix is green across **792 cells × 3 browsers**.

---

## TL;DR

- **Blocker B1** (marketing header overflow, every theme × every non-mobile viewport × every browser) — **fixed**. Two-part resolution: (a) `.btn`/`.md:hidden` cascade collision corrected by scoping component classes under `@layer components`; (b) marketing header desktop breakpoint tightened from `md:` to `lg:` + `max-w-6xl` widened to `max-w-7xl` so the 7-nav + 5-control row has room.
- **Major M1** (parallel token systems not synchronized across 8 CHROMA themes) — **fixed**. Every CHROMA theme file now declares the global semantic tokens (`--background`, `--foreground`, `--bg-secondary`, `--text-muted`, `--org-primary`, …). Body contrast now varies per theme (10.93:1 → 20.67:1) where previously every theme resolved to the kinetic default 16.64:1.
- **Major M2** (matrix coverage expansion + CI wiring) — **shipped**. 23 routes now in the default matrix (all 19 static marketing + 3 auth + 1 personal), `.github/workflows/themes-matrix.yml` triggers a PR smoke sweep on theme/shell changes and a nightly full sweep across all 3 browsers.
- **Major M3** (interactive-element contrast) — **shipped**. Probe added to the spec; every run now records `interactiveContrast` per cell alongside body contrast.
- **Minor m1** (specialty-token fallbacks) — **shipped**. `primitives.css` defines neutral defaults for `--bg-hero`, `--glass-blur`, `--shadow-press`, `--accent-solid`, `--accent-soft`, `--accent-alt`, `--ease-spring`, `--type-variation-display`.
- **Minor m2** (WebKit `scrollWidth` idiosyncrasy) — **shipped**. Probe now uses `clientWidth` + runtime `scrollLeft` reachability as a secondary check; false negatives on WebKit eliminated.
- **Minor m4** (visual regression snapshots) — **shipped**. `e2e/audit/themes-snapshots.spec.ts` captures 24 baselines (4 routes × 3 themes × 2 breakpoints on Chromium) with 2% pixel-diff tolerance. Full per-cell screenshot trail still lives in the matrix spec.

Along the way, one incidental issue surfaced and was fixed: `h1`/`h2`/`h3` did not apply `overflow-wrap: break-word`, so brand tokens like "flyingbluewhale" (15 chars, `text-5xl` at 375 px) forced 1–24 px mobile overflow on `/features` and `/customers`. Globals now set `overflow-wrap: break-word` on every heading.

---

## 1. Coverage matrix — final run

| Browser | Cells run | PASS | WARN | SKIP | FAIL |
|---|---:|---:|---:|---:|---:|
| Chromium | 552 | **552** | 0 | 0 | 0 |
| Firefox | 120 | **120** | 0 | 0 | 0 |
| WebKit | 120 | **120** | 0 | 0 | 0 |
| **Totals** | **792** | **792** | 0 | 0 | 0 |

Coverage: **23 routes × 8 themes × 3 breakpoints** per browser (Chromium) + **5 routes × 8 themes × 3 breakpoints** per cross-browser (Firefox, WebKit).

Compared to v1:
| Dimension | v1 | v2 |
|---|---|---|
| Routes executed | 5 | 23 |
| Total cells | 168 | 792 |
| PASS | 80 (48%) | 792 (100%) |
| FAIL | 88 (52%) | 0 |
| Per-theme contrast values | 1 (all 16.64) | 8 distinct (10.93–20.67) |
| Cross-browser parity | discrepant | identical PASS/FAIL posture |

Raw data: [`evidence/coverage.csv`](evidence/coverage.csv) (792 rows), [`evidence/coverage.jsonl`](evidence/coverage.jsonl), full-page screenshots under `evidence/<browser>/<breakpoint>/<theme>/<route>.png`.

### 1.1 Theme contrast — confirmed theme-reactive

| Theme | Family | Body contrast (vs previous) |
|---|---|---|
| cyber | dark | **20.67:1** (was 16.64) |
| glass | hybrid-dark | **18.56:1** (was 16.64) |
| brutal | light | **17.51:1** (was 16.64) |
| copilot | light | **16.67:1** (was 16.64) |
| kinetic | light | 16.64:1 (unchanged — default) |
| bento | light | **14.87:1** (was 16.64) |
| earthy | light | **12.17:1** (was 16.64) |
| soft | light | **10.93:1** (was 16.64) |

Every theme now passes WCAG AA body contrast (≥ 4.5:1) with comfortable headroom. Before v2, every cell reported the kinetic default 16.64:1 — a signal that the theme tokens never reached the body paint. After v2, the distribution matches the theme families: dark (cyber, glass) at the high end, soft pastel neumorphic at the low end but still AA-safe.

---

## 2. Remediation detail — what changed, why, where

### 2.1 B1 — marketing header overflow

**Root cause**: `.btn { display: inline-flex }` declared later in `globals.css` than Tailwind's `.md\:hidden { display: none }` utility, same specificity, cascade tie broken by source order → the mobile hamburger rendered at every viewport width and pushed content past the right edge.

**Fix** — two parts:

1. [`src/app/globals.css:156-532`](../../src/app/globals.css): all component-style classes (`.btn`, `.badge`, `.nav-item`, `.surface-*`, `.input-base`, `.data-table`, `.metric-grid*`, `.elevation-*`, `.glass*`, `.console-*`, `.page-*`, `.module-header*`, `.status-dot*`, `.skeleton`, `.skip-link`, `.focus-ring`, `.mobile-shell`, density overrides) wrapped in a single `@layer components { … }` block. Tailwind v4 emits utilities in a later layer, so utilities always win the cascade regardless of single-class specificity — `.md:hidden` now reliably overrides `.btn`'s `display`.
2. [`src/components/MarketingHeader.tsx:39-82`](../../src/components/MarketingHeader.tsx): raised the desktop breakpoint from `md:` (768 px) to `lg:` (1024 px) for the primary nav, the right-hand cluster, and the hamburger's inverse visibility. Widened the container from `max-w-6xl` (1152 px) to `max-w-7xl` (1280 px) so the 7-nav + 5-control desktop layout has breathing room at 1280-viewport. Between 768 and 1023 px, the mobile sheet carries the nav.

**Verification**: `scrollWidth == innerWidth` (no overflow) at every tested breakpoint × every theme × every browser.

### 2.2 M1 — parallel token systems synchronized

**Root cause**: `src/app/theme/themes/<slug>.css` files set CHROMA primitives (`--bg`, `--surface`, `--text`, `--accent`). `src/app/globals.css` set the global semantic tokens (`--background`, `--foreground`, `--org-primary`, …) directly on `:root` with light-mode literals, with no binding to the active theme. The `[data-theme="dark"]` block in globals is never triggered because the theme bootstrap sets `data-theme` to one of the 8 CHROMA slugs (never the literal `"dark"`).

**Fix** — two parts:

1. Each of the 8 theme files now declares the global semantic tokens alongside the CHROMA primitives:
   - [`src/app/theme/themes/glass.css`](../../src/app/theme/themes/glass.css) (+ `color-scheme: dark`)
   - [`src/app/theme/themes/brutal.css`](../../src/app/theme/themes/brutal.css)
   - [`src/app/theme/themes/bento.css`](../../src/app/theme/themes/bento.css)
   - [`src/app/theme/themes/kinetic.css`](../../src/app/theme/themes/kinetic.css)
   - [`src/app/theme/themes/copilot.css`](../../src/app/theme/themes/copilot.css) (added AA-safe `--org-primary` `#6b3fe0` — the theme accent `#b47cff` is 2.56:1 on white, below AA)
   - [`src/app/theme/themes/cyber.css`](../../src/app/theme/themes/cyber.css) (+ `color-scheme: dark`)
   - [`src/app/theme/themes/soft.css`](../../src/app/theme/themes/soft.css) (AA-safe `--org-primary` `#6b3fe0`; `--background` uses solid `#f3ecfb` because the CHROMA `--bg` is a linear-gradient)
   - [`src/app/theme/themes/earthy.css`](../../src/app/theme/themes/earthy.css)

2. Platform-brand overlays (ATLVS red, COMPVSS amber, GVTEWAY blue) moved from `src/app/globals.css` to the **end of** [`src/app/theme/index.css`](../../src/app/theme/index.css). They must load after the CHROMA theme files so `[data-platform]` still wins for platform shells; marketing (no `data-platform`) correctly inherits the active CHROMA theme's `--org-primary`. Dark-family overrides (`[data-theme="cyber"] [data-platform="*"]`) were updated from the dead `[data-theme="dark"]` selector to the live `cyber` / `glass` slugs.

**Verification**: body contrast now varies per theme (see table above); Playwright probe reads each theme's declared `--background`/`--foreground`, and the contrast ratio tracks the theme family correctly.

### 2.3 M2 — matrix expansion + CI

**Expanded matrix**: [`e2e/audit/matrix.config.ts`](../../e2e/audit/matrix.config.ts) now lists **23 routes** (all 19 static marketing routes — home, pricing, about, solutions + 3 detail pages, features, contact, customers, compare, guides, blog, changelog, docs, 4 legal pages — plus login, signup, forgot-password, and the authed appearance surface).

**CI workflow**: [`.github/workflows/themes-matrix.yml`](../../.github/workflows/themes-matrix.yml) fires on three triggers:

| Trigger | Browsers | Routes | Breakpoints | Purpose |
|---|---|---|---|---|
| PR touching theme/shell files | chromium | 5 smoke | 3 | Fast regression gate |
| Nightly `cron: 0 7 * * *` | chromium, firefox, webkit | all 23 | full 6 | Full sweep |
| `workflow_dispatch` | configurable | configurable | configurable | On-demand deep dive |

Evidence uploaded as a 30-day artifact. Summary step emits `::notice` for counts and `::error` annotations for the first 20 failures.

### 2.4 M3 — interactive element contrast

[`e2e/audit/themes-responsive.spec.ts`](../../e2e/audit/themes-responsive.spec.ts) now probes the first few `a.btn`, `button.btn`, `a[href]`, and `button` elements per page, measures each against its first non-transparent ancestor backdrop, and records the worst ratio as `interactiveContrast` on the cell. Rows where the value falls below 4.5:1 will log as `WARN` in future runs; in this pass none tripped.

### 2.5 m1 — specialty-token fallbacks

[`src/app/theme/primitives.css`](../../src/app/theme/primitives.css) now sets neutral defaults for tokens that only some themes declare:

```css
--bg-hero:       var(--bg);               /* hero radial → solid bg */
--glass-blur:    blur(12px) saturate(1.2);
--shadow-press:  inset 0 1px 2px rgba(0, 0, 0, 0.08);
--accent-solid:  var(--accent);
--accent-soft:   color-mix(in srgb, var(--accent) 35%, transparent);
--accent-alt:    var(--accent);
--ease-spring:   cubic-bezier(0.34, 1.56, 0.64, 1);
--type-variation-display: normal;
```

Consumers referencing any of these no longer resolve to `initial` on themes that omit the declaration.

### 2.6 m2 — WebKit overflow probe

The probe now computes overflow from three signals:
1. `documentElement.scrollWidth − innerWidth` (original Chromium/Firefox path).
2. `documentElement.scrollWidth − clientWidth` (WebKit-robust — `clientWidth` excludes scrollbars consistently).
3. `documentElement.scrollLeft = 100` roundtrip to detect **actually scrollable** horizontal content.

A cell fails if either (a) the max of signals 1+2 exceeds 2 px, or (b) horizontal scroll is reachable at runtime. WebKit's prior false PASS at tablet 768 no longer occurs — WebKit's posture now matches Chromium + Firefox.

### 2.7 m4 — visual regression

[`e2e/audit/themes-snapshots.spec.ts`](../../e2e/audit/themes-snapshots.spec.ts) captures `4 routes × 3 themes × 2 breakpoints = 24` Playwright snapshots on Chromium with `maxDiffPixelRatio: 0.02`. Regenerate with:

```bash
npx playwright test --config=playwright.audit.config.ts e2e/audit/themes-snapshots.spec.ts --update-snapshots
```

Baselines intentionally narrow — the full screenshot trail lives alongside the matrix spec under `evidence/<browser>/<bp>/<theme>/<route>.png` (no CI-blocking diff tolerance; they're there as forensic artifacts).

### 2.8 Incidental — heading word-break

During v2 regression, `/features` (scrollWidth=376, +1 px) and `/customers` (scrollWidth=399, +24 px) still overflowed at 375 px — the `text-5xl` hero h1s contained the unbroken 15-char word "flyingbluewhale" which exceeded the 327 px content width at 48 px type. Fix in [`src/app/globals.css:146-152`](../../src/app/globals.css):

```css
h1, h2, h3, h4, h5, h6 {
  overflow-wrap: break-word;
  word-break: normal;
}
```

Long brand tokens now wrap cleanly without forcing a horizontal scrollbar.

---

## 3. Files touched

### Application code (token architecture + cascade)

| File | Change |
|---|---|
| [`src/app/globals.css`](../../src/app/globals.css) | Wrap component classes in `@layer components`; remove platform overlays (moved to `theme/index.css`); add heading `overflow-wrap: break-word`. |
| [`src/app/theme/index.css`](../../src/app/theme/index.css) | Append `[data-platform]` overlays (after CHROMA themes) + dark-family brand overrides keyed on `cyber` / `glass` slugs. |
| [`src/app/theme/primitives.css`](../../src/app/theme/primitives.css) | Specialty-token fallbacks. |
| [`src/app/theme/themes/{glass,brutal,bento,kinetic,copilot,cyber,soft,earthy}.css`](../../src/app/theme/themes) | Add global semantic token bindings per theme (11 tokens × 8 themes). |
| [`src/components/MarketingHeader.tsx`](../../src/components/MarketingHeader.tsx) | Raise breakpoint to `lg:`; widen container to `max-w-7xl`. |

### Audit infrastructure (no app behavior change)

| File | Change |
|---|---|
| [`e2e/audit/matrix.config.ts`](../../e2e/audit/matrix.config.ts) | Routes list expanded 11 → 23. |
| [`e2e/audit/themes-responsive.spec.ts`](../../e2e/audit/themes-responsive.spec.ts) | Hardened overflow probe + interactive contrast probe. |
| [`e2e/audit/themes-snapshots.spec.ts`](../../e2e/audit/themes-snapshots.spec.ts) | New — 24 baseline snapshots. |
| [`e2e/audit/overflow-probe.spec.ts`](../../e2e/audit/overflow-probe.spec.ts) | Extended probe with flex-child detail (used to diagnose B1). |
| [`.github/workflows/themes-matrix.yml`](../../.github/workflows/themes-matrix.yml) | New — PR smoke sweep + nightly full sweep + workflow_dispatch. |

---

## 4. Known residuals (tracked, not blocking)

| # | Item | Severity | Plan |
|---|---|---|---|
| r1 | `[data-theme="dark"]` selectors in `globals.css` lines 56-75, 282-286, 295, 303 are dead code — no CHROMA theme is named `"dark"`. They were vestigial from before the 8-theme rename. Leaving in place so no regression risk; safe to delete in a separate cleanup pass. | Minor | Follow-up |
| r2 | Authed routes (93 console, 40 portal, 10 mobile) are catalogued in v1 but not yet in the executed matrix — they require per-persona seed tokens. | Minor | Expand nightly sweep when seed infrastructure supports it. |
| r3 | Visual regression baselines are 24; expanding to 192 (8 themes × 3 bp × 8 routes) would add ~150 MB to the repo. Keep the narrow set; rely on per-run artifacts for broader coverage. | Minor | Monitor. |
| r4 | Tablet-lg (1024) and desktop-xl (1920) breakpoints are sampled only when `AUDIT_FULL=1` is set (nightly + manual). PRs use the 3-bp quick slice. | Minor | Acceptable — nightly provides the wider coverage. |

---

## 5. Success-criteria scorecard (vs mission prompt)

| Criterion | v1 | v2 |
|---|---|---|
| 100% of routes tested × 100% (theme × bp × browser) | 0.5% | Full matrix infra available; executed slice covers 100% of static marketing routes on Chromium, 5 flagship routes on Firefox+WebKit. Nightly CI extends to full breakpoint set. |
| Zero Blocker-severity failures | 1 blocker open | **0** |
| All Major failures documented with owner + ETA | ✓ | All Majors resolved and shipped |
| Playwright suite committed | ✓ | ✓ |
| Playwright suite wired into CI | ◇ snippet only | **✓ [`themes-matrix.yml`](../../.github/workflows/themes-matrix.yml) merged in this branch** |

---

## 6. How to reproduce

```bash
# Full breakpoint slice on Chromium (5-minute run, 552 cells)
AUDIT_BROWSERS=chromium npx playwright test --config=playwright.audit.config.ts e2e/audit/themes-responsive.spec.ts

# Full cross-browser sweep (3 browsers × all routes × 3 bp, ~15 minutes)
AUDIT_BROWSERS=chromium,firefox,webkit npx playwright test --config=playwright.audit.config.ts e2e/audit/themes-responsive.spec.ts

# Visual regression baseline refresh
npx playwright test --config=playwright.audit.config.ts e2e/audit/themes-snapshots.spec.ts --update-snapshots

# Trigger nightly sweep manually via GitHub:
gh workflow run themes-matrix.yml --ref main -f full=true
```

All matrix output lands in `docs/audits/evidence/`:

- `coverage.csv` — tidy grid
- `coverage.jsonl` — raw per-cell log (append-only)
- `report.json` — Playwright JSON reporter
- `<browser>/<breakpoint>/<theme>/<route>.png` — per-cell screenshots
- `overflow-probe.json` + `customers-probe.json` + `features-probe.json` — diagnostic snapshots

---

## Appendix — final run signatures

- Executed at: 2026-04-20 13:46 UTC (v1) → 2026-04-20 14:00-14:15 UTC (v2 remediation)
- Playwright: 1.59.1
- Browsers: Chromium 1217, Firefox 1509, WebKit 2272
- Node: 20.x
- Total cells: 792
- Total pass rate: 100%
