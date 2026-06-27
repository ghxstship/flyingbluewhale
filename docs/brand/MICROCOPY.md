# Microcopy Playbook — ATLVS Technologies

How to write the small words: buttons, empty states, errors, confirmations, toasts, form
help, validation, loading. This is `voice.md` applied at the component scale. Read that
first — the 40/35/25 Spider-Man / Iron-Man / Thor blend, "write like a person," no emoji,
no competitor names — then use this as the per-pattern reference.

## Two centers of gravity

- **Parker (Spider-Man) leads the public face** — marketing, the marketplace, the first
  empty screen, onboarding, the help that teaches. Friendly, fast, a little
  self-deprecating. This is where the wonder lives.
- **Stark (Iron Man) leads the operator console** — dense chrome, and the only voice that
  talks when something breaks. Calm, competent, accountable. No swagger in error states; no
  nerves in the welcome mat.
- **Thor is a volume knob** — one reserved, mythic line for the genuinely huge moment (doors
  open, headliner's on, the wrap). Never a default.

## Casing

Casing is role-based and token-driven via `--p-case-*` — **author every string in sentence
case** and let the tokens apply the rest. Don't hand-type ALL CAPS or Title Case.

- Buttons, labels, titles → sentence case (`--p-case` default).
- Eyebrows, overlines, mono labels, table headers → uppercase + tracked (token-applied).
- Display heads → the typeface's native case (Anton renders uppercase via
  `--p-display-case`).
- Title Case → only under an explicit XPMS governance scope.

So: write `Add assignment`, not `Add Assignment` and not `ADD ASSIGNMENT`.

## Buttons & actions

Verb-first, sentence case, name the actual thing. Skip "click here." Stark voice in the
console, Parker on the public side.

- ✓ `Save run-of-show`  ✗ `Submit`
- ✓ `Send for approval`  ✗ `OK`
- ✓ `Publish to marketplace`  ✗ `Click to publish your listing now`
- ✓ `Add assignment`  ✗ `Create New Assignment Record`

Destructive actions name the consequence; pair with a Dialog confirm, never `window.confirm`.

- ✓ `Void credential`  ✗ `Delete`
- ✓ `Cancel show` (in red, with a confirm)  ✗ `Remove`

## Empty states (Parker)

The empty screen is an invitation — this is where wonder belongs. One line of context, one
clear next action. Concrete over grand.

- ✓ `No assignments yet. Pull someone in from the catalog and rough it in.` + `Add
  assignment`
- ✓ `Nothing on the run-of-show. Start with doors and work outward.` + `Add cue`
- ✗ `No data available.`
- ✗ `Get started by leveraging our powerful assignment management solution.`

## Errors (Stark, calm)

Flat and accountable. Say what happened, say what to do, take the blame when it's ours.
Nobody wants a tour guide when the bus is on fire — no jokes, no apology theater, no stack
traces.

- ✓ `That didn't load. Give it another shot — if it sticks, it's on us.`
- ✓ `Couldn't save. Check your connection and try again.`
- ✓ `This credential is already redeemed. Reissue if the holder needs a new one.`
- ✗ `Oops! Something went wrong 😅`
- ✗ `Error: 500 Internal Server Error`
- ✗ `We sincerely apologize for the inconvenience this may have caused.`

## Confirmations (brief)

Short. The action already happened; don't celebrate it for them.

- ✓ `Saved.`  ✓ `Saved. Smooth one.`  ✓ `Sent for approval.`
- ✗ `Your changes have been successfully saved to the database!`

For a destructive confirm dialog, state the consequence and the count:

- ✓ Title `Void 3 credentials?` · Body `They stop scanning at the gate immediately. You can
  reissue later.` · Confirm `Void credentials`

## Success toasts

One clause. Optional undo. Parker can warm it slightly; Stark keeps it flat in the console.

- ✓ `Assignment delivered.`  + `Undo`
- ✓ `Manifest exported.`
- ✗ `Great job! Your assignment was delivered successfully! 🎉`

## Form help & validation

Help text teaches (Parker); validation is flat and specific (Stark). Help sits under the
field; validation replaces it on error. Never blame the user.

- Help ✓ `We default to 60% deposit, 40% on load-in. Override per booking.`
- Help ✗ `Please enter a valid value.`
- Validation ✓ `Pick a load-in date on or before the show.`
- Validation ✓ `That email is already on the crew manifest.`
- Validation ✗ `Invalid input.`
- Validation ✗ `You forgot to fill this out!!!`

## Loading

State what's happening if it's slow; stay quiet if it's fast. No fake personality on a
spinner in the console.

- ✓ `Resolving metrics…`  (live report)
- ✓ `Pulling the manifest…`
- ✗ `Hang tight, magic in progress ✨`

## The huge moment (Thor — rare)

Reserve for the genuinely large: doors, headliner, the wrap. One line, mythic, with a wink
so it never goes pompous. Use almost never.

- ✓ `Doors are open. The world you built is live.`
- ✗ Using this register on a saved draft.

## Quick don'ts

No "solutions," "synergy," "unlocks," "empowers," "streamlines," "unified," "enterprise-
grade," "best-in-class." No emoji anywhere. No competitor names or "vs." No rule-of-three
triads, no "X, not Y" antithesis. No sentence that would survive in Salesforce docs.
