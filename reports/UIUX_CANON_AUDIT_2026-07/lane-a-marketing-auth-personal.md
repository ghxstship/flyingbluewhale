# Lane A — (marketing) · (auth) · (personal) — UI/UX canon audit (2026-07-22)

Read-only audit per `reports/UIUX_CANON_AUDIT_2026-07/CHECKLIST.md`. No remediation performed.

## 1. Coverage

**204 / 204 files walked (100%).** Enumerated via
`find "src/app/(marketing)" "src/app/(auth)" "src/app/(personal)" -name "*.tsx" -o -name "*.ts" | sort`
(120 marketing · 31 auth · 53 personal; 27,338 lines). Every file was swept
mechanically for all nine classes (hand-set type, raw hex/rgb, px literals,
em/en dashes, aria/htmlFor gaps, undefined-token vocabulary, hardcoded
English, status pills, hardcoded cross-shell URLs) and every page was read or
pattern-profiled for the judgment classes (PAT / VOICE / COMP misuse).

Sanctioned exceptions honored (not flagged): `/aurora` page-scoped
northern-lights style block (documented brand moment), OG-image / icon
routes, comparison data JSON, `"—"` used as an empty-value data placeholder
(22 sites, matches `formatMetricValue` convention), `/es-ES` + `/pt-BR`
intentionally hand-localized landing pages (by design, not extractor
targets — but their copy still carries em dashes, counted under V1).

## 2. Summary table

| Class | Findings (deduped) | Instances | Top offenders |
|---|---|---|---|
| TOKEN | 4 | ~130 lines | the 14-file `(personal)` legacy-vocab cluster; brand-kit stale green |
| TYPE | 5 | ~60 lines | `(personal)` `text-display text-3xl` h1s; hand-set `text-2xl font-semibold tracking-tight` h1/h2s; hand-rolled eyebrows |
| GRID | 2 | ~30 lines | brand-kit spec plates (inline px); `text-[15px]` blog/guides body |
| COMP | 2 | 14 files | `const INPUT` re-implementation of `.ps-input`; hand-rolled secondary CTAs |
| PAT | 2 | 9 sites | bare-div empty states; CartItemRow swallows server-action errors |
| VOICE | 3 | 163 lines / 75 files | em/en dashes in UI strings (standing emphatic rule) |
| A11Y | 1 | 2 components | async error text without `aria-live`/`role="alert"` |
| I18N | 1 | 12 files | ticketing + GVTEWAY store surfaces fully hardcoded English |
| NAV | 0 | — | clean: `urlFor()` respected, no hardcoded rails, EXEMPT reasons present |

**The three worst systemic patterns:**

1. **The `(personal)` legacy-vocabulary cluster (T1/T2/Y2)** — 14 `/me`
   marketplace-era pages still carry a pre-Monument vocabulary:
   `var(--color-text-secondary)` / `var(--color-text-tertiary)` /
   `var(--brand-color)` are **undefined** (only `--color-text-1/2/3` exist in
   the `@theme inline` wiring) and the classes `text-label` / `text-display` /
   `card-elevated` / bare `card` are **defined nowhere**. This is not just
   off-canon — it is dead CSS: secondary/tertiary text renders in the
   inherited body color (hierarchy lost), "Open console →" and card labels
   lose their accent color, and the `/me` console tile has no surface
   styling at all. 116 lines.
2. **Em/en dashes in UI copy (V1)** — 163 lines across 75 files, in direct
   violation of the emphatic standing rule (`feedback-no-em-dashes.md`):
   `t()` fallbacks, metadata titles (`` `${u.title} — ${u.short}` ``), auth
   error strings, brand-kit copy, es-ES/pt-BR locale copy, en-dash select
   options ("1–5", "6–20").
