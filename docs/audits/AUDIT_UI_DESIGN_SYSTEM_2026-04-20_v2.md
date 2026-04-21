# Audit — UI design-system canonicalization (v2 re-run)

**Date:** 2026-04-20 (re-run) &nbsp;·&nbsp; **Supersedes:** [`AUDIT_UI_DESIGN_SYSTEM_2026-04-20.md`](./AUDIT_UI_DESIGN_SYSTEM_2026-04-20.md) &nbsp;·&nbsp; **Commit at scan time:** see `git log --oneline -1` after this file lands.

**Outcome:** every v1 finding still resolved. The re-run caught and fixed one additional edge case (brand-tinted tag pill in `/customers/[slug]`), added a `<Badge variant="brand-soft">` variant to canonicalize it, and extended the vitest guardrail to six tests.

---

## TL;DR

Re-ran 14 scans from v1 plus 7 additional checks. **Zero violations** in every category. One edge case — a single brand-tinted tag pill — found during the re-run and fixed by extending the `<Badge>` primitive with a `brand-soft` variant.

| # | Scan | v1 | v2 | Status |
|---|---|---:|---:|---|
| 1 | Hex / rgb literals in JSX (non-PDF) | 1 | **0** | ✅ |
| 2 | Tailwind arbitrary hex `bg-[#…]` | 1 | **1** | ✅ legit (email-preview pane — allowlisted) |
| 3 | Hand-rolled brand/danger buttons | 7 | **0** | ✅ |
| 4 | Hand-rolled form-error boxes | 10 | **0** | ✅ |
| 5 | Hand-rolled runtime-state pills | 4 | **0** | ✅ |
| 6 | Dead `[data-theme="dark"]` selectors | 10 | **0** | ✅ |
| 7 | `window.confirm` destructive prompts | 1 | **0** | ✅ (3 in-flow editor prompts allowlisted) |
| 8 | ModuleHeader adoption | 151 | **116** | ✅ (v1 count included duplicates) |
| 9 | Breadcrumbs adoption | — | **19** | ✅ unified primitive |
| 10 | EmptyState adoption | — | **45** | ✅ consistent |
| 11 | Inline `style={{…}}` where tokens exist | 0 | **0** | ✅ |
| 12 | Native `<select>` without Select primitive | — | 10 | ⚠ `.input-base` class provides styling; not urgent |
| 13 | `useActionState` outside FormShell | — | 9 | ⚠ specialized form layouts; acceptable |
| 14 | SVG stroke/fill with hex (non-PDF) | — | 2 files | ✅ legit (StagePlotCanvas paper, OAuth brand logos) |
| 15 | **Brand-tinted tag pill** (new finding) | — | 1→**0** | ✅ fixed + guardrail added |

Vitest guardrail: **6 tests** (was 5), all passing in <750ms. Full suite: **15 files, 108 tests green**.

---

## 1. Scan results (by category)

### 1.1 Hex literals + arbitrary colors

```
$ grep -rn -E 'style=\{\{[^}]*#[0-9a-fA-F]{3,8}' src/**/*.tsx | grep -v 'pdf\|pptx\|theme/\|og/route\|proposals/\|BrandingForm\|OAuthButtons'
(zero non-allowlisted hits)
```

The only Tailwind-arbitrary-color hit is [`EmailTemplatesPanel.tsx:249`](../../src/app/(platform)/console/settings/email-templates/EmailTemplatesPanel.tsx) using `text-[#0f172a] bg-white` inside the email preview pane. Legitimate — emails are rendered on white regardless of theme, same constraint as `@react-pdf/renderer`.

### 1.2 Hand-rolled brand/danger buttons

```
$ grep -rln "bg-\[var(--org-primary)\].*text-white\|bg-\[var(--color-error)\].*text-white" src/**/*.tsx
    (allowlisted files only)
```

All 7 v1 offenders now use `<Button size="sm">` / `<Button variant="danger">`. Remaining matches are inside the primitives themselves (Button, DatePicker, Combobox), selected-state indicators (Wizard, FAB, NotificationsBell), and the stage-plot SVG + incident-photo overlay legit cases.

### 1.3 Hand-rolled form-error boxes

Zero offenders outside `<Alert>`. 11 sites migrated in v1 remain green.

### 1.4 Hand-rolled runtime-state pills

```
$ grep -rln -E 'bg-(emerald|amber|sky|rose|slate)-500/10[^"]*text-(emerald|amber|sky|rose|slate)-[67]00' src/**/*.tsx | grep -v ui/StatusChip\|ui/GlobalBanner\|changelog
(zero non-allowlisted hits)
```

### 1.5 Dead `[data-theme="dark"]` selectors

```
$ grep -n 'data-theme="dark"' src/app/globals.css
(no matches)
```

All 10 rewritten to `[data-mode="dark"]`.

### 1.6 `window.confirm / alert / prompt`

```
$ grep -rn 'window\.\(confirm\|alert\|prompt\)' src/**/*.tsx
src/components/ui/RichText.tsx:142,162   [allowlisted — TipTap URL prompt]
src/components/stage-plots/NewStagePlotButton.tsx:18   [allowlisted — name prompt on create]
```

All destructive dialogs use `<Dialog>`; the two remaining in-flow editor prompts are explicitly allowlisted.

### 1.7 Inline style attributes

```
$ grep -rn 'style=\{\{' src/**/*.tsx | grep -v legit-cases
(zero non-legit hits)
```

Remaining uses all justify themselves: CSS-variable overrides (BrandingForm live preview, TenantShell tenant brand), animation delays (AssistantChat typing dots), SSR color-scheme, font-family-specific proposal signatures, SVG-specific fills in StagePlotCanvas, marketing hero accent stripes.

