# ATLVS Ecosystem — Marketing Site + Onboarding Rebuild Plan

Status: **EXECUTING — all 7 decisions ratified 2026-07-22** · Drafted 2026-07-22
Grounding: `XPMS_2.5.zip` (kit + ecosystem bundle, inventoried), the live repo
(93 marketing routes, 43-route `(legend)` shell, auth/org-creation flow,
`/studio/settings/*` org-level surfaces), `docs/brand/voice.md`, and the
sitemap/nav/voice CI guards this plan must land inside.

---

## 0 · Executive summary

Three strategy shifts drive the rebuild:

1. **COMPVSS is the go-to-market spearhead.** The marketing site sells one
   product hard (field/venue workforce ops, live today), positions ATLVS and
   GVTEWAY as **Coming Soon** with concrete teasers, and reframes LEG3ND as the
   **organization master hub** every product hangs off.
2. **LEG3ND is repositioned** from "Knowledge · LMS · Resources" to the
   **Organization Hub**: org-level and event/project-level branding + white-label
   studio, org chart, position library, GL codes/cost centers, company locations,
   asset catalogs, knowledge base, template configurator + library, and the
   gamified LMS. LEG3ND ships as **the default XPMS 2.5 base kit** (406 canonical
   atoms, 9 gated phases, coordinate matrix, budget template, compliance engine,
   signage library) **with org-level customizations layered on top**.
3. **Onboarding inverts.** New organizations are created and configured **only
   through LEG3ND on web**. COMPVSS becomes login/join-only. Onboarding = a
   guided population of the org-level LEG3ND datasets (the constants reused
   across every project), seeded from XPMS 2.5 defaults, so an org is correctly
   configured before a single crew member is invited.

The site itself is rebuilt for **SEO** (technical + programmatic content) and
**GEO** (generative-engine optimization: llms.txt, machine-readable comparison
data, citation-friendly claims), with an **unbiased competitor comparison
program**, **industry pages**, and **role/persona pages**.

---

## 1 · What exists today (do not rebuild blind)

| Asset | State | Disposition |
|---|---|---|
| 93 `(marketing)` routes incl. `/compare/[competitor]`, `/alternatives/[competitor]`, `/solutions/[industry]`, `/teams/[role]`, `/features/[module]/[industry]`, blog/guides/glossary/tools | Live, thin content in places | **Reuse the route architecture** — it is already the programmatic-SEO shape. Rebuild content, templates, metadata, and interlinking |
| `(legend)` shell — 43 routes (learn/certifications/resources/signage/engine/community…) | Live LMS + knowledge spine | **Extend into the Organization Hub** (new hub IA on top; nothing retired) |
| `/studio/settings/{branding,catalog,organization,job-templates,…}` | Live org-level datasets | These ARE the hub datasets. LEG3ND hub becomes their canonical home/mirror (phased; console keeps working) |
| Auth: `signup → /onboarding/org → create_org_with_owner` RPC | Live, product-agnostic | Becomes the **LEG3ND-gated** org-creation path |
| `CompvssOnboarding` + `/m/onboarding` | Live | Strip org-creation affordances → login/join-only |
| `entitlements.json` app registry + App Rail COMING SOON mechanics | Live (7 extensions already use it) | Reuse the same mechanism to mark ATLVS + GVTEWAY coming-soon on marketing |
| Marketing nav SSOT (`marketingHeaderGroups`/`marketingFooterGroups` in `nav.ts`), sitemap guard (0 orphans), voice guard (no em-dashes, no emoji, voice canon), contrast guard | CI-enforced | Every new route lands through these gates |
| XPMS 2.5 kit | New | The substance behind LEG3ND: SSOT Bible (406 atoms × 44 fields, 10 departments, 79 disciplines), `dim_phase` (9 gates incl. **Amplify**), 90-coordinate matrix, 624-atom staging catalog, bound budget template, XMCE compliance engine (177 formulas), signage/wayfinding library, Supabase DDL |

---

## 2 · Positioning architecture