3. **Hand-set heading/eyebrow type instead of the ramp (Y1/Y3)** — ~44 sites
   set `text-2xl/3xl font-semibold tracking-tight` on `h1`/`h2` or hand-roll
   eyebrows as `text-[11px] font-semibold tracking-wider uppercase` instead
   of bare ramp headings / `.hed-*` / `.eyebrow`. These headings render in
   Hanken semibold, not Bebas — a visible face defection on every
   `(personal)` settings/notifications surface and the auth error pages.

## 3. Findings

| # | Class | path:line | Rule broken | Suggested fix | Effort | Risk |
|---|---|---|---|---|---|---|
| T1 | TOKEN | `src/app/(personal)/me/**` (14 files, see block below) | Surfaces/text from `--p-*`; retired/parallel namespaces must not reappear. `var(--color-text-secondary)` (33×), `var(--color-text-tertiary)` (27×), `var(--brand-color)` (7×), `var(--color-border)`/`var(--color-surface)` (via `me/reviews/new` INPUT const) — the first three are **undefined**, so the declaration is invalid and color falls back to inherited | Sweep to `text-[var(--p-text-2)]` / `--p-text-3` / `--p-accent-text` (or Tailwind `text-text-2` utilities already wired) | M | **High — live visual defect**: text hierarchy + accent affordance silently lost on every `/me` marketplace page |
| T2 | TOKEN | same 14 files | No dead/unknown classes: `text-label` (36×), `text-display` (16×), `card-elevated` (29×), `card` (1× — `me/page.tsx:126`) are defined in no stylesheet; they produce zero styles | `text-label`→`.eyebrow`; `text-display`→bare `h1` on the ramp; `card-elevated`→`.surface-raised` (or Card); `card`→`.surface` | M | High — the `/me` "Open console" tile renders with no surface/border; "cards" are unstyled divs with padding only |
| T3 | TOKEN | `src/app/(marketing)/brand-kit/foundations/page.tsx:521,531,541` | Palette v8.0: each product owns its accent; house green retired | Page displays `accent-text #147D1C (light) · #6EE176 (dark)` — the **retired house-green** values — for ATLVS, COMPVSS **and** GVTEWAY alike; and the "Product identity" section omits LEG3ND (0 mentions in the file) though v8.0 gives 4 products accents. Public brand documentation contradicting the ratified palette | S | Med — public-facing brand spec misinforms partners/designers |
| T4 | TOKEN | `src/app/globals.css:1208` ← consumer `src/app/(marketing)/pricing/page.tsx:536` | Tokens resolve from the SSOT | `.kinetic-display` reads `var(--font-size-6xl)` which is defined nowhere; its only consumer papers over it with hand-set `text-5xl sm:text-6xl` | S | Low (masked), but the class is a trap for the next consumer |
| Y1 | TYPE | 25 sites (block below) | Bare `h1`–`h4` land on the `--p-fs-*` ramp; don't hand-set `text-Nxl font-semibold tracking-tight` | Replace with bare headings or `.hed-*`; tracking has one home (`--p-heading-ls`) | M | Med — headings render Hanken-semibold instead of Bebas on auth error pages + all `(personal)` account surfaces |
| Y2 | TYPE | 16 sites in `(personal)` (e.g. `me/page.tsx:27`, `me/applications/page.tsx:30,53`, `me/availability/page.tsx:138`, `me/crew/page.tsx:53`, `me/inquiries/page.tsx:32,53`, `me/offers/page.tsx:75`, `me/reviews/*`, `me/saved-searches`, `me/submissions/*`, `me/talent`) | Same rule; compounded by T2 | `text-display text-3xl` → dead class + hand-set size; replace with bare `h1` | S (mechanical) | Med — same face defection |
| Y3 | TYPE | 19 sites (block below) | Eyebrows/overlines use `.eyebrow` | Hand-rolled `text-[11px]/text-xs + font-semibold + tracking-wider + uppercase` eyebrows in changelog, community, customers/[slug] (3× `h2`-as-eyebrow), roadmap, pricing:647, integrations/partners/[slug], compare + features figcaptions, PersonalTabs:36, me/preferences legends (3×), me/settings/appearance (2×, with off-canon `tracking-[0.2em]`) | S | Low–Med — tracking/casing drift per surface |
| Y4 | TYPE | `src/app/(marketing)/pricing/page.tsx:556` | Metric/stat figures = display face w/ tabular treatment (`.ps-stat`) | Tier price `text-3xl font-semibold tracking-tight` hand-set; use `.ps-stat .v` or the ramp | S | Low |
| Y5 | TYPE/GRID | `brand-kit/foundations/page.tsx` (~20 inline `fontSize`/`gap` literals: 111,123,179,212,218,233,243,255,299,322,336,349,511,643,650,654,674,681,687,755,787,806,830,834), `brand-kit/logo-kit/page.tsx:149` | 4px grid; sizes from the ramp | These are spec-plate demonstrations rendering the kit at fixed literal scales. Recommend **documenting as a sanctioned exception** (like the aurora block) rather than remediating; if not, migrate to `--p-fs-*`/`--p-*` vars | S (to document) | Low |
| G1 | GRID | `src/app/(marketing)/blog/[slug]/page.tsx:79` · `guides/[slug]/page.tsx:80` | Sizes come from the ramp; 4px grid | `text-[15px]` long-form body — off-ramp, off-grid; use `.ps-body`/`text-base` | S | Low |
| G2 | GRID | `src/app/(personal)/me/security/two-factor/TwoFactorClient.tsx:171` (`w-[252px]` QR box) · `pricing/page.tsx:590` (`min-w-[720px]`) · `brand-kit/page.tsx:65` (`max-w-[1180px]`) | px literals in classes | 252/720 are 4px-grid multiples (functional QR/table widths — arguably fine); 1180 is off-grid | S | Trivial |
| C1 | COMP | `integrations/submit/page.tsx:29` · `marketplace/_inquire/InquirePanel.tsx:9` · `marketplace/calls/[slug]/submit/page.tsx` · `marketplace/gigs/[slug]/apply/page.tsx:23` · `me/reviews/new/page.tsx:13` | `Input`/`.ps-input` (+`--sm`/`--lg`) over ad-hoc | Five files each re-declare `const INPUT = "w-full rounded-md border …"` re-implementing `.ps-input` (the `me/reviews/new` copy also uses the legacy `--color-border`/`--color-surface` indirection). Misses focus ring via `--p-focus`, density tokens, disabled states | M | Med — inputs on these forms don't get the kit focus/density behavior |
| C2 | COMP | 9 files: `(marketing)/page.tsx:277,375` · `mfa/recovery/page.tsx` · `events/[slug]/tickets/TicketPurchase.tsx` · `integrations/page.tsx` · `integrations/submit/page.tsx` · `marketplace/_inquire/InquirePanel.tsx` · `marketplace/calls/[slug]/submit/page.tsx` · `marketplace/gigs/[slug]/apply/page.tsx` · `me/availability/page.tsx` | Button/`.ps-btn` variants over ad-hoc | Hand-rolled secondary CTA anchors (`rounded-md border border-[var(--p-border-2)] px-5 py-2.5 text-sm font-semibold … hover:bg-…`) instead of `Button variant="secondary"` / `.ps-btn--secondary` | S | Low–Med — no `:active`/`:focus-visible`/loading parity |
| P1 | PAT | `events/page.tsx:60` · `events/[slug]/tickets/page.tsx:132` · `marketplace/store/page.tsx:64` · `marketplace/agencies/page.tsx:76` · `marketplace/calendar/page.tsx:82` · `integrations/partners/page.tsx:118` · `me/reviews/page.tsx:84` · `me/saved-searches/page.tsx:108` · `me/availability/page.tsx:274` | `EmptyState` teaches the first action | Bare `<div className="surface p-6">No … yet.</div>` empty states with no first-action CTA (contrast: `me/applications` does this right with `EmptyState` + "Browse Gigs") | S | Low–Med — dead-end moments for new users |
| P2 | PAT | `marketplace/store/_components/CartItemRow.tsx:29,34` | List honesty / every async result surfaces | Both `useActionState` results are discarded (`const [, updateAction]`) — server-action errors (stock clamp, removal failure) are **silently swallowed**; user sees nothing | S | **High — silent failure in a commerce flow** |
| V1 | VOICE | 163 lines / 75 files (counts per file in block below) | NO em/en dashes in UI strings (emphatic standing rule); restructure or use subtitle | Dashes in `t()` fallbacks, metadata `title`/`description` templates (`ai/[slug]:30`, `community/[slug]:29`, `features/[module]/[industry]:59,91`), auth error strings (`(auth)/actions.ts:111,117`, `mfa/challenge/actions.ts:137`), magic-link copy, brand-kit + es-ES/pt-BR copy, en-dash range options (`contact/ContactForm.tsx:78–80`), blockquote attribution dashes (`blog/[slug]:115`, `community/[slug]:120`, `compare/[competitor]:207`, `customers/[slug]:127`) | M (mechanical rewrite, needs copy judgment) | Med — direct standing-rule violation, user-visible everywhere |
| V2 | VOICE | `brand-kit/page.tsx:365` | Same rule inside an aria string | `aria-label="GHXSTSHIP — home"` (also mirrors the header-link label onto a non-link `h1`) | S | Trivial |
| V3 | VOICE | `(personal)` headings/EmptyState titles vs marketing | Sentence-vs-Title-Case consistency per surface | `(personal)` mixes Title Case ("My Applications", "No Applications Yet", "Booking Calendar") against the marketing shell's sentence case; within `(personal)` it is mostly-consistent Title Case, so this is a cross-shell convention decision, not per-file drift | S (decide + sweep) | Low |
| A1 | A11Y | `events/[slug]/tickets/TicketPurchase.tsx:132` · `marketplace/store/_components/CartItemRow.tsx` (via P2) | `aria-live` on async result regions | Error rendered in a plain `<p>` (`{state?.error && <p …>}`) with no `aria-live`/`role="alert"`; screen readers never hear purchase failures. (Other lanes-A clients are clean: `Alert` carries `role="alert"`, LeaveOrg/SetActive/MyOfferActions route through `toast`) | S | Med — checkout failure invisible to SR users |
| I1 | I18N | 12 files: `events/[slug]/page.tsx` · `events/[slug]/tickets/{page.tsx,TicketPurchase.tsx,actions.ts}` · `marketplace/store/{page,cart/page,[slug]/page}.tsx` + `_components/{AddToCartForm,CartItemRow,CheckoutButton}.tsx` · `marketplace/{talent,crew,agencies,vendors,rfqs}/**/inquire/page.tsx` (metadata) · `(marketing)/not-found.tsx` | User-facing strings t()-wrapped (3-arg fallback) | The entire ticketing + GVTEWAY store surface is hardcoded English ("Already have a ticket?", "Sold out", "Cart", "Update", "Remove", "Quantity", "No products are available right now.", "Not Found.") — zero `t()` in these files | M | Med — locale users hit raw English on the only public commerce flows |

