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

## Deferred — Parts C (structural UX), D3, E4/E5 (the handoff's PR-3/PR-4)

Larger frontend/content work, intentionally separate per the handoff's own 4-PR plan:
- **C1** mobile hero ecosystem (build a stacked < lg layout) · **C2** auth-rail value line on mobile · **C3** trust bar = brand logos/links not text · **C4** clickable proof rows + stat sources · **C5** app-card accent emphasis · **C6** product imagery/screenshots.
- **D3** `/[locale]` URL routing before hreflang promotion.
- **E4** glossary expansion + `definedTermSchema` · **E5** `/compare` & `/alternatives` verdict + structured tables · **E6** `dateModified` provenance.

These touch layout/components/assets/routing rather than copy SSOT; recommend as the next PR.
