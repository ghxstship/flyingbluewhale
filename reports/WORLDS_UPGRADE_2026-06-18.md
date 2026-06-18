# WORLDS kit upgrade — status

**Source:** `design_handoff_worlds/CLAUDE_CODE_REMEDIATION.md` (World Engine voice).
**Date:** 2026-06-18 · tsc + lint + 744 tests + production build all green.

## Done (this change) — Parts A, B, D1/D2 + full SSOT sweep + re-translation

**Part A — SSOT & consistency (the doc's "do first, biggest GEO lever"):**
- **A1 four apps everywhere** — `seo.ts` `SITE.apps` adds LEG3ND + CANON one-liners; `SITE.description` → four-app phrasing; `organizationSchema().brand` = 4; `AuthShell` highlight/tagline/description → four apps + "The engine behind new worlds." Hardcoded OG/metadata (`layout.tsx`, `og/route.tsx`, `opengraph-image.tsx`) de-staled (no more "three apps" / "Itinerary for cultural tastemakers").
- **A2 lifecycle** — already renders from `XPMS_PHASES` (Discovery→Close); fixed the title, deleted the retired `lifecycle.phases` (R&D/Compliance/Activation/Strike) from all 7 catalogs.
- **A3 one CTA constant** — `CANONICAL_CTAS.primary = "Start building free"`; swept **22** CTA-label keys in `en.json` to it (0 titlecase "Start Free"/"Sign Up Free" remain).
- **A4 one free-tier name** — "Free forever on the Access tier" in signup + hero disclaimer + pricing FAQ.

**Part B — World Engine voice:** home hero ("Build worlds. Run them live."), four CANON app one-liners (byte-identical to `seo.ts` — GEO G2), subhead, Why-ATLVS, closing CTA; auth/onboarding voice (signup/login/onboarding titles + subtitles, fallbacks + catalog).

**Part C (copy items):** C7 drop org capture from signup · C8 remove leaked `/console/...` route from onboarding copy.

**Part D:** D1 removed the unsupported `aggregateRating` · D2 added `alternateName` for brand-entity disambiguation.

**Guard:** `src/lib/__tests__/worlds-canon.test.ts` locks four-apps / CTA constant / XPMS-lifecycle parity / identical app strings / no titlecase CTA labels.

**Re-translation (surgical):** the **55** changed/new `en` keys re-translated into all 6 locales (ar/de/es/fr/ja/pt) via per-language transcreation agents — World Engine voice, brand names + `{email}` preserved, primary CTA consistent. Verified: full key parity (0 drift), no placeholder leaks.

## Done (deferred batch) — Parts C, D3, E4/E5/E6

Executed 2026-06-18 (this change). tsc + lint + guard tests + production build all green; sitemap 0 orphan / 0 dangling.

**Part C (structural UX):**
- **C1** mobile hero four-app grid (stacked 2×2 < lg) — verified at 390px.
- **C2** auth-rail value line carried above the form on mobile (`AuthShell`) — verified.
- **C3** trust bar is now clickable brand links → `/customers` + a "See the work →" link (`trustBar.seeWork`).
- **C4** proof rows are clickable (`<Link>` → `/customers`) + a stats provenance footnote (`stats.source` / `stats.sourceLink`).
- **C5** app-card accent band — already present (per-product top band + AA `textColor`); no change needed.
- **C6** product imagery/screenshots — **asset-blocked.** No real product screenshots exist; empty placeholder frames would degrade the live site, so deferred until real assets land. (Honest no-op, not a silent skip.)

**D3 (locale routing / hreflang):** investigated — `/es-ES` + `/pt-BR` are *real* distinct URLs, so the emitted hreflang (en/es/pt only) is honest, not premature; no scope-out needed. The two pages were **stale** (three apps, old CTA/voice) and contradicted WORLDS canon while live, so both were rewritten to the four-app World-Engine voice as symmetric self-contained inline localized pages (satisfying the user's "re-translate the entire codebase to match the new copy for all languages"). The now-dead `marketing.pages.pt-BR.*` catalog namespace (32 keys × 7 locales) was removed.

**E4 (glossary `definedTermSchema`):** already wired (`definedTermSchema` + `inDefinedTermSet` on `/glossary/[slug]`). Added a `webPageSchema` provenance node alongside it.

**E5 (`/compare` & `/alternatives` verdict + structured tables):** already strong — `/compare/[competitor]` carries a "bottom line" verdict, a structured feature-matrix `<table>`, balanced "when they win", `faqSchema`, and `reviewSchema`. No content gap; layered E6 provenance on top.

**E6 (`dateModified` provenance):** new `CONTENT_REVISED` SSOT date + `formatReviewedDate()` + `webPageSchema()` in `seo.ts`; a localized "Last updated {date}" dateline (`common.lastUpdated`, all 7 locales) + a `webPageSchema` `dateModified` node now ship on `/compare/[competitor]`, `/alternatives/[competitor]`, and `/glossary/[slug]`.

**Four-app parity fix (uncovered during D3):** the home (and the new es/pt) LEG3ND card linked `/solutions/legend`, which **404'd** — three of four apps had a solution page, LEG3ND did not. Built the real fourth page (`/solutions/legend`, Production-Orange accent, eight-pillar grid, XPMS-2.0 callout, FAQ, `productSchema`) and wired it into `nav.ts` (header megamenu + footer) with localized labels across all 7 catalogs. Sitemap regenerated. *(English copy for now; localizing the page body is the one honest follow-up, tracked with C6 imagery.)*

## Remaining follow-ups (asset/localization, non-blocking)

- **C6** product screenshots — needs real assets.
- Localize the `/solutions/legend` page body (currently English; nav labels are localized).
