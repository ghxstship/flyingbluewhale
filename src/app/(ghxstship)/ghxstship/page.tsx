import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Layers, Compass, Clock3, Building2, Hexagon, MapPin } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CATALOG_STATS, CLASSES, SOLUTIONS, ANCHOR_MARKETS, paths } from "@/lib/ghxstship";
import { GhxstshipJsonLd, organizationSchema, serviceSchema, faqSchema } from "@/components/ghxstship/JsonLd";
import { getRequestT } from "@/lib/i18n/request";

type Translate = Awaited<ReturnType<typeof getRequestT>>["t"];

export const dynamic = "force-static";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestT();
  return {
    title: t(
      "ghxstship.home.meta.title",
      undefined,
      "GHXSTSHIP — Experiential Production Company | Festivals, Theme Parks, Live Events",
    ),
    description: t(
      "ghxstship.home.meta.description",
      undefined,
      "Experiential production at scale — festivals, immersive experiences, theme park attractions, brand activations, theatrical productions, and premium hospitality. Anchored in Miami, New York City, Chicago, and Los Angeles.",
    ),
    keywords: [
      "experiential production company",
      "festival production company",
      "theme park production",
      "live event production",
      "immersive experience design",
      "brand activation agency",
      "theatrical production company",
      "premium hospitality production",
      "Miami event production",
      "New York event production",
      "Los Angeles event production",
      "Chicago event production",
    ],
    alternates: { canonical: "https://ghxstship.pro/ghxstship" },
  };
}

function buildProofStats(t: Translate) {
  return [
    {
      label: t("ghxstship.home.proof.services.label", undefined, "Services"),
      value: CATALOG_STATS.serviceCount,
      sub: t("ghxstship.home.proof.services.sub", undefined, "Disciplines under one roof"),
    },
    {
      label: t("ghxstship.home.proof.industries.label", undefined, "Industries"),
      value: CATALOG_STATS.solutionCount,
      sub: t("ghxstship.home.proof.industries.sub", undefined, "From festivals to fan zones"),
    },
    {
      label: t("ghxstship.home.proof.markets.label", undefined, "Markets"),
      value: CATALOG_STATS.marketCount,
      sub: t("ghxstship.home.proof.markets.sub", undefined, "Anchored + national reach"),
    },
    {
      label: t("ghxstship.home.proof.phases.label", undefined, "Phases"),
      value: CATALOG_STATS.phaseCount,
      sub: t("ghxstship.home.proof.phases.sub", undefined, "Discovery to wrap"),
    },
  ];
}

const FEATURED_SOLUTIONS = [
  "concerts-festivals-tours",
  "premium-sporting-experiences-fan-zones",
  "amusement-theme-parks",
  "cruise-lines-maritime",
  "immersive-experiences",
  "premium-experiences-hospitality",
] as const;

function buildFaqs(t: Translate) {
  return [
    {
      q: t("ghxstship.home.faq.q1.q", undefined, "What kind of productions does GHXSTSHIP take on?"),
      a: t(
        "ghxstship.home.faq.q1.a",
        undefined,
        "Festivals and concert tours, theme park attractions, immersive experiences, brand activations and pop-ups, theatrical performances, art and cultural installations, premium sporting hospitality and fan zones, conferences and trade shows, luxury retail and dining, weddings and private estate events, cruise ship and maritime entertainment, and ultra-premium private events. Nineteen industry verticals in total.",
      ),
    },
    {
      q: t("ghxstship.home.faq.q2.q", undefined, "Where does GHXSTSHIP operate?"),
      a: t(
        "ghxstship.home.faq.q2.a",
        undefined,
        "Four anchor markets with full-time teams and dedicated fabrication capacity: Miami, New York City, Chicago, and Los Angeles. Eight satellite markets serviced from those anchors: Orlando, Nashville, Austin, Atlanta, Minneapolis, Denver, Las Vegas, and Seattle. National and international productions are handled from the closest anchor.",
      ),
    },
    {
      q: t("ghxstship.home.faq.q3.q", undefined, "How is GHXSTSHIP different from a typical event agency?"),
      a: t(
        "ghxstship.home.faq.q3.a",
        undefined,
        "GHXSTSHIP runs every engagement on the same internal data model — the Experiential Project Management System (XPMS) — that publishes our public service catalog. Every deliverable, vendor, compliance check, and budget line carries a stable identifier you can audit end to end. Same schema runs internally on our ATLVS software. Same schema is what you read on this site.",
      ),
    },
    {
      q: t("ghxstship.home.faq.q4.q", undefined, "Do you handle production end to end, or only specific phases?"),
      a: t(
        "ghxstship.home.faq.q4.a",
        undefined,
        "Both. We engage across all eight production phases — Discovery, Concept, Develop, Advance, Build, Show, Strike, and Wrap — or any subset. Per-project tiers are scoped to a single brief. Retainers run continuous engagements across multiple briefs.",
      ),
    },
    {
      q: t("ghxstship.home.faq.q5.q", undefined, "Who owns the deliverables and IP at the end of an engagement?"),
      a: t(
        "ghxstship.home.faq.q5.a",
        undefined,
        "You do. All concept artwork, design files, engineering drawings, and production documentation transfer to you on final invoice. Reusable touring scenic systems and trade show booth assets stay in our climate-controlled storage by default for redeployment, but ownership is yours.",
      ),
    },
  ];
}

