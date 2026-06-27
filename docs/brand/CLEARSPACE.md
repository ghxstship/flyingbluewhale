# Clear Space & Minimum Size — ATLVS Technologies

Rules for the two primary marks: the spaced **A T L V S** wordmark and the **star / waypoint**
app-icon mark (`public/brand/atlvs-mark.svg`). Give them room and don't shrink them past
legibility.

## The wordmark — A T L V S

Set in **Jost**, spaced caps, `nowrap`, with the crossbar-less `A`. Wordmark lockup only —
never use this treatment for UI text or headings.

- **Spaced-caps treatment.** Render with literal spaces between letters in JSX
  (`A T L V S`), matching the parent `G H X S T S H I P` treatment. Do not fake the spacing
  with `letter-spacing` on a solid string — the spaces are the mark.
- **Accessible name.** Always `aria-label="ATLVS Technologies — home"` on the wordmark
  element so assistive tech reads the brand, not five letters. The visible spaced glyphs are
  presentational.

### Clear space

Keep a margin of **1× cap-height (`X`)** clear on all four sides — measure `X` from the
height of the capital `A`. No other element (type, rule, image edge, icon) intrudes into that
zone.

```
   ┌─────────────────────────────┐
   │   ← X →                      │   X = cap-height of "A"
   │        A T L V S             │
   │                      ← X →   │
   └─────────────────────────────┘
```

### Minimum size

- **Screen:** minimum **96 px wide** (the spaced caps lose legibility below this — the gaps
  collapse first).
- **Print:** minimum **24 mm wide**.
- Below the wordmark minimum, use the star mark instead.

## The star / waypoint mark

The 8-point waypoint star with a center dot (`atlvs-mark.svg`, `viewBox 0 0 64 64`). This is
the app-icon / favicon mark and the fallback when the wordmark won't fit.

### Clear space

Keep clear space of **½ the mark's height** on all sides.

### Minimum size

- **Favicon / smallest UI:** **16 px**.
- **App icon / avatar:** **24 px** and up; the rounded-rect lockups
  (`atlvs-icon-*.svg`, `viewBox 0 0 128 128`) are for **32 px+** product/app-tile use.
- Don't render the bare star below 16 px — switch to the solid-fill icon lockup.

## Color variants

- **Default (ink/light surfaces):** the dark ink mark — `atlvs-mark.svg`.
- **White (dark/photo surfaces):** `atlvs-mark-white.svg`.
- **Mono:** when a single-color context demands it, use `currentColor` so the mark inherits
  the surface text color.
- **Product accent:** on a product surface, the icon lockup carries that product's accent
  (`atlvs-icon-atlvs.svg` red, `…-compvss.svg` yellow, `…-gvteway.svg` blue). House /
  marketing defaults to ATLVS volcanic red `#E23414`. Pull accents from `--p-accent`, never a
  hand-typed hex, in any new lockup.

## Don'ts

- Don't recolor outside the sanctioned variants (no gradients, no off-brand hues).
- Don't add a crossbar to the `A` or change the inter-letter spacing of the wordmark.
- Don't stretch, skew, rotate, or add effects (shadow, glow, outline) to either mark.
- Don't place the mark on a low-contrast background — use the white variant on dark/photo.
- Don't reconstruct the wordmark in another typeface; Jost only.
- Don't crowd the clear-space zone or pair the mark with a tagline inside it.