**Ecosystem narrative (home page):** "The World Builder's Ecosystem" retained;
the story becomes *one org hub (LEG3ND) + the field app you can use today
(COMPVSS) + what's coming (ATLVS, GVTEWAY)*.

| Product | Marketing state | Framing |
|---|---|---|
| **COMPVSS** | **Live — the hero** | Site & venue operations for deskless crews. Full product marketing: features, pricing, industries, personas, comparisons, demo |
| **LEG3ND** | **Live — the foundation** | The Organization Hub: brand + white-label studio, org chart + position library, GL codes, locations, asset catalogs, knowledge base, template configurator, gamified LMS. "Your org, configured once, reused everywhere." Built on XPMS 2.5 |
| **ATLVS** | **Coming Soon** | Teaser: the operator console (ERP × CRM × PM), Coordinate Matrix task lens, Sell→Settle spine. Waitlist CTA |
| **GVTEWAY** | **Coming Soon** | Teaser: the public interface + marketplace (the live `/marketplace` surfaces remain as proof). Waitlist CTA |
| Extensions (OPVS, CVRGO, GVLLEY, Vault, MVNIFEST) | Roadmap chips | One roadmap page, no dedicated pages yet |
| **Developers & Partners** | New program | "Build with us": API/OpenAPI surface (documents, reports, advancing scopes already public), integration submissions (route exists), agency/partner directory (marketplace exists) — unified under one program page |

---

## 2a · App ownership of the XPMS department classes (owner canon, 2026-07-22)

How the ecosystem splits workflows across the apps, by XPMS class:

| App | Department classes |
|---|---|
| **LEG3ND** | 0000 Executive (the org level itself) |
| **ATLVS** | 1000 Creative · 2000 Talent · 3000 Marketing |
| **COMPVSS** | 4000 Build · 5000 Production · 6000 Operations |
| **GVTEWAY** | 7000 · 8000 (Hospitality/Experience) · 9000 Technology |

**7000/8000 note (owner-stated):** the current deployed canon (SSOT Bible +
live cost centers) reads 7000 Experience / 8000 Hospitality; the numbering
flip (Hospitality to 7000, Experience to 8000) arrives in the NEXT XPMS
version. **Leave the deployed data as is** until that version lands; both
classes are GVTEWAY-owned either way, so app ownership is unaffected. Do not
"fix" the ordering prematurely.

