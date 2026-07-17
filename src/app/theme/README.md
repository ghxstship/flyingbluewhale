# ATLVS Theme System

One canonical kit skin (`atlvs-product`). Mode (light/dark), density (compact/cozy/spacious), and accent intensity (soft/default/vivid) are orthogonal axes. Zero FOUC.

## Contract

- **Slug is immutable:** `atlvs-product` (the design_handoff_atlvs_kit). Used verbatim in `data-theme`, `localStorage` key `chroma.theme`, cookie `chroma_theme`.
- **Per-product accent** reads `data-product` (kit canon) OR `data-platform` (codebase): `atlvs` (volcanic red — also the house / cold-start default), `compvss` (signal yellow), `gvteway` (blue), `legend` (molten orange), plus extension products `cvrgo`/`opvs`/`gvlley`/`vault`. There is **no GHXSTSHIP theme** (ratified 2026-07-17: two theming systems only — the ATLVS Ecosystem default + Full System Whitelabel; GHXSTSHIP is an identity mark). House/marketing surfaces carry no `data-product` and resolve to the ATLVS cold-start default.
- **Mode** (`light`/`dark`/`system`) lives on `data-mode`, set by `theme-script.ts` before first paint.
- **Density** (`compact`/`cozy`/`spacious`) lives on `data-density`; `cozy` is the default and strips the attribute.
- **Accent intensity** (`soft`/`default`/`vivid`) lives on `data-accent`; `default` is implicit and strips the attribute.

## Files

```
src/app/theme/
  primitives.css              raw palette + spacing + motion
  themes/
    atlvs-product.css         the kit — tokens + accent + .ps-* component library
  index.css                   orchestrated imports + SSR fallback :root
  themes.config.ts            registry (slug, label, family, essence, swatchColor)
  theme-script.ts             pre-hydration FOUC bootstrap string
  ThemeProvider.tsx           client provider + useTheme hook
```

## Token namespace

The kit's `--p-*` namespace is the single source of truth.

| Token group                                                | Examples                                                                                  |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Neutral ramp (v7.0 surface seed)                          | `--p-neutral-0` … `--p-neutral-1000` (12 steps, light + dark; surfaces map onto it)       |
| Surface                                                    | `--p-bg` `--p-surface` `--p-surface-2` `--p-border` `--p-border-2`                        |
| Text                                                       | `--p-text-1` `--p-text-2` `--p-text-3`                                                    |
| Accent                                                     | `--p-accent` `--p-accent-hover` `--p-accent-text` `--p-accent-weak` `--p-accent-contrast` |
| Accent ramp (v7.0, derived)                               | `--p-accent-50` … `--p-accent-900` (tint→surface / shade→text-1)                          |
| Accent CTA (AA-safe filled buttons)                        | `--p-accent-cta` `--p-accent-cta-contrast`                                                |
| Semantic (fills/dots/icons)                               | `--p-success` `--p-warning` `--p-danger` `--p-info`                                       |
| Semantic text (v7.0, AA small-text inks)                  | `--p-success-text` `--p-warning-text` `--p-danger-text` `--p-info-text` (per mode)        |
| Radii                                                      | `--p-r-sm` `--p-r` `--p-r-md` `--p-r-lg` `--p-r-xl` `--p-r-pill`                          |
| Spacing (4px grid)                                         | `--p-0-5` `--p-1` … `--p-8` `--p-10` `--p-12` `--p-14` `--p-16` `--p-20` `--p-24`         |
| Elevation                                                  | `--p-elev-xs` `--p-elev-1` `--p-elev-2` `--p-elev-3` `--p-elev-2xl` (+ `--p-shadow*` aliases) |
| Motion                                                     | `--p-ease` `--motion-fast/normal/slow/hover/skeleton` `--ease-out/in/standard/hover`      |
| Type                                                       | `--p-font` `--p-heading` `--p-mono` `--p-mono-data` `--p-eyebrow` `--p-wordmark` `--p-lh-*` `--p-tracking-*` |
| Density (`--k-*`)                                          | `--k-ctl-py/px/fs` `--k-row-py/px` `--k-cell-fs` `--k-card-pad`                           |
| Brand identity (mode-agnostic, for multi-product surfaces) | `--brand-atlvs` `--brand-compvss` `--brand-gvteway` (+ `-ink` text, `-on` contrast)       |

