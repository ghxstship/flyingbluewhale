import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { MARKETS, MARKET_BY_SLUG, SOLUTIONS, paths } from "@/lib/ghxstship";
import type { CitySlug } from "@/lib/ghxstship/types";
import { GhxstshipJsonLd, breadcrumbSchema, serviceSchema } from "@/components/ghxstship/JsonLd";

export const dynamic = "force-static";

export function generateStaticParams() {
  return MARKETS.map((m) => ({ city: m.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ city: string }> }): Promise<Metadata> {
  const { city } = await params;
  const m = MARKET_BY_SLUG[city as CitySlug];
  if (!m) return {};
  return {
    title: `${m.name} Production Company — Festivals, Events, Activations | GHXSTSHIP`,
    description: `${m.blurb} ${m.type === "anchor" ? "Full local team and fabrication capacity." : "Serviced from our nearest anchor market."}`,
    alternates: { canonical: `https://ghxstship.pro/ghxstship/markets/${m.slug}` },
  };
}

export default async function MarketDetail({ params }: { params: Promise<{ city: string }> }) {
  const { city } = await params;
  const m = MARKET_BY_SLUG[city as CitySlug];
  if (!m) notFound();

  const relevantSolutions = SOLUTIONS.filter((s) => s.geoStrongholds.toLowerCase().includes(m.name.toLowerCase()));

  return (
    <>
      <GhxstshipJsonLd
        data={[
          breadcrumbSchema([
            { label: "GHXSTSHIP", href: "/ghxstship" },
            { label: "Markets", href: "/ghxstship/markets" },
            { label: m.name, href: paths.marketDetail(m.slug) },
          ]),
          serviceSchema({
            name: `${m.name} Experiential Production`,
            description: m.blurb,
            serviceType: "Experiential Production",
            areaServed: [m.name],
            offers: relevantSolutions.map((s) => ({ name: s.name })),
          }),
        ]}
      />
      <div className="space-y-16 pb-24">
        <section className="mx-auto max-w-6xl px-6 pt-12">
          <nav className="mb-6 text-xs text-[var(--p-text-2)]">
            <Link href={paths.marketsRoot()} className="hover:text-[var(--p-text-1)]">
              Markets
            </Link>
            <span className="mx-2">/</span>
            <span className="text-[var(--p-text-1)]">{m.name}</span>
          </nav>
          <div className="font-mono text-[10px] tracking-[0.2em] text-[var(--p-text-2)] uppercase">
            {m.type === "anchor" ? "Anchor Market" : "Satellite Market"}
            {m.servicedFrom && (
              <>
                {" "}
                · serviced from{" "}
                <Link href={paths.marketDetail(m.servicedFrom)} className="underline hover:text-[var(--p-text-1)]">
                  {MARKET_BY_SLUG[m.servicedFrom].name}
                </Link>
              </>
            )}
          </div>
          <h1 className="mt-3 text-5xl uppercase sm:text-7xl" style={{ fontFamily: "var(--font-display)" }}>
            {m.name}
          </h1>
          <p className="mt-6 max-w-3xl text-lg text-[var(--p-text-2)]">{m.blurb}</p>
        </section>

        <section className="mx-auto max-w-6xl px-6">
          <div className="text-xs font-semibold tracking-[0.2em] uppercase" style={{ color: "var(--p-accent)" }}>
            Venues & Anchors
          </div>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {m.anchors.map((a) => (
              <li key={a} className="surface p-4 text-sm">
                {a}
              </li>
            ))}
          </ul>
        </section>

        {relevantSolutions.length > 0 && (
          <section className="mx-auto max-w-6xl px-6">
            <div className="text-xs font-semibold tracking-[0.2em] text-[var(--p-text-2)] uppercase">
              Industries where {m.name} is a stronghold
            </div>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {relevantSolutions.map((s) => (
                <li key={s.slug}>
                  <Link href={paths.solutionDetail(s.slug)} className="surface hover-lift block p-4 text-sm">
                    {s.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mx-auto max-w-6xl px-6">
          <div className="surface-raised p-10">
            <h2 className="text-3xl uppercase sm:text-4xl" style={{ fontFamily: "var(--font-display)" }}>
              Run something in {m.name}.
            </h2>
            <p className="mt-3 max-w-xl text-[var(--p-text-2)]">
              We know the venues, the unions, the permit windows, and the fixers. Brief us with your dates and the local
              posture.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button href={paths.contact()} size="lg">
                Start a Project
              </Button>
              <Button href={paths.solutionsRoot()} size="lg" variant="secondary">
                Browse Industries
              </Button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
