# ATLVS Theme System

One canonical kit skin (`atlvs-product`). Mode (light/dark), density (compact/comfortable/spacious), and accent intensity (soft/default/vivid) are orthogonal axes. Zero FOUC.

## Contract

- **Slug is immutable:** `atlvs-product` (the design_handoff_atlvs_kit). Used verbatim in `data-theme`, `localStorage` key `chroma.theme`, cookie `chroma_theme`.
- **Per-product accent** reads `data-product` (kit canon) OR `data-platform` (codebase): `atlvs` (pink), `compvss` (amber), `gvteway` (blue, v5.1).
- **Mode** (`light`/`dark`/`system`) lives on `data-mode`, set by `theme-script.ts` before first paint.
- **Density** (`compact`/`comfortable`/`spacious`) lives on `data-density`; `comfortable` is the default and strips the attribute.
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
| Surface                                                    | `--p-bg` `--p-surface` `--p-surface-2` `--p-border` `--p-border-2`                        |
| Text                                                       | `--p-text-1` `--p-text-2` `--p-text-3`                                                    |
| Accent                                                     | `--p-accent` `--p-accent-hover` `--p-accent-text` `--p-accent-weak` `--p-accent-contrast` |
| Accent CTA (AA-safe filled buttons)                        | `--p-accent-cta` `--p-accent-cta-contrast`                                                |
| Semantic                                                   | `--p-success` `--p-warning` `--p-danger` `--p-info`                                       |
| Radii                                                      | `--p-r-sm` `--p-r` `--p-r-lg` `--p-r-pill`                                                |
| Spacing (4px grid)                                         | `--p-1` … `--p-8`                                                                         |
| Elevation                                                  | `--p-elev-1` `--p-elev-2` `--p-elev-3` `--p-shadow-sm` `--p-shadow-lg`                    |
| Motion                                                     | `--p-ease` `--motion-fast/normal/slow/hover/skeleton` `--ease-out/in/standard/hover`      |
| Type                                                       | `--p-font` `--p-heading` `--p-mono` `--p-eyebrow` `--p-wordmark`                          |
| Density (`--k-*`)                                          | `--k-ctl-py/px/fs` `--k-row-py/px` `--k-cell-fs` `--k-card-pad`                           |
| Brand identity (mode-agnostic, for multi-product surfaces) | `--brand-atlvs` `--brand-compvss` `--brand-gvteway` (+ `-ink` text, `-on` contrast)       |

Tailwind v4 `@theme inline` (in `globals.css`) exposes a thin `--color-*` shim that resolves to the same `--p-*` values, so `bg-surface` / `text-text-1` / `border-border` Tailwind utility classes paint kit tokens directly.

## Component library (`.ps-*`)

Defined in `themes/atlvs-product.css`. The full set:

- **Buttons** `.ps-btn` (+ `--ghost --soft --danger --icon --sm --lg`)
- **Forms** `.ps-input` `.ps-inputgrp` `.ps-field` `.ps-label` `.ps-hint` (`--err`) `.ps-check` (`--radio`) `.ps-toggle` `.ps-seg` `.ps-slider`
- **Badges + chips** `.ps-badge` (+ `--ok --warn --danger --info --neutral`) `.ps-chip` `.ps-tag` `.ps-dot` (+ `--ok --warn --danger --info --muted`)
- **Avatars** `.ps-av` (+ `--sm --lg --sq --ghost`) `.ps-avstack`
- **Nav** `.ps-tabs` `.ps-crumb` `.ps-page` `.ps-menu` (+ `.mi .sep .lbl`) `.ps-kbd`
- **Data** `.ps-table` `.ps-progress` `.ps-meter` `.ps-stat` `.ps-steps`
- **Feedback** `.ps-banner` (+ `--info --ok --warn --danger`) `.ps-toast` `.ps-tip` `.ps-modal` `.ps-empty` `.ps-skel` `.ps-spinner`
- **Type** `.ps-eyebrow` `.ps-mono` `.ps-id` `.ps-h` `.ps-muted`

Every selector matches BOTH `[data-ui="saas"]` (kit canon) AND `[data-theme="atlvs-product"]` (codebase convention). All shells set both attributes.

## Wordmark

The Jost crossbar-less wordmark (`<Wordmark word="ATLVS" subtitle="TECHNOLOGIES" />` from `src/components/brand/Wordmark.tsx`) is the only legitimate consumer of `var(--p-wordmark)`. Reserved for the brand lockup; per MONUMENT (kit v3), display type uses Anton via `--p-heading` and body/UI type uses Hanken Grotesk via `--p-font`.

## Contrast — WCAG 1.4.3

| Surface                                   | Light                                 | Dark                                           |
| ----------------------------------------- | ------------------------------------- | ---------------------------------------------- |
| `--p-text-1` on `--p-bg`                  | `#181b23` on `#f7f8fa` → 16.0:1 (AAA) | `#f2f4f8` on `#111318` → 17.4:1 (AAA)          |
| `--p-text-2` on `--p-surface`             | `#5b6472` on `#ffffff` → 7.3:1 (AAA)  | `#a6aebc` on `#1a1d24` → 9.4:1 (AAA)           |
| `--p-text-3` on `--p-surface`             | `#656d7a` on `#ffffff` → 5.2:1 (AA)   | `#9098a4` on `#1a1d24` → 5.1:1 (AA)            |
| white on `--p-accent-cta` (atlvs light)   | white on `#c91463` → 5.6:1 (AA)       | atlvs dark uses ink on `#ff4d9b` → 6.1:1 (AA)  |
| white on `--p-accent-cta` (compvss light) | white on `#8a5a0f` → 5.9:1 (AA)       | compvss dark uses ink on `#f0b255` → kit canon |
| white on `--p-accent-cta` (gvteway light) | white on `#2563eb` → 5.2:1 (AA)       | gvteway dark uses ink on `#5e8bf2` → kit canon |

The bright display accents (`--p-accent`) deliberately fail AA as text — they're for fills, focus halos, and large display text where 3:1 suffices. Use `--p-accent-text` (deepened in light mode) for any small-text usage; or `--p-accent-cta` paired with `--p-accent-cta-contrast` for filled CTAs.

## Legacy migration

The pre-kit cosmic GHXSTSHIP skin and the CHROMA exploration set (bermuda-triangle, glass, brutal, bento, kinetic, copilot, cyber, soft, earthy) were stripped in the kit migration. Every legacy `--bg`/`--foreground`/`--org-*`/`--shadow-*`/`--radius-*`/`--color-*` reference was swept to `--p-*` across all `src/` files; legacy `.btn`/`.badge`/`.input-base`/`.data-table`/`.status-dot*` class definitions were removed from `globals.css`; consumers were migrated to `.ps-*` equivalents.
