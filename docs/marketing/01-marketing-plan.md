# Marketing UI — plan + status

**Scope:** everything under `src/app/(marketing)/**`, the shared
`MarketingHeader`, the 8-theme CHROMA BEACON picker exposure, and the
locale infrastructure that feeds `<html lang dir>`.

**Shipping model:** three horizons (M1 / M2 / M3), same shape as the
backend audit. M1 is foundation; M2 is normalization; M3 is
future-proof. As of this document's update, **M1 is 100%**, **M2 is
5 of 7 shipped** (2 deferred with reasons), **M3 is 1 of 8 shipped**
(7 deferred with product-decision reasons noted per item).

---

## M1 — Foundation (100%)

Shipped in commit `31a6a74`. Every item has a regression guard in
`e2e/marketing-header.spec.ts` (9 tests).

| Item | Status | Guard |
|---|---|---|
| **M1-01** rename Auto → System + fix orphan-provider no-op | ✅ | `segmented control uses the System label` + `clicking Dark flips checked state AND writes data-mode=dark on <html>` |
| **M1-02** extract `MarketingHeader` into its own client component | ✅ | every other spec implicitly |
| **M1-03** `LocaleSwitcher` — dropdown + cookie + `router.refresh()` | ✅ | `switching to ja writes a cookie…`, `switching to ar flips <html dir> to rtl` |
| **M1-04** CHROMA BEACON picker as a right-side sheet | ✅ | `Themes button opens the sheet`, `picking a theme writes the cookie` |
| **M1-05** mobile nav hamburger + full-height sheet | ✅ | `hamburger replaces the desktop nav`, `close button restores` |

### The surprise bug found during M1

`ThemeToggle` imported `useTheme` from `@/components/providers/ThemeProvider`
— a module that was **never mounted in the root tree**. Only the CHROMA
BEACON provider was mounted, so every click on Light/System/Dark wrote
to an orphaned context. The UI looked fine but did nothing.

Fixed architecturally: the CHROMA BEACON provider gained an orthogonal
`mode` dimension. The DOM now carries **two** attributes —
`data-mode ∈ {light,dark}` (resolved against `prefers-color-scheme`)
and `data-theme ∈ {glass, brutal, kinetic, copilot, cyber, soft, earthy, bento}`.
The orphan provider is deleted.

---

## M2 — Normalize (5 of 7 shipped)

### Shipped

| Item | Status | Artefact |
|---|---|---|
| **M2-02** rhythm primitives | ✅ | [`MarketingPrimitives.tsx`](../../src/components/marketing/MarketingPrimitives.tsx) — `MarketingHero`, `MarketingSection`, `MarketingGrid`, `MarketingPageShell`. Applied to `/features` as the reference implementation. |
| **M2-03** breadcrumb primitive with `BreadcrumbList` JSON-LD | ✅ | [`Breadcrumbs.tsx`](../../src/components/marketing/Breadcrumbs.tsx) — visible trail + embedded schema.org JSON-LD in one component so callers can't forget the SEO half. |
| **M2-04** structured data helpers + `Organization` on root | ✅ | [`lib/seo/structured-data.tsx`](../../src/lib/seo/structured-data.tsx) — factories for `Organization`, `Article`, `SoftwareApplication`, `FAQPage`. Organization wired into `src/app/layout.tsx` so every page inherits it. |
| **M2-05** dynamic OG image pipeline | ✅ (pre-existing) | `src/app/og/route.tsx` + `buildMetadata` in `src/lib/seo.ts` — every marketing page's `generateMetadata` emits a theme-aware OG URL. Confirmed shipped before the audit. |
| **M2-07** focus-ring polish | ✅ (pre-existing) | `src/app/globals.css:265` — `a:focus-visible, button:focus-visible` rule already in place. `MarketingPrimitives` + `MarketingHeader` + `LocaleSwitcher` added explicit `focus-visible:ring-2` on their own interactive surfaces. |

### Deferred (with reasons)

**M2-01 — hex literal sweep.** Deferred: grep over `src/app/(marketing)/**` for `text-[#…]` or raw `#RRGGBB` returns **zero hits**. The ESLint `no-restricted-syntax` rule shipped in P5D already catches these at CI. Marketing pages predated that rule but were clean by the time I ran the sweep — probably already normalized during the CHROMA BEACON migration.

**M2-06 — empty-state coverage.** Deferred: none of the 15 marketing pages actually fetch dynamic content — blog posts, guides, customers, changelog all render from hardcoded TypeScript files (`src/lib/blog.ts`, etc.). Empty-state risk is zero until **M3-06** migrates to MDX + a real CMS. When that ships, every list route should use `<EmptyState>` (primitive already exists at `src/components/ui/EmptyState.tsx`).

### Follow-up work (not blocking M3)