<details>
<summary><strong>T1/T2 file list — the (personal) legacy-vocab cluster (116 lines)</strong></summary>

| file | lines w/ legacy vocab |
|---|---|
| `src/app/(personal)/me/page.tsx` | 17 |
| `src/app/(personal)/me/applications/[applicationId]/page.tsx` | 13 |
| `src/app/(personal)/me/submissions/[submissionId]/page.tsx` | 10 |
| `src/app/(personal)/me/availability/page.tsx` | 10 |
| `src/app/(personal)/me/saved-searches/page.tsx` | 9 |
| `src/app/(personal)/me/reviews/page.tsx` | 9 |
| `src/app/(personal)/me/reviews/new/page.tsx` | 8 |
| `src/app/(personal)/me/talent/page.tsx` | 7 |
| `src/app/(personal)/me/inquiries/page.tsx` | 7 |
| `src/app/(personal)/me/crew/page.tsx` | 7 |
| `src/app/(personal)/me/offers/page.tsx` | 6 |
| `src/app/(personal)/me/applications/page.tsx` | 6 |
| `src/app/(personal)/me/submissions/page.tsx` | 5 |
| `src/app/(personal)/me/profile/page.tsx` | 2 |

Vocabulary: `var(--color-text-secondary)` ×33 · `var(--color-text-tertiary)`
×27 · `var(--brand-color)` ×7 · class `text-label` ×36 · `text-display` ×16 ·
`card-elevated` ×29 · bare `card` ×1 (`me/page.tsx:126`). None of these
tokens/classes is defined in `globals.css`, `theme/**`, or the Tailwind
`@theme inline` wiring (only `--color-text-1/2/3` exist). Cluster matches the
0002-marketplace-era `/me` build; the newer `(personal)` surfaces
(profile/settings/security/preferences/notifications/privacy/tickets) are
already on `--p-*` + FormShell.
</details>

