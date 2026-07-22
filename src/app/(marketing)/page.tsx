// Marketing home — COMPVSS-first (MARKETING_ONBOARDING_REBUILD_PLAN §0/§2/§3).
// The site sells the product you can use TODAY (COMPVSS, field/venue workforce
// ops), positions LEG3ND as the organization foundation, and frames ATLVS +
// GVTEWAY as coming soon with honest teasers. "The World Builder's Ecosystem"
// identity line is retained; the hero sells COMPVSS.
//
// SaaS skin (Hanken Grotesk body, Anton display, neutral surfaces, soft
// elevation) inherited from (marketing)/layout.tsx data-theme="atlvs-product".
//
// i18n: preserved sections keep their existing catalog keys. New COMPVSS-first
// copy lives under `marketing.pages.home.worlds.*` with call-site fallbacks
// (the sanctioned rollout pattern in src/lib/i18n/t.ts) so the page ships
// before the catalogs are populated and the i18n sweep can fill them later.

import Link from "next/link";
import type { Metadata } from "next";
import { FAQSection } from "@/components/marketing/FAQ";
import { JsonLd } from "@/components/marketing/JsonLd";
import { ProductPreview } from "@/components/marketing/ProductPreview";
import { Button } from "@/components/ui/Button";
import { buildMetadata, organizationSchema, softwareApplicationSchema, websiteSchema, SITE } from "@/lib/seo";
import { getRequestT } from "@/lib/i18n/request";
import { PRODUCT_ACCENTS } from "@/lib/brand";
import { Wordmark } from "@/components/brand/Wordmark";
import { POST_LIST } from "@/lib/blog";
import { CHANGELOG_ENTRIES } from "@/lib/changelog";

// Trust-bar customers. `logo` points at a licensed grayscale asset under
// public/brand/customers/<slug>.svg; until rights clear it stays undefined and
// the wordmark slides instead. Drop the file in + set `logo` to swap it live.
type TrustLogo = { name: string; slug: string; logo?: string };
const TRUST_LOGOS: TrustLogo[] = [
  { name: "Red Bull", slug: "red-bull" },
  { name: "Heineken", slug: "heineken" },
  { name: "Formula 1", slug: "formula-1" },
  { name: "Insomniac", slug: "insomniac" },
  { name: "Patrón", slug: "patron" },
  { name: "Polymarket", slug: "polymarket" },
];

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestT();
  return buildMetadata({
    title: t(
      "marketing.pages.home.worlds.metadata.title",
      undefined,
      "COMPVSS by ATLVS Technologies · Field and venue operations for crews who build worlds",
    ),
    description: t(
      "marketing.pages.home.worlds.metadata.description",
      undefined,
      "COMPVSS runs site and venue operations from the crew's own phones: shifts, gate scans, incidents, daily logs, gear custody. Offline-first, priced per organization, live today. Part of the ATLVS ecosystem.",
    ),
    path: "/",
    languages: {
      "es-ES": `${SITE.baseUrl}/es-ES`,
      "pt-BR": `${SITE.baseUrl}/pt-BR`,
    },
    keywords: [
      "COMPVSS",
      "ATLVS",
      "ATLVS Technologies",
      "GVTEWAY",
      "LEG3ND",
      "field workforce app",
      "deskless workforce software",
      "venue operations software",
      "event crew scheduling software",
      "crew management software",
      "gate scanning app",
      "incident reporting app",
      "geofenced time clock",
      "offline-first crew app",
      "site operations platform",
      "production crew app",
    ],
    ogImageTitle: t(
      "marketing.pages.home.worlds.metadata.ogImageTitle",
      undefined,
      "Field and venue ops for crews who build worlds",
    ),
  });
}

