import type { Metadata } from "next";
import Link from "next/link";
import { ANCHOR_MARKETS, SATELLITE_MARKETS, paths } from "@/lib/ghxstship";
import { GhxstshipJsonLd, breadcrumbSchema } from "@/components/ghxstship/JsonLd";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-static";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestT();
  return {
    title: t(
      "ghxstship.markets.meta.title",
      undefined,
      "Markets — Miami, New York, Chicago, Los Angeles + 8 Satellites | GHXSTSHIP",
    ),
    description: t(
      "ghxstship.markets.meta.description",
      undefined,
      "Anchor markets in Miami, New York City, Chicago, and Los Angeles with full local teams and dedicated fabrication. Eight satellite markets serviced from anchors: Orlando, Nashville, Austin, Atlanta, Minneapolis, Denver, Las Vegas, Seattle.",
    ),
    keywords: [
      "Miami event production company",
      "New York event production",
      "Chicago event production",
      "Los Angeles event production",
      "Las Vegas event production",
      "Orlando theme park production",
      "Atlanta event production",
      "Austin event production",
      "Nashville event production",
      "Denver event production",
      "Minneapolis event production",
      "Seattle event production",
    ],
    alternates: { canonical: "https://ghxstship.pro/ghxstship/markets" },
  };
}

export default async function MarketsHub() {
  const { t } = await getRequestT();
  return (
    <>
      <GhxstshipJsonLd
        data={breadcrumbSchema([
          { label: "GHXSTSHIP", href: "/ghxstship" },
          { label: "Markets", href: "/ghxstship/markets" },
        ])}
      />
      <div className="space-y-16 pb-24">
        <section className="mx-auto max-w-6xl px-6 pt-16">
          <div className="text-xs font-semibold tracking-[0.25em] uppercase" style={{ color: "var(--p-accent)" }}>
            {t("ghxstship.markets.hero.eyebrow", undefined, "Markets")}
          </div>
          <h1 className="mt-4 text-5xl uppercase sm:text-7xl" style={{ fontFamily: "var(--font-display)" }}>
            {t("ghxstship.markets.hero.heading.line1", undefined, "Four anchors.")}
            <br />
            {t("ghxstship.markets.hero.heading.line2", undefined, "Eight satellites.")}
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-[var(--p-text-2)]">
            {t(
              "ghxstship.markets.hero.body",
              undefined,
              "Anchor markets get full local presence, dedicated team, and fabrication capacity. Satellites are serviced from anchors with deep venue and permit familiarity. National and international productions are handled from the closest anchor.",
            )}
          </p>
        </section>

        <section className="mx-auto max-w-6xl px-6">
          <div className="text-xs font-semibold tracking-[0.2em] uppercase" style={{ color: "var(--p-accent)" }}>
            {t("ghxstship.markets.anchor.eyebrow", undefined, "Anchor Markets")}
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {ANCHOR_MARKETS.map((m) => (
              <Link
                key={m.slug}
                href={paths.marketDetail(m.slug)}
                className="surface hover-lift flex h-full flex-col p-6"
              >
                <div className="text-xl uppercase" style={{ fontFamily: "var(--font-display)" }}>
                  {m.name}
                </div>
                <p className="mt-3 line-clamp-4 text-sm text-[var(--p-text-2)]">{m.blurb}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6">
          <div className="text-xs font-semibold tracking-[0.2em] text-[var(--p-text-2)] uppercase">
            {t("ghxstship.markets.satellite.eyebrow", undefined, "Satellite Markets")}
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {SATELLITE_MARKETS.map((m) => (
              <Link
                key={m.slug}
                href={paths.marketDetail(m.slug)}
                className="surface hover-lift flex h-full flex-col p-6"
              >
                <div className="text-lg uppercase" style={{ fontFamily: "var(--font-display)" }}>
                  {m.name}
                </div>
                <p className="mt-3 line-clamp-4 text-xs text-[var(--p-text-2)]">{m.blurb}</p>
                {m.servicedFrom && (
                  <div className="mt-3 text-[10px] tracking-wide text-[var(--p-text-2)] uppercase">
                    {t(
                      "ghxstship.markets.servicedFrom",
                      { city: m.servicedFrom.replace("-", " ") },
                      "Serviced from {city}",
                    )}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
