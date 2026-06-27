// Marketing home — ATLVS ecosystem (ATLVS · COMPVSS · GVTEWAY · LEG3ND).
// SaaS skin (Hanken Grotesk body, Anton display, neutral surfaces, soft
// elevation) inherited from (marketing)/layout.tsx data-theme="atlvs-product".
// Copy leads with the platform — production-ops vernacular, no voyage metaphor.

import Link from "next/link";
import type { Metadata } from "next";
import { FAQSection } from "@/components/marketing/FAQ";
import { JsonLd } from "@/components/marketing/JsonLd";
import { ProductPreview } from "@/components/marketing/ProductPreview";
import { buildMetadata, organizationSchema, softwareApplicationSchema, websiteSchema, SITE } from "@/lib/seo";
import { getRequestT } from "@/lib/i18n/request";
import { PRODUCT_ACCENTS } from "@/lib/brand";
import { Wordmark } from "@/components/brand/Wordmark";
import { XPMS_PHASES } from "@/lib/xpms";

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
    title: t("marketing.pages.home.metadata.title"),
    description: t("marketing.pages.home.metadata.description"),
    path: "/",
    languages: {
      "es-ES": `${SITE.baseUrl}/es-ES`,
      "pt-BR": `${SITE.baseUrl}/pt-BR`,
    },
    keywords: [
      "ATLVS",
      "ATLVS Technologies",
      "COMPVSS",
      "GVTEWAY",
      "production management software",
      "event operations platform",
      "crew management software",
      "live event software",
      "festival operations platform",
      "experiential production platform",
      "concert tour management",
      "brand activation software",
      "production scheduling",
      "event ticketing platform",
      "offline-first crew app",
    ],
    ogImageTitle: t("marketing.pages.home.metadata.ogImageTitle"),
  });
}