export default async function Home() {
  const { t } = await getRequestT();
  // Shorthand for the new-copy namespace: catalog key + call-site fallback.
  const w = (key: string, fallback: string) => t(`marketing.pages.home.worlds.${key}`, undefined, fallback);

  // §3 — COMPVSS proof: every claim below is true of the live repo.
  // gate scan journal: assignment_scan_codes/assignment_events (+ occupancy at
  //   /studio/access-control/counts); incidents: /m/incident(s) + close
  //   sign-off (20260722140000_incident_close_signoff); punch/daily-log/
  //   handover: /m/punch, /m/daily-log, /m/handover; shifts + geofence:
  //   /m/schedule + shift_swaps + time_clock_zones/classifyPunch (flagged
  //   off-site punches); custody: transitionAssetState → asset_movements;
  //   offline queue: public/service-worker.js QUEUEABLE_ENDPOINTS.
  const PROOF = [
    {
      title: w("proof.items.gateScan.title", "Gate scan with a journal"),
      body: w(
        "proof.items.gateScan.body",
        "Scan credentials and tickets at the door. Every read lands in the scan journal as accepted, duplicate, or wrong zone, and occupancy counts come straight from it.",
      ),
    },
    {
      title: w("proof.items.incidents.title", "Incidents that close properly"),
      body: w(
        "proof.items.incidents.body",
        "File an incident from the floor with photos attached. Closing one takes a named sign-off, and the record keeps who filed it and who signed it.",
      ),
    },
    {
      title: w("proof.items.fieldRecords.title", "Punch lists, daily logs, handovers"),
      body: w(
        "proof.items.fieldRecords.body",
        "The records that usually live in someone's head get written where the work happens, and they survive the shift change.",
      ),
    },
    {
      title: w("proof.items.shifts.title", "Shifts and geofenced punches"),
      body: w(
        "proof.items.shifts.body",
        "Shift schedules with swaps, and clock punches checked against the site geofence. An off-site punch gets flagged for a manager instead of silently counting.",
      ),
    },
    {
      title: w("proof.items.custody.title", "Gear custody"),
      body: w(
        "proof.items.custody.body",
        "Check equipment out and back in. Every move writes a custody record, so the question of who has the drill has exactly one answer.",
      ),
    },
    {
      title: w("proof.items.offline.title", "Built for dead zones"),
      body: w(
        "proof.items.offline.body",
        "Clock punches and scans queue on the device when the network drops and replay in order when it comes back. No lost punches, no double reads.",
      ),
    },
  ];

  // §2 — LEG3ND foundation: the org-level datasets every project inherits.
  const FOUNDATION = [
    w("foundation.items.brandStudio", "Brand studio"),
    w("foundation.items.orgChart", "Org chart"),
    w("foundation.items.glCodes", "GL codes"),
    w("foundation.items.locations", "Locations"),
    w("foundation.items.catalogs", "Catalogs"),
    w("foundation.items.templates", "Templates"),
    w("foundation.items.knowledge", "Knowledge"),
    w("foundation.items.academy", "Academy"),
  ];

  // §5 — GEO entity consistency: the four one-liners VERBATIM from SITE.apps
  // (the locked WORLDS canon), so answer engines see one identical sentence
  // per app across pages, llms.txt, and schema.
  const ECOSYSTEM = [
    { slug: "compvss", app: SITE.apps.compvss, href: "/compvss", note: w("ecosystem.notes.live", "Live today") },
    { slug: "legend", app: SITE.apps.legend, href: "/legend", note: w("ecosystem.notes.live", "Live today") },
    { slug: "atlvs", app: SITE.apps.atlvs, href: "/atlvs", note: w("ecosystem.notes.comingSoon", "Coming soon") },
    { slug: "gvteway", app: SITE.apps.gvteway, href: "/gvteway", note: w("ecosystem.notes.comingSoon", "Coming soon") },
  ];

  // §6 — GEO Q&A. Real questions, short honest answers; rendered visibly by
  // FAQSection which also emits the FAQPage JSON-LD.
  const HOME_FAQ = [
    {
      q: w("faq.items.whatIsCompvss.q", "What is COMPVSS?"),
      a: w(
        "faq.items.whatIsCompvss.a",
        "COMPVSS is the field and venue operations app from ATLVS Technologies. Crews use it on their own phones for shifts, clock punches, gate scans, incidents, daily logs, and gear custody. It installs as a PWA and is live today.",
      ),
    },
    {
      q: w("faq.items.pricing.q", "How is COMPVSS priced?"),
      a: w(
        "faq.items.pricing.a",
        "Per organization. One price covers the whole org with unlimited crew members; seats are never counted. The Access tier is free with no credit card.",
      ),
    },
    {
      q: w("faq.items.offline.q", "Does COMPVSS work offline?"),
      a: w(
        "faq.items.offline.a",
        "Yes. COMPVSS is an offline-first PWA: the app shell and recently loaded pages stay available without signal, and clock punches, gate scans, and equipment scans queue on the device and replay in order when the network returns. Anything that needs a live server decision tells you plainly instead of pretending it went through.",
      ),
    },
    {
      q: w("faq.items.createOrg.q", "How do organizations get created?"),
      a: w(
        "faq.items.createOrg.a",
        "On the web, in LEG3ND. That is where an organization is born and configured: branding, org chart, GL codes, locations, catalogs, and templates get set up once, and every project inherits them. COMPVSS itself is where crew log in and work.",
      ),
    },
    {
      q: w("faq.items.crewJoin.q", "How does crew join?"),
      a: w(
        "faq.items.crewJoin.a",
        "By invitation or org code. A coordinator sends an invite or shares the org code, crew open COMPVSS on their phone and accept, and they are on the roster. Nobody has to create an organization from the field app.",
      ),
    },
  ];

  // E-25: the "Latest" rail reads the real content sources (blog registry +
  // changelog) instead of hardcoded dates that are guaranteed to go stale.
  const railDate = (iso: string) => iso.split("-").join(" · ");
  const [latestPost, previousPost] = POST_LIST;
  const latestChange = CHANGELOG_ENTRIES[0];
  const POSTS = [
    latestPost && {
      date: railDate(latestPost.date),
      cat: t("marketing.pages.home.latest.posts.fieldNotes.cat"),
      title: latestPost.title,
      href: `/blog/${latestPost.slug}`,
    },
    latestChange && {
      date: railDate(latestChange.date),
      cat: t("marketing.pages.home.latest.posts.release.cat"),
      title: latestChange.title,
      href: "/changelog",
    },
    previousPost && {
      date: railDate(previousPost.date),
      cat: t("marketing.pages.home.latest.posts.fieldNotes.cat"),
      title: previousPost.title,
      href: `/blog/${previousPost.slug}`,
    },
  ].filter((p): p is NonNullable<typeof p> => Boolean(p));

  return (
    <>
      <JsonLd
        data={[
          organizationSchema(),
          websiteSchema(),
          // COMPVSS is the product this page sells; the app entity carries the
          // canonical one-liner so schema and visible copy stay identical.
          softwareApplicationSchema({
            name: "COMPVSS",
            appName: "COMPVSS",
            description: SITE.apps.compvss.tagline,
            url: `${SITE.baseUrl}/compvss`,
            price: "0",
          }),
        ]}
      />

      {/* 1 · HERO — COMPVSS, the product you can use today */}
      <section className="relative px-6 pt-16 pb-20 sm:pt-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-12 lg:grid-cols-[1.5fr_1fr]">
            <div>
              {/* Identity line retained; the hero itself sells COMPVSS. */}
              <p className="eyebrow eyebrow-accent">{SITE.tagline}</p>
              <h1 className="hed-3xl mt-5 leading-[1.05]">
                {w("hero.titleLine1", "The field app")}
                <br />
                {w("hero.titleLine2", "for crews who")}
                <br />
                <span data-platform="compvss" style={{ color: "var(--p-accent-text)" }}>
                  {w("hero.titleLine3", "build worlds.")}
                </span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--p-text-2)]">
                {w(
                  "hero.subtitle",
                  "COMPVSS runs site and venue operations from the phone already in your pocket: shifts, gate scans, incidents, daily logs, gear custody. It works on a real show site today, including the corners where the signal quits.",
                )}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button href="/compvss" variant="cta">
                  {w("hero.ctaPrimary", "Explore COMPVSS")}
                </Button>
                <Link
                  href="/demo"
                  className="rounded-md border border-[var(--p-border-2)] px-5 py-2.5 text-sm font-semibold text-[var(--p-text-1)] transition-colors hover:bg-[var(--p-surface-2)]"
                >
                  {w("hero.ctaSecondary", "See it run")}
                </Link>
              </div>
              <p className="mt-6 text-xs text-[var(--p-text-3)]">
                {w("hero.disclaimer", "Live today · Free on the Access tier · Priced per organization, every crew member included")}
              </p>
            </div>
            {/* lg+ only — narrower columns can't fit the preview + wordmarks
                without overflow (same constraint the previous hero carried). */}
            <div className="hidden min-w-0 lg:block" data-platform="compvss">
              <div className="mb-4 overflow-hidden rounded-xl border border-[var(--p-border)] bg-[var(--p-surface-2)] p-3 shadow-[var(--p-elev-2)]">
                <ProductPreview accent={PRODUCT_ACCENTS.compvss} label="COMPVSS · Field" />
              </div>
              <div className="rounded-xl border border-[var(--p-border)] bg-[var(--p-surface)] p-6 shadow-[var(--p-elev-2)]">
                <div className="eyebrow mb-3 text-[var(--p-text-3)]">
                  {w("hero.liveLabel", "On the crew's phones today")}
                </div>
                <ul className="space-y-2 text-sm text-[var(--p-text-2)]">
                  {[
                    w("hero.liveItems.schedule", "Shift schedule, swaps, and time off"),
                    w("hero.liveItems.clock", "Geofenced clock punches"),
                    w("hero.liveItems.scan", "Gate and equipment scanning"),
                    w("hero.liveItems.incidents", "Incident filing with sign-off"),
                    w("hero.liveItems.logs", "Daily logs and handover records"),
                  ].map((item) => (
                    <li key={item} className="flex items-baseline gap-2.5">
                      <span aria-hidden className="inline-block h-1.5 w-1.5 flex-none rounded-full" style={{ background: PRODUCT_ACCENTS.compvss }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST BAR — sliding customer-logo marquee (preserved social proof) */}
      <section className="border-y border-[var(--p-border)] bg-[var(--p-surface-2)] py-10">
        <div className="mx-auto max-w-6xl px-6">
          <p className="eyebrow text-center text-[var(--p-text-3)]">
            {t("marketing.pages.home.trustBar.label")}
          </p>
        </div>
        {/* C3 — receipts, not claims: each logo deep-links to the proof. The
            track holds 3 copies so the slide loops seamlessly; copies 2–3 are
            aria-hidden. Wordmarks slide until licensed logo assets drop in. */}
        <div className="logo-marquee mt-6" aria-label={t("marketing.pages.home.trustBar.label")}>
          <div className="logo-marquee__track">
            {[...TRUST_LOGOS, ...TRUST_LOGOS, ...TRUST_LOGOS].map((c, i) => {
              const isClone = i >= TRUST_LOGOS.length;
              return (
                <Link
                  key={`${c.slug}-${i}`}
                  href="/customers"
                  aria-hidden={isClone}
                  tabIndex={isClone ? -1 : undefined}
                  className="logo-marquee__item text-sm font-bold tracking-[0.12em] text-[var(--p-text-1)] uppercase opacity-70 transition-opacity hover:opacity-100"
                >
                  {c.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.logo} alt={c.name} className="h-6 w-auto" loading="lazy" />
                  ) : (
                    c.name
                  )}
                </Link>
              );
            })}
          </div>
        </div>
        <div className="mx-auto mt-6 max-w-6xl px-6 text-center">
          <Link href="/customers" className="eyebrow eyebrow-accent hover:underline">
            {t("marketing.pages.home.trustBar.seeWork", undefined, "See the work →")}
          </Link>
        </div>
      </section>

      {/* 2 · LEG3ND FOUNDATION STRIP */}
      <section id="foundation" className="px-6 py-20" data-platform="legend">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-xl border border-[var(--p-border)] bg-[var(--p-surface)] p-8 shadow-[var(--p-elev-1)] sm:p-10">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div className="max-w-2xl">
                <p className="eyebrow" style={{ color: "var(--p-accent-text)" }}>
                  {w("foundation.eyebrow", "The foundation")}
                </p>
                <h2 className="hed-xl mt-3">{w("foundation.title", "Organizations start in LEG3ND.")}</h2>
                <p className="mt-4 text-lg text-[var(--p-text-2)]">
                  {w(
                    "foundation.body",
                    "Configure once, and every project inherits it. Your brand, your org chart, your GL codes, your venues, your catalogs, your templates: set up on the web, carried into everything the crew touches in the field.",
                  )}
                </p>
              </div>
              <Link
                href="/legend"
                className="rounded-md border border-[var(--p-border-2)] px-5 py-2.5 text-sm font-semibold text-[var(--p-text-1)] transition-colors hover:bg-[var(--p-surface-2)]"
              >
                {w("foundation.cta", "Tour the organization hub")}
              </Link>
            </div>
            <ul className="mt-8 flex flex-wrap gap-2.5">
              {FOUNDATION.map((item) => (
                <li
                  key={item}
                  className="rounded-full border border-[var(--p-border)] bg-[var(--p-surface-2)] px-4 py-1.5 text-sm font-medium text-[var(--p-text-1)]"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 3 · COMPVSS PROOF — concrete field capabilities, all live in the product */}
      <section id="compvss" className="border-t border-[var(--p-border)] bg-[var(--p-surface-2)] px-6 py-20" data-platform="compvss">
        <div className="mx-auto max-w-6xl">
          <p className="eyebrow" style={{ color: "var(--p-accent-text)" }}>
            {w("proof.eyebrow", "COMPVSS, in the field")}
          </p>
          <h2 className="hed-xl mt-3">{w("proof.title", "What your crew gets on day one")}</h2>
          <p className="mt-4 max-w-3xl text-lg text-[var(--p-text-2)]">
            {w(
              "proof.body",
              "None of this is a roadmap slide. Each of these is running in the product right now, and the demo will show you.",
            )}
          </p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {PROOF.map((p) => (
              <article
                key={p.title}
                className="rounded-xl border border-[var(--p-border)] bg-[var(--p-surface)] p-6 shadow-[var(--p-elev-1)]"
              >
                <span aria-hidden className="inline-block h-1 w-8 rounded-full" style={{ background: PRODUCT_ACCENTS.compvss }} />
                <h3 className="mt-3 text-base font-semibold text-[var(--p-text-1)]">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--p-text-2)]">{p.body}</p>
              </article>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Button href="/compvss" variant="cta">
              {w("proof.ctaPrimary", "Explore COMPVSS")}
            </Button>
            <Link href="/demo" className="text-sm font-semibold text-[var(--p-accent-text)] hover:underline">
              {w("proof.ctaSecondary", "Walk through the demo →")}
            </Link>
          </div>
        </div>
      </section>

      {/* 4 · COMING SOON RAIL — ATLVS + GVTEWAY, honest framing, no dates */}
      <section id="coming-soon" className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <p className="eyebrow eyebrow-accent">{w("comingSoon.eyebrow", "In build")}</p>
          <h2 className="hed-xl mt-3">{w("comingSoon.title", "The rest of the ecosystem is on its way")}</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            <article
              data-platform="atlvs"
              className="relative rounded-xl border border-[var(--p-border)] bg-[var(--p-surface)] p-7 shadow-[var(--p-elev-1)]"
            >
              <span aria-hidden className="absolute inset-x-0 top-0 h-1 rounded-t-xl" style={{ background: PRODUCT_ACCENTS.atlvs }} />
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <Wordmark word="ATLVS" style={{ color: "var(--p-accent-text)", fontSize: 24 }} />
                <span className="eyebrow text-[var(--p-text-3)]">{w("comingSoon.badge", "Coming soon")}</span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-[var(--p-text-2)]">
                {w(
                  "comingSoon.atlvs.body",
                  "The operator console. Projects, advancing, budgets, procurement, and the paperwork drafted for you, in one place. We are building it in the open, and you can see where it is headed.",
                )}
              </p>
              <Link href="/atlvs" className="mt-5 inline-block text-sm font-semibold text-[var(--p-accent-text)] hover:underline">
                {w("comingSoon.atlvs.cta", "Preview ATLVS →")}
              </Link>
            </article>
            <article
              data-platform="gvteway"
              className="relative rounded-xl border border-[var(--p-border)] bg-[var(--p-surface)] p-7 shadow-[var(--p-elev-1)]"
            >
              <span aria-hidden className="absolute inset-x-0 top-0 h-1 rounded-t-xl" style={{ background: PRODUCT_ACCENTS.gvteway }} />
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <Wordmark word="GVTEWAY" style={{ color: "var(--p-accent-text)", fontSize: 24 }} />
                <span className="eyebrow text-[var(--p-text-3)]">{w("comingSoon.badge", "Coming soon")}</span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-[var(--p-text-2)]">
                {w(
                  "comingSoon.gvteway.body",
                  "The public side of the world you build: ticketing, portals, and the marketplace where crews, vendors, and gigs find each other. The marketplace is already live; the full product is coming.",
                )}
              </p>
              <div className="mt-5 flex flex-wrap gap-4">
                <Link href="/marketplace" className="text-sm font-semibold text-[var(--p-accent-text)] hover:underline">
                  {w("comingSoon.gvteway.ctaMarketplace", "Browse the live marketplace →")}
                </Link>
                <Link href="/gvteway" className="text-sm font-semibold text-[var(--p-accent-text)] hover:underline">
                  {w("comingSoon.gvteway.cta", "Preview GVTEWAY →")}
                </Link>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* 5 · ECOSYSTEM STRIP — the four one-liners verbatim from SITE.apps (GEO) */}
      <section id="ecosystem" className="border-y border-[var(--p-border)] bg-[var(--p-surface-2)] px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <p className="eyebrow eyebrow-accent">{w("ecosystem.eyebrow", "One ecosystem")}</p>
          <h2 className="hed-xl mt-3">{w("ecosystem.title", "Four apps, one record store")}</h2>
          <div className="mt-10 divide-y divide-[var(--p-border)] rounded-xl border border-[var(--p-border)] bg-[var(--p-surface)] shadow-[var(--p-elev-1)]">
            {ECOSYSTEM.map((e) => (
              <Link
                key={e.slug}
                href={e.href}
                data-platform={e.slug}
                className="flex flex-wrap items-baseline gap-x-6 gap-y-2 px-6 py-5 transition-colors hover:bg-[var(--p-surface-2)]"
              >
                <span className="w-40 flex-none">
                  <Wordmark word={e.app.name} style={{ color: "var(--p-accent-text)", fontSize: 18 }} />
                </span>
                <span className="min-w-0 flex-1 text-sm leading-relaxed text-[var(--p-text-2)]">{e.app.tagline}</span>
                <span className="eyebrow flex-none text-[var(--p-text-3)]">{e.note}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF — STATS (preserved, with attribution) */}
      <section className="px-6 py-20" aria-label={t("marketing.pages.home.stats.ariaLabel")}>
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 rounded-xl border border-[var(--p-border)] bg-[var(--p-surface)] p-10 text-center shadow-[var(--p-elev-1)] md:grid-cols-3">
            {[
              { big: "14+", label: t("marketing.pages.home.stats.items.yearsExperience") },
              { big: "250+", label: t("marketing.pages.home.stats.items.productionsShipped") },
              { big: "5M+", label: t("marketing.pages.home.stats.items.guestsServed") },
            ].map((s) => (
              <div key={s.label}>
                <div className="hed-2xl text-[var(--p-accent)]">{s.big}</div>
                <div className="eyebrow mt-2 text-[var(--p-text-3)]">{s.label}</div>
              </div>
            ))}
          </div>
          {/* C4 — attribute the stats (no orphan numbers). */}
          <p className="mt-4 text-center text-[11px] text-[var(--p-text-3)]">
            {t("marketing.pages.home.stats.source", undefined, "From GHXSTSHIP Industries production history through 2026.")}{" "}
            <Link href="/about" className="text-[var(--p-accent-text)] underline">
              {t("marketing.pages.home.stats.sourceLink", undefined, "About")}
            </Link>
          </p>
        </div>
      </section>

      {/* 6 · GEO Q&A — FAQSection renders the FAQPage JSON-LD */}
      <FAQSection title={t("marketing.pages.home.faq.title")} faqs={HOME_FAQ} />

      {/* 7 · DEVELOPERS / PARTNERS teaser */}
      <section id="build-with-us" className="border-t border-[var(--p-border)] bg-[var(--p-surface-2)] px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <p className="eyebrow eyebrow-accent">{w("buildWithUs.eyebrow", "Build with us")}</p>
          <h2 className="hed-xl mt-3">{w("buildWithUs.title", "Developers and partners")}</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            <Link
              href="/developers"
              className="block rounded-xl border border-[var(--p-border)] bg-[var(--p-surface)] p-7 shadow-[var(--p-elev-1)] transition-shadow hover:shadow-[var(--p-elev-2)]"
            >
              <h3 className="text-base font-semibold text-[var(--p-text-1)]">
                {w("buildWithUs.developers.title", "Developers")}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--p-text-2)]">
                {w(
                  "buildWithUs.developers.body",
                  "The documents, reports, and advancing APIs are public, scoped, and OpenAPI-described. Build against the same endpoints the product runs on.",
                )}
              </p>
              <span className="mt-4 inline-block text-sm font-semibold text-[var(--p-accent-text)]">
                {w("buildWithUs.developers.cta", "Read the API docs →")}
              </span>
            </Link>
            <Link
              href="/partners"
              className="block rounded-xl border border-[var(--p-border)] bg-[var(--p-surface)] p-7 shadow-[var(--p-elev-1)] transition-shadow hover:shadow-[var(--p-elev-2)]"
            >
              <h3 className="text-base font-semibold text-[var(--p-text-1)]">
                {w("buildWithUs.partners.title", "Partners")}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--p-text-2)]">
                {w(
                  "buildWithUs.partners.body",
                  "Agencies, resellers, and integration builders who put crews on sites every week. If that is you, we should talk.",
                )}
              </p>
              <span className="mt-4 inline-block text-sm font-semibold text-[var(--p-accent-text)]">
                {w("buildWithUs.partners.cta", "Explore the partner program →")}
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* LATEST — real content sources (preserved) */}
      <section id="latest" className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <p className="eyebrow eyebrow-accent">{t("marketing.pages.home.latest.eyebrow")}</p>
          <h2 className="hed-xl mt-3">{t("marketing.pages.home.latest.title")}</h2>
          <div className="mt-10 divide-y divide-[var(--p-border)] rounded-xl border border-[var(--p-border)] bg-[var(--p-surface)] shadow-[var(--p-elev-1)]">
            {POSTS.map((l) => (
              <Link
                key={l.title}
                href={l.href}
                className="flex flex-wrap items-center gap-4 px-5 py-4 transition-colors hover:bg-[var(--p-surface-2)]"
              >
                <span className="w-32 flex-none font-mono text-xs text-[var(--p-text-3)]" style={{ fontFamily: "var(--p-mono-data)" }}>{l.date}</span>
                <span className="eyebrow flex-none rounded-full bg-[var(--p-accent-weak)] px-3 py-1 eyebrow-accent">
                  {l.cat}
                </span>
                <span className="flex-1 text-base font-semibold text-[var(--p-text-1)]">{l.title}</span>
                <span className="flex-none text-sm text-[var(--p-accent-text)]">→</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 8 · CLOSING CTA */}
      <section id="cta" className="border-t border-[var(--p-border)] bg-[var(--p-surface-2)] px-6 py-24 text-center">
        <div className="mx-auto max-w-3xl">
          <p className="eyebrow eyebrow-accent">{w("cta.eyebrow", "Your crew is already carrying the hardware")}</p>
          <h2 className="hed-2xl mt-3">{w("cta.title", "Put the site in their pocket")}</h2>
          <p className="mx-auto mt-6 max-w-xl text-lg text-[var(--p-text-2)]">
            {w(
              "cta.body",
              "Start with COMPVSS today. When the operator console and the public side arrive, your org, your people, and your records will already be there waiting.",
            )}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button href="/signup" variant="cta">
              {t("marketing.pages.home.cta.ctaPrimary", undefined, "Start building free")}
            </Button>
            <Link
              href="/demo"
              className="rounded-md border border-[var(--p-border-2)] px-6 py-3 text-sm font-semibold text-[var(--p-text-1)] transition-colors hover:bg-[var(--p-surface-2)]"
            >
              {t("marketing.pages.home.cta.ctaSecondary", undefined, "See it run")}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
