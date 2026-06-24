# Brand Assets — ATLVS Technologies

The shipped SVG brand library. Everything here is token-friendly: marks use `currentColor` or
the sanctioned brand hexes, so they retheme per surface. Pull accents from `--p-accent` in
code rather than hardcoding when you can.

For rules, see the brand docs:

- **Clear space & minimum size:** [`docs/brand/CLEARSPACE.md`](../../docs/brand/CLEARSPACE.md)
- **Imagery / photo direction:** [`docs/brand/PHOTOGRAPHY.md`](../../docs/brand/PHOTOGRAPHY.md)
- **Voice:** [`docs/brand/voice.md`](../../docs/brand/voice.md) · **Glossary:** [`docs/brand/GLOSSARY.md`](../../docs/brand/GLOSSARY.md)

## Logos & marks

| File | What | Use |
|---|---|---|
| `atlvs-mark.svg` | Star / waypoint mark, dark ink | Primary mark on light surfaces |
| `atlvs-mark-white.svg` | Star / waypoint mark, white | Dark / photo surfaces |
| `atlvs-icon-ink.svg` | Ink icon lockup (rounded rect) | Neutral app tile / avatar |

The visible wordmark **A T L V S** is set in Jost, spaced caps, in JSX (not an asset) — see
`CLEARSPACE.md` for the spaced-caps treatment and the required
`aria-label="ATLVS Technologies — home"`.

## Product app icons

Rounded-rect lockups, `viewBox 0 0 128 128`, one per product accent (32 px+).

| File | Product | Accent |
|---|---|---|
| `atlvs-icon-atlvs.svg` | ATLVS | volcanic red `#E23414` |
| `atlvs-icon-compvss.svg` | COMPVSS | signal yellow `#FFC400` |
| `atlvs-icon-gvteway.svg` | GVTEWAY | blue `#2563EB` |

> LEG3ND is molten orange `#ED6A1E`; the house / marketing default accent is ATLVS volcanic
> red `#E23414`.

## Pictograms

| File | What | Use |
|---|---|---|
| `pictograms.svg` | The 60 public-domain AIGA / U.S. DOT symbol signs (`aiga-*` ids) | The sole signage pictogram set. Rendered via `SignIcon` / `SignPanel`; colored by category → airport tone. Metadata index: `src/lib/signage_pictograms.ts`. |

## Patterns (`patterns/`)

Tileable textures using `currentColor` at low opacity — set `color:` on the container to
theme. Reference via CSS `background` or an `<img>`; each carries an internal `<pattern>` for
SVG `fill="url(#…)"` use.

| File | What |
|---|---|
| `patterns/grid.svg` | Engineering grid (48px tile) |
| `patterns/dots.svg` | Dot field (32px tile) |
| `patterns/diagonal.svg` | Diagonal hatch (24px tile) |

## Spot art (`spot/`)

Flat, two-color-max geometric motifs in the brand style. Default to ATLVS volcanic red
`#E23414`; swap the fill/stroke to `currentColor` to retheme per surface.

| File | Motif | Meaning |
|---|---|---|
| `spot/waypoint.svg` | 8-point star + center dot | The waypoint / "you build here" mark |
| `spot/signal.svg` | Concentric rings | Broadcast / reach / signal |
| `spot/build.svg` | Stacked bars | The build coming together |

## Heritage (parent brand)

`logo-ghostship-skull.svg` and `skull-bone.svg` are the GHXSTSHIP parent-brand marks — use
only in explicit parent-company / ecosystem contexts, not as ATLVS product chrome.

## Rules of thumb

- Don't recolor outside the sanctioned variants or add effects (shadow, glow, gradient) to a
  mark.
- Don't reconstruct the wordmark in another typeface — Jost only.
- One texture per surface: a pattern **or** a spot art, not both.
- Decorative-only assets take `alt=""`; meaningful marks get a real accessible name.