export default async function Home() {
  const { t } = await getRequestT();

  const INDUSTRIES: Array<{ title: string; body: string; href: string }> = [
    {
      title: t("marketing.pages.home.industries.items.festivals.title"),
      body: t("marketing.pages.home.industries.items.festivals.body"),
      href: "/solutions/festivals-tours",
    },
    {
      title: t("marketing.pages.home.industries.items.concertsTours.title"),
      body: t("marketing.pages.home.industries.items.concertsTours.body"),
      href: "/solutions/concerts",
    },
    {
      title: t("marketing.pages.home.industries.items.brandActivations.title"),
      body: t("marketing.pages.home.industries.items.brandActivations.body"),
      href: "/solutions/brand-activations",
    },
    {
      title: t("marketing.pages.home.industries.items.immersiveExperiences.title"),
      body: t("marketing.pages.home.industries.items.immersiveExperiences.body"),
      href: "/solutions/immersive-experiences",
    },
    {
      title: t("marketing.pages.home.industries.items.sportingEvents.title"),
      body: t("marketing.pages.home.industries.items.sportingEvents.body"),
      href: "/solutions/live-events",
    },
    {
      title: t("marketing.pages.home.industries.items.tvFilmBroadcast.title"),
      body: t("marketing.pages.home.industries.items.tvFilmBroadcast.body"),
      href: "/solutions/broadcast-tv-film",
    },
    {
      title: t("marketing.pages.home.industries.items.corporateAgm.title"),
      body: t("marketing.pages.home.industries.items.corporateAgm.body"),
      href: "/solutions/corporate-events",
    },
    {
      title: t("marketing.pages.home.industries.items.theatrical.title"),
      body: t("marketing.pages.home.industries.items.theatrical.body"),
      href: "/solutions/theatrical-performances",
    },
  ];

  const TIERS = [
    {
      name: t("marketing.pages.home.adopt.tiers.fullPlatform.name"),
      tag: t("marketing.pages.home.adopt.tiers.fullPlatform.tag"),
      body: t("marketing.pages.home.adopt.tiers.fullPlatform.body"),
    },
    {
      name: t("marketing.pages.home.adopt.tiers.singleApp.name"),
      tag: t("marketing.pages.home.adopt.tiers.singleApp.tag"),
      body: t("marketing.pages.home.adopt.tiers.singleApp.body"),
    },
    {
      name: t("marketing.pages.home.adopt.tiers.modulesOnly.name"),
      tag: t("marketing.pages.home.adopt.tiers.modulesOnly.tag"),
      body: t("marketing.pages.home.adopt.tiers.modulesOnly.body"),
    },
  ];

  // Canonical XPMS production lifecycle (8-gate) — single source of truth is
  // XPMS_PHASES (src/lib/xpms). Names + descriptions are aligned to the
  // Discovery → Design → Advance → Procurement → Build → Install → Operate →
  // Close arc so this marketing copy can never drift from the protocol.
  const PHASE_SUBS: Record<string, string> = {
    Discovery: "Brief approved, go decision made.",
    Design: "Design package approved, scope locked.",
    Advance: "Contracts & POs issued, budget baselined.",
    Procurement: "Deposits paid, long-leads committed.",
    Build: "Fabrication & construction complete, QC passed.",
    Install: "Installed, commissioned, punch list closed.",
    Operate: "Show live; operating acceptance.",
    Close: "Reconciled, final cost report filed.",
  };
  const PHASES: Array<{ n: string; name: string; sub: string }> = XPMS_PHASES.map((p) => ({
    n: String(p.num).padStart(2, "0"),
    name: p.label,
    sub: PHASE_SUBS[p.label] ?? "",
  }));

  // `color` is the bright brand fill (decorative accent bars / large display).
  // `textColor` is the per-product AA-deepened text variant (matches the
  // theme's --p-accent-text) so brand-colored text on white surfaces still
  // clears WCAG 1.4.3 4.5:1 — the bright fills (#2edb3a etc.) only reach
  // ~2.2–3.5:1 as text. Same hue, darker value; brand mark colors unchanged.
  const PRODUCTS = [
    {
      slug: "atlvs",
      title: "ATLVS",
      audience: t("marketing.pages.home.products.atlvs.audience"),
      tag: t("marketing.pages.home.products.atlvs.tag"),
      body: t("marketing.pages.home.products.atlvs.body"),
      href: "/solutions/atlvs",
      color: PRODUCT_ACCENTS.atlvs,
      textColor: "#971a05",
    },
    {
      slug: "compvss",
      title: "COMPVSS",
      audience: t("marketing.pages.home.products.compvss.audience"),
      tag: t("marketing.pages.home.products.compvss.tag"),
      body: t("marketing.pages.home.products.compvss.body"),
      href: "/solutions/compvss",
      color: PRODUCT_ACCENTS.compvss,
      textColor: "#9d6a00",
    },
    {
      slug: "gvteway",
      title: "GVTEWAY",
      audience: t("marketing.pages.home.products.gvteway.audience"),
      tag: t("marketing.pages.home.products.gvteway.tag"),
      body: t("marketing.pages.home.products.gvteway.body"),
      href: "/solutions/gvteway",
      color: PRODUCT_ACCENTS.gvteway,
      textColor: "#1d4ed8",
    },
    {
      slug: "legend",
      title: "LEG3ND",
      audience: t("marketing.pages.home.products.legend.audience"),
      tag: t("marketing.pages.home.products.legend.tag"),
      body: t("marketing.pages.home.products.legend.body"),
      href: "/solutions/legend",
      color: PRODUCT_ACCENTS.legend,
      textColor: "#c2520a",
    },
  ];

  const EDGES = [
    {
      n: "01",
      title: t("marketing.pages.home.difference.edges.endToEnd.title"),
      tag: t("marketing.pages.home.difference.edges.endToEnd.tag"),
      body: t("marketing.pages.home.difference.edges.endToEnd.body"),
    },
    {
      n: "02",
      title: t("marketing.pages.home.difference.edges.proprietaryStack.title"),
      tag: t("marketing.pages.home.difference.edges.proprietaryStack.tag"),
      body: t("marketing.pages.home.difference.edges.proprietaryStack.body"),
    },
    {
      n: "03",
      title: t("marketing.pages.home.difference.edges.perOrgNotPerSeat.title"),
      tag: t("marketing.pages.home.difference.edges.perOrgNotPerSeat.tag"),
      body: t("marketing.pages.home.difference.edges.perOrgNotPerSeat.body"),
    },
  ];

  const PROJECTS = [
    {
      code: "RRR 312",
      title: t("marketing.pages.home.projects.items.rrr312.title"),
      sub: t("marketing.pages.home.projects.items.rrr312.sub"),
      year: "2026",
    },
    {
      code: "RRR 226",
      title: t("marketing.pages.home.projects.items.rrr226.title"),
      sub: t("marketing.pages.home.projects.items.rrr226.sub"),
      year: "2026",
    },
    {
      code: "RRR 052",
      title: t("marketing.pages.home.projects.items.rrr052.title"),
      sub: t("marketing.pages.home.projects.items.rrr052.sub"),
      year: "2025",
    },
    {
      code: "RRR 108",
      title: t("marketing.pages.home.projects.items.rrr108.title"),
      sub: t("marketing.pages.home.projects.items.rrr108.sub"),
      year: "2024",
    },
    {
      code: "RRR 023",
      title: t("marketing.pages.home.projects.items.rrr023.title"),
      sub: t("marketing.pages.home.projects.items.rrr023.sub"),
      year: "2024",
    },
    {
      code: "RRR 311",
      title: t("marketing.pages.home.projects.items.rrr311.title"),
      sub: t("marketing.pages.home.projects.items.rrr311.sub"),
      year: "2023",
    },
    {
      code: "RRR 001",
      title: t("marketing.pages.home.projects.items.rrr001.title"),
      sub: t("marketing.pages.home.projects.items.rrr001.sub"),
      year: "2023",
    },
  ];

  const HOME_FAQ = [
    {
      q: t("marketing.pages.home.faq.items.whatIsAtlvs.q"),
      a: t("marketing.pages.home.faq.items.whatIsAtlvs.a"),
    },
    {
      q: t("marketing.pages.home.faq.items.whoIsItFor.q"),
      a: t("marketing.pages.home.faq.items.whoIsItFor.a"),
    },
    {
      q: t("marketing.pages.home.faq.items.pricing.q"),
      a: t("marketing.pages.home.faq.items.pricing.a"),
    },
    {
      q: t("marketing.pages.home.faq.items.vendorPayouts.q"),
      a: t("marketing.pages.home.faq.items.vendorPayouts.a"),
    },
    {
      q: t("marketing.pages.home.faq.items.compvssOffline.q"),
      a: t("marketing.pages.home.faq.items.compvssOffline.a"),
    },
    {
      q: t("marketing.pages.home.faq.items.whoBuilds.q"),
      a: t("marketing.pages.home.faq.items.whoBuilds.a"),
    },
    {
      q: t("marketing.pages.home.faq.items.dataSecurity.q"),
      a: t("marketing.pages.home.faq.items.dataSecurity.a"),
    },
    {
      q: t("marketing.pages.home.faq.items.aiAssistant.q"),
      a: t("marketing.pages.home.faq.items.aiAssistant.a"),
    },
    {
      q: t("marketing.pages.home.faq.items.exportData.q"),
      a: t("marketing.pages.home.faq.items.exportData.a"),
    },
  ];

  const POSTS = [
    {
      date: "2026 · 05 · 28",
      cat: t("marketing.pages.home.latest.posts.fieldNotes.cat"),
      title: t("marketing.pages.home.latest.posts.fieldNotes.title"),
      href: "/blog",
    },
    {
      date: "2026 · 05 · 12",
      cat: t("marketing.pages.home.latest.posts.release.cat"),
      title: t("marketing.pages.home.latest.posts.release.title"),
      href: "/changelog",
    },
    {
      date: "2026 · 04 · 30",
      cat: t("marketing.pages.home.latest.posts.careers.cat"),
      title: t("marketing.pages.home.latest.posts.careers.title"),
      href: "/careers",
    },
  ];

  return (
    <>
      <JsonLd
        data={[
          organizationSchema(),
          websiteSchema(),
          softwareApplicationSchema({
            name: "ATLVS Technologies",
            description: SITE.description,
            url: SITE.baseUrl,
            price: "0",
          }),
        ]}
      />

      {/* HERO */}
      <section className="relative px-6 pt-16 pb-20 sm:pt-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-12 lg:grid-cols-[1.5fr_1fr]">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] text-[var(--p-accent-text)] uppercase">
                {t("marketing.pages.home.hero.eyebrow")}
              </p>
              <h1 className="mt-5 text-4xl leading-[1.05] font-bold tracking-tight sm:text-5xl md:text-6xl">
                {t("marketing.pages.home.hero.titleLine1")}
                <br />
                {t("marketing.pages.home.hero.titleLine2")}
                <br />
                <span className="text-[var(--p-accent)]">{t("marketing.pages.home.hero.titleLine3")}</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--p-text-2)]">
                {t("marketing.pages.home.hero.subtitleLead")}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/signup"
                  className="rounded-md bg-[var(--p-accent-cta)] px-5 py-2.5 text-sm font-semibold text-[var(--p-accent-cta-contrast)] transition-[filter] hover:brightness-95"
                >
                  {t("marketing.pages.home.hero.ctaPrimary")}
                </Link>
                <Link
                  href="/demo"
                  className="rounded-md border border-[var(--p-border-2)] px-5 py-2.5 text-sm font-semibold text-[var(--p-text-1)] transition-colors hover:bg-[var(--p-surface-2)]"
                >
                  {t("marketing.pages.home.hero.ctaSecondary")}
                </Link>
              </div>
              <p className="mt-6 text-xs text-[var(--p-text-3)]">{t("marketing.pages.home.hero.disclaimer")}</p>
              {/* C1 — the four-app story survives below lg, where the wide
                  ecosystem rail is hidden. Compact 2-up, plain names (no
                  letter-spaced Wordmark that overflows narrow tracks). */}
              <div className="mt-8 grid grid-cols-2 gap-2.5 lg:hidden">
                {PRODUCTS.map((p) => (
                  <div key={p.slug} className="rounded-lg border border-[var(--p-border)] bg-[var(--p-surface)] p-3">
                    <div className="text-sm font-bold" style={{ color: p.textColor }}>
                      {p.title}
                    </div>
                    <p className="mt-0.5 text-[11px] font-medium tracking-[0.06em] text-[var(--p-text-3)] uppercase">
                      {p.tag}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            {/* lg+ only — the Wordmark letter-row's min-content width (~228px)
                cannot fit the 768px tablet column and overflowed the viewport
                (readiness matrix, tablet breakpoint). min-w-0 lets the column
                shrink to its track. */}
            <div className="hidden min-w-0 lg:block">
              {/* C6 — real product imagery: a token-driven console illustration
                  (not a screenshot) anchors the hero with a glimpse of the
                  command deck. Themed to the ATLVS accent. */}
              <div className="mb-4 overflow-hidden rounded-xl border border-[var(--p-border)] bg-[var(--p-surface-2)] p-3 shadow-[var(--p-elev-2)]">
                <ProductPreview accent={PRODUCT_ACCENTS.atlvs} label="ATLVS · Console" />
              </div>
              <div className="rounded-xl border border-[var(--p-border)] bg-[var(--p-surface)] p-6 shadow-[var(--p-elev-2)]">
                <div className="mb-3 text-[10px] font-semibold tracking-[0.14em] text-[var(--p-text-3)] uppercase">
                  {t("marketing.pages.home.hero.ecosystemLabel")}
                </div>
                {PRODUCTS.map((p) => (
                  <div key={p.slug} className="border-t border-[var(--p-border)] py-3 first:border-t-0 first:pt-0">
                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                      <Wordmark word={p.title} style={{ color: p.textColor, fontSize: 17 }} />
                      <span className="text-[10px] font-medium tracking-[0.08em] text-[var(--p-text-3)] uppercase">
                        {p.audience.replace(/^For /i, "")}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[var(--p-text-2)]">{p.tag}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST BAR — sliding customer-logo marquee */}
      <section className="border-y border-[var(--p-border)] bg-[var(--p-surface-2)] py-10">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-center text-[11px] font-semibold tracking-[0.16em] text-[var(--p-text-3)] uppercase">
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
          <Link
            href="/customers"
            className="text-[11px] font-semibold tracking-[0.14em] text-[var(--p-accent-text)] uppercase hover:underline"
          >
            {t("marketing.pages.home.trustBar.seeWork", undefined, "See the work →")}
          </Link>
        </div>
      </section>

      {/* THE FOUR APPS */}
      <section id="apps" className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold tracking-[0.18em] text-[var(--p-accent-text)] uppercase">
            {t("marketing.pages.home.threeApps.eyebrow")}
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            {t("marketing.pages.home.threeApps.title")}
          </h2>
          <p className="mt-4 max-w-3xl text-lg text-[var(--p-text-2)]">{t("marketing.pages.home.threeApps.body")}</p>
          {/* lg+ for the app grid — at 768px a sub-third-width card is narrower
              than the Wordmark letter-row's min-content (~228px) and overflows.
              2-up at lg, 4-up at xl keeps every card above that floor. */}
          <div className="mt-10 grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
            {PRODUCTS.map((p) => (
              <Link
                key={p.slug}
                href={p.href}
                data-platform={p.slug}
                className="group relative block rounded-xl border border-[var(--p-border)] bg-[var(--p-surface)] p-6 shadow-[var(--p-elev-1)] transition-shadow hover:shadow-[var(--p-elev-2)]"
              >
                <span
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-1 rounded-t-xl"
                  style={{ background: p.color }}
                />
                <p className="text-[10px] font-semibold tracking-[0.14em] uppercase" style={{ color: p.textColor }}>
                  {p.audience}
                </p>
                <h3 className="mt-2">
                  <Wordmark word={p.title} style={{ color: p.textColor, fontSize: 30 }} />
                </h3>
                <p className="mt-1 text-xs font-medium text-[var(--p-text-3)] uppercase">{p.tag}</p>
                <p className="mt-4 text-sm leading-relaxed text-[var(--p-text-2)]">{p.body}</p>
                <p className="mt-5 text-xs font-semibold text-[var(--p-text-1)]">
                  {t("marketing.pages.home.threeApps.readMore")}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* INDUSTRIES */}
      <section id="industries" className="border-t border-[var(--p-border)] bg-[var(--p-surface-2)] px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold tracking-[0.18em] text-[var(--p-accent-text)] uppercase">
            {t("marketing.pages.home.industries.eyebrow")}
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            {t("marketing.pages.home.industries.title")}
          </h2>
          <p className="mt-4 max-w-3xl text-lg text-[var(--p-text-2)]">{t("marketing.pages.home.industries.body")}</p>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {INDUSTRIES.map((d) => (
              <Link
                key={d.title}
                href={d.href}
                className="block rounded-lg border border-[var(--p-border)] bg-[var(--p-surface)] p-5 transition-[border-color,box-shadow] hover:border-[var(--p-accent)] hover:shadow-[var(--p-elev-1)]"
              >
                <h3 className="text-base font-semibold tracking-tight text-[var(--p-text-1)]">{d.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--p-text-2)]">{d.body}</p>
              </Link>
            ))}
          </div>
          <p className="mt-8 text-sm text-[var(--p-text-2)]">
            {t("marketing.pages.home.industries.footnote")}{" "}
            <Link href="/solutions" className="font-semibold text-[var(--p-accent-text)] hover:underline">
              {t("marketing.pages.home.industries.footnoteLink")}
            </Link>
          </p>
        </div>
      </section>

      {/* 8-PHASE LIFECYCLE */}
      <section id="lifecycle" className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold tracking-[0.18em] text-[var(--p-accent-text)] uppercase">
            {t("marketing.pages.home.lifecycle.eyebrow")}
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            {t("marketing.pages.home.lifecycle.title")}
          </h2>
          <p className="mt-4 max-w-3xl text-lg text-[var(--p-text-2)]">{t("marketing.pages.home.lifecycle.body")}</p>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            {PHASES.map((s) => (
              <div
                key={s.n}
                className="rounded-lg border border-[var(--p-border)] bg-[var(--p-surface)] p-4 shadow-[var(--p-elev-1)]"
              >
                <div className="font-mono text-[11px] font-semibold tracking-[0.14em] text-[var(--p-text-3)]">
                  {t("marketing.pages.home.lifecycle.phaseLabel")} {s.n}
                </div>
                <div className="mt-1.5 text-base font-semibold text-[var(--p-text-1)]">{s.name}</div>
                <div className="mt-0.5 text-xs text-[var(--p-text-2)]">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* THE DIFFERENCE */}
      <section className="border-y border-[var(--p-border)] bg-[var(--p-surface-2)] px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold tracking-[0.18em] text-[var(--p-accent-text)] uppercase">
            {t("marketing.pages.home.difference.eyebrow")}
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            {t("marketing.pages.home.difference.title")}
          </h2>
          <p className="mt-4 max-w-3xl text-lg text-[var(--p-text-2)]">{t("marketing.pages.home.difference.body")}</p>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {EDGES.map((e) => (
              <article
                key={e.n}
                className="rounded-xl border border-[var(--p-border)] bg-[var(--p-surface)] p-7 shadow-[var(--p-elev-1)]"
              >
                <span className="font-mono text-[11px] font-semibold tracking-[0.14em] text-[var(--p-accent-text)] uppercase">
                  {e.n}
                </span>
                <h3 className="mt-2 text-xl font-bold tracking-tight text-[var(--p-text-1)]">{e.title}</h3>
                <span className="mt-1 inline-block text-[11px] font-medium tracking-[0.08em] text-[var(--p-text-3)] uppercase">
                  {e.tag}
                </span>
                <p className="mt-4 text-sm leading-relaxed text-[var(--p-text-2)]">{e.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ADOPT YOUR WAY */}
      <section id="adopt" className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold tracking-[0.18em] text-[var(--p-accent-text)] uppercase">
            {t("marketing.pages.home.adopt.eyebrow")}
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            {t("marketing.pages.home.adopt.title")}
          </h2>
          <p className="mt-4 max-w-3xl text-lg text-[var(--p-text-2)]">{t("marketing.pages.home.adopt.body")}</p>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {TIERS.map((t) => (
              <article
                key={t.name}
                className="rounded-xl border border-[var(--p-border)] bg-[var(--p-surface)] p-7 shadow-[var(--p-elev-1)]"
              >
                <h3 className="text-xl font-bold tracking-tight text-[var(--p-text-1)]">{t.name}</h3>
                <span className="mt-1 inline-block text-[11px] font-medium tracking-[0.08em] text-[var(--p-text-3)] uppercase">
                  {t.tag}
                </span>
                <p className="mt-4 text-sm leading-relaxed text-[var(--p-text-2)]">{t.body}</p>
              </article>
            ))}
          </div>
          <p className="mt-8 text-sm text-[var(--p-text-2)]">
            <Link href="/pricing" className="font-semibold text-[var(--p-accent-text)] hover:underline">
              {t("marketing.pages.home.adopt.pricingLink")}
            </Link>
          </p>
        </div>
      </section>

      {/* PROJECTS / RECEIPTS */}
      <section id="customers" className="border-t border-[var(--p-border)] bg-[var(--p-surface-2)] px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] text-[var(--p-accent-text)] uppercase">
                {t("marketing.pages.home.projects.eyebrow")}
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                {t("marketing.pages.home.projects.title")}
              </h2>
            </div>
            <p className="max-w-md text-sm text-[var(--p-text-2)]">{t("marketing.pages.home.projects.body")}</p>
          </div>
          <div className="mt-10 overflow-hidden rounded-xl border border-[var(--p-border)] bg-[var(--p-surface)] shadow-[var(--p-elev-1)]">
            <div className="grid grid-cols-[110px_1fr_70px] gap-4 border-b border-[var(--p-border)] bg-[var(--p-surface-2)] px-5 py-3 text-[10px] font-semibold tracking-[0.14em] text-[var(--p-text-3)] uppercase">
              <span>{t("marketing.pages.home.projects.tableHeaders.project")}</span>
              <span>{t("marketing.pages.home.projects.tableHeaders.title")}</span>
              <span>{t("marketing.pages.home.projects.tableHeaders.year")}</span>
            </div>
            {/* C4 — proof is navigable, not a dead table. */}
            {PROJECTS.map((v) => (
              <Link
                key={v.code}
                href="/customers"
                className="grid grid-cols-[110px_1fr_70px] items-center gap-4 border-b border-[var(--p-border)] px-5 py-4 transition-colors last:border-b-0 hover:bg-[var(--p-surface-2)]"
              >
                <span className="font-mono text-xs font-semibold text-[var(--p-text-1)]">{v.code}</span>
                <div>
                  <div className="text-sm font-semibold text-[var(--p-text-1)]">{v.title}</div>
                  <div className="text-xs text-[var(--p-text-3)]">{v.sub}</div>
                </div>
                <span className="font-mono text-xs text-[var(--p-text-2)]">{v.year}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* RECEIPTS — STATS */}
      <section className="px-6 py-20" aria-label={t("marketing.pages.home.stats.ariaLabel")}>
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 rounded-xl border border-[var(--p-border)] bg-[var(--p-surface)] p-10 text-center shadow-[var(--p-elev-1)] md:grid-cols-3">
            {[
              { big: "14+", label: t("marketing.pages.home.stats.items.yearsExperience") },
              { big: "250+", label: t("marketing.pages.home.stats.items.productionsShipped") },
              { big: "5M+", label: t("marketing.pages.home.stats.items.guestsServed") },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-5xl font-bold tracking-tight text-[var(--p-accent)] md:text-6xl">{s.big}</div>
                <div className="mt-2 text-[11px] font-semibold tracking-[0.14em] text-[var(--p-text-3)] uppercase">
                  {s.label}
                </div>
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

      {/* FAQ */}
      <FAQSection title={t("marketing.pages.home.faq.title")} faqs={HOME_FAQ} />

      {/* LATEST */}
      <section id="latest" className="border-t border-[var(--p-border)] bg-[var(--p-surface-2)] px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold tracking-[0.18em] text-[var(--p-accent-text)] uppercase">
            {t("marketing.pages.home.latest.eyebrow")}
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            {t("marketing.pages.home.latest.title")}
          </h2>
          <div className="mt-10 divide-y divide-[var(--p-border)] rounded-xl border border-[var(--p-border)] bg-[var(--p-surface)] shadow-[var(--p-elev-1)]">
            {POSTS.map((l) => (
              <Link
                key={l.title}
                href={l.href}
                className="flex flex-wrap items-center gap-4 px-5 py-4 transition-colors hover:bg-[var(--p-surface-2)]"
              >
                <span className="w-32 flex-none font-mono text-xs text-[var(--p-text-3)]">{l.date}</span>
                <span className="flex-none rounded-full bg-[var(--p-accent-weak)] px-3 py-1 text-[10px] font-semibold tracking-[0.12em] text-[var(--p-accent-text)] uppercase">
                  {l.cat}
                </span>
                <span className="flex-1 text-base font-semibold text-[var(--p-text-1)]">{l.title}</span>
                <span className="flex-none text-sm text-[var(--p-accent-text)]">→</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="cta" className="px-6 py-24 text-center">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-semibold tracking-[0.18em] text-[var(--p-accent-text)] uppercase">
            {t("marketing.pages.home.cta.eyebrow")}
          </p>
          <h2 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">{t("marketing.pages.home.cta.title")}</h2>
          <p className="mx-auto mt-6 max-w-xl text-lg text-[var(--p-text-2)]">{t("marketing.pages.home.cta.body")}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/signup"
              className="rounded-md bg-[var(--p-accent-cta)] px-6 py-3 text-sm font-semibold text-[var(--p-accent-cta-contrast)] transition-[filter] hover:brightness-95"
            >
              {t("marketing.pages.home.cta.ctaPrimary")}
            </Link>
            <Link
              href="/demo"
              className="rounded-md border border-[var(--p-border-2)] px-6 py-3 text-sm font-semibold text-[var(--p-text-1)] transition-colors hover:bg-[var(--p-surface-2)]"
            >
              {t("marketing.pages.home.cta.ctaSecondary")}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
