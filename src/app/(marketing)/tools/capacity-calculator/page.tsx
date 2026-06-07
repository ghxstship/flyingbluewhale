import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { CTASection } from "@/components/marketing/CTASection";
import { buildMetadata, breadcrumbSchema, softwareApplicationSchema, SITE } from "@/lib/seo";
import { CapacityCalculator } from "@/components/marketing/tools/CapacityCalculator";
import { getRequestT } from "@/lib/i18n/request";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestT();
  return buildMetadata({
    title: t("marketing.tools.capacity.meta.title", undefined, "Venue Capacity Calculator — Maximum Occupancy by Use"),
    description: t(
      "marketing.tools.capacity.meta.description",
      undefined,
      "Estimate maximum legal occupancy from square footage and use type. IBC-aligned defaults for assembly, concentrated, standing, and dining.",
    ),
    path: "/tools/capacity-calculator",
    keywords: [
      "venue capacity calculator",
      "maximum occupancy calculator",
      "event space capacity",
      "IBC occupant load",
      "assembly occupancy",
      "fire code capacity",
    ],
    ogImageEyebrow: t("marketing.tools.eyebrow", undefined, "Free Tool"),
    ogImageTitle: t("marketing.tools.capacity.title", undefined, "Venue Capacity Calculator."),
  });
}

export default async function CapacityCalculatorPage() {
  const { t } = await getRequestT();
  const crumbs = [
    { label: t("common.home", undefined, "Home"), href: "/" },
    { label: t("marketing.tools.crumbsToolsLabel", undefined, "Tools"), href: "/tools" },
    {
      label: t("marketing.tools.capacity.crumbsLabel", undefined, "Capacity Calculator"),
      href: "/tools/capacity-calculator",
    },
  ];

  return (
    <div>
      <JsonLd
        data={[
          breadcrumbSchema(crumbs),
          softwareApplicationSchema({
            name: t("marketing.tools.capacity.schemaName", undefined, "ATLVS Capacity Calculator"),
            description: t(
              "marketing.tools.capacity.schemaDescription",
              undefined,
              "Estimate maximum venue occupancy from square footage and use type.",
            ),
            url: `${SITE.baseUrl}/tools/capacity-calculator`,
            price: "0",
          }),
        ]}
      />
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <section className="mx-auto max-w-3xl px-6 pt-8 pb-12">
        <div className="eyebrow eyebrow-brand">{t("marketing.tools.eyebrow", undefined, "Free Tool")}</div>
        <h1 className="hed-xl mt-4">{t("marketing.tools.capacity.title", undefined, "Venue Capacity Calculator.")}</h1>
        <p className="mt-5 text-lg text-[var(--p-text-2)]">
          {t(
            "marketing.tools.capacity.lead",
            undefined,
            "Estimate maximum legal occupancy from square footage and use type. IBC-aligned defaults for assembly, concentrated, standing, and dining configurations. Confirm with the AHJ before publishing.",
          )}
        </p>
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-12">
        <CapacityCalculator />
      </section>

      <section className="mx-auto max-w-3xl px-6 py-12">
        <h2 className="hed-lg">{t("marketing.tools.capacity.how.heading", undefined, "How Occupant Load Works.")}</h2>
        <p className="mt-3 text-sm leading-relaxed text-[var(--p-text-2)]">
          {t(
            "marketing.tools.capacity.how.body1",
            undefined,
            "Occupant load is the maximum number of people permitted in a space, set by the International Building Code (IBC) and adopted (with modifications) by most US jurisdictions. The IBC sets per-occupant area factors by use type — 7 sq ft per person standing, 15 sq ft for unconcentrated assembly with tables, 5 sq ft for waiting areas. Multiply usable floor area by the appropriate factor (and divide) to land on a load.",
          )}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-[var(--p-text-2)]">
          {t(
            "marketing.tools.capacity.how.body2",
            undefined,
            "Real-world capacity is the lower of the IBC load and what the venue's egress capacity supports — exit width, fixed seating layout, sprinkler coverage, and AHJ judgement all play in. Use this calculator as a starting estimate; confirm with the local Authority Having Jurisdiction before publishing capacity.",
          )}
        </p>
      </section>

      <CTASection
        title={t("marketing.tools.capacity.cta.title", undefined, "Capacity Lives In ATLVS.")}
        subtitle={t(
          "marketing.tools.capacity.cta.subtitle",
          undefined,
          "Per-venue capacity, ticket allocations, and gate-scan limits — one record.",
        )}
      />
    </div>
  );
}
