import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { CTASection } from "@/components/marketing/CTASection";
import { FAQSection } from "@/components/marketing/FAQ";
import { buildMetadata, breadcrumbSchema, softwareApplicationSchema, SITE } from "@/lib/seo";
import { GeneratorSizeCalculator } from "@/components/marketing/tools/GeneratorSizeCalculator";
import { getRequestT } from "@/lib/i18n/request";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestT();
  return buildMetadata({
    title: t("marketing.tools.generator.meta.title", undefined, "Generator Size Calculator: kVA for Event Power"),
    description: t(
      "marketing.tools.generator.meta.description",
      undefined,
      "Size a generator from connected load, power factor, diversity, and headroom. kVA required, next standard rental size up, and a fuel estimate.",
    ),
    path: "/tools/generator-size-calculator",
    keywords: [
      "generator size calculator",
      "event generator sizing",
      "kva calculator",
      "generator kva required",
      "event power calculator",
      "generator fuel consumption estimate",
    ],
    ogImageEyebrow: t("marketing.tools.eyebrow", undefined, "Free Tool"),
    ogImageTitle: t("marketing.tools.generator.title", undefined, "Generator Size Calculator."),
  });
}

export default async function GeneratorSizeCalculatorPage() {
  const { t } = await getRequestT();
  const crumbs = [
    { label: t("common.home", undefined, "Home"), href: "/" },
    { label: t("marketing.tools.crumbsToolsLabel", undefined, "Tools"), href: "/tools" },
    {
      label: t("marketing.tools.generator.crumbsLabel", undefined, "Generator Size Calculator"),
      href: "/tools/generator-size-calculator",
    },
  ];

  const FAQS = [
    {
      q: t("marketing.tools.generator.faq.how.q", undefined, "How is the generator size calculated?"),
      a: t(
        "marketing.tools.generator.faq.how.a",
        undefined,
        "Connected load (entered in kW, or computed from amps and voltage) is multiplied by the demand or diversity factor to get running demand, divided by the power factor to convert to kVA, then padded by your headroom percentage. The suggested unit is the next size up from a list of standard rental genset ratings. The fuel line is a modeled approximation near 0.07 gallons of diesel per kWh at working loads.",
      ),
    },
    {
      q: t("marketing.tools.generator.faq.compliant.q", undefined, "Is this code-compliant electrical advice?"),
      a: t(
        "marketing.tools.generator.faq.compliant.a",
        undefined,
        "No. It is a planning aid, not engineering or AHJ advice, and we are not your engineer of record. Temporary power design, feeder sizing, grounding, and permitting must be done by a licensed electrician or the engineer of record and accepted by the authority having jurisdiction.",
      ),
    },
    {
      q: t("marketing.tools.generator.faq.source.q", undefined, "Where do the defaults come from?"),
      a: t(
        "marketing.tools.generator.faq.source.a",
        undefined,
        "The 0.8 power factor is the standard genset rating convention, and the diversity-factor concept mirrors standard electrical load-calculation practice. The 20 percent headroom default and the fuel curve are labeled MODELED because they are rules of thumb, not code values. The basis for each figure is stated next to the input it drives, the same way the XPMS compliance engine labels its rule sources.",
      ),
    },
  ];

  return (
    <div>
      <JsonLd
        data={[
          breadcrumbSchema(crumbs),
          softwareApplicationSchema({
            name: t("marketing.tools.generator.schemaName", undefined, "ATLVS Generator Size Calculator"),
            description: t(
              "marketing.tools.generator.schemaDescription",
              undefined,
              "Size an event generator from connected load, power factor, diversity, and headroom.",
            ),
            url: `${SITE.baseUrl}/tools/generator-size-calculator`,
            price: "0",
          }),
        ]}
      />
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <section className="mx-auto max-w-3xl px-6 pt-8 pb-12">
        <div className="eyebrow eyebrow-brand">{t("marketing.tools.eyebrow", undefined, "Free Tool")}</div>
        <h1 className="hed-xl mt-4">
          {t("marketing.tools.generator.title", undefined, "Generator Size Calculator.")}
        </h1>
        <p className="mt-5 text-lg text-[var(--p-text-2)]">
          {t(
            "marketing.tools.generator.lead",
            undefined,
            "Turn a load schedule into a kVA number, the next standard rental size up, and a fuel estimate. A planning aid for the power conversation, not a substitute for the engineer of record.",
          )}
        </p>
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-8">
        <GeneratorSizeCalculator />
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
          {t("marketing.tools.generator.how.heading", undefined, "How generator sizing works.")}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[var(--p-text-2)]">
          {t(
            "marketing.tools.generator.how.body1",
            undefined,
            "Generators are rated in kVA at a stated power factor, usually 0.8. Your load schedule is in kW, so the conversion runs through two factors: diversity (not everything draws at once, so running demand is a fraction of connected load) and power factor (real power over apparent power). Add headroom for motor inrush and the gear that shows up on the truck unannounced, and you have the kVA the rental order needs.",
          )}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-[var(--p-text-2)]">
          {t(
            "marketing.tools.generator.how.body2",
            undefined,
            "Oversizing has a cost beyond the rental line: a diesel set loafing under about 30 percent load wet stacks, fouling injectors and stacks over a multi-day run. Power vendors solve it with paralleled smaller units or load banks. Bring the demand number, the show schedule, and the redundancy requirement to the vendor and the engineer of record; they design from there.",
          )}
        </p>
      </section>

      <FAQSection faqs={FAQS} />

      <CTASection
        title={t("marketing.tools.generator.cta.title", undefined, "Power Runs Through COMPVSS.")}
        subtitle={t(
          "marketing.tools.generator.cta.subtitle",
          undefined,
          "Fuel checks, generator rounds, and site-ops tasks live in the field app your crew already carries.",
        )}
        primaryLabel={t("marketing.tools.generator.cta.primary", undefined, "See COMPVSS")}
        primaryHref="/compvss"
      />
    </div>
  );
}
