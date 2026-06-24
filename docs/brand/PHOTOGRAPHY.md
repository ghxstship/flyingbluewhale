# Photography & Imagery Direction — ATLVS Technologies

ATLVS is for people who build worlds — festivals, film sets, galas, stadium tours, immersive
runs, broadcasts. The imagery has to carry the art of that work, the weight of it, and the
fun of it. Photograph the build, not the brochure.

## Subject

Shoot the real production, mid-motion:

- **Live production** — the floor during a show: front-of-house, the deck, the booth, lights
  hung and lit, the crowd as energy not as the point.
- **Crews at work** — stagehands rigging, a runner with a radio, a stage manager on cans, the
  load-in line. People doing the thing, hands in frame.
- **Venues & sites** — empty rooms before doors, the truss going up, cable runs, the venue at
  the scale that makes the work feel real.
- **Builds** — fabrication, scenic, the half-assembled set; the world coming together and the
  world being struck.

Cast real crew where possible. Show range — not every shoot is a stadium; a black-box
theater build belongs here too.

## Treatment

- **High-contrast.** Deep shadows, decisive light. Lean into the dramatic stage lighting
  that's already there rather than flattening it.
- **Candid.** Caught moments over posed ones. A look mid-task beats a smile at the lens.
- **Motion.** Let it move — a little blur on a hand or a cable pull reads as work in
  progress, not a mistake.
- **Available light first.** Stage wash, work lights, golden-hour load-in. Color casts from
  the rig are welcome; don't neutralize the room.
- **Grain over plastic.** Texture is fine. Over-retouched, stock-smooth skin is not.

## Accent overlay

When you need to brand an image (hero, OG card, section break):

- Tint with the surface's product accent at low opacity — ATLVS volcanic red `#E23414` for
  house/marketing, the owning product's accent on its surface (COMPVSS yellow, GVTEWAY blue,
  LEG3ND orange). Pull from `--p-accent`, not a hand-typed hex.
- A dark-to-transparent gradient (`--p-gradient-fade-r` / a bottom scrim) for legible
  overlaid type; keep text on the darkest quarter of the frame.
- Spot art (`public/brand/spot/`) and patterns (`public/brand/patterns/`) overlay cleanly at
  low opacity for texture — use one, not both, per surface.

## Do

- Shoot wide enough to feel the scale of the build.
- Keep faces real and lighting honest.
- Favor the in-between moments: the build, the soundcheck, the strike.
- Verify you have a release/license for every recognizable face and venue.

## Don't

- No generic corporate stock: handshakes, headset call-center reps, laptops in sunny cafés.
- No staged "diverse team pointing at a screen."
- No heavy color-grade presets that erase the room's own light.
- No emoji or sticker overlays. UI iconography comes from Lucide or the AIGA signs.
- No competitor logos, marks, or recognizable competitor product UI in frame.

## Accessibility — alt text

Every content image ships descriptive `alt`. Describe the subject and what's happening, not
the mood; ~125 characters.

- ✓ `Stagehands raising a lighting truss during load-in at an empty arena.`
- ✗ `Image` · `photo.jpg` · `Exciting production vibes!`
- Decorative-only imagery (texture, pure background) takes `alt=""` so screen readers skip
  it.

## Sourcing & licensing

- Prefer first-party photography from real ATLVS productions, with talent/crew releases on
  file.
- Licensed stock is a fallback only — choose frames that read as real production work, and
  record the license + usage scope alongside the asset.
- Keep a source/credit/expiry record for every image. Don't ship an image you can't account
  for the rights to.
