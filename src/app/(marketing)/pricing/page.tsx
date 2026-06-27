// Static page — pre-render at build, no streaming Suspense on client nav.

import type { Metadata } from "next";
import { Fragment } from "react";
import { Check, X, Minus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { JsonLd } from "@/components/marketing/JsonLd";
import { FAQSection } from "@/components/marketing/FAQ";
import { Accordion } from "@/components/ui/Accordion";
import { CTASection } from "@/components/marketing/CTASection";
import { PricingCalculator } from "@/components/marketing/PricingCalculator";
import { buildMetadata, faqSchema } from "@/lib/seo";
import { getRequestT } from "@/lib/i18n/request";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestT();
  return buildMetadata({
    title: t("marketing.pages.pricing.meta.title"),
    description: t("marketing.pages.pricing.meta.description"),
    path: "/pricing",
    keywords: [
      "production software pricing",
      "event management software cost",
      "ATLVS Technologies pricing",
      "ATLVS pricing",
      "GVTEWAY pricing",
      "COMPVSS pricing",
    ],
    ogImageEyebrow: t("marketing.pages.pricing.meta.ogEyebrow"),
    ogImageTitle: t("marketing.pages.pricing.meta.ogTitle"),
  });
}

type TierT = (key: string) => string;

const buildTiers = (t: TierT) => [
  {
    tier: t("marketing.pages.pricing.tiers.free.name"),
    price: t("marketing.pages.pricing.tiers.free.price"),
    per: t("marketing.pages.pricing.tiers.free.per"),
    description: t("marketing.pages.pricing.tiers.free.description"),
    features: [
      t("marketing.pages.pricing.tiers.free.features.basicProjects"),
      t("marketing.pages.pricing.tiers.free.features.guestArtistPortals"),
      t("marketing.pages.pricing.tiers.free.features.upTo3Users"),
      t("marketing.pages.pricing.tiers.free.features.upTo100Credentials"),
      t("marketing.pages.pricing.tiers.free.features.communitySupport"),
    ],
    cta: t("marketing.pages.pricing.tiers.free.cta"),
    href: "/signup",
    highlight: false,
  },
  {
    tier: t("marketing.pages.pricing.tiers.crew.name"),
    price: t("marketing.pages.pricing.tiers.crew.price"),
    per: t("marketing.pages.pricing.tiers.crew.per"),
    description: t("marketing.pages.pricing.tiers.crew.description"),
    features: [
      t("marketing.pages.pricing.tiers.crew.features.everythingInFree"),
      t("marketing.pages.pricing.tiers.crew.features.invoicingExpensesBudgets"),
      t("marketing.pages.pricing.tiers.crew.features.advancing16"),
      t("marketing.pages.pricing.tiers.crew.features.upTo10Users"),
      t("marketing.pages.pricing.tiers.crew.features.upTo2kCredentials"),
      t("marketing.pages.pricing.tiers.crew.features.emailSupport"),
    ],
    cta: t("marketing.pages.pricing.tiers.crew.cta"),
    href: "/signup",
    highlight: false,
  },
  {
    tier: t("marketing.pages.pricing.tiers.production.name"),
    price: t("marketing.pages.pricing.tiers.production.price"),
    per: t("marketing.pages.pricing.tiers.production.per"),
    description: t("marketing.pages.pricing.tiers.production.description"),
    features: [
      t("marketing.pages.pricing.tiers.production.features.everythingInCrew"),
      t("marketing.pages.pricing.tiers.production.features.fullProcurement"),
      t("marketing.pages.pricing.tiers.production.features.aiAssistant"),
      t("marketing.pages.pricing.tiers.production.features.proposalsSigned"),
      t("marketing.pages.pricing.tiers.production.features.kbygGuides"),
      t("marketing.pages.pricing.tiers.production.features.unlimitedUsers"),
      t("marketing.pages.pricing.tiers.production.features.priorityConcierge"),
    ],
    cta: t("marketing.pages.pricing.tiers.production.cta"),
    href: "/signup",
    highlight: true,
  },
  {
    tier: t("marketing.pages.pricing.tiers.festival.name"),
    price: t("marketing.pages.pricing.tiers.festival.price"),
    per: t("marketing.pages.pricing.tiers.festival.per"),
    description: t("marketing.pages.pricing.tiers.festival.description"),
    features: [
      t("marketing.pages.pricing.tiers.festival.features.everythingInProduction"),
      t("marketing.pages.pricing.tiers.festival.features.multiOrgSso"),
      t("marketing.pages.pricing.tiers.festival.features.soc2Dpa"),
      t("marketing.pages.pricing.tiers.festival.features.dedicatedCsm"),
      t("marketing.pages.pricing.tiers.festival.features.sourceAvailable"),
      t("marketing.pages.pricing.tiers.festival.features.customIntegrations"),
    ],
    cta: t("marketing.pages.pricing.tiers.festival.cta"),
    href: "/contact",
    highlight: false,
  },
];