<details>
<summary><strong>Y1 hand-set heading sites (25)</strong></summary>

```
src/app/(auth)/error.tsx:18            src/app/(personal)/me/organizations/page.tsx:21,38
src/app/(auth)/not-found.tsx:13        src/app/(personal)/me/page.tsx:85
src/app/(marketing)/customers/page.tsx:57,74
src/app/(marketing)/features/[module]/page.tsx:179,224
src/app/(personal)/error.tsx:18        src/app/(personal)/me/privacy/page.tsx:17
src/app/(personal)/me/notifications/inbox/InboxClient.tsx:241
src/app/(personal)/me/notifications/inbox/page.tsx:32
src/app/(personal)/me/notifications/page.tsx:28,43
src/app/(personal)/me/notifications/push/page.tsx:110
src/app/(personal)/me/profile/page.tsx:45,68
src/app/(personal)/me/security/page.tsx:51
src/app/(personal)/me/security/two-factor/page.tsx:27
src/app/(personal)/me/settings/appearance/page.tsx:18
src/app/(personal)/me/settings/page.tsx:27
src/app/(personal)/me/tickets/page.tsx:23,78
src/app/(personal)/not-found.tsx:12
```
</details>

<details>
<summary><strong>Y3 hand-rolled eyebrow sites (19)</strong></summary>

