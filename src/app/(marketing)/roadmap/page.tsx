import Link from "next/link";
import type { Metadata } from "next";
import { Clock } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { CTASection } from "@/components/marketing/CTASection";
import { buildMetadata, breadcrumbSchema, CANONICAL_CTAS } from "@/lib/seo";
import { getRequestT } from "@/lib/i18n/request";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestT();
  return buildMetadata({
    title: t("marketing.pages.roadmap.metadata.title"),
    description: t("marketing.pages.roadmap.metadata.description"),
    path: "/roadmap",
    keywords: ["ATLVS roadmap", "production software roadmap", "ATLVS Technologies upcoming features"],
    ogImageEyebrow: t("marketing.pages.roadmap.metadata.ogImageEyebrow"),
    ogImageTitle: t("marketing.pages.roadmap.metadata.ogImageTitle"),
  });
}

type RoadmapItem = { titleKey: string; bodyKey: string; tagKey?: string };
type RoadmapQuarter = { labelKey: string; status: "in_flight" | "next" | "exploring"; items: RoadmapItem[] };

const ROADMAP: RoadmapQuarter[] = [
  {
    labelKey: "marketing.pages.roadmap.quarters.q3-2026.label",
    status: "in_flight",
    items: [
      {
        titleKey: "marketing.pages.roadmap.quarters.q3-2026.items.aiUseCases.title",
        bodyKey: "marketing.pages.roadmap.quarters.q3-2026.items.aiUseCases.body",
        tagKey: "marketing.pages.roadmap.tags.shipped",
      },
      {
        titleKey: "marketing.pages.roadmap.quarters.q3-2026.items.featureIndustryFarm.title",
        bodyKey: "marketing.pages.roadmap.quarters.q3-2026.items.featureIndustryFarm.body",
        tagKey: "marketing.pages.roadmap.tags.shipped",
      },
      {
        titleKey: "marketing.pages.roadmap.quarters.q3-2026.items.comparisonExpansion.title",
        bodyKey: "marketing.pages.roadmap.quarters.q3-2026.items.comparisonExpansion.body",
        tagKey: "marketing.pages.roadmap.tags.shipped",
      },
      {
        titleKey: "marketing.pages.roadmap.quarters.q3-2026.items.glossary.title",
        bodyKey: "marketing.pages.roadmap.quarters.q3-2026.items.glossary.body",
        tagKey: "marketing.pages.roadmap.tags.shipped",
      },
      {
        titleKey: "marketing.pages.roadmap.quarters.q3-2026.items.freeToolsHub.title",
        bodyKey: "marketing.pages.roadmap.quarters.q3-2026.items.freeToolsHub.body",
        tagKey: "marketing.pages.roadmap.tags.partial",
      },
      {
        titleKey: "marketing.pages.roadmap.quarters.q3-2026.items.customerStoriesP1.title",
        bodyKey: "marketing.pages.roadmap.quarters.q3-2026.items.customerStoriesP1.body",
        tagKey: "marketing.pages.roadmap.tags.inProgress",
      },
    ],
  },
  {
    labelKey: "marketing.pages.roadmap.quarters.q4-2026.label",
    status: "next",
    items: [
      {
        titleKey: "marketing.pages.roadmap.quarters.q4-2026.items.savingsCalculator.title",
        bodyKey: "marketing.pages.roadmap.quarters.q4-2026.items.savingsCalculator.body",
      },
      {
        titleKey: "marketing.pages.roadmap.quarters.q4-2026.items.aiTiers.title",
        bodyKey: "marketing.pages.roadmap.quarters.q4-2026.items.aiTiers.body",
      },
      {
        titleKey: "marketing.pages.roadmap.quarters.q4-2026.items.localesBeyondHome.title",
        bodyKey: "marketing.pages.roadmap.quarters.q4-2026.items.localesBeyondHome.body",
      },
      {
        titleKey: "marketing.pages.roadmap.quarters.q4-2026.items.customerStoriesP2.title",
        bodyKey: "marketing.pages.roadmap.quarters.q4-2026.items.customerStoriesP2.body",
      },
      {
        titleKey: "marketing.pages.roadmap.quarters.q4-2026.items.templatesExpansion.title",
        bodyKey: "marketing.pages.roadmap.quarters.q4-2026.items.templatesExpansion.body",
      },
      {
        titleKey: "marketing.pages.roadmap.quarters.q4-2026.items.sixMoreTools.title",
        bodyKey: "marketing.pages.roadmap.quarters.q4-2026.items.sixMoreTools.body",
      },
    ],
  },
  {
    labelKey: "marketing.pages.roadmap.quarters.q1-2027.label",
    status: "exploring",
    items: [
      {
        titleKey: "marketing.pages.roadmap.quarters.q1-2027.items.megaMenu.title",
        bodyKey: "marketing.pages.roadmap.quarters.q1-2027.items.megaMenu.body",
      },
      {
        titleKey: "marketing.pages.roadmap.quarters.q1-2027.items.mediaKit.title",
        bodyKey: "marketing.pages.roadmap.quarters.q1-2027.items.mediaKit.body",
      },
      {
        titleKey: "marketing.pages.roadmap.quarters.q1-2027.items.partnerDirectory.title",
        bodyKey: "marketing.pages.roadmap.quarters.q1-2027.items.partnerDirectory.body",
      },
      {
        titleKey: "marketing.pages.roadmap.quarters.q1-2027.items.roadmapUpvoting.title",
        bodyKey: "marketing.pages.roadmap.quarters.q1-2027.items.roadmapUpvoting.body",
      },
    ],
  },
];

