import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Layers, Compass, Clock3, Building2, Hexagon, MapPin } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CATALOG_STATS, CLASSES, SOLUTIONS, ANCHOR_MARKETS, paths } from "@/lib/ghxstship";
import { GhxstshipJsonLd, organizationSchema, serviceSchema, faqSchema } from "@/components/ghxstship/JsonLd";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "GHXSTSHIP — Experiential Production Company | Festivals, Theme Parks, Live Events",
  description:
    "Experiential production at scale — festivals, immersive experiences, theme park attractions, brand activations, theatrical productions, and premium hospitality. Anchored in Miami, New York City, Chicago, and Los Angeles.",
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

const PROOF_STATS = [
  { label: "Services", value: CATALOG_STATS.serviceCount, sub: "Disciplines under one roof" },
  { label: "Industries", value: CATALOG_STATS.solutionCount, sub: "From festivals to fan zones" },
  { label: "Markets", value: CATALOG_STATS.marketCount, sub: "Anchored + national reach" },
  { label: "Phases", value: CATALOG_STATS.phaseCount, sub: "Discovery to wrap" },
];

const FEATURED_SOLUTIONS = [
  "concerts-festivals-tours",
  "premium-sporting-experiences-fan-zones",
  "amusement-theme-parks",
  "cruise-lines-maritime",
  "immersive-experiences",
  "premium-experiences-hospitality",
] as const;

const FAQS = [
  {
    q: "What kind of productions does GHXSTSHIP take on?",
    a: "Festivals and concert tours, theme park attractions, immersive experiences, brand activations and pop-ups, theatrical performances, art and cultural installations, premium sporting hospitality and fan zones, conferences and trade shows, luxury retail and dining, weddings and private estate events, cruise ship and maritime entertainment, and ultra-premium private events. Nineteen industry verticals in total.",
  },
  {
    q: "Where does GHXSTSHIP operate?",
    a: "Four anchor markets with full-time teams and dedicated fabrication capacity: Miami, New York City, Chicago, and Los Angeles. Eight satellite markets serviced from those anchors: Orlando, Nashville, Austin, Atlanta, Minneapolis, Denver, Las Vegas, and Seattle. National and international productions are handled from the closest anchor.",
  },
  {
    q: "How is GHXSTSHIP different from a typical event agency?",
    a: "GHXSTSHIP runs every engagement on the same internal data model — the Experiential Project Management System (XPMS) — that publishes our public service catalog. Every deliverable, vendor, compliance check, and budget line carries a stable identifier you can audit end to end. Same schema runs internally on our ATLVS software. Same schema is what you read on this site.",
  },
  {
    q: "Do you handle production end to end, or only specific phases?",
    a: "Both. We engage across all eight production phases — Discovery, Concept, Develop, Advance, Build, Show, Strike, and Wrap — or any subset. Per-project tiers are scoped to a single brief. Retainers run continuous engagements across multiple briefs.",
  },
  {
    q: "Who owns the deliverables and IP at the end of an engagement?",
    a: "You do. All concept artwork, design files, engineering drawings, and production documentation transfer to you on final invoice. Reusable touring scenic systems and trade show booth assets stay in our climate-controlled storage by default for redeployment, but ownership is yours.",
  },
];

