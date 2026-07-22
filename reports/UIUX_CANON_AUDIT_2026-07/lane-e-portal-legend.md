# Lane E — Portal (GVTEWAY), LEG3ND shell, public token surfaces (/book, /offer), shared portal/guide/signage components

Read-only audit, 2026-07-22. Classes and dedupe rules per `CHECKLIST.md`.

## 1. Coverage

**324 / 324 files walked (100%).**

| Area | Files |
|---|---|
| `src/app/(portal)/**` | 182 |
| `src/app/(legend)/**` | 121 |
| `src/app/offer/**` | 10 |
| `src/app/book/**` | 4 |
| `src/components/portal/**` | 3 |
| `src/components/guides/**` | 2 |
| `src/components/signage/**` | 2 |

Method: full-lane mechanical sweeps (raw hex/rgb, hand-set heading classes, em/en dashes, emoji, retired token vocab, tailwind palette colors, arbitrary px, `t()` coverage, FormShell/useActionState presence, aria/label association, urlFor/hardcoded hosts, nav SSOT, `--sign-*` usage, non-`aiga-*` pictogram refs, filter-pill/status patterns) + judgment reads of: both shell layouts, all 4 signage components/forms, legend hub CRUD (locations, organization, brand, catalogs, job-templates), engine, community composer, /book and /offer end-to-end (page, forms, print, error), GuideView/GuideComments, TicketPass, PortalDocVault, PortalPrivacyPanel, messages, apply, vendor invoices, P&L/settlement ledgers.

Lane-specific canon verified up front: portal shell carries `data-platform="gvteway"`+`data-product="gvteway"` at `(portal)/layout.tsx` and `p/[slug]/layout.tsx:83`; legend shell carries `data-product/platform/type="legend"`; both rails come from `nav.ts` (`portalNav`, `legendNav`) — **no hardcoded rails, no cross-shell hardcoded `/studio` or `/m` hrefs anywhere in the lane**. `PortalDocVault` is mounted exactly where canon says (artist / media / delegation index pages). `/p/[slug]/guide` renders through `<GuideView>`. Retired token vocab (`--bg`, `--surface`, `--accent`, `--org-*`, `.badge-*`): zero hits. Tailwind palette colors (`text-red-500` etc.): zero hits. Emoji: zero hits. Arbitrary px values: only `[11px]` (the sanctioned floor).

## 2. Summary

| Class | Findings | Worst offenders |
|---|---|---|
| TYPE | 3 (2 systemic) | 58 files hand-set headings; ~108 hand-rolled eyebrow/uppercase labels vs 17 files on `.eyebrow` |
| TOKEN | 5 (2 real bugs) | `--border-default` consumed undefined on /offer; duplicate `--p-text-2` in offer print; BrandingForm off-canon hex defaults |
| GRID | 1 (note) | `SignPanel` `radius = 14` default |
| COMP | 3 | ad-hoc composer input; hand-styled anchor-button on /offer |
| PAT | 2 | signage `colorway` free-text field (retired vocabulary); `pictogram_key` not allowlisted to `aiga-*` |
| VOICE | 2 (1 systemic) | ~25 em-dash strings in visible copy, concentrated in legend subtitles/blurbs |
| A11Y | 3 | BrandingForm unlabeled hex inputs; PostComposer placeholder-as-label |
| I18N | 2 (1 systemic) | legend shell 12/121 files use `t()`; ~15 portal pages with hardcoded copy |
| NAV | 1 | hardcoded `*@atlvs.pro` mailtos bypassing `BRAND.emails`; `next/link` used for a mailto |

**Signage two-color rule: PASS.** `SignIcon` renders sprite-only `currentColor`; `SignPanel` and `PictogramPreview` both set `--sign-knock` to the tone field and resolve every color through `signFieldVar`/`signLegendVar` → `CATEGORY_TONE`. No third color, no ad-hoc tinting in any renderer. The two signage findings below are authoring-form data hygiene, not rendering violations.

## 3. Findings