type ComparisonT = (key: string) => string;

const buildComparison = (
  t: ComparisonT,
): Array<{
  category: string;
  rows: Array<{
    feature: string;
    free: boolean | string;
    crew: boolean | string;
    production: boolean | string;
    festival: boolean | string;
  }>;
}> => {
  const unlimited = t("marketing.pages.pricing.comparison.values.unlimited");
  return [
    {
      category: t("marketing.pages.pricing.comparison.categories.core"),
      rows: [
        {
          feature: t("marketing.pages.pricing.comparison.core.tenantWalled"),
          free: true,
          crew: true,
          production: true,
          festival: true,
        },
        {
          feature: t("marketing.pages.pricing.comparison.core.usersPerOrg"),
          free: "3",
          crew: "10",
          production: unlimited,
          festival: unlimited,
        },
        {
          feature: t("marketing.pages.pricing.comparison.core.projectsPerOrg"),
          free: "1",
          crew: "5",
          production: unlimited,
          festival: unlimited,
        },
        {
          feature: t("marketing.pages.pricing.comparison.core.webhooks"),
          free: true,
          crew: true,
          production: true,
          festival: true,
        },
      ],
    },
    {
      category: t("marketing.pages.pricing.comparison.categories.atlvs"),
      rows: [
        {
          feature: t("marketing.pages.pricing.comparison.atlvs.projectsTasks"),
          free: true,
          crew: true,
          production: true,
          festival: true,
        },
        {
          feature: t("marketing.pages.pricing.comparison.atlvs.rfisSubmittals"),
          free: false,
          crew: true,
          production: true,
          festival: true,
        },
        {
          feature: t("marketing.pages.pricing.comparison.atlvs.inspections"),
          free: false,
          crew: true,
          production: true,
          festival: true,
        },
        {
          feature: t("marketing.pages.pricing.comparison.atlvs.finance"),
          free: false,
          crew: true,
          production: true,
          festival: true,
        },
        {
          feature: t("marketing.pages.pricing.comparison.atlvs.procurement"),
          free: false,
          crew: false,
          production: true,
          festival: true,
        },
        {
          feature: t("marketing.pages.pricing.comparison.atlvs.production"),
          free: false,
          crew: true,
          production: true,
          festival: true,
        },
        {
          feature: t("marketing.pages.pricing.comparison.atlvs.peopleCredentials"),
          free: false,
          crew: true,
          production: true,
          festival: true,
        },
        {
          feature: t("marketing.pages.pricing.comparison.atlvs.advancing"),
          free: false,
          crew: true,
          production: true,
          festival: true,
        },
        {
          feature: t("marketing.pages.pricing.comparison.atlvs.kbygGuides"),
          free: false,
          crew: false,
          production: true,
          festival: true,
        },
      ],
    },
    {
      category: t("marketing.pages.pricing.comparison.categories.gvteway"),
      rows: [
        {
          feature: t("marketing.pages.pricing.comparison.gvteway.guestPortal"),
          free: true,
          crew: true,
          production: true,
          festival: true,
        },
        {
          feature: t("marketing.pages.pricing.comparison.gvteway.artistPortal"),
          free: true,
          crew: true,
          production: true,
          festival: true,
        },
        {
          feature: t("marketing.pages.pricing.comparison.gvteway.vendorPortal"),
          free: false,
          crew: true,
          production: true,
          festival: true,
        },
        {
          feature: t("marketing.pages.pricing.comparison.gvteway.clientPortal"),
          free: false,
          crew: false,
          production: true,
          festival: true,
        },
        {
          feature: t("marketing.pages.pricing.comparison.gvteway.sponsorPortal"),
          free: false,
          crew: false,
          production: true,
          festival: true,
        },
        {
          feature: t("marketing.pages.pricing.comparison.gvteway.crewPortal"),
          free: false,
          crew: true,
          production: true,
          festival: true,
        },
        {
          feature: t("marketing.pages.pricing.comparison.gvteway.whiteLabel"),
          free: false,
          crew: false,
          production: true,
          festival: true,
        },
      ],
    },
    {
      category: t("marketing.pages.pricing.comparison.categories.compvss"),
      rows: [
        {
          feature: t("marketing.pages.pricing.comparison.compvss.offlineGateScan"),
          free: true,
          crew: true,
          production: true,
          festival: true,
        },
        {
          feature: t("marketing.pages.pricing.comparison.compvss.geoShiftClock"),
          free: false,
          crew: true,
          production: true,
          festival: true,
        },
        {
          feature: t("marketing.pages.pricing.comparison.compvss.dailyLog"),
          free: false,
          crew: true,
          production: true,
          festival: true,
        },
        {
          feature: t("marketing.pages.pricing.comparison.compvss.fieldIntake"),
          free: false,
          crew: true,
          production: true,
          festival: true,
        },
      ],
    },
    {
      category: t("marketing.pages.pricing.comparison.categories.ai"),
      rows: [
        {
          feature: t("marketing.pages.pricing.comparison.ai.assistantGrounded"),
          free: false,
          crew: false,
          production: true,
          festival: true,
        },
        {
          feature: t("marketing.pages.pricing.comparison.ai.deepReasoning"),
          free: false,
          crew: false,
          production: false,
          festival: true,
        },
        {
          feature: t("marketing.pages.pricing.comparison.ai.draftingTemplates"),
          free: false,
          crew: false,
          production: true,
          festival: true,
        },
        {
          feature: t("marketing.pages.pricing.comparison.ai.monthlyBudget"),
          free: "—",
          crew: "—",
          production: t("marketing.pages.pricing.comparison.values.included"),
          festival: t("marketing.pages.pricing.comparison.values.custom"),
        },
      ],
    },
    {
      category: t("marketing.pages.pricing.comparison.categories.payments"),
      rows: [
        {
          feature: t("marketing.pages.pricing.comparison.payments.cardAch"),
          free: false,
          crew: true,
          production: true,
          festival: true,
        },
        {
          feature: t("marketing.pages.pricing.comparison.payments.stripeConnect"),
          free: false,
          crew: false,
          production: true,
          festival: true,
        },
        {
          feature: t("marketing.pages.pricing.comparison.payments.internationalWire"),
          free: false,
          crew: false,
          production: true,
          festival: true,
        },
      ],
    },
    {
      category: t("marketing.pages.pricing.comparison.categories.security"),
      rows: [
        {
          feature: t("marketing.pages.pricing.comparison.security.immutableAudit"),
          free: true,
          crew: true,
          production: true,
          festival: true,
        },
        {
          feature: t("marketing.pages.pricing.comparison.security.selfExpiringShares"),
          free: true,
          crew: true,
          production: true,
          festival: true,
        },
        {
          feature: t("marketing.pages.pricing.comparison.security.rateLimited"),
          free: true,
          crew: true,
          production: true,
          festival: true,
        },
        {
          feature: t("marketing.pages.pricing.comparison.security.strictHeaders"),
          free: true,
          crew: true,
          production: true,
          festival: true,
        },
        {
          feature: t("marketing.pages.pricing.comparison.security.sso"),
          free: false,
          crew: false,
          production: false,
          festival: true,
        },
        {
          feature: t("marketing.pages.pricing.comparison.security.soc2"),
          free: false,
          crew: false,
          production: false,
          festival: true,
        },
        {
          feature: t("marketing.pages.pricing.comparison.security.customDpa"),
          free: false,
          crew: false,
          production: false,
          festival: true,
        },
        {
          feature: t("marketing.pages.pricing.comparison.security.dataResidency"),
          free: false,
          crew: false,
          production: false,
          festival: true,
        },
      ],
    },
    {
      category: t("marketing.pages.pricing.comparison.categories.support"),
      rows: [
        {
          feature: t("marketing.pages.pricing.comparison.support.community"),
          free: true,
          crew: true,
          production: true,
          festival: true,
        },
        {
          feature: t("marketing.pages.pricing.comparison.support.emailSupport"),
          free: false,
          crew: true,
          production: true,
          festival: true,
        },
        {
          feature: t("marketing.pages.pricing.comparison.support.priorityOnboarding"),
          free: false,
          crew: false,
          production: true,
          festival: true,
        },
        {
          feature: t("marketing.pages.pricing.comparison.support.dedicatedCsm"),
          free: false,
          crew: false,
          production: false,
          festival: true,
        },
        {
          feature: t("marketing.pages.pricing.comparison.support.uptimeSla"),
          free: false,
          crew: false,
          production: false,
          festival: true,
        },
      ],
    },
  ];
};