```
src/app/(marketing)/changelog/page.tsx:83
src/app/(marketing)/community/[slug]/page.tsx:78
src/app/(marketing)/community/page.tsx:44,67
src/app/(marketing)/compare/[competitor]/page.tsx:206
src/app/(marketing)/customers/[slug]/page.tsx:97,106,115
src/app/(marketing)/customers/page.tsx:99
src/app/(marketing)/features/[module]/page.tsx:202
src/app/(marketing)/integrations/partners/[slug]/page.tsx:111
src/app/(marketing)/pricing/page.tsx:647
src/app/(marketing)/roadmap/page.tsx:160
src/app/(personal)/PersonalTabs.tsx:36
src/app/(personal)/me/preferences/page.tsx:84,130,154
src/app/(personal)/me/settings/appearance/page.tsx:31,43
```
</details>

<details>
<summary><strong>V1 em/en-dash copy lines — 75 files (count per file; placeholder "—" excluded)</strong></summary>

```
22 (marketing)/brand-kit/foundations/page.tsx     2 (personal)/me/settings/page.tsx
 9 (marketing)/pt-BR/page.tsx                     2 (personal)/me/reviews/page.tsx
 8 (marketing)/brand-kit/logo-kit/page.tsx        2 (personal)/me/preferences/page.tsx
 7 (marketing)/marketplace/talent/[handle]/page   2 (personal)/me/notifications/inbox/InboxClient.tsx
 7 (marketing)/marketplace/rfqs/[slug]/page       2 (personal)/me/crew/page.tsx
 7 (marketing)/marketplace/crew/[handle]/page     2 (marketing)/marketplace/calls/[slug]/submit/actions.ts
 6 (marketing)/marketplace/gigs/[slug]/page       2 (marketing)/legal/sla/page.tsx
 5 (marketing)/marketplace/vendors/[handle]/page  2 (marketing)/integrations/submit/thanks/page.tsx
 5 (marketing)/features/[module]/page.tsx         2 (marketing)/integrations/submit/page.tsx
 5 (marketing)/es-ES/page.tsx                     2 (marketing)/integrations/partners/page.tsx
 4 (personal)/me/tickets/page.tsx                 2 (marketing)/customers/[slug]/page.tsx
 4 (personal)/me/profile/page.tsx                 2 (marketing)/community/[slug]/page.tsx
 4 (marketing)/pricing/page.tsx                   2 (marketing)/brand-kit/page.tsx
 4 (marketing)/features/[module]/[industry]/page  2 (auth)/magic-link/MagicLinkForm.tsx
 3 (personal)/me/security/two-factor/TwoFactorClient.tsx   2 (auth)/actions.ts
 3 (marketing)/marketplace/calls/[slug]/submit/page.tsx
 3 (marketing)/marketplace/calls/[slug]/page.tsx
 3 (marketing)/marketplace/agencies/[handle]/page.tsx
 3 (marketing)/contact/ContactForm.tsx  (en-dash ranges "1–5", "6–20", "21–50")
 + 37 more files at 1 line each (full raw list reproducible via:
   grep -rn '—\|–' 'src/app/(marketing)' 'src/app/(auth)' 'src/app/(personal)'
   filtered to non-comment lines)
```
</details>

