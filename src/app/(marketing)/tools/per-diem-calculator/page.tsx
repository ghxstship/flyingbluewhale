import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { CTASection } from "@/components/marketing/CTASection";
import { buildMetadata, breadcrumbSchema, softwareApplicationSchema, SITE } from "@/lib/seo";
import { PerDiemCalculator } from "@/components/marketing/tools/PerDiemCalculator";

export const metadata: Metadata = buildMetadata({
  title: "Per-Diem Calculator — Crew & Talent Travel Allowance",
  description:
    "Compute total per-diem for crew or talent across multiple cities and days. GSA-aligned default rates with custom rate overrides.",
  path: "/tools/per-diem-calculator",
  keywords: [
    "per diem calculator",
    "GSA per diem rate",
    "tour per diem",
    "crew per diem rate",
    "event per diem",
    "production per diem total",
  ],
  ogImageEyebrow: "Free Tool",
  ogImageTitle: "Per-Diem Calculator.",
});

export default function PerDiemCalculatorPage() {
  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Tools", href: "/tools" },
    { label: "Per-Diem Calculator", href: "/tools/per-diem-calculator" },
  ];

  return (
    <div>
      <JsonLd
        data={[
          breadcrumbSchema(crumbs),
          softwareApplicationSchema({
            name: "ATLVS Per-Diem Calculator",
            description: "Per-diem total calculator for production crew and talent.",
            url: `${SITE.baseUrl}/tools/per-diem-calculator`,
            price: "0",
          }),
        ]}
      />
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <section className="mx-auto max-w-3xl px-6 pt-8 pb-12">
        <div className="eyebrow eyebrow-accent">Free Tool</div>
        <h1 className="hed-xl mt-4">Per-Diem Calculator.</h1>
        <p className="mt-5 text-lg text-[var(--text-secondary)]">
          Compute total per-diem for crew or talent across multiple cities and days. GSA-aligned default rates;
          overridable per-city.
        </p>
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-12">
        <PerDiemCalculator />
      </section>

      <section className="mx-auto max-w-3xl px-6 py-12">
        <h2 className="hed-lg">How Per-Diem Works.</h2>
        <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
          Per-diem is the daily allowance paid to a traveler — typically crew, talent, or contractors — for meals and
          incidentals while away from their home base. The US General Services Administration (GSA) publishes
          city-by-city per-diem rates for federal travel; most production budgets use these as a defensible baseline.
          International rates come from the State Department's DSSR tables.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
          Per-diem typically settles on a per-show or weekly cadence in cash or paystub. Tour managers track per-diem
          against the city × day rate matrix to avoid drift between projected and actual.
        </p>
      </section>

      <CTASection
        title="Skip The Math."
        subtitle="Per-diem auto-calculates on every show in ATLVS, tied to your roster."
      />
    </div>
  );
}