Tailwind v4 `@theme inline` (in `globals.css`) exposes a thin `--color-*` shim that resolves to the same `--p-*` values, so `bg-surface` / `text-text-1` / `border-border` Tailwind utility classes paint kit tokens directly.

## Component library (`.ps-*`)

Defined in `themes/atlvs-product.css`. The full set:

- **Buttons** `.ps-btn` (+ `--cta --ghost --soft --tertiary --link --danger --icon --sm --lg --loading`; mode-aware hover, built-in `:active` + `:focus-visible`)
- **Forms** `.ps-input` (+ `--sm --lg`, explicit `:disabled`) `.ps-inputgrp` `.ps-field` `.ps-label` `.ps-hint` (`--err`) `.ps-check` (`--radio`) `.ps-toggle` `.ps-seg` `.ps-slider`
- **Badges + chips** `.ps-badge` (+ `--ok --warn --danger --info --neutral --accent --sm`) `.ps-chip` (+ `--sm --selectable`) `.ps-tag` (+ `--sm`) `.ps-dot` (+ `--ok --warn --danger --info --muted`)
- **Tables** `.ps-table` (+ `--sticky --zebra`; `.num` numeric cols, sortable `th[aria-sort]`)
- **Avatars** `.ps-av` (+ `--sm --lg --sq --ghost`) `.ps-avstack`
- **Nav** `.ps-tabs` `.ps-crumb` `.ps-page` `.ps-menu` (+ `.mi .sep .lbl`) `.ps-kbd`
- **Data** `.ps-table` `.ps-progress` `.ps-meter` `.ps-stat` `.ps-steps`
- **Feedback** `.ps-banner` (+ `--info --ok --warn --danger`) `.ps-toast` `.ps-tip` `.ps-modal` `.ps-empty` `.ps-skel` `.ps-spinner`
- **Type** `.ps-eyebrow` `.ps-mono` `.ps-id` `.ps-h` `.ps-muted`

Every selector matches BOTH `[data-ui="saas"]` (kit canon) AND `[data-theme="atlvs-product"]` (codebase convention). All shells set both attributes.

## Wordmark

The Jost crossbar-less wordmark (`<Wordmark word="ATLVS" subtitle="TECHNOLOGIES" />` from `src/components/brand/Wordmark.tsx`) is the only legitimate consumer of `var(--p-wordmark)`. Reserved for the brand lockup; per MONUMENT (kit v3), display type uses Anton via `--p-heading` and body/UI type uses Hanken Grotesk via `--p-font`.

## Contrast — WCAG 1.4.3

| Surface                              | Light                                   | Dark                                     |
| ------------------------------------ | --------------------------------------- | ---------------------------------------- |
| `--p-text-1` on `--p-surface`        | `#181B23` on `#ffffff` → 17.21:1 (AAA)  | `#F2F4F8` on `#1a1d24` → 15.32:1 (AAA)   |
| `--p-text-2` on `--p-surface`        | `#4A5563` on `#ffffff` → 7.58:1 (AAA)   | `#AEB6C4` on `#1a1d24` → 8.26:1 (AAA)    |
| `--p-text-3` on `--p-surface`        | `#656D7A` on `#ffffff` → 5.22:1 (AA)    | `#9098A4` on `#1a1d24` → 5.79:1 (AA)     |
| `--p-accent-cta-contrast` on `--p-accent-cta` (ATLVS) | `#ffffff` on `#ad220a` → 6.98:1 (AA) | `#0e1014` on `#ff5634` → 6.01:1 (AA) |

The bright display accents (`--p-accent`) deliberately fail AA as text — they're for fills, focus halos, and large display text where 3:1 suffices. Use `--p-accent-text` (deepened in light mode) for any small-text usage; or `--p-accent-cta` paired with `--p-accent-cta-contrast` for filled CTAs.

## Legacy migration

The pre-kit cosmic GHXSTSHIP skin and the CHROMA exploration set (bermuda-triangle, glass, brutal, bento, kinetic, copilot, cyber, soft, earthy) were stripped in the kit migration. Every legacy `--bg`/`--foreground`/`--org-*`/`--shadow-*`/`--radius-*`/`--color-*` reference was swept to `--p-*` across all `src/` files; legacy `.btn`/`.badge`/`.input-base`/`.data-table`/`.status-dot*` class definitions were removed from `globals.css`; consumers were migrated to `.ps-*` equivalents.