## 4. Canon-positive notes (reference implementations)

- **The (auth) form suite** — `LoginForm` / `SignupForm` / `MagicLinkForm` /
  `AcceptInviteForm` / `ResetPasswordForm`: AuthShell + `Input` (label/id
  wired) + `Alert` (`role="alert"`) + `Button loading` + `useActionState` +
  3-arg `t()` fallbacks throughout. The cleanest form pattern in the lane
  (only residue: dash copy in two strings, hand-set h1 on `error.tsx`).
- **`(marketing)/atlvs` + `/gvteway` pages** — fully composed from
  `MarketingPrimitives` (`MarketingHero`/`Section`/`Grid`/`PageShell`), zero
  hand-set type, static-t translated; the model for new product pages.
- **`(marketing)/pricing`** — `.ps-table` comparison matrix, `eyebrow`
  classes, `Button` variants, FAQ schema; only 3 small findings (Y4, Y3, T4).
- **NAV discipline is clean lane-wide** — zero hardcoded `atlvs.pro` /
  `/studio` / `/m` hrefs, `urlFor()` used at every cross-shell point
  (`me/page.tsx`, auth resolve flow); `/pitch` correctly documents its
  sitemap-EXEMPT status in a comment.
- **List honesty** — `/me` dashboard tiles use head-only exact counts with an
  explanatory comment (P2 remediation pattern worth copying); marketplace
  list rows all open real details.
- **`me/notifications/inbox/InboxClient.tsx`** — exemplary icon-button a11y:
  every icon action carries paired `aria-label` + `title`, EmptyState per
  tab, aria-labeled tab rail and unread counts.
- **Label association** — all audited form labels either wrap their control
  (implicit association) or use `htmlFor`/`sr-only` (`CartItemRow` qty);
  no orphaned labels found.
- **Loading states** — all three shells ship `loading.tsx`; the marketing
  shell's null-fallback decision is documented in-file with rationale.

## 5. Cross-lane handoff notes

- The `(personal)` legacy cluster (T1/T2) is one mechanical sweep — 14 files,
  6 find/replace rules — and clears ~45% of this lane's instance count.
- `PricingCalculator`, `MarketingPrimitives`, `AuthShell`, `DeckShell`,
  `InquirePanel`'s shared bits live in `src/components/**` (another lane);
  findings here cite only the route-local call sites.
- `docs/compvss` off-grid exceptions were checked; none of this lane's GRID
  findings fall under that carve-out (it is COMPVSS-kit-scoped).
