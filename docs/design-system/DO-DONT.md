# Do / Don't Gallery — ATLVS Technologies

Paired examples for the most common design-system mistakes. Each pair is enforced by a guard
in `src/app/design-system.test.ts` (14 guards) — if you write the ✗ form, the suite fails.
Author to the ✓ form and the guards stay green.

## Tokens, not hex

Components read `--p-*` tokens. Never hardcode a hex value or a raw Tailwind color-scale
literal — there's a token for every surface, text, accent, and semantic role.
_Guard: "no raw Tailwind color-scale literals — token vars only."_

```tsx
// ✓ do
<div className="bg-[var(--p-surface)] text-[var(--p-text)] border-[color:var(--p-border)]" />

// ✗ don't
<div className="bg-[#F7F8FA] text-slate-900 border-gray-200" />
```

## Button primitive, not a hand-rolled brand button

Use `<Button>` from `src/components/ui/`. Don't reconstruct the accent button by hand — the
primitive carries hover/active/focus-visible/disabled state and AA contrast.
_Guard: "no hand-rolled brand buttons (`bg-[var(--p-accent)]` + `text-white`)."_

```tsx
// ✓ do
<Button variant="cta">Save run-of-show</Button>

// ✗ don't
<button className="bg-[var(--p-accent)] text-white rounded px-4 py-2">Save</button>
```

## Sentence case via tokens, not ALL CAPS in the string

Author strings in sentence case; casing is applied by `--p-case-*` tokens (eyebrows/labels
get uppercase+tracking automatically; Anton display heads get uppercase via
`--p-display-case`). Don't bake case into the content.
_Guard: casing tokens are consumed; retired-case patterns flagged._

```tsx
// ✓ do
<label className="ps-label">Load-in date</label>      // token applies the case

// ✗ don't
<label>LOAD-IN DATE</label>
<h2>Add New Assignment Record</h2>                      // Title Case by hand
```

## StatusChip, not ad-hoc state pills

Runtime state renders through the status primitives (`StatusChip` / `StatusBadge`), which map
state → tone via `src/lib/tones.ts`. Don't hand-tint pills with raw color scales.
_Guard: "no hand-rolled runtime-state pills (`bg-{emerald|amber|sky|rose}-500/10 …`)."_

```tsx
// ✓ do
<StatusChip state="approved" />

// ✗ don't
<span className="bg-emerald-500/10 text-emerald-700 rounded-full px-2">Approved</span>
```

For brand-tinted tags, use `<Badge variant="brand-soft">`, not `bg-[var(--p-accent)]/10
text-[var(--p-accent)]`.
_Guard: "no hand-rolled brand-tinted tag pills."_

## FormField, not a bare input + hand-rolled error box

Wrap fields in `FormField` (label + help + validation) and surface form errors through
`Alert`. Don't reconstruct the danger-bordered error box inline.
_Guard: "no hand-rolled form-error boxes (`border-[color:var(--p-danger)]/40`)."_

```tsx
// ✓ do
<FormField label="Crew email" help="We'll add them to the manifest." error={state?.error}>
  <input className="ps-input" name="email" />
</FormField>

// ✗ don't
<input className="ps-input" name="email" />
{error && (
  <div className="border-[color:var(--color-error)]/40 bg-[var(--color-error)]/10 text-[var(--color-error)]">
    {error}
  </div>
)}
```

## Dialog, not window.confirm

Destructive confirms go through `<Dialog>` so they're styled, accessible, and on-brand.
`window.confirm` is banned outside the allowlist.
_Guard: "no `window.confirm` destructive prompts outside allowlist."_

```tsx
// ✓ do
<Dialog
  title="Void 3 credentials?"
  body="They stop scanning at the gate immediately. You can reissue later."
  confirmLabel="Void credentials"
  onConfirm={voidCredentials}
/>

// ✗ don't
if (window.confirm("Are you sure?")) voidCredentials();
```

## Accent-text token for text, not the bright fill accent

Bright accents (COMPVSS yellow, LEG3ND orange) are fill colors — they fail AA as text. Use
`--p-accent-text` (deepened in light, brightened in dark) for links and colored text; reserve
`--p-accent` for fills, dots, and icons.

```tsx
// ✓ do
<a className="text-[var(--p-accent-text)] underline">View manifest</a>

// ✗ don't
<a className="text-[var(--p-accent)]">View manifest</a>   // bright fill fails as text
```

## Also guarded

- **Mode selector:** use `[data-mode="dark"]`, never the dead `[data-theme="dark"]`.
  _Guard present._
- **Retired fonts:** no references to the v2 stack (Archivo / Space Grotesk as headings),
  Inter, or JetBrains Mono — the stack is Anton / Hanken Grotesk / Space Mono / IBM Plex Mono
  / Jost. _Guard: dead-font references._
- **Palette-lock (v8.1 OKLCH):** no retired cyan/green house hexes survive in `src/` —
  per-product accents + the ATLVS-red house accent only. _Guard: palette-locked._
- **Mobile responsiveness:** no hardcoded `min-w` ≥ 375px outside the allowlist. _Guard
  present._

> The full, authoritative list lives in `src/app/design-system.test.ts`. When in doubt, run
> the suite — a green run is the contract.