type FaqT = (key: string) => string;

const buildFaqs = (t: FaqT) => [
  {
    q: t("marketing.pages.pricing.faqs.perSeat.q"),
    a: t("marketing.pages.pricing.faqs.perSeat.a"),
  },
  {
    q: t("marketing.pages.pricing.faqs.freeReallyFree.q"),
    a: t("marketing.pages.pricing.faqs.freeReallyFree.a"),
  },
  {
    q: t("marketing.pages.pricing.faqs.trialWorks.q"),
    a: t("marketing.pages.pricing.faqs.trialWorks.a"),
  },
  {
    q: t("marketing.pages.pricing.faqs.changeTiers.q"),
    a: t("marketing.pages.pricing.faqs.changeTiers.a"),
  },
  {
    q: t("marketing.pages.pricing.faqs.nonprofits.q"),
    a: t("marketing.pages.pricing.faqs.nonprofits.a"),
  },
  {
    q: t("marketing.pages.pricing.faqs.perScanFee.q"),
    a: t("marketing.pages.pricing.faqs.perScanFee.a"),
  },
  {
    q: t("marketing.pages.pricing.faqs.festivalVsProduction.q"),
    a: t("marketing.pages.pricing.faqs.festivalVsProduction.a"),
  },
  {
    q: t("marketing.pages.pricing.faqs.selfHost.q"),
    a: t("marketing.pages.pricing.faqs.selfHost.a"),
  },
  {
    q: t("marketing.pages.pricing.faqs.dataAfterCancel.q"),
    a: t("marketing.pages.pricing.faqs.dataAfterCancel.a"),
  },
];