export default function GhxstshipHome() {
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
            <span style={{ color: "var(--org-primary)" }}>GHXSTSHIP Industries</span>
            <span className="ms-3 text-[var(--text-muted)]">Est. Miami · New York · Chicago · Los Angeles</span>
          </div>
          <h1
            className="mt-6 text-5xl leading-[0.95] font-semibold tracking-tight uppercase sm:text-7xl lg:text-[8rem]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Experiential
            <br />
            <span style={{ color: "var(--org-primary)" }}>production,</span>
            <br />
            built once,
            <br />
            run anywhere.
          </h1>
          <p className="mt-8 max-w-2xl text-lg text-[var(--text-secondary)]">
            We design, engineer, fabricate, and operate festivals, immersive experiences, theme park attractions,
            theatrical productions, brand activations, and premium hospitality. The same operating system that runs
            inside our studio publishes the catalog you&apos;re reading — so the work you brief us on Monday becomes a
            scoped, priced, and assignable engagement by Wednesday.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Button href={paths.contact()} size="lg">
              Start a Project
            </Button>
            <Button href={paths.servicesRoot()} size="lg" variant="secondary">
              Services Catalog
            </Button>
            <Link href={paths.pricing()} className="btn btn-ghost btn-lg">
              Pricing →
            </Link>
          </div>
        </section>

        {/* PROOF STRIP */}
        <section className="mx-auto max-w-6xl px-6">
          <div className="surface-raised grid grid-cols-2 gap-px overflow-hidden md:grid-cols-4">
            {PROOF_STATS.map((stat) => (
              <div key={stat.label} className="bg-[var(--background)] p-6">
                <div
                  className="text-5xl font-semibold tracking-tight"
                  style={{ fontFamily: "var(--font-display)", color: "var(--org-primary)" }}
                >
                  {stat.value}
                </div>
                <div className="mt-2 text-xs font-semibold tracking-[0.18em] uppercase">{stat.label}</div>
                <div className="mt-1 text-xs text-[var(--text-muted)]">{stat.sub}</div>
              </div>
            ))}
          </div>
        </section>

        {/* WHAT WE DO */}
        <section className="mx-auto max-w-6xl px-6">
          <div className="grid items-end gap-6 md:grid-cols-2">
            <div>
              <div className="text-xs font-semibold tracking-[0.2em] uppercase" style={{ color: "var(--org-primary)" }}>
                What We Do
              </div>
              <h2 className="mt-3 text-4xl uppercase sm:text-5xl" style={{ fontFamily: "var(--font-display)" }}>
                Six ways to find
                <br />
                the right team.
              </h2>
            </div>
            <p className="text-[var(--text-secondary)]">
              Production touches a lot of disciplines. Search by what you build, when in the lifecycle, how deep the
              detail goes, what kind of experience it is, what industry it serves, or where it happens. Every path lands
              on a real producer with a real portfolio.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <AxisCard
              icon={<Layers className="h-5 w-5" />}
              count={CATALOG_STATS.classCount}
              title="Disciplines"
              blurb="Production, build, hospitality, technology, operations, executive — ten core disciplines covering everything we touch."
              href={paths.servicesRoot()}
            />
            <AxisCard
              icon={<Clock3 className="h-5 w-5" />}
              count={CATALOG_STATS.phaseCount}
              title="Phases"
              blurb="Discovery, concept, develop, advance, build, show, strike, wrap. Engage across all eight or any subset."
              href={paths.phasesRoot()}
            />
            <AxisCard
              icon={<Building2 className="h-5 w-5" />}
              count={6}
              title="Detail Depth"
              blurb="From multi-year programs down to single rigging components. We work at the level your brief lives at."
              href={paths.servicesRoot()}
            />
            <AxisCard
              icon={<Hexagon className="h-5 w-5" />}
              count={CATALOG_STATS.tierCount}
              title="Experience Modes"
              blurb="Social, digital, virtual, physical, experiential, theatrical. Most engagements span two or three."
              href={paths.tiersRoot()}
            />
            <AxisCard
              icon={<Compass className="h-5 w-5" />}
              count={CATALOG_STATS.solutionCount}
              title="Industries"
              blurb="Festivals to fan zones, theme parks to maritime, art galleries to F1 paddock clubs. Nineteen verticals."
              href={paths.solutionsRoot()}
            />
            <AxisCard
              icon={<MapPin className="h-5 w-5" />}
              count={CATALOG_STATS.marketCount}
              title="Markets"
              blurb="Miami, New York, Chicago, Los Angeles. Plus eight satellites. National and international from any anchor."
              href={paths.marketsRoot()}
            />
          </div>
        </section>

        {/* DISCIPLINE GRID */}
        <section className="mx-auto max-w-6xl px-6">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="text-xs font-semibold tracking-[0.2em] uppercase" style={{ color: "var(--org-primary)" }}>
                Capabilities
              </div>
              <h2 className="mt-3 text-4xl uppercase sm:text-5xl" style={{ fontFamily: "var(--font-display)" }}>
                Ten disciplines.
                <br />
                One studio.
              </h2>
            </div>
            <Link
              href={paths.servicesRoot()}
              className="text-sm font-semibold tracking-wide uppercase hover:text-[var(--org-primary)]"
            >
              Full services catalog →
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
                  <div className="font-mono text-[10px] tracking-[0.18em] text-[var(--text-muted)]">CLASS {c.code}</div>
                  <div className="mt-2 text-2xl uppercase" style={{ fontFamily: "var(--font-display)" }}>
                    {c.shortName}
                  </div>
                  <div className="mt-2 line-clamp-2 text-sm text-[var(--text-secondary)]">{c.definition}</div>
                </div>
                <ArrowRight className="cta-nudge mt-1 h-5 w-5 shrink-0 text-[var(--text-muted)] transition-colors group-hover:text-[var(--org-primary)]" />
              </Link>
            ))}
          </div>
        </section>

        {/* INDUSTRIES GRID */}
        <section className="mx-auto max-w-6xl px-6">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="text-xs font-semibold tracking-[0.2em] uppercase" style={{ color: "var(--org-primary)" }}>
                Industries
              </div>
              <h2 className="mt-3 text-4xl uppercase sm:text-5xl" style={{ fontFamily: "var(--font-display)" }}>
                Where the
                <br />
                work lives.
              </h2>
            </div>
            <Link
              href={paths.solutionsRoot()}
              className="text-sm font-semibold tracking-wide uppercase hover:text-[var(--org-primary)]"
            >
              All 19 industries →
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
                  <p className="mt-3 line-clamp-3 text-sm text-[var(--text-secondary)]">{s.definition}</p>
                  <div className="mt-4 text-xs font-semibold tracking-wide text-[var(--text-muted)] uppercase transition-colors group-hover:text-[var(--org-primary)]">
                    Read more →
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
              style={{ background: "linear-gradient(90deg, var(--org-primary), var(--org-accent))" }}
            />
            <div className="grid gap-8 md:grid-cols-2 md:items-end">
              <div>
                <div
                  className="text-xs font-semibold tracking-[0.2em] uppercase"
                  style={{ color: "var(--org-primary)" }}
                >
                  How We Work Together
                </div>
                <h2 className="mt-3 text-4xl uppercase sm:text-5xl" style={{ fontFamily: "var(--font-display)" }}>
                  Per project.
                  <br />
                  Or on retainer.
                </h2>
              </div>
              <p className="text-[var(--text-secondary)]">
                <strong className="text-[var(--text-primary)]">Per Project</strong> — five tiers from a single-night
                activation to a multi-year mega-event. <strong className="text-[var(--text-primary)]">Retainer</strong>{" "}
                — four team-composition bundles from a coordinator pair to a 24/7 senior team. Add-ons stack on either
                path.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button href={paths.pricing()} size="lg">
                See pricing
              </Button>
              <Button href={paths.contact()} size="lg" variant="secondary">
                Start a Project
              </Button>
            </div>
          </div>
        </section>

        {/* MARKETS STRIP */}
        <section className="mx-auto max-w-6xl px-6">
          <div className="text-xs font-semibold tracking-[0.2em] text-[var(--text-muted)] uppercase">
            Anchor Markets
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {ANCHOR_MARKETS.map((m) => (
              <Link key={m.slug} href={paths.marketDetail(m.slug)} className="surface hover-lift block p-6">
                <div className="text-2xl uppercase" style={{ fontFamily: "var(--font-display)" }}>
                  {m.name}
                </div>
                <div className="mt-3 line-clamp-3 text-xs text-[var(--text-secondary)]">{m.blurb}</div>
              </Link>
            ))}
          </div>
          <div className="mt-6">
            <Link
              href={paths.marketsRoot()}
              className="text-sm font-semibold tracking-wide uppercase hover:text-[var(--org-primary)]"
            >
              All twelve markets, including satellites →
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-6xl px-6">
          <div className="text-xs font-semibold tracking-[0.2em] uppercase" style={{ color: "var(--org-primary)" }}>
            FAQ
          </div>
          <h2 className="mt-3 text-4xl uppercase sm:text-5xl" style={{ fontFamily: "var(--font-display)" }}>
            Common questions.
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {FAQS.map((faq) => (
              <details key={faq.q} className="surface group p-6 [&[open]>summary>span:last-child]:rotate-45">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
                  <span className="text-base font-semibold">{faq.q}</span>
                  <span className="mt-1 inline-block text-2xl leading-none transition-transform">+</span>
                </summary>
                <p className="mt-3 text-sm text-[var(--text-secondary)]">{faq.a}</p>
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
}: {
  icon: React.ReactNode;
  count: number;
  title: string;
  blurb: string;
  href: string;
}) {
  return (
    <Link href={href} className="surface hover-lift group block p-6">
      <div className="flex items-center gap-3">
        <span
          className="inline-flex h-8 w-8 items-center justify-center"
          style={{ background: "var(--org-accent)", color: "var(--accent-contrast)" }}
        >
          {icon}
        </span>
        <span className="ms-auto font-mono text-xs text-[var(--text-muted)]">{count}</span>
      </div>
      <div className="mt-4 text-xl uppercase" style={{ fontFamily: "var(--font-display)" }}>
        {title}
      </div>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">{blurb}</p>
      <div className="mt-4 text-xs font-semibold tracking-wide text-[var(--text-muted)] uppercase transition-colors group-hover:text-[var(--org-primary)]">
        Open →
      </div>
    </Link>
  );
}
