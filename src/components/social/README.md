# Social-graphics kit (`src/components/social/`)

Brand-locked share-image components for **ATLVS Technologies**, designed to
render via Next.js's **`next/og` `ImageResponse`** (satori) — the same way the
repo already makes share images (`src/app/og/route.tsx`,
`src/app/opengraph-image.tsx`). These are **not** browser-DOM components.

## Why ImageResponse (and what that constrains)

`ImageResponse` rasterizes a tiny JSX subset to PNG with satori. That imposes:

1. **No CSS variables.** satori cannot resolve `var(--p-accent)` or any token
   from `atlvs-product.css`. Every color is a **literal hex**, centralized in
   the **`PALETTE`** const in `SocialCard.tsx` — a hand-kept mirror of
   `src/app/theme/tokens.json` (neutral ramp + `surface.light`) and
   `src/lib/brand.ts#PRODUCT_ACCENTS` (the four product accents, re-exported
   from their canonical owner — never re-authored here). **Keep PALETTE in
   lockstep with `tokens.json`.**
2. **Inline `style` only** — no `className`. Fonts are referenced by family
   name (Anton / Hanken Grotesk / Space Mono); the *route* that mounts a card
   registers the actual font data on `ImageResponse({ fonts })`. Without that,
   satori uses its bundled fallback and layout still holds.
3. **Explicit `display: "flex"`** on every multi-child node (satori requires
   it). All kit components already do this.

## Files

| File            | Role                                                                 |
| --------------- | ------------------------------------------------------------------- |
| `formats.ts`    | `SOCIAL_FORMATS` + `formatSize`/`isSocialFormat` guards.            |
| `SocialCard.tsx`| Parametric card + `PALETTE` (literal-hex SSOT) + `resolveAccent`.   |
| `templates.tsx` | Preset compositions (`announcement`/`quote`/`stat`/`event`/`launch`).|
| `index.ts`      | Barrel re-export.                                                    |

## Formats (`SOCIAL_FORMATS`)

| id       | size       | use                                              |
| -------- | ---------- | ------------------------------------------------ |
| `og`     | 1200×630   | OpenGraph / Twitter large card (X, Slack, etc.)  |
| `square` | 1080×1080  | Instagram / LinkedIn feed                        |
| `story`  | 1080×1920  | IG / TikTok / Snap vertical story (9:16)         |
| `wide`   | 1500×500   | X / LinkedIn profile banner                      |

## Brand

- **Accents** (per-product, owned): ATLVS `#E23414` · COMPVSS `#FFC400` ·
  GVTEWAY `#2563EB` · LEG3ND `#ED6A1E`. Pass `product` (`"atlvs"|"compvss"|
  "gvteway"|"legend"`); omit or `"house"` → ATLVS-red **house** accent.
- **Bright accents** (COMPVSS yellow, LEG3ND orange) auto-swap to an ink
  foreground on the `accent`-flood variant for AA legibility.
- **Type**: Anton (display title, all-caps) · Hanken Grotesk (body/subtitle) ·
  Space Mono (eyebrow/footer). Spaced `A T L V S` mark in the footer.
- **Voice** (`docs/brand/voice.md`): world-builder — wonder in invitations,
  calm in chrome.

## Usage

```tsx
import { ImageResponse } from "next/og";
import { announcementCard, formatSize } from "@/components/social";

const { w, h } = formatSize("og");
return new ImageResponse(
  announcementCard({ format: "og", product: "gvteway", title: "We shipped it" }),
  { width: w, height: h },
);
```

### Templates

| id             | extra opts                 | paint  |
| -------------- | -------------------------- | ------ |
| `announcement` | —                          | canvas |
| `quote`        | `attribution`              | canvas |
| `stat`         | `value`, `label`           | canvas |
| `event`        | `date`, `venue`            | canvas |
| `launch`       | —                          | accent flood |

## Live route

`src/app/social/[template]/route.tsx` renders any template from query params:

```
/social/announcement?title=We%20shipped%20it&subtitle=Reports%20v6.3%20is%20live
/social/launch?product=gvteway&format=square&title=Marketplace%20is%20open
/social/stat?format=story&title=Tickets%20sold&value=12%2C480&label=MMW26
/social/event?product=legend&title=The%20Standard&date=Jun%2028&venue=Hialeah
/social/quote?title=Production%20runs%20on%20it&attribution=A%20producer
```

Query params: `format` (og|square|story|wide), `product`
(atlvs|compvss|gvteway|legend|house), `title`, `subtitle`, `eyebrow`,
`footer`, plus the per-template extras above.

It is an **image asset endpoint**, intentionally not in any nav. Route
handlers outside `/api` are invisible to the sitemap orphan guard; the path is
also listed in `scripts/generate-sitemap.mjs#EXEMPT` for documentation.
```
