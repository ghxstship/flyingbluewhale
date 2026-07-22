import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { CTASection } from "@/components/marketing/CTASection";
import { FAQSection } from "@/components/marketing/FAQ";
import { buildMetadata, breadcrumbSchema, softwareApplicationSchema, SITE } from "@/lib/seo";
import { CrewSizeCalculator } from "@/components/marketing/tools/CrewSizeCalculator";
import { getRequestT } from "@/lib/i18n/request";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestT();
  return buildMetadata({
    title: t("marketing.tools.crewSize.meta.title", undefined, "Crew Size Calculator: Security, Stewards, Medical"),
    description: t(
      "marketing.tools.crewSize.meta.description",
      undefined,
      "Estimate security headcount, stewards, and medical staffing tiers from attendance and event type. Honest rule-of-thumb ratios, labeled as such.",
    ),
    path: "/tools/crew-size-calculator",
    keywords: [
      "event security calculator",
      "security staffing ratio",
      "event steward calculator",
      "event medical staffing",
      "crowd management staffing",
      "festival security headcount",
    ],
    ogImageEyebrow: t("marketing.tools.eyebrow", undefined, "Free Tool"),
    ogImageTitle: t("marketing.tools.crewSize.title", undefined, "Crew Size Calculator."),
  });
}

export default async function CrewSizeCalculatorPage() {
  const { t } = await getRequestT();
  const crumbs = [
    { label: t("common.home", undefined, "Home"), href: "/" },
    { label: t("marketing.tools.crumbsToolsLabel", undefined, "Tools"), href: "/tools" },
    {
      label: t("marketing.tools.crewSize.crumbsLabel", undefined, "Crew Size Calculator"),
      href: "/tools/crew-size-calculator",
    },
  ];

  const FAQS = [
    {
      q: t("marketing.tools.crewSize.faq.how.q", undefined, "How is the crew size calculated?"),
      a: t(
        "marketing.tools.crewSize.faq.how.a",
        undefined,
        "Security starts from a per-attendee ratio that slides by event risk profile (1 per 100 attendees for a concert, 1 per 75 for a festival, 1 per 250 for a corporate event, 1 per 125 for sports), then adds 2 per door lane and 1 roamer per 3 bar or concession points. Stewards use a lighter per-attendee ratio, and medical staffing steps through tiers (first-aid point, first-aid post, medical post, field medical unit) at roughly 2 first aiders per 1,000 attendees. Every ratio is shown inline next to its result.",
      ),
    },
    {
      q: t("marketing.tools.crewSize.faq.compliant.q", undefined, "Is this code-compliant staffing advice?"),
      a: t(
        "marketing.tools.crewSize.faq.compliant.a",
        undefined,
        "No. It is a planning aid, not engineering or AHJ advice. Legally required staffing comes from your event risk assessment, the venue license, local ordinance, and the authority having jurisdiction. Use this to shape the first budget and then verify with your security and medical providers.",
      ),
    },
    {
      q: t("marketing.tools.crewSize.faq.source.q", undefined, "Where do the ratios come from?"),
      a: t(
        "marketing.tools.crewSize.faq.source.a",
        undefined,
        "They are industry rules of thumb, the same 1:100 security baseline event operators use as a first pass, adjusted by risk profile. Every figure is labeled MODELED because none of them is a verbatim requirement from a statute or code. The parameterization mirrors how the XPMS compliance engine models staffing rules.",
      ),
    },
  ];

  return (
    <div>
      <JsonLd
        data={[
          breadcrumbSchema(crumbs),
          softwareApplicationSchema({
            name: t("marketing.tools.crewSize.schemaName", undefined, "ATLVS Crew Size Calculator"),
            description: t(
              "marketing.tools.crewSize.schemaDescription",
              undefined,
              "Estimate security, steward, and medical staffing from attendance and event type.",
            ),
            url: `${SITE.baseUrl}/tools/crew-size-calculator`,
            price: "0",
          }),
        ]}
      />
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <section className="mx-auto max-w-3xl px-6 pt-8 pb-12">
        <div className="eyebrow eyebrow-brand">{t("marketing.tools.eyebrow", undefined, "Free Tool")}</div>
        <h1 className="hed-xl mt-4">{t("marketing.tools.crewSize.title", undefined, "Crew Size Calculator.")}</h1>
        <p className="mt-5 text-lg text-[var(--p-text-2)]">
          {t(
            "marketing.tools.crewSize.lead",
            undefined,
            "Estimate security headcount, stewards, and medical staffing tiers from attendance and event type. Every ratio is a labeled rule of thumb, so you know exactly what you are looking at.",
          )}
        </p>
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-8">
        <CrewSizeCalculator />
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
        <h2 className="hed-lg">{t("marketing.tools.crewSize.how.heading", undefined, "How staffing ratios work.")}</h2>
        <p className="mt-3 text-sm leading-relaxed text-[var(--p-text-2)]">
          {t(
            "marketing.tools.crewSize.how.body1",
            undefined,
            "There is no single statutory security ratio for events in the US. Operators start from a baseline near 1 security per 100 attendees and slide it by risk profile: alcohol service, standing crowds, multi-stage sites, and rival-crowd dynamics push it tighter; seated, credentialed corporate rooms relax it. Doors and bars get their own coverage on top, because those are the pinch points where incidents start.",
          )}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-[var(--p-text-2)]">
          {t(
            "marketing.tools.crewSize.how.body2",
            undefined,
            "Medical staffing steps through tiers rather than a straight line: a first-aid point for small rooms, a staffed post with an ambulance on standby in the low thousands, and a physician-led field medical unit at festival scale. Your medical provider and the AHJ set the real numbers from the event medical plan; this tool tells you which conversation you are about to have.",
          )}
        </p>
      </section>

      <FAQSection faqs={FAQS} />

      <CTASection
        title={t("marketing.tools.crewSize.cta.title", undefined, "Staff It In COMPVSS.")}
        subtitle={t(
          "marketing.tools.crewSize.cta.subtitle",
          undefined,
          "Rosters, shifts, and day-of check-ins for the crew this calculator just sized.",
        )}
        primaryLabel={t("marketing.tools.crewSize.cta.primary", undefined, "See COMPVSS")}
        primaryHref="/compvss"
      />
    </div>
  );
}
