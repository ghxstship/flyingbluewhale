import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { CTASection } from "@/components/marketing/CTASection";
import { buildMetadata, breadcrumbSchema, softwareApplicationSchema, SITE } from "@/lib/seo";
import { CapacityCalculator } from "@/components/marketing/tools/CapacityCalculator";

export const metadata: Metadata = buildMetadata({
  title: "Venue Capacity Calculator — Maximum Occupancy by Use",
  description:
    "Estimate maximum legal occupancy from square footage and use type. IBC-aligned defaults for assembly, concentrated, standing, and dining.",
  path: "/tools/capacity-calculator",
  keywords: [
    "venue capacity calculator",
    "maximum occupancy calculator",
    "event space capacity",
    "IBC occupant load",
    "assembly occupancy",
    "fire code capacity",
  ],
  ogImageEyebrow: "Free Tool",
  ogImageTitle: "Venue Capacity Calculator.",
});

export default function CapacityCalculatorPage() {
  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Tools", href: "/tools" },
    { label: "Capacity Calculator", href: "/tools/capacity-calculator" },
  ];

  return (
    <div>
      <JsonLd
        data={[
          breadcrumbSchema(crumbs),
          softwareApplicationSchema({
            name: "ATLVS Capacity Calculator",
            description: "Estimate maximum venue occupancy from square footage and use type.",
            url: `${SITE.baseUrl}/tools/capacity-calculator`,
            price: "0",
          }),
        ]}
      />
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <section className="mx-auto max-w-3xl px-6 pt-8 pb-12">
        <div className="eyebrow eyebrow-brand">Free Tool</div>
        <h1 className="hed-xl mt-4">Venue Capacity Calculator.</h1>
        <p className="mt-5 text-lg text-[var(--text-secondary)]">
          Estimate maximum legal occupancy from square footage and use type. IBC-aligned defaults for assembly,
          concentrated, standing, and dining configurations. Confirm with the AHJ before publishing.
        </p>
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-12">
        <CapacityCalculator />
      </section>

      <section className="mx-auto max-w-3xl px-6 py-12">
        <h2 className="hed-lg">How Occupant Load Works.</h2>
        <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
          Occupant load is the maximum number of people permitted in a space, set by the International Building Code
          (IBC) and adopted (with modifications) by most US jurisdictions. The IBC sets per-occupant area factors by use
          type — 7 sq ft per person standing, 15 sq ft for unconcentrated assembly with tables, 5 sq ft for waiting
          areas. Multiply usable floor area by the appropriate factor (and divide) to land on a load.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
          Real-world capacity is the lower of the IBC load and what the venue's egress capacity supports — exit width,
          fixed seating layout, sprinkler coverage, and AHJ judgement all play in. Use this calculator as a starting
          estimate; confirm with the local Authority Having Jurisdiction before publishing capacity.
        </p>
      </section>

      <CTASection
        title="Capacity Lives In ATLVS."
        subtitle="Per-venue capacity, ticket allocations, and gate-scan limits — one record."
      />
    </div>
  );
}