| # | Class | Path:line | Rule | Suggested fix | Effort | Risk |
|---|---|---|---|---|---|---|
| E-01 | TYPE | 58 files (list below) — e.g. `(portal)/p/[slug]/producer/approvals/page.tsx:62`, `(legend)/legend/learn/page.tsx:56` | Bare `h1`–`h4` land on the `--p-fs-*` ramp; hand-set `text-2xl font-semibold` / `text-4xl font-bold tracking-tight` overrides Bebas + fluid ramp | Strip size/weight/tracking utilities from headings; use bare `h1`/`h2` or `.hed-*` | M (mechanical sweep) | Low; visible face change (Hanken→Bebas) when fixed — batch per shell |
| E-02 | TYPE | ~108 occurrences across the lane — e.g. `(portal)/p/[slug]/crew/docs/new/page.tsx:18` (`text-xs font-semibold tracking-wider uppercase`), `TicketPass.tsx:80` | Eyebrows/overlines are `.eyebrow` (Space Mono); only 17 lane files use it | Replace hand-rolled uppercase micro-label stacks with `.eyebrow` | M | Low |
| E-03 | TYPE | `producer/pnl/page.tsx:92-115`, `stakeholder/pnl/page.tsx:92-115`, `promoter/settlements/page.tsx:94-108`, `producer/readiness/page.tsx:76`, `sponsor/reporting/page.tsx:67,73` | Metric values = Hanken 800 tabular (`MetricCard`/`.ps-stat .v`); these hand-roll `font-mono text-2xl font-semibold` stat tiles | Use `MetricCard` (already imported in several of these files for other tiles) | S | Low |
| E-04 | TOKEN | `src/app/offer/[token]/page.tsx:79` | `border-[var(--border-default)]` — the property is only defined inside the *print* pages' inline style; **undefined on the live offer page**, border color silently falls back | Use `var(--p-border)` | S | Real: missing border on the Print/PDF pill in the external offer surface |
| E-05 | TOKEN | `src/app/offer/[token]/print/page.tsx:52-53` | `--p-text-2` declared twice (`#1a1a1a` then `#6b6b6b`) — first is dead; one of the two was clearly meant to be `--p-text-1`/`--p-text-3` | Rename the intended override; same duplicated block exists in `src/app/msa/[token]/print/page.tsx` (other lane, note for dedupe) | S | Print secondary text renders lighter than intended |
| E-06 | TOKEN | `(legend)/legend/hub/brand/BrandingForm.tsx:33-35` | White-label defaults seed `#DC2626` / `#6D4A2A` — neither is a canon color; the cold-start accent is volcanic red `#E23414` | Seed defaults from `tokens.json` accents (or the org's product accent) | S | Orgs that save without touching the picker ship an off-brand near-red |
| E-07 | TOKEN | `src/app/offer/[token]/print/page.tsx:48-63` | Print artifact hardcodes a full hex palette incl. `--p-accent: #1a4dbb` (an off-brand blue on an ATLVS-branded letter) | Acceptable as a documented print-palette moment, but the accent should be the issuing brand's accent (letters are white-labelable) | S | Low |
| E-08 | TOKEN | `(legend)/legend/start/actions.ts:461-465` | Invite email is ad-hoc inline HTML with raw hex, outside the Email Kit `templates.ts` registry (which the advance/scheduler emails all use) | Move to an Email Kit template id | M | Inconsistent email chrome; unreviewed copy path |
| E-09 | COMP | `(portal)/p/[slug]/messages/[roomId]/page.tsx:207-209` | Composer input hand-styles `rounded-md border … px-3 py-2` instead of `.ps-input` | `className="ps-input flex-1"` | S | Low |
| E-10 | COMP | `src/app/offer/[token]/page.tsx:75-81` | "Download PDF / Print" is a hand-styled anchor; button vocabulary is `.ps-btn` variants | `.ps-btn ps-btn--ghost ps-btn--sm` (pattern already used on `/p/[slug]/apply`) | S | Low |
| E-11 | COMP | `(legend)/legend/hub/templates/job-templates/new/page.tsx:25-45`, `PositionForm.tsx`, `NewSignForm.tsx` | Legend hub CRUD mixes `ui/Input` with raw `<label><input className="ps-input">` blocks in the same forms | Standardize on `Input` (labels are associated today via wrapping, so a11y holds; this is vocabulary consistency) | S | Low |
| E-12 | PAT | `(legend)/legend/signage/new/NewSignForm.tsx:95-99`, `actions.ts:25,45,71`, `[signId]/page.tsx:88`, `page.tsx:182` | Signage canon: color derives **only** from `category → CATEGORY_TONE`; "no ad-hoc colorway tinting". The authoring form carries a free-text `colorway` field ("life-safety green") — never used to tint (good) but it stores and displays a parallel, uncontrolled color vocabulary that invites reintroduction | Drop the field from the form/detail (or derive the display string from `CATEGORY_TONE`) | S | Misleading metadata; a future consumer could tint from it |
| E-13 | PAT | `(legend)/legend/signage/actions.ts:24` (zod: `pictogram_key: z.string().max(120)`) | Sole pictogram set is the 60 `aiga-*` sprite ids; the form only *suggests* them via datalist — any string is accepted and a non-sprite id renders an empty `SignIcon` | Validate against the `PICTOGRAMS` index (`src/lib/signage_pictograms.ts`) at the boundary | S | Broken (blank) signs authorable in prod |
| E-14 | VOICE | ~25 visible-copy strings (list below) — e.g. `(legend)/legend/compliance/page.tsx:112`, `(legend)/legend/page.tsx:36-101`, `(portal)/p/[slug]/apply/page.tsx:186`, `p/onsite/page.tsx:74,122` | NO em/en dashes in labels/titles/subtitles/marketing copy (emphatic standing rule); restructure instead. (The `"—"` null placeholder in data cells is the sanctioned formatting convention and is NOT flagged.) | Restructure each string (comma, period, or split) | S each, M total | Emphatic owner rule; currently shipping |
| E-15 | VOICE | `src/app/(portal)/layout.tsx:11` (comment) | Stale doc: "narrows the accent to plasma cyan" — GVTEWAY has been blue `#2563EB` since v5.1 | Fix comment | S | None (doc drift only) |
| E-16 | A11Y | `(legend)/legend/hub/brand/BrandingForm.tsx:89-96,111-118,133-140` | The hex **text** inputs (accentColor/accentForeground/secondaryColor) have no `htmlFor`/`id` association and no `aria-label` (only the adjacent color-swatch inputs are labeled); labels are non-wrapping siblings | Add `id` + `htmlFor`, or `aria-label` per field | S | Screen readers announce three anonymous text fields on a fresh CRUD surface |
| E-17 | A11Y | `(legend)/legend/community/PostComposer.tsx:21-28` | Title input + body textarea rely on placeholder-as-label (no `aria-label`); placeholder disappears on input | `aria-label` on both (category `<select>` already has one) | S | Low-moderate |
| E-18 | A11Y | `src/components/guides/GuideView.tsx:73` | Section-pill `<nav>` lacks `aria-label` (unnamed landmark on every guide) | `aria-label={t("components.guideView.sectionsNav", …)}` | S | Low |
| E-19 | I18N | Systemic: `src/app/(legend)/**` — 12 of 121 files reference `t()` | User-facing strings t()-wrapped; legend ships hardcoded English in nearly every ModuleHeader title/subtitle, empty state, form label, and button. The fresh hub CRUD is internally inconsistent: `NewLocationForm` + job-templates are fully t()-wrapped, `PositionForm`/`NewSignForm`/`RuleForm`/`ResourceForm`/`CollectionForm`/`PostComposer` are not | Catalog sweep over the legend shell (the i18n sweep pipeline exists) | L | Legend is a public-funnel surface; locale users get full-English |
| E-20 | I18N | ~15 portal pages, e.g. `p/[slug]/crew/docs/new/page.tsx:18-19`, `vendor/docs/new`, `crew|vendor/time-off/new:20`, `p/[slug]/schedule/page.tsx:48` | Portal is otherwise ~80% t()-covered; these thin wrapper pages hardcode eyebrow/title copy | Wrap the handful of strings | S | Low |
| E-21 | NAV | `(portal)/p/[slug]/apply/page.tsx:174`, `src/components/portal/PortalPrivacyPanel.tsx:162` | Hardcoded `accreditation@atlvs.pro` / `privacy@atlvs.pro` bypass the `BRAND.emails` SSOT (`src/lib/brand.ts`); apply additionally routes the mailto through `next/link` `<Link>` (mailtos are plain `<a>`) | Read from `BRAND.emails`; swap `Link`→`a` | S | Address drift on rebrand/white-label; Link prefetch noise |
| E-22 | GRID | `src/components/signage/SignPanel.tsx:34` (`radius = 14` default) | Radii ride `--p-r-md`/`--p-r-xl` | Judgment: sign anatomy is its own SEGD/AIGA-proportioned system (cap-height-derived padding is intentional); if kept, document 14 as part of the `--sign-*` anatomy layer or move to a `--sign-radius` token | S | None visible |

<details>
<summary><strong>E-01 file list — hand-set heading classes (58 files)</strong></summary>

Portal (44): `error.tsx`, `not-found.tsx`, `p/[slug]/announcements`, `client/proposals/[proposalId]/approvals/[approvalId]`, `change-orders/[coId]`, `revisions/[revisionId]`, `crew/docs/new`, `crew/time-off/new`, `inbox`, `messages/[roomId]`, `messages`, `producer/{approvals,pnl,portfolio,readiness,reviews,risk,tracker}`, `promoter/{approvals,co-pro,marketing,settlements,tour-pnl}`, `schedule`, `settings/notifications`, `sponsor/reporting`, `stakeholder/{audit,governance,pnl,portfolio,sustainability}`, `tasks`, `vendor/docs/new`, `vendor/time-off/new`, plus the remaining `p/*` consumer pages surfaced by the sweep (`text-(xl|2xl|3xl|4xl) font-(semibold|bold)` grep is the authoritative enumerator).
Legend (11): `error.tsx`, `not-found.tsx`, `architecture`, `for-institutions`, `learn`, `learn/[course]` (+ lesson + quiz ×3), `store`.
Offer (3): `UnlockForm.tsx`, `checkin`, `onboarding`.
</details>

<details>
<summary><strong>E-14 string list — em dashes in visible copy</strong></summary>

Legend ModuleHeader subtitles/emptyLabels: `badges:54`, `community/page:87`, `compliance:112`, `console:87`, `crew:66`, `leaderboard:58`, `live:76`, `my-learning:100`, `path:78`, `resources/[id]:60` (template), `resources:78`, `engine/runs/[id]:103`.
Legend home tile blurbs (t() fallbacks): `legend/page.tsx:36,41,67,82,92,101`.
Portal t() fallbacks: `apply/changes:32`, `apply:186`, `athlete/page:52,69`, `media/page:57`, `volunteer/application:29`, `onsite:74,122`.
Offer: `checkin/page.tsx:27`.
Signage form: `[signId]/placements/new/NewPlacementForm.tsx:39` (`— Org-level (no project) —` option label).
Quiz title concat: `learn/[course]/quiz/[id]/page.tsx:39` (`{title} — Quiz`).
</details>

## 4. Canon-positive notes (reference implementations)

- **Signage rendering trio** — `SignIcon` / `SignPanel` / `PictogramPreview` are the cleanest canon in the lane: single sprite render path, two-color rule via `--sign-knock`, all color through `CATEGORY_TONE` → `--sign-*` tokens, SEGD anatomy derived from cap height, `role="img"` + label fallback from the pictogram index. Use as the reference for any function-colored component.
- **`/book/[token]`** — marketing-grade token surface: bare `h1` on the ramp, `.eyebrow` + `.ps-body`, full 3-arg `t()` coverage, `BookingForm` is the model client form (useActionState + Alert + Input + Button, tz autodetect with server fallback), calm confirm/cancel voice ("All set. Book a new time below whenever you're ready.").
- **`/offer/[token]` UnlockForm + error boundary** — FormShell/FormField over a token gate, org lockup resolved server-side with safe-metadata-only pre-unlock (E-05 comment discipline), shared `TokenShellError` for chrome-free external failures.
- **`GuideView`** — `hed-2xl`, semantic deep-link anchors, `aria-hidden` decorative separators, i18n throughout; `GuideComments` labels every control.
- **`TicketPass`** — i18n'd server component, fixed-white QR field documented for dark-mode scanners, StatusBadge for state, privacy note pinned in the doc comment.
- **Vendor invoice submission** (`p/[slug]/vendor/invoices`) — FormShell + FormField + hints + t() everywhere; the best portal form.
- **Nav SSOT** — both shells resolve rails exclusively from `nav.ts` (`portalNav` + persona mapping, `legendNav`); portal mobile drawer re-labels through the i18n nav-label helpers.
- **`PortalDocVault` / privacy panels** — mounted per canon, fully t()-wrapped shared components.

## 5. Systemic patterns (for the remediation plan)

1. **Hand-set heading/eyebrow typography instead of the v8.0 ramp** (E-01 + E-02, ~166 sites): the portal and legend shells predate the Wired Scale and were never swept; every fresh page copies a neighbor, so the drift self-propagates.
2. **Legend shell shipped without i18n** (E-19 + the em-dash cluster E-14): the whole `(legend)` group reads as pre-voice-canon, pre-i18n code; one catalog+voice sweep fixes both classes together.
3. **Token surfaces define their own palette plumbing** (E-04/E-05/E-07): the offer/msa print pages hand-copy a `--p-*` override block (with a live duplicate-property bug) and leak a private var (`--border-default`) into the non-print page; a shared print-palette snippet would close all three.