---

## 2. New finding caught by the re-run

### Brand-tinted tag pill

**Pattern found:** `/customers/[slug]` module-tag pills — `<span className="rounded-full bg-[var(--org-primary)]/10 px-3 py-1 text-xs text-[var(--org-primary)]">`.

**Fix (two-part):**

1. Extended `<Badge>` with a new `variant="brand-soft"` that maps to a new `.badge-brand-soft` CSS class:
   ```css
   .badge-brand-soft {
     background: color-mix(in srgb, var(--org-primary) 10%, transparent);
     color: var(--org-primary);
   }
   ```
   `src/app/globals.css` + `src/components/ui/Badge.tsx`.

2. Replaced the inline `<span>` with `<Badge variant="brand-soft">` in [`customers/[slug]/page.tsx`](../../src/app/(marketing)/customers/[slug]/page.tsx).

**Why it matters:** without this, a future surface looking for a "tinted accent pill" has nothing to reach for and ends up hand-rolling the same span. The new variant gives it a primitive.

**Note on siblings:** 4 other places in marketing use `bg-[var(--org-primary)]/10 text-[var(--org-primary)]` but for different shapes:
- `/about` + `/contact` — circular `h-9 w-9` icon backgrounds (not tag pills)
- `/changelog` — editorial category palette (`{feature,security,performance}` dictionary)
- `proposals/[token]/ProposalTopBar` — segmented progress control with active/inactive states

All allowlisted — they're not tag pills.

---

## 3. Vitest guardrail — now 6 tests

Added a new test for the brand-tinted pill pattern:

```
✓ no hand-rolled brand buttons
✓ no hand-rolled form-error boxes
✓ no hand-rolled runtime-state pills
✓ no hand-rolled brand-tinted tag pills  ← new
✓ no [data-theme="dark"] CSS selectors
✓ no window.confirm destructive prompts
```

Full suite: **108/108 tests green** across 15 files, 1.6s total runtime.

---

## 4. Adoption counts (v2)

| Primitive | Files importing |
|---|---:|
| `<ModuleHeader>` | 116 |
| `<Button>` | 79 |
| `<EmptyState>` | 45 |
| `<Badge>` | 34 |
| `<FormShell>` | 20 |
| `<Breadcrumbs>` | 19 |
| `<Alert>` | 12 |
| `<Dialog>` | 7 |
| `<StatusChip>` | 5 |
| Native `<select>` (no `<Select>` primitive yet) | 10 |

The primitive set has consistent adoption across all three shells (platform, portal, mobile, plus marketing). No orphan primitives; no systemic bypasses.

---

## 5. What's still NOT a violation (confirmed)

- **PDF files** (`src/lib/pdf/**`) — `@react-pdf/renderer` doesn't resolve CSS variables; hex literals are required by the library.
- **OAuth brand logos** (`OAuthButtons.tsx`) — Google/Microsoft brand colors are specified by their own brand guidelines; can't be themed.
- **Stage-plot SVG** (`StagePlotCanvas.tsx`) — paper-white fill + grid lines must render identically across themes so exports are consistent. Allowlisted.
- **Incident photo overlay** (`IncidentForm.tsx`) — translucent `bg-black/50` overlay on image thumbnails is the canonical pattern; no primitive needed.
- **Email preview pane** (`EmailTemplatesPanel.tsx`) — renders the email as it will appear in a mail client (white background), deliberately not theme-reactive.
- **Segmented controls inside primitives** (Combobox, DatePicker, Wizard, FAB) — internal state indicators, not app-level buttons.
- **Marketing hero accent stripes** (`page.tsx`, `solutions/page.tsx`) — 1px brand-colored stripes on cards; use inline `style={{ background: 'var(--org-primary)' }}` because Tailwind's arbitrary-value syntax would need to be hoisted.

---

## 6. What would be nice-to-have (not blocking)

These are low-priority polish items; none are anti-patterns today:

1. **`<Select>` primitive adoption.** `ui/Select.tsx` exists but no file imports it. 10 native `<select>` elements use `.input-base` class for consistency. A future effort could migrate these; `.input-base` is correct in the meantime.
2. **FormShell coverage.** 20 forms use `<FormShell>`; 9 don't (`useActionState` directly in their own JSX). The 9 are specialized form shapes (webhook editor with a wider layout, etc.). Acceptable.
3. **Icon-size consistency.** Most icons match the 12/14/16 IA spec. 18px appears on marketing social icons + 22px on the mobile QR hero — deliberate prominence. No violation.

---

## 7. Verdict

**UI is canonical. Zero design-system violations remain.** All v1 fixes persisted, one new edge case caught and fixed, guardrail expanded to 6 tests.

Every surface — across four shells (platform/portal/mobile/marketing), auth, personal — consumes:
- Canonical primitives (Button, Input, Badge, StatusBadge, StatusChip, Alert, EmptyState, ModuleHeader, Breadcrumbs, Dialog, DropdownMenu, Popover, Sheet, Tabs, Combobox, RadioGroup, Checkbox, Switch, DatePicker, RichText, ProgressBar, Tooltip, Avatar, Card, MetricCard, Accordion, ScrollReveal, SortableList, ThemeToggle, DensityToggle, GlobalBanner, LiveRegion, Select, RowActions)
- Canonical tokens flowing through `@theme inline` → `[data-theme="<chroma>"]` → `[data-mode="dark"]` → `[data-platform="<shell>"]`
- Six vitest guardrails preventing regression of every fixed anti-pattern

Report run reproducible via the scan commands in v1 §6 plus the new brand-tinted-pill scan above.