function Cell({ value }: { value: boolean | string }) {
  if (value === true) return <Check size={16} className="text-[var(--p-accent)]" />;
  if (value === false) return <X size={14} className="text-[var(--p-text-2)] opacity-50" />;
  if (value === "—") return <Minus size={14} className="text-[var(--p-text-2)]" />;
  return <span className="text-xs text-[var(--p-text-2)]">{value}</span>;
}

export default async function PricingPage() {
  const { t } = await getRequestT();
  const tiers = buildTiers(t);
  const comparison = buildComparison(t);
  const faqs = buildFaqs(t);
  return (
    <div>
      <JsonLd data={[faqSchema(faqs)]} />
      <section className="mx-auto max-w-6xl px-6 pt-12 pb-10 text-center">
        <div className="eyebrow eyebrow-accent">{t("marketing.pages.pricing.hero.eyebrow")}</div>
        <h1 className="kinetic-display mx-auto mt-3 max-w-3xl text-5xl sm:text-6xl">
          {t("marketing.pages.pricing.hero.title")}
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-[var(--p-text-2)]">
          {t("marketing.pages.pricing.hero.subtitle")}
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-12">
        <div className="grid gap-4 md:grid-cols-4">
          {tiers.map((tier) => (
            <div
              key={tier.tier}
              className={`surface flex flex-col p-6 ${tier.highlight ? "ring-2 ring-[var(--p-accent)]" : ""}`}
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">{tier.tier}</div>
                {tier.highlight && <Badge variant="brand">{t("marketing.pages.pricing.tiers.mostCommonBadge")}</Badge>}
              </div>
              <div className="mt-4">
                <span className="text-3xl font-semibold tracking-tight">{tier.price}</span>
                {tier.per && <span className="text-sm text-[var(--p-text-2)]"> / {tier.per}</span>}
              </div>
              <p className="mt-2 text-xs text-[var(--p-text-2)]">{tier.description}</p>
              <ul className="mt-5 flex-1 space-y-2 text-sm text-[var(--p-text-2)]">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check size={14} className="mt-0.5 text-[var(--p-accent)]" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <Button href={tier.href} variant={tier.highlight ? "primary" : "secondary"} className="w-full">
                  {tier.cta}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="hed-xl">
          {t("marketing.pages.pricing.comparison.title")}
        </h2>
        <p className="mt-3 max-w-xl text-sm text-[var(--p-text-2)]">
          {t("marketing.pages.pricing.comparison.intro")}{" "}
          <a className="text-[var(--p-accent-text)] underline underline-offset-2" href="/contact">
            {t("marketing.pages.pricing.comparison.talkToStudio")}
          </a>
          .
        </p>
        <div className="mt-8 overflow-x-auto">
          <table className="ps-table min-w-[720px]">
            <thead>
              <tr>
                <th>{t("marketing.pages.pricing.comparison.headers.module")}</th>
                <th style={{ textAlign: "center" }}>
                  {t("marketing.pages.pricing.comparison.headers.free")}
                </th>
                <th style={{ textAlign: "center" }}>
                  {t("marketing.pages.pricing.comparison.headers.crew")}
                </th>
                <th style={{ textAlign: "center" }}>
                  {t("marketing.pages.pricing.comparison.headers.production")}
                </th>
                <th style={{ textAlign: "center" }}>
                  {t("marketing.pages.pricing.comparison.headers.festival")}
                </th>
              </tr>
            </thead>
            <tbody>
              {comparison.map((cat) => (
                <Fragment key={cat.category}>
                  <tr className="bg-[var(--p-surface-2)]">
                    <td colSpan={5} className="eyebrow">
                      {cat.category}
                    </td>
                  </tr>
                  {cat.rows.map((r) => (
                    <tr key={cat.category + r.feature}>
                      <td>{r.feature}</td>
                      <td style={{ textAlign: "center" }}>
                        <Cell value={r.free} />
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <Cell value={r.crew} />
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <Cell value={r.production} />
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <Cell value={r.festival} />
                      </td>
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <PricingCalculator />
      </section>

      <FAQSection title={t("marketing.pages.pricing.faqs.title")} faqs={faqs} />

      <section className="mx-auto max-w-3xl px-6 py-12">
        <h2 className="mb-4 text-sm font-semibold tracking-wide text-[var(--p-text-2)] uppercase">
          {t("marketing.pages.pricing.billingFaq.title", undefined, "Billing & plans")}
        </h2>
        <Accordion
          items={[
            {
              title: t(
                "marketing.pages.pricing.billingFaq.q1.title",
                undefined,
                "Can I change plans at any time?",
              ),
              content: t(
                "marketing.pages.pricing.billingFaq.q1.content",
                undefined,
                "Yes. Upgrade or downgrade whenever you like — changes are prorated to the day, and your data carries across every tier.",
              ),
            },
            {
              title: t(
                "marketing.pages.pricing.billingFaq.q2.title",
                undefined,
                "Do you offer annual billing?",
              ),
              content: t(
                "marketing.pages.pricing.billingFaq.q2.content",
                undefined,
                "Annual billing is available on every paid tier and discounts the monthly rate. Switch the toggle above to see annual pricing.",
              ),
            },
            {
              title: t(
                "marketing.pages.pricing.billingFaq.q3.title",
                undefined,
                "What happens when an event wraps?",
              ),
              content: t(
                "marketing.pages.pricing.billingFaq.q3.content",
                undefined,
                "Nothing disappears. Completed projects move to your archive and stay fully readable; you only pay for active seats.",
              ),
            },
          ]}
          defaultOpen={[0]}
        />
      </section>

      <CTASection
        title={t("marketing.pages.pricing.cta.title")}
        subtitle={t("marketing.pages.pricing.cta.subtitle")}
        primaryLabel={t("marketing.pages.pricing.cta.primaryLabel")}
        primaryHref="/signup"
        secondaryLabel={t("marketing.pages.pricing.cta.secondaryLabel")}
        secondaryHref="/contact"
      />
    </div>
  );
}