const STATUS_LABEL_KEY: Record<RoadmapQuarter["status"], string> = {
  in_flight: "marketing.pages.roadmap.status.inFlight",
  next: "marketing.pages.roadmap.status.next",
  exploring: "marketing.pages.roadmap.status.exploring",
};

const STATUS_COLOR: Record<RoadmapQuarter["status"], string> = {
  in_flight: "var(--p-success)",
  next: "var(--p-accent)",
  exploring: "var(--p-text-2)",
};

export default async function RoadmapPage() {
  const { t } = await getRequestT();
  const crumbs = [
    { label: t("marketing.pages.roadmap.breadcrumbs.home"), href: "/" },
    { label: t("marketing.pages.roadmap.breadcrumbs.roadmap"), href: "/roadmap" },
  ];

  return (
    <div>
      <JsonLd data={[breadcrumbSchema(crumbs)]} />
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="eyebrow eyebrow-brand">{t("marketing.pages.roadmap.hero.eyebrow")}</div>
        <h1 className="hed-3xl mt-4">{t("marketing.pages.roadmap.hero.title")}</h1>
        <p className="mt-5 max-w-3xl text-lg text-[var(--p-text-2)]">{t("marketing.pages.roadmap.hero.subtitle")}</p>
        <p className="mt-3 max-w-3xl text-sm text-[var(--p-text-2)]">
          {t("marketing.pages.roadmap.hero.influencePrefix")}{" "}
          <Link href="/contact" className="text-[var(--p-accent)] underline underline-offset-2">
            {t("marketing.pages.roadmap.hero.influenceLink")}
          </Link>{" "}
          {t("marketing.pages.roadmap.hero.influenceSuffix")}
        </p>
      </section>

      {ROADMAP.map((q) => (
        <section key={q.labelKey} className="mx-auto max-w-6xl px-6 py-8">
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: STATUS_COLOR[q.status] }}
              aria-hidden="true"
            />
            <h2 className="hed-lg">{t(q.labelKey)}</h2>
            <span
              className="rounded-full border border-[var(--p-border)] bg-[var(--p-surface-2)] px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase"
              style={{ color: STATUS_COLOR[q.status] }}
            >
              {t(STATUS_LABEL_KEY[q.status])}
            </span>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {q.items.map((item) => (
              <div key={item.titleKey} className="surface p-5">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">{t(item.titleKey)}</div>
                  {item.tagKey ? (
                    <span className="rounded-full border border-[var(--p-border)] bg-[var(--p-surface-2)] px-2 py-0.5 text-[10px] font-medium text-[var(--p-text-2)]">
                      <Clock size={9} className="me-1 inline-block" aria-hidden="true" />
                      {t(item.tagKey)}
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-sm text-[var(--p-text-2)]">{t(item.bodyKey)}</p>
              </div>
            ))}
          </div>
        </section>
      ))}

      <CTASection
        title={t("marketing.pages.roadmap.cta.title")}
        subtitle={t("marketing.pages.roadmap.cta.subtitle")}
        primaryLabel={CANONICAL_CTAS.primary.label}
        primaryHref={CANONICAL_CTAS.primary.href}
        secondaryLabel={CANONICAL_CTAS.secondary.label}
        secondaryHref={CANONICAL_CTAS.secondary.href}
      />
    </div>
  );
}