export default async function GhxstshipHome() {
  const { t } = await getRequestT();
  const PROOF_STATS = buildProofStats(t);
  const FAQS = buildFaqs(t);
  return (
    <>
      <GhxstshipJsonLd
        data={[
          organizationSchema(),
          serviceSchema({
            name: "Experiential Production",
            description:
              "Experiential production company building festivals, immersive experiences, theme park attractions, theatrical performances, brand activations, and premium hospitality.",
            serviceType: "Experiential Production",
            category: "Live Event Production",
            areaServed: [
              "Miami",
              "New York City",
              "Chicago",
              "Los Angeles",
              "Orlando",
              "Las Vegas",
              "Austin",
              "Nashville",
              "Atlanta",
              "Minneapolis",
              "Denver",
              "Seattle",
              "United States",
            ],
            offers: SOLUTIONS.map((s) => ({ name: s.name })),
          }),
          faqSchema(FAQS),
        ]}
      />

      <div className="space-y-24 pb-24">
        {/* HERO */}
        <section className="mx-auto max-w-6xl px-6 pt-20 pb-12">
          <div className="text-xs font-semibold tracking-[0.25em] uppercase">
            <span style={{ color: "var(--p-accent)" }}>GHXSTSHIP Industries</span>
            <span className="ms-3 text-[var(--p-text-2)]">
              {t("ghxstship.home.hero.established", undefined, "Est. Miami · New York · Chicago · Los Angeles")}
            </span>
          </div>
          <h1
            className="mt-6 text-5xl leading-[0.95] font-semibold tracking-tight uppercase sm:text-7xl lg:text-[8rem]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {t("ghxstship.home.hero.line1", undefined, "Experiential")}
            <br />
            <span style={{ color: "var(--p-accent)" }}>{t("ghxstship.home.hero.line2", undefined, "production,")}</span>
            <br />
            {t("ghxstship.home.hero.line3", undefined, "built once,")}
            <br />
            {t("ghxstship.home.hero.line4", undefined, "run anywhere.")}
          </h1>
          <p className="mt-8 max-w-2xl text-lg text-[var(--p-text-2)]">
            {t(
              "ghxstship.home.hero.body",
              undefined,
              "We design, engineer, fabricate, and operate festivals, immersive experiences, theme park attractions, theatrical productions, brand activations, and premium hospitality. The same operating system that runs inside our studio publishes the catalog you’re reading — so the work you brief us on Monday becomes a scoped, priced, and assignable engagement by Wednesday.",
            )}
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Button href={paths.contact()} size="lg">
              {t("ghxstship.home.hero.cta.startProject", undefined, "Start a Project")}
            </Button>
            <Button href={paths.servicesRoot()} size="lg" variant="secondary">
              {t("ghxstship.home.hero.cta.servicesCatalog", undefined, "Services Catalog")}
            </Button>
            <Link href={paths.pricing()} className="ps-btn ps-btn--ghost ps-btn--lg">
              {t("ghxstship.home.hero.cta.pricing", undefined, "Pricing →")}
            </Link>
          </div>
        </section>

        {/* PROOF STRIP */}
        <section className="mx-auto max-w-6xl px-6">
          <div className="surface-raised grid grid-cols-2 gap-px overflow-hidden md:grid-cols-4">
            {PROOF_STATS.map((stat) => (
              <div key={stat.label} className="bg-[var(--p-bg)] p-6">
                <div
                  className="text-5xl font-semibold tracking-tight"
                  style={{ fontFamily: "var(--font-display)", color: "var(--p-accent)" }}
                >
                  {stat.value}
                </div>
                <div className="mt-2 text-xs font-semibold tracking-[0.18em] uppercase">{stat.label}</div>
                <div className="mt-1 text-xs text-[var(--p-text-2)]">{stat.sub}</div>
              </div>
            ))}
          </div>
        </section>

        {/* WHAT WE DO */}
        <section className="mx-auto max-w-6xl px-6">
          <div className="grid items-end gap-6 md:grid-cols-2">
            <div>
              <div className="text-xs font-semibold tracking-[0.2em] uppercase" style={{ color: "var(--p-accent)" }}>
                {t("ghxstship.home.whatWeDo.eyebrow", undefined, "What We Do")}
              </div>
              <h2 className="mt-3 text-4xl uppercase sm:text-5xl" style={{ fontFamily: "var(--font-display)" }}>
                {t("ghxstship.home.whatWeDo.heading.line1", undefined, "Six ways to find")}
                <br />
                {t("ghxstship.home.whatWeDo.heading.line2", undefined, "the right team.")}
              </h2>
            </div>
            <p className="text-[var(--p-text-2)]">
              {t(
                "ghxstship.home.whatWeDo.body",
                undefined,
                "Production touches a lot of disciplines. Search by what you build, when in the lifecycle, how deep the detail goes, what kind of experience it is, what industry it serves, or where it happens. Every path lands on a real producer with a real portfolio.",
              )}
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <AxisCard
              icon={<Layers className="h-5 w-5" />}
              count={CATALOG_STATS.classCount}
              title={t("ghxstship.home.axis.disciplines.title", undefined, "Disciplines")}
              blurb={t(
                "ghxstship.home.axis.disciplines.blurb",
                undefined,
                "Production, build, hospitality, technology, operations, executive — ten core disciplines covering everything we touch.",
              )}
              href={paths.servicesRoot()}
              t={t}
            />
            <AxisCard
              icon={<Clock3 className="h-5 w-5" />}
              count={CATALOG_STATS.phaseCount}
              title={t("ghxstship.home.axis.phases.title", undefined, "Phases")}
              blurb={t(
                "ghxstship.home.axis.phases.blurb",
                undefined,
                "Discovery, concept, develop, advance, build, show, strike, wrap. Engage across all eight or any subset.",
              )}
              href={paths.phasesRoot()}
              t={t}
            />
            <AxisCard
              icon={<Building2 className="h-5 w-5" />}
              count={6}
              title={t("ghxstship.home.axis.detailDepth.title", undefined, "Detail Depth")}
              blurb={t(
                "ghxstship.home.axis.detailDepth.blurb",
                undefined,
                "From multi-year programs down to single rigging components. We work at the level your brief lives at.",
              )}
              href={paths.servicesRoot()}
              t={t}
            />
            <AxisCard
              icon={<Hexagon className="h-5 w-5" />}
              count={CATALOG_STATS.tierCount}
              title={t("ghxstship.home.axis.experienceModes.title", undefined, "Experience Modes")}
              blurb={t(
                "ghxstship.home.axis.experienceModes.blurb",
                undefined,
                "Social, digital, virtual, physical, experiential, theatrical. Most engagements span two or three.",
              )}
              href={paths.tiersRoot()}
              t={t}
            />
            <AxisCard
              icon={<Compass className="h-5 w-5" />}
              count={CATALOG_STATS.solutionCount}
              title={t("ghxstship.home.axis.industries.title", undefined, "Industries")}
              blurb={t(
                "ghxstship.home.axis.industries.blurb",
                undefined,
                "Festivals to fan zones, theme parks to maritime, art galleries to F1 paddock clubs. Nineteen verticals.",
              )}
              href={paths.solutionsRoot()}
              t={t}
            />
            <AxisCard
              icon={<MapPin className="h-5 w-5" />}
              count={CATALOG_STATS.marketCount}
              title={t("ghxstship.home.axis.markets.title", undefined, "Markets")}
              blurb={t(
                "ghxstship.home.axis.markets.blurb",
                undefined,
                "Miami, New York, Chicago, Los Angeles. Plus eight satellites. National and international from any anchor.",
              )}
              href={paths.marketsRoot()}
              t={t}
            />
          </div>
        </section>

        {/* DISCIPLINE GRID */}
        <section className="mx-auto max-w-6xl px-6">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="text-xs font-semibold tracking-[0.2em] uppercase" style={{ color: "var(--p-accent)" }}>
                {t("ghxstship.home.capabilities.eyebrow", undefined, "Capabilities")}
              </div>
              <h2 className="mt-3 text-4xl uppercase sm:text-5xl" style={{ fontFamily: "var(--font-display)" }}>
                {t("ghxstship.home.capabilities.heading.line1", undefined, "Ten disciplines.")}
                <br />
                {t("ghxstship.home.capabilities.heading.line2", undefined, "One studio.")}
              </h2>
            </div>
            <Link
              href={paths.servicesRoot()}
              className="text-sm font-semibold tracking-wide uppercase hover:text-[var(--p-accent)]"
            >
              {t("ghxstship.home.capabilities.fullCatalog", undefined, "Full services catalog →")}
            </Link>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {CLASSES.map((c) => (
              <Link
                key={c.code}
                href={paths.classDetail(c.slug)}
                className="surface hover-lift group flex items-start justify-between gap-4 p-6"
              >
                <div>
                  <div className="font-mono text-[10px] tracking-[0.18em] text-[var(--p-text-2)]">
                    {t("ghxstship.home.classLabel", { code: c.code }, "CLASS {code}")}
                  </div>
                  <div className="mt-2 text-2xl uppercase" style={{ fontFamily: "var(--font-display)" }}>
                    {c.shortName}
                  </div>
                  <div className="mt-2 line-clamp-2 text-sm text-[var(--p-text-2)]">{c.definition}</div>
                </div>
                <ArrowRight className="cta-nudge mt-1 h-5 w-5 shrink-0 text-[var(--p-text-2)] transition-colors group-hover:text-[var(--p-accent)]" />
              </Link>
            ))}
          </div>
        </section>

        {/* INDUSTRIES GRID */}
        <section className="mx-auto max-w-6xl px-6">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="text-xs font-semibold tracking-[0.2em] uppercase" style={{ color: "var(--p-accent)" }}>
                {t("ghxstship.home.industries.eyebrow", undefined, "Industries")}
              </div>
              <h2 className="mt-3 text-4xl uppercase sm:text-5xl" style={{ fontFamily: "var(--font-display)" }}>
                {t("ghxstship.home.industries.heading.line1", undefined, "Where the")}
                <br />
                {t("ghxstship.home.industries.heading.line2", undefined, "work lives.")}
              </h2>
            </div>
            <Link
              href={paths.solutionsRoot()}
              className="text-sm font-semibold tracking-wide uppercase hover:text-[var(--p-accent)]"
            >
              {t("ghxstship.home.industries.all", undefined, "All 19 industries →")}
            </Link>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURED_SOLUTIONS.map((slug) => {
              const s = SOLUTIONS.find((x) => x.slug === slug);
              if (!s) return null;
              return (
                <Link key={s.slug} href={paths.solutionDetail(s.slug)} className="surface hover-lift group block p-6">
                  <div className="text-xl uppercase" style={{ fontFamily: "var(--font-display)" }}>
                    {s.name}
                  </div>
                  <p className="mt-3 line-clamp-3 text-sm text-[var(--p-text-2)]">{s.definition}</p>
                  <div className="mt-4 text-xs font-semibold tracking-wide text-[var(--p-text-2)] uppercase transition-colors group-hover:text-[var(--p-accent)]">
                    {t("ghxstship.home.industries.readMore", undefined, "Read more →")}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* PRICING TEASE */}
        <section className="mx-auto max-w-6xl px-6">
          <div className="surface-raised relative overflow-hidden p-10">
            <div
              className="absolute inset-x-0 top-0 h-1"
              style={{ background: "linear-gradient(90deg, var(--p-accent), var(--p-accent-text))" }}
            />
            <div className="grid gap-8 md:grid-cols-2 md:items-end">
              <div>
                <div className="text-xs font-semibold tracking-[0.2em] uppercase" style={{ color: "var(--p-accent)" }}>
                  {t("ghxstship.home.pricingTease.eyebrow", undefined, "How We Work Together")}
                </div>
                <h2 className="mt-3 text-4xl uppercase sm:text-5xl" style={{ fontFamily: "var(--font-display)" }}>
                  {t("ghxstship.home.pricingTease.heading.line1", undefined, "Per project.")}
                  <br />
                  {t("ghxstship.home.pricingTease.heading.line2", undefined, "Or on retainer.")}
                </h2>
              </div>
              <p className="text-[var(--p-text-2)]">
                <strong className="text-[var(--p-text-1)]">
                  {t("ghxstship.home.pricingTease.perProject.label", undefined, "Per Project")}
                </strong>{" "}
                {t(
                  "ghxstship.home.pricingTease.perProject.body",
                  undefined,
                  "— five tiers from a single-night activation to a multi-year mega-event.",
                )}{" "}
                <strong className="text-[var(--p-text-1)]">
                  {t("ghxstship.home.pricingTease.retainer.label", undefined, "Retainer")}
                </strong>{" "}
                {t(
                  "ghxstship.home.pricingTease.retainer.body",
                  undefined,
                  "— four team-composition bundles from a coordinator pair to a 24/7 senior team. Add-ons stack on either path.",
                )}
              </p>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button href={paths.pricing()} size="lg">
                {t("ghxstship.home.pricingTease.cta.seePricing", undefined, "See pricing")}
              </Button>
              <Button href={paths.contact()} size="lg" variant="secondary">
                {t("ghxstship.home.hero.cta.startProject", undefined, "Start a Project")}
              </Button>
            </div>
          </div>
        </section>

        {/* MARKETS STRIP */}
        <section className="mx-auto max-w-6xl px-6">
          <div className="text-xs font-semibold tracking-[0.2em] text-[var(--p-text-2)] uppercase">
            {t("ghxstship.home.markets.eyebrow", undefined, "Anchor Markets")}
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {ANCHOR_MARKETS.map((m) => (
              <Link key={m.slug} href={paths.marketDetail(m.slug)} className="surface hover-lift block p-6">
                <div className="text-2xl uppercase" style={{ fontFamily: "var(--font-display)" }}>
                  {m.name}
                </div>
                <div className="mt-3 line-clamp-3 text-xs text-[var(--p-text-2)]">{m.blurb}</div>
              </Link>
            ))}
          </div>
          <div className="mt-6">
            <Link
              href={paths.marketsRoot()}
              className="text-sm font-semibold tracking-wide uppercase hover:text-[var(--p-accent)]"
            >
              {t("ghxstship.home.markets.all", undefined, "All twelve markets, including satellites →")}
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-6xl px-6">
          <div className="text-xs font-semibold tracking-[0.2em] uppercase" style={{ color: "var(--p-accent)" }}>
            {t("ghxstship.home.faq.eyebrow", undefined, "FAQ")}
          </div>
          <h2 className="mt-3 text-4xl uppercase sm:text-5xl" style={{ fontFamily: "var(--font-display)" }}>
            {t("ghxstship.home.faq.heading", undefined, "Common questions.")}
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {FAQS.map((faq) => (
              <details key={faq.q} className="surface group p-6 [&[open]>summary>span:last-child]:rotate-45">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
                  <span className="text-base font-semibold">{faq.q}</span>
                  <span className="mt-1 inline-block text-2xl leading-none transition-transform">+</span>
                </summary>
                <p className="mt-3 text-sm text-[var(--p-text-2)]">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

function AxisCard({
  icon,
  count,
  title,
  blurb,
  href,
  t,
}: {
  icon: React.ReactNode;
  count: number;
  title: string;
  blurb: string;
  href: string;
  t: Translate;
}) {
  return (
    <Link href={href} className="surface hover-lift group block p-6">
      <div className="flex items-center gap-3">
        <span
          className="inline-flex h-8 w-8 items-center justify-center"
          style={{ background: "var(--p-accent-text)", color: "var(--p-accent-contrast)" }}
        >
          {icon}
        </span>
        <span className="ms-auto font-mono text-xs text-[var(--p-text-2)]">{count}</span>
      </div>
      <div className="mt-4 text-xl uppercase" style={{ fontFamily: "var(--font-display)" }}>
        {title}
      </div>
      <p className="mt-2 text-sm text-[var(--p-text-2)]">{blurb}</p>
      <div className="mt-4 text-xs font-semibold tracking-wide text-[var(--p-text-2)] uppercase transition-colors group-hover:text-[var(--p-accent)]">
        {t("ghxstship.home.axis.open", undefined, "Open →")}
      </div>
    </Link>
  );
}
