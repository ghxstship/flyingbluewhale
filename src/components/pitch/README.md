# Pitch / Sales-Deck Kit

A reusable, in-app deck and slide system for ATLVS Technologies. Build a
16:9 presentation out of token-styled React primitives, drive it with a
keyboard-navigable shell, and present it live in the browser — no PowerPoint,
no export round-trip.

Everything is painted through `--p-*` design tokens (via Tailwind arbitrary
values and the `.ps-*` / `.ps-h` primitives) so a deck inherits the active
theme: light/dark mode, density, and the product accent all flow through.
Headings ride **Anton** via `.ps-h`. No raw hex, no Tailwind palette colors —
the CI guard `src/app/design-system.test.ts` enforces this.

The voice is world-builder (`docs/brand/voice.md`): _"you're not running an
event, you're building a world."_ Wonder in the opener and the ask, plain
numbers in the middle, no competitor comparison, no emoji.

## Files

| File            | What it is                                                            |
| --------------- | -------------------------------------------------------------------- |
| `DeckShell.tsx` | `"use client"` full-screen deck driver — keyboard nav, dots, counter |
| `slides.tsx`    | Slide layout primitives — each a 16:9 `Slide` frame                  |
| `templates.tsx` | `atlvsPitchDeck()` — a ready-to-present sample deck                   |
| `index.ts`      | Barrel                                                                |

## Quick start

```tsx
import { DeckShell, atlvsPitchDeck } from "@/components/pitch";

export default function Page() {
  return <DeckShell slides={atlvsPitchDeck()} label="ATLVS Technologies" />;
}
```

Live demo: **`/pitch`** (rendered by `src/app/(marketing)/pitch/page.tsx`).

## DeckShell

```tsx
<DeckShell slides={React.ReactNode[]} label?="Pitch deck" />
```

Renders one slide at a time inside a centered 16:9 stage.

| Key                                  | Action          |
| ------------------------------------ | --------------- |
| `→` · `Space` · `PageDown`           | Next slide      |
| `←` · `PageUp`                       | Previous slide  |
| `Home` / `End`                       | First / last    |
| `Esc`                                | Exit (back)     |

Progress dots are clickable, a slide counter sits top-right, and the active
slide lives in an `aria-live` region announced as "Slide N of M".

## Slide primitives

All take plain props and render a 16:9 `Slide`. Type sizes use `clamp()` so a
slide scales with the stage.

| Component      | Use                                          | Key props                                |
| -------------- | -------------------------------------------- | ---------------------------------------- |
| `TitleSlide`   | Cover                                        | `eyebrow`, `title`, `subtitle`, `wordmark`, `footer` |
| `StatSlide`    | One big metric                               | `stat`, `caption`, `eyebrow`, `source`   |
| `QuoteSlide`   | Pull-quote                                   | `quote`, `attribution`, `role`           |
| `AgendaSlide`  | Numbered list                                | `title`, `items[]`, `eyebrow`            |
| `SectionSlide` | Full-accent act divider                      | `index`, `title`, `subtitle`             |
| `TwoColSlide`  | Text + visual (or `bullets`)                 | `title`, `body`, `bullets[]`, `visual`   |
| `CloseSlide`   | The ask                                      | `title`, `cta`, `contact`, `eyebrow`     |

`Slide` itself is exported for custom layouts:

```tsx
import { Slide } from "@/components/pitch";

<Slide tone="raised" align="center">
  {/* anything, token-styled */}
</Slide>;
```

`tone`: `surface` (page bg) · `raised` (card bg) · `accent` (accent flood).
`align`: `start` · `center`.

## Authoring your own deck

A deck is just `React.ReactNode[]`. Compose primitives in order and hand the
array to `DeckShell`:

```tsx
import { TitleSlide, StatSlide, CloseSlide } from "@/components/pitch";

export function myDeck() {
  return [
    <TitleSlide key="cover" title="Build the world" />,
    <StatSlide key="s1" stat="250+" caption="productions shipped" />,
    <CloseSlide key="ask" title="Let's go" cta="Start at atlvs.pro" />,
  ];
}
```

To carry a product hue on a slide, wrap it in a `data-product` element
(`atlvs` · `compvss` · `gvteway` · `legend`) — the accent tokens re-resolve
and the deck recolors itself.