- Apply `MarketingHero` / `MarketingSection` / `MarketingGrid` to the other 14 marketing pages. Currently only `/features` uses them. Incremental — each page is an independent refactor with no coordination needed.
- Add `<Breadcrumbs>` to the six nested routes: `/solutions/[industry]`, `/features/[module]`, `/compare/[competitor]`, `/customers/[slug]`, `/blog/[slug]`, `/guides/[slug]`. Each is a 3-line change.

---

## M3 — Future-proof (1 of 8 shipped)

### Shipped

| Item | Status | Artefact |
|---|---|---|
| **M3-07** perf budget tightened | ✅ | `.github/workflows/ci.yml` Lighthouse CI assertions bumped: perf 0.80 → 0.85, a11y / best-practices / seo all 0.90 → 0.95. Still non-blocking (`|| echo warning`) to avoid PR noise on LHCI flakes. |

### Deferred with product-decision gates

**M3-01 — full locale content translation.** The plumbing is complete: `src/lib/i18n/{config,server,t}.ts` already loads `messages/<locale>.json` dynamically, falls back to `en` when missing, and `<html lang dir>` updates live. What's missing is the *content*: 15 marketing pages × ~50 strings × 7 locales = ~5,250 translations. This is a content task, not an engineering task. A 200-line engineering deliverable would be string extraction into `messages/en.json` + six stub files — but without real translations it's cosmetic. **Gate:** hire a translator OR commit to DeepL/Google as the seed + tolerate machine quality until humans review.

**M3-02 — theme-specific hero imagery.** 8 themes × 3 marquee pages = 24 bespoke illustrations. The engineering surface is trivial (conditional `src` on `next/image` keyed off `useTheme().theme`). **Gate:** design work. Can't code my way to 24 illustrations.

**M3-03 — live product preview in hero.** Replace the home-page screenshot with an iframe of `/p/mmw26-hialeah/guide` at 50% scale. Engineering is straightforward but comes with two sub-decisions that need product sign-off: (a) sandbox policy — do we allow the iframe to run JS / accept input, or is it read-only? (b) ISR cadence for the underlying portal page — currently `force-dynamic`; for iframe use we'd want it ISR'd at the same 5-min cadence as marketing pages. **Gate:** product sign-off on sandbox + caching.

**M3-04 — motion pass.** `MotionShowcase` component looping 10-second clips of the 8 themes on the home hero. Engineering is straightforward; motion design for each theme is not. Requires `prefers-reduced-motion` gating (trivial) but depends on design assets per theme. **Gate:** design work.

**M3-05 — marketing analytics + funnel instrumentation.** Three events to track: `marketing.theme.picked`, `marketing.locale.switched`, `marketing.cta.clicked`. Engineering surface is a single public POST route that writes to `usage_events` via `createServiceClient()` + a `useTrack()` client hook. **Gate:** product decision on tool — Sentry Metrics (paid add-on), PostHog (new infra), our own `usage_events` table (no third-party dep, queryable via existing tooling). Blocking on that choice so we don't ship one integration and rip it out.

**M3-06 — blog + changelog CMS migration.** Current blog posts live in `src/lib/blog.ts` as TypeScript objects; changelog lives in `src/lib/changelog.ts`. Migrate to MDX files in `content/blog/*.mdx` + auto-generate changelog from conventional commits (`feat:` / `fix:`). **Gate:** larger architectural decision — do we pick `contentlayer`, `@next/mdx`, or a headless CMS (Sanity, Contentful)? Each implies a different content workflow. Blocking on the call.

**M3-08 — marketing-specific RUM.** Web Vitals from marketing pages routed to a separate Sentry project + dashboard so marketing perf degradation doesn't hide behind app-error noise. Engineering is a separate `@sentry/nextjs` project init guarded by `if (isMarketingRoute)`. **Gate:** additional Sentry project cost + a new Web Vitals dashboard someone actually watches. Infra + product.

---

## Acceptance snapshot at time of writing

| Surface | Check | Result |
|---|---|---|
| Typecheck | `npm run typecheck` | clean |
| Unit | `npm test` | 75 / 75 passing |
| E2E | `npx playwright test` | 285 / 295 passing (10 env-gated skips) |
| Marketing header e2e | `e2e/marketing-header.spec.ts` | 9 / 9 passing |

---

## Commits in this tranche

- `31a6a74` — M1: locale switcher, theme gallery, mobile nav, orphan-provider fix.
- (this commit) — M2 primitives, breadcrumb, structured data, LHCI threshold bump, deferred rationale doc.

Next actionable piece of work, if someone is ready to unblock a gate:
1. Decide M3-05 tool choice (Sentry Metrics / PostHog / self-hosted) → I'll ship analytics end-to-end.
2. Decide M3-06 CMS vs. MDX → I'll ship the migration.

Everything else is either content or design work the engineering team can't provide alone.
