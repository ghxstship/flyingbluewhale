import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SOLUTIONS, paths, CATALOG_STATS } from "@/lib/ghxstship";
import { GhxstshipJsonLd, breadcrumbSchema, serviceSchema } from "@/components/ghxstship/JsonLd";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Industries — Festival, Theme Park, Cruise, Olympic Hospitality, Theatre | GHXSTSHIP",
  description:
    "Nineteen industry verticals served — concerts and festivals, theme parks, cruise lines, Olympic hospitality and fan zones, immersive experiences, brand activations, premium dining, weddings, theatrical performances, museum galas, and more.",
  keywords: [
    "festival production company",
    "theme park production company",
    "cruise ship production",
    "Olympic hospitality production",
    "immersive experience company",
    "brand activation agency",
    "wedding production",
    "theatre production company",
    "museum gala production",
  ],
  alternates: { canonical: "https://ghxstship.pro/ghxstship/solutions" },
};

export default function SolutionsHub() {
  return (
    <>
      <GhxstshipJsonLd
        data={[
          breadcrumbSchema([
            { label: "GHXSTSHIP", href: "/ghxstship" },
            { label: "Industries", href: "/ghxstship/solutions" },
          ]),
          serviceSchema({
            name: "Experiential Production by Industry",
            description:
              "Nineteen industry verticals from festivals to fan zones, theme parks to maritime, art galleries to F1 paddock clubs.",
            serviceType: "Experiential Production",
            offers: SOLUTIONS.map((s) => ({ name: s.name })),
          }),
        ]}
      />

      <div className="space-y-20 pb-24">
        <section className="mx-auto max-w-6xl px-6 pt-16">
          <div className="text-xs font-semibold tracking-[0.25em] uppercase" style={{ color: "var(--org-primary)" }}>
            Industries
          </div>
          <h1 className="mt-4 text-5xl uppercase sm:text-7xl" style={{ fontFamily: "var(--font-display)" }}>
            {CATALOG_STATS.solutionCount} verticals.
            <br />
            One studio.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-[var(--text-secondary)]">
            Different industries draw on different services. A theme park ride launch and a museum gala both touch
            scenic fabrication, but the compliance posture, the audience, and the run-of-show look nothing alike. Browse
            by what you&apos;re building below; each industry page lists every service we anchor in that vertical, along
            with phase emphasis, depth of detail, and where it tends to happen geographically.
          </p>
        </section>

        <section className="mx-auto max-w-6xl px-6">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {SOLUTIONS.map((s) => (
              <Link
                key={s.slug}
                href={paths.solutionDetail(s.slug)}
                className="surface hover-lift group flex h-full flex-col p-6"
              >
                <div className="text-xl uppercase" style={{ fontFamily: "var(--font-display)" }}>
                  {s.name}
                </div>
                <p className="mt-3 line-clamp-3 text-sm text-[var(--text-secondary)]">{s.definition}</p>
                <div className="mt-4 flex items-center gap-2 text-[10px] font-semibold tracking-[0.2em] uppercase">
                  <span className="text-[var(--text-muted)]">{s.anchoredServices.length} anchored services</span>
                  <ArrowRight className="ml-auto h-3 w-3 text-[var(--text-muted)] group-hover:text-[var(--org-primary)]" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