Implications: LEG3ND owning 0000 confirms the Organization-Hub framing (the
executive/org tier IS the hub); the P4 dim_department reconciliation should
carry an `app` ownership annotation alongside the Bible labels; marketing
copy may tell the split story (each app owns its classes' workflows).

## 2b · Aurora AI + accent canon + extensions (owner directives, 2026-07-22)

- **Aurora AI (powered by Brio)** is the AI product identity: every AI feature
  across the ecosystem is branded Aurora AI. Marketing page at `/aurora`; the
  first mention per page reads "Aurora AI" (once per page with the "powered by
  Brio" attribution). Existing claims rebrand; no new capability claims.
- **Accent canon validated:** ATLVS red `#E23414` · COMPVSS yellow `#FFC400` ·
  GVTEWAY blue `#2563EB` · LEG3ND orange `#ED6A1E` (all confirmed in
  tokens.json). **Aurora = vibrant green as a northern-lights gradient** —
  marketing-scoped treatment for now (page-local CSS); product-token
  integration is a later theme pass.
- **Extensions hidden:** OPVS, CVRGO, Vault, MVNIFEST, GVLLEY, Social, Email
  are toggled off everywhere (`EXTENSIONS_VISIBLE = false` in entitlements.ts
  filters the App Rail; marketing copy carries no extension references).
  Their registry entries + theme tokens stay (infrastructure). Future pass,
  much later.

## 3 · New marketing IA (route map)

Kept routes are marked (keep); everything else is new or rebuilt content on an
existing route. All navigation lands in `marketingHeaderGroups` /
`marketingFooterGroups`; anything intentionally unlisted goes to sitemap EXEMPT.

```
/                         Rebuilt home: COMPVSS hero, LEG3ND foundation strip,
                          coming-soon rail (ATLVS·GVTEWAY), social proof, GEO Q&A block
/compvss                  NEW dedicated product home (deep, replaces thin /solutions/compvss)
/compvss/features         Feature index → /features/[module] (keep, re-scoped to COMPVSS-first)
/compvss/pricing          COMPVSS-first pricing (keep /pricing as ecosystem overview)
/legend                   NEW product home: the Organization Hub (marketing side;
                          the app lives on the legend subdomain — no route collision:
                          this is the (marketing) page at the apex)
/atlvs                    Coming-soon teaser + waitlist
/gvteway                  Coming-soon teaser + waitlist (links live /marketplace as proof)
/solutions/[industry]     (keep route) rebuilt template + expanded industry set (§7)
/teams/[role]             (keep route) rebuilt persona template + expanded set (§8)
/compare                  (keep) comparison hub, category-grouped
/compare/[competitor]     (keep route) rebuilt unbiased template (§6)
/alternatives/[competitor](keep route) intent-variant of compare, canonicalized properly
/pricing                  (keep) ecosystem pricing, COMPVSS emphasized
/developers               NEW: API docs entry, OpenAPI links, build-with-us, integration submit (folds /integrations/submit)
/partners                 (keep) expanded: agencies, resellers, integration partners
/roadmap                  (keep) extensions + coming-soon detail
/blog /guides /glossary /tools /templates /customers /events (keep — content program §5)
/about /careers /press /contact /legal/* /status /brand-kit (keep)
/marketplace/*            (keep — GVTEWAY proof surface)
/demo /demo/[persona]     (keep) re-pointed at COMPVSS personas first
```

Locale strategy: `es-ES` and `pt-BR` landing mirrors stay; hreflang wired
site-wide (today only those two stubs exist — §4 makes hreflang systematic).

---

## 4 · SEO program

**Technical (all templates):**
- Next Metadata API on every route: title patterns (`{Page} · COMPVSS by ATLVS
  Technologies`), meta descriptions from content frontmatter, canonical URLs via
  `urlFor`, OG/Twitter cards (existing OG pipeline reused).
- **JSON-LD per template type**: `Organization` + `WebSite` (site-wide),
  `SoftwareApplication` (product pages, with `offers`), `FAQPage` (Q&A blocks),
  `HowTo` (guides), `BreadcrumbList` (all nested routes), `Article` (blog),
  `Event` (events pages — data already live).
- `sitemap.xml` already generated — extend with lastmod from content dates;
  `robots.txt` reviewed; 301s for any retired/renamed URL via `vercel.json`
  legacy-redirect block (repo convention).
- Core Web Vitals: marketing routes go `force-static`/ISR wherever they don't
  read session (most do today — audit per route); image optimization pass;
  font subsetting already handled by `next/font`.
- Internal-linking system: every industry page links its personas, comparisons,
  features, and glossary terms; hub-and-spoke around `/compvss`.

**Content clusters (programmatic):**
- Comparison cluster (§6), industry cluster (§7), persona cluster (§8).
- Glossary (route exists) seeded from XPMS 2.5 vocabulary — the standard is a
  genuine SEO moat: phases, coordinate matrix, URID, advancing, punch list,
  run of show, settlement… each term gets a definition page linking product
  surfaces. (Public education on the standard also feeds GEO.)
- Tools (routes exist: capacity + per-diem calculators) — expand with
  XMCE-derived free calculators (crew auto-sizing, generator sizing, restroom/
  ADA counts). Each tool page is a link magnet and demonstrates the compliance
  engine. MODELED-vs-CODE-DERIVED labeling carried over honestly.

---

## 5 · GEO program (generative-engine optimization)

- **`/llms.txt`** (and `/llms-full.txt`): curated, maintained summary of the
  ecosystem, products, pricing model, and canonical URLs — the emerging
  convention AI crawlers read first.
- **Answer-shaped content**: every product/industry/persona page carries a
  visible FAQ section (real questions, 2-4 sentence answers) with `FAQPage`
  JSON-LD — the unit LLMs quote.
- **Citation-friendly claims**: every factual claim on comparison pages carries
  a source + "last verified" date (§6) — models preferentially retain and
  attribute dated, sourced claims.
- **Entity consistency**: one canonical description of each product (name,
  category, one-liner) reused verbatim across pages, llms.txt, JSON-LD
  `sameAs`/`description` — so models converge on our phrasing.
- **Machine-readable comparison data**: the feature matrices in §6 also ship as
  JSON endpoints under `/api/v1/public/comparisons` (static, cached) so
  agents/aggregators ingest structure, not scraped prose.
- Bots policy: explicitly allow the major AI crawlers in robots.txt (decision
  point — default allow).

---

## 6 · Competitor comparison program (unbiased by construction)

**Method (published on `/compare` as our methodology statement):**
- Feature matrices sourced ONLY from public docs/pricing pages; every cell
  carries a `last_verified` date; competitor strengths stated plainly; we link
  to the competitor; corrections invited via a published contact path.
- No fabricated pricing; absent data shows as "Not published" — never a dash
  that implies absence of the feature.
- Voice canon applies (no trash-talk; "never compare" in CLAUDE.md refers to
  product/console copy — marketing comparison pages become a **ratified,
  carved-out exception**, see Decisions §12).

**Data model:** one `comparisons.json` SSOT (per competitor: category, feature
matrix vs COMPVSS/ecosystem, pricing notes, best-for, sources, verified dates)
driving `/compare/[competitor]`, `/alternatives/[competitor]`, hub pages, and
the GEO JSON endpoint. A CI guard fails any page whose `last_verified` is older
than 180 days.

**Coverage (initial 24, grouped by the category page that hosts them):**
- *Deskless workforce / crew ops (COMPVSS category):* Connecteam, Deputy,
  When I Work, Sling, 7shifts, Homebase, Workyard, Jolt, Blink, Beekeeper
- *Event crew scheduling / production staffing:* LASSO, Rhino/Crew Studio,
  Pop Bookings, Sirvez
- *Production management (ATLVS category, framed "coming soon — how we'll
  compare"):* Momentus (Ungerboeck), Prism, Flex Rental Solutions, Rentman,
  Current RMS, Master Tour, Eventbooks
- *Ticketing/marketplace (GVTEWAY category, same framing):* Eventbrite, Tixr,
  Dice
- Expandable: the JSON SSOT makes each additional competitor a data PR, not a
  page build.

**Note on the repo's competitor-name scrub:** the brand guard
(`src/lib/brand`) currently bans competitor names in source. The carve-out is
explicit: names live ONLY in `comparisons.json` + `(marketing)/compare|
alternatives` templates; the guard gains an allowlist scoped to those paths.
Product/console/app copy stays scrubbed.

---

## 7 · Industry pages (`/solutions/[industry]` — rebuilt template, expanded set)

Template: hero (industry-specific pain → outcome), day-in-the-life workflow
(mapped to real product surfaces with screenshots), 3 relevant features, the
XPMS angle where credible (e.g. compliance engine for festivals), persona links,
comparison links, FAQ (GEO), CTA (COMPVSS trial / waitlist for others).

Set (14): music-festivals · concerts-touring · corporate-events ·
brand-activations (experiential agencies) · sports-events · film-tv-production ·
theater-performing-arts · venues-arenas · trade-shows-exhibitions ·
conferences · weddings-private-events · government-municipal ·
education-campus · houses-of-worship.

Each declares: primary product (COMPVSS today), search cluster (e.g. "event
crew scheduling software for festivals"), and 3 proof points.

## 8 · Persona pages (`/teams/[role]` — rebuilt template, expanded set)

Template: "your week, before/after", the 5 surfaces this persona lives in,
permission story (what they can/can't touch — RBAC as a selling point),
integrations they care about, FAQ, CTA.

Set (12): production-manager · site-ops-manager · technical-director ·
production-coordinator · tour-manager · crew-freelancer · warehouse-asset-manager ·
safety-officer · finance-controller · talent-buyer-booker · marketing-content-lead ·
vendor-subcontractor.

---

## 9 · LEG3ND repositioning — the Organization Hub

**Marketing narrative:** "Configure your organization once. Every project
inherits it." LEG3ND is where an org's constants live: identity, structure,
money codes, places, things, knowledge, templates, and training.

**Hub IA (product side — new top-level sections in the `(legend)` shell,
existing 43 routes re-homed under them, nothing deleted):**

| Hub section | Contents | Today's home → disposition |
|---|---|---|
| **Brand Studio** | Org + event/project branding, white-label modes (`data-brand` rails exist in kit-documents) | `/studio/settings/branding` → canonical home moves to LEG3ND; console keeps a deep-link |
| **Organization** | Org chart, position library, reporting lines | `/studio/settings/organization`, roster reporting forest (`/m/roster/reporting` engine) → surfaced in hub |
| **Finance Codes** | GL codes / cost centers (XPMS 10 departments, 0000-9000), payment terms | `cost_centers` canon (already XPMS-seeded) |
| **Locations** | Company locations, venues, time-clock zones | `locations`, `/studio/settings/time-clock-zones` |
| **Catalogs** | Master asset catalog, GTIN bindings, signage library | `/studio/settings/catalog`, `master_catalog_items`, signage lib (already in LEG3ND) |
| **Templates** | Template configurator + library: doc templates (29 kit docs), job templates, field templates, advance-packet presets, guide configs | `/studio/settings/{email-templates,job-templates,advancing}`, `/m/templates`, documents registry |
| **Knowledge** | The Standard (XPMS), knowledge base, resources | existing `(legend)` resources/learn (keep) |
| **Academy** | Gamified LMS: courses, certifications, badges, leaderboard | existing `(legend)` learn spine (keep) |

**XPMS 2.5 as the base kit:** a new org's LEG3ND hub arrives pre-seeded from
the kit — `dim_phase` (9 gates incl. Amplify; note the **ordinal remap Close
8→9** flagged in the change record for anything persisting ordinals),
department classes/disciplines (the URID taxonomy), the 406-atom catalog as the
starter asset catalog, the budget template binding, XMCE metric/permit
registries, and the AIGA signage library. Org customizations are **additive
layers** on the base kit (append-only, mirroring the standard's own
governance). The kit's `xpms_supabase_migration.sql` is reconciled against the
live schema (much already exists: dim_phase, coordinate matrix from kit-34) —
a delta migration, not a re-run.

**Phasing honesty:** marketing tells the full hub story at launch; the product
hub IA lands in two steps (hub shell + navigation first, canonical-home
migrations second) so the console never breaks mid-transition.

---

## 10 · Onboarding sequence redesign

**Rule: organizations are born in LEG3ND on web.**

New-org flow (LEG3ND web app, `legend.atlvs.pro/start`):
1. Account + org identity (name, slug, logo → Brand Studio seed)
2. **Base kit install** — XPMS 2.5 defaults applied visibly ("your org starts
   with the standard: 9 phases, 10 departments, 406 catalog atoms, compliance
   engine") with opt-outs per dataset
3. Organization — org chart roots, position library (seeded from XPMS
   department classes), invite the manager band
4. Finance codes — GL/cost centers (XPMS 0000-9000 defaults, editable)
5. Locations — first venue/office, time-clock zone
6. Catalogs — confirm starter catalog, add org-specific SKUs
7. Templates — pick doc/guide/advance-packet templates to activate
8. Crew invites — NOW invite crew (COMPVSS deep links in the invite email)

Each step writes the same tables the hub manages — onboarding IS the hub in
sequence mode, so there is no second data model.

**COMPVSS becomes join-only:**
- `(auth)` signup: product-context aware. From COMPVSS entry points the
  create-org path disappears — options are **login**, **accept invite**, or
  **join by org code**; "Need to create an organization?" links out to the
  LEG3ND web flow (with a "requires a desktop browser" hint).
- `createOrgAction` / `create_org_with_owner` gains a server-side channel
  guard: org creation succeeds only from the LEG3ND/web onboarding context
  (not from `/m` service-worker origin). UI removal + server guard; the RPC
  itself stays (console/admin/e2e still need it).
- `CompvssOnboarding` preview flow: org-creation affordances removed; the
  no-org state teaches "ask your coordinator for an invite" + org-code entry.
- e2e: new specs for (a) org-create blocked from COMPVSS context, (b) join by
  invite from COMPVSS, (c) full LEG3ND onboarding populating all 7 datasets.

---

## 11 · Implementation phases (each lands green: tsc · vitest · eslint · sitemap/ia/voice guards · e2e where applicable)

- **P0 · Foundations (no visible change):** comparisons.json SSOT + guards;
  metadata/JSON-LD helpers; llms.txt generator; brand-guard carve-out;
  content frontmatter conventions; static/ISR audit of marketing routes.
- **P1 · COMPVSS-first core:** new home, `/compvss` product home, rebuilt
  pricing emphasis, ATLVS/GVTEWAY coming-soon teasers + waitlist capture,
  `/legend` hub marketing page, `/developers`, nav SSOT + footer rewire.
- **P2 · Programmatic SEO/GEO:** comparison template + first 10 competitors;
  industry template + 14 pages; persona template + 12 pages; glossary XPMS
  seed; FAQ blocks + JSON-LD everywhere; GEO endpoints.
- **P3 · LEG3ND hub + onboarding:** hub shell IA in `(legend)`; `/start`
  onboarding sequence (8 steps); XPMS 2.5 delta migration + org-seeding
  function; auth flow branching; COMPVSS join-only changes; e2e suite.
- **P4 addendum (found during P3 recon, in-scope for THIS implementation):**
  `dim_department` (kit-34) diverges from the XPMS 2.5 SSOT Bible's 10 classes
  (Bible: 0000 Executive, 1000 Creative, 2000 Talent, 3000 Marketing, 4000
  Build, 5000 Production, 6000 Operations, 7000 Experience, 8000 Hospitality,
  9000 Technology — exactly the cost-center canon; kit-34 shipped 1000
  Production, 2000 Technical, 3000 Site & Ops, 4000 Talent, 5000 Hospitality,
  6000 Safety, 7000 Logistics, 8000 Commercial, 9000 Admin). The CODES collide
  at different meanings (1000 Production vs 1000 Creative), and live
  project_tasks/events coordinates embed kit-34 codes, so relabeling is an
  ATOMIC data migration (dim labels + coordinate/department remap on seeded
  project data + field-app verification) — scheduled here, not silently
  grandfathered. P3 added only the missing 0000 Executive (additive-safe).
- **P4 · Comparison completion + content:** remaining 14 competitors,
  customers/case-study template, tools expansion (XMCE calculators),
  blog/guides seeding cadence.
- **P5 · Polish + measurement:** CWV pass, hreflang completion, search-console
  wiring, dashboard for organic/GEO citations, 180-day verification workflow.

Rough sizing: P0-P1 one focused wave; P2 largely programmatic off templates +
data files; P3 is the only schema-touching phase (delta migration + seeding
RPC + auth guard — sequenced deploy per the migration/app-skew rule).

---

## 11b · P5 CWV/static audit — finding + disposition (2026-07-22)

**Finding:** the full marketing surface (139 routes) is server-rendered per
request (`ƒ`); only the metadata routes (`/llms.txt`, `/sitemap.xml`,
`/compare/comparisons.json`, `/changelog.rss`, icons/OG) are static. Root
cause is the ROOT layout (`src/app/layout.tsx`): it reads `headers()` for the
CSP **nonce** (`x-nonce`) and `cookies()` for theme + locale, which opts every
descendant route out of static rendering. Page-level `revalidate` hints
(`getStaticEnT`) cannot override a dynamic root layout.

**Disposition:** deliberate architecture, not a defect. The per-request nonce
CSP is a security posture (next.config headers), and cookie-based locale is
the current i18n mechanism. Making marketing static requires ONE refactor
with two halves that are already scheduled together in the post-completion
backlog (§14): locale moves from cookie to URL segment (es-ES/pt-BR parity +
hreflang emission), and the marketing tree either adopts a hash-based CSP or
isolates the nonce read out of the shared root layout. Do them as one pass.
Until then CWV exposure is TTFB-only (Vercel edge SSR); payloads are already
lean (no client-side data fetching on marketing pages).

## 12 · Decisions — RATIFIED 2026-07-22 (all seven approved as recommended)

All recommendations approved by the owner. Two carry a rider: **decision 6**
(LEG3ND canonical-home migration) and **decision 7** (es-ES/pt-BR locale
parity) are approved as phased, with the deferred halves added to the backlog
for **IMMEDIATE execution once this implementation is fully completed** — see
§14. Original decision text preserved below for the record.

### Original decision list (as reviewed)

1. **Competitor naming carve-out** — ratify marketing-scoped allowlist for the
   brand guard (product copy stays scrubbed). *Recommended: yes.*
2. **Comparison categories for coming-soon products** — publish ATLVS/GVTEWAY
   category comparisons pre-launch ("how we'll compare") or hold until GA?
   *Recommended: publish category education pages, hold head-to-heads.*
3. **`/compvss` vs `/solutions/compvss`** — new top-level product homes with
   301s from the old solutions paths. *Recommended: yes (cleaner entity URLs).*
4. **Org-creation enforcement depth** — UI + server-action guard (proposed) vs
   also a DB-level channel check. *Recommended: app-tier only; the RPC remains
   the admin/e2e path.*
5. **AI-crawler robots policy** — default allow all major agents. *Recommended:
   allow.*
6. **LEG3ND canonical-home migrations** (branding/catalog/org settings moving
   from console settings to the hub) — mirror first, move later, or move
   immediately? *Recommended: mirror in P3, move canonically in a later cycle.*
7. **Locale scope for the new pages** — en-only first with hreflang scaffolding,
   or es-ES/pt-BR at parity? *Recommended: en first; the i18n sweep pipeline
   handles catalogs afterward.*

## 13 · Guardrails carried through every phase

Voice canon (40/35/25, write-like-a-person, **no em-dashes in UI copy**, no
emoji, never trash-talk competitors even on comparison pages), brand marks
(`A T L V S` spaced, aria-labels), nav SSOT + sitemap 0-orphan guard, tokens/
contrast guards, LDP naming for any new tables (`*_state`/`*_phase`), the
migration/app-skew deploy sequencing, and the standing rule that every claim on
a comparison page carries a source and a date.

## 14 · POST-COMPLETION BACKLOG — ratified for IMMEDIATE execution after P5

Two items, both owner-ratified 2026-07-22 with explicit "immediate once this
implementation is fully completed" instruction. Neither is optional and neither
waits for a future cycle:

> **§14.2 execution note (2026-07-22):** catalog parity landed in three
> stages: (a) the new surface's inline t() fallbacks were merged into en.json
> (287 keys, incl. the extractor-invisible template-literal namespaces), (b)
> es/pt translated to 0-missing with placeholder verification, (c) the
> industries/personas/glossary data-file content is being t()-wrapped at
> render sites so it can localize. **Open owner decision:** the COMPARISON
> claim tables stay source-language (English) in es/pt for now — translating
> verified competitive claims multiplies the 180-day verification surface per
> language and risks meaning drift in legally sensitive copy. Localize the
> comparison page CHROME only, unless the owner rules otherwise.

1. **LEG3ND canonical-home migration** (decision 6 rider). P3 ships the hub as
   a MIRROR of the console settings surfaces (branding, catalog, organization,
   locations, templates). Immediately after P5 closes, the canonical homes MOVE
   to the LEG3ND hub: console `/studio/settings/{branding,catalog,organization,
   …}` become deep-links/redirects into the hub, nav/sitemap updated, e2e
   retargeted. One cycle, no drift window.
2. **Locale parity for the new marketing surface** (decision 7 rider). All new
   pages ship en-first with hreflang scaffolding. Immediately after P5 closes,
   run the i18n sweep pipeline (catalog conventions per repo memory: en=1sp,
   locales=2sp, no trailing newline) to bring es-ES and pt-BR to parity across
   home, product pages, industries, personas, and comparisons.
