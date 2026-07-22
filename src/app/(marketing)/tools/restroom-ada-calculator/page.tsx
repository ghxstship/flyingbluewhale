import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { CTASection } from "@/components/marketing/CTASection";
import { FAQSection } from "@/components/marketing/FAQ";
import { buildMetadata, breadcrumbSchema, softwareApplicationSchema, SITE } from "@/lib/seo";
import { RestroomAdaCalculator } from "@/components/marketing/tools/RestroomAdaCalculator";
import { getRequestT } from "@/lib/i18n/request";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestT();
  return buildMetadata({
    title: t("marketing.tools.restroom.meta.title", undefined, "Restroom & ADA Calculator: Portable Units for Events"),
    description: t(
      "marketing.tools.restroom.meta.description",
      undefined,
      "Estimate portable restroom units, ADA-accessible counts (2010 ADA 5 percent rule), and handwash stations from attendance, duration, and alcohol service.",
    ),
    path: "/tools/restroom-ada-calculator",
    keywords: [
      "porta potty calculator",
      "portable restroom calculator",
      "event restroom calculator",
      "ADA portable toilet requirements",
      "handwash station calculator",
      "festival restroom count",
    ],
    ogImageEyebrow: t("marketing.tools.eyebrow", undefined, "Free Tool"),
    ogImageTitle: t("marketing.tools.restroom.title", undefined, "Restroom & ADA Calculator."),
  });
}

export default async function RestroomAdaCalculatorPage() {
  const { t } = await getRequestT();
  const crumbs = [
    { label: t("common.home", undefined, "Home"), href: "/" },
    { label: t("marketing.tools.crumbsToolsLabel", undefined, "Tools"), href: "/tools" },
    {
      label: t("marketing.tools.restroom.crumbsLabel", undefined, "Restroom & ADA Calculator"),
      href: "/tools/restroom-ada-calculator",
    },
  ];

  const FAQS = [
    {
      q: t("marketing.tools.restroom.faq.how.q", undefined, "How is the restroom count calculated?"),
      a: t(
        "marketing.tools.restroom.faq.how.a",
        undefined,
        "The base is the standard industry sizing table: about 1 portable unit per 100 attendees for a 4-hour event, scaled up to 2x for events running 10 or more hours, plus 20 percent when alcohol is served and 10 percent when the crowd skews majority women. The ADA-accessible count is 5 percent of total units with a minimum of 1 per cluster, per the 2010 ADA Standards section 213. Handwash stations run 1 per 10 units.",
      ),
    },
    {
      q: t("marketing.tools.restroom.faq.compliant.q", undefined, "Is this code-compliant sanitation advice?"),
      a: t(
        "marketing.tools.restroom.faq.compliant.a",
        undefined,
        "No. It is a planning aid, not engineering or AHJ advice. The permit count is set by your local health department and the authority having jurisdiction, and permanent-venue fixture counts follow the adopted plumbing code. Use this to size the rental order conversation, then confirm with the permitting authority.",
      ),
    },
    {
      q: t("marketing.tools.restroom.faq.source.q", undefined, "Where do the numbers come from?"),
      a: t(
        "marketing.tools.restroom.faq.source.a",
        undefined,
        "The accessible count is derived from the 2010 ADA Standards section 213 (5 percent of units, minimum 1 per cluster). The fixture-count methodology traces to IPC 403.1, the plumbing-code table for permanent occupancies. The portable-unit base table, the alcohol uplift, and the handwash ratio are industry rules of thumb and are labeled MODELED, matching how the XPMS compliance engine separates derived rules from modeled ones.",
      ),
    },
  ];

  return (
    <div>
      <JsonLd
        data={[
          breadcrumbSchema(crumbs),
          softwareApplicationSchema({
            name: t("marketing.tools.restroom.schemaName", undefined, "ATLVS Restroom & ADA Calculator"),
            description: t(
              "marketing.tools.restroom.schemaDescription",
              undefined,
              "Estimate portable restroom units, ADA-accessible counts, and handwash stations for events.",
            ),
            url: `${SITE.baseUrl}/tools/restroom-ada-calculator`,
            price: "0",
          }),
        ]}
      />
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <section className="mx-auto max-w-3xl px-6 pt-8 pb-12">
        <div className="eyebrow eyebrow-brand">{t("marketing.tools.eyebrow", undefined, "Free Tool")}</div>
        <h1 className="hed-xl mt-4">{t("marketing.tools.restroom.title", undefined, "Restroom & ADA Calculator.")}</h1>
        <p className="mt-5 text-lg text-[var(--p-text-2)]">
          {t(
            "marketing.tools.restroom.lead",
            undefined,
            "Estimate portable units, ADA-accessible counts, and handwash stations from attendance, duration, and alcohol service. The accessible math follows the 2010 ADA Standards; the sizing table is honest about being a rule of thumb.",
          )}
        </p>
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-8">
        <RestroomAdaCalculator />
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-12">
        <p className="text-sm text-[var(--p-text-2)]">
          {t(
            "marketing.tools.fromXpms",
            undefined,
            "From the XPMS compliance engine: the same rulebase that runs XMCE checks in LEG3ND.",
          )}{" "}
          <Link href="/glossary/xpms" className="font-medium text-[var(--p-accent)] hover:underline">
            {t("marketing.tools.xpmsGlossaryLink", undefined, "What is XPMS?")}
          </Link>{" "}
          <Link href="/legend" className="font-medium text-[var(--p-accent)] hover:underline">
            {t("marketing.tools.legendLink", undefined, "Explore LEG3ND")}
          </Link>
        </p>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-12">
        <h2 className="hed-lg">
          {t("marketing.tools.restroom.how.heading", undefined, "How sanitation counts work.")}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[var(--p-text-2)]">
          {t(
            "marketing.tools.restroom.how.body1",
            undefined,
            "Permanent venues size restrooms from the plumbing code: IPC 403.1 sets minimum fixture counts per occupant by occupancy type. Outdoor and temporary events do not get a single national table, so the industry converged on a sizing practice keyed to attendance, event length, and alcohol service, and your local health department turns that into a permit condition.",
          )}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-[var(--p-text-2)]">
          {t(
            "marketing.tools.restroom.how.body2",
            undefined,
            "Accessibility is the part with hard numbers: the 2010 ADA Standards section 213 requires at least 5 percent of units to be accessible, with a minimum of 1, and the practical reading for events is at least 1 accessible unit in every cluster so nobody crosses the site to find one. Place them on firm, level routes and keep the doors clear of cable ramps.",
          )}
        </p>
      </section>

      <FAQSection faqs={FAQS} />

      <CTASection
        title={t("marketing.tools.restroom.cta.title", undefined, "Site Ops Live In COMPVSS.")}
        subtitle={t(
          "marketing.tools.restroom.cta.subtitle",
          undefined,
          "Service rounds, cluster checks, and vendor punch lists in the field app your ops crew carries.",
        )}
        primaryLabel={t("marketing.tools.restroom.cta.primary", undefined, "See COMPVSS")}
        primaryHref="/compvss"
      />
    </div>
  );
}
