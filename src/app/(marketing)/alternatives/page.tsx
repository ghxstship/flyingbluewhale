import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { CTASection } from "@/components/marketing/CTASection";
import { buildMetadata, breadcrumbSchema } from "@/lib/seo";
import { JsonLd } from "@/components/marketing/JsonLd";
import { COMPARE_LIST } from "@/lib/compare";
import { getRequestT } from "@/lib/i18n/request";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestT();
  return buildMetadata({
    title: t("marketing.pages.alternatives.meta.title"),
    description: t("marketing.pages.alternatives.meta.description"),
    path: "/alternatives",
    keywords: [
      "production software alternatives",
      "event management software alternatives",
      "Cvent alternatives",
      "Procore alternatives events",
      "tour management alternatives",
    ],
    ogImageEyebrow: t("marketing.pages.alternatives.meta.ogEyebrow"),
    ogImageTitle: t("marketing.pages.alternatives.meta.ogTitle"),
  });
}

export default async function AlternativesIndex() {
  const { t } = await getRequestT();
  const crumbs = [
    { label: t("marketing.pages.alternatives.breadcrumbs.home"), href: "/" },
    { label: t("marketing.pages.alternatives.breadcrumbs.alternatives"), href: "/alternatives" },
  ];

  return (
    <div>
      <JsonLd data={[breadcrumbSchema(crumbs)]} />
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="eyebrow eyebrow-brand">{t("marketing.pages.alternatives.hero.eyebrow")}</div>
        <h1 className="hed-2xl mt-4">{t("marketing.pages.alternatives.hero.title")}</h1>
        <p className="mt-5 max-w-3xl text-lg text-[var(--text-secondary)]">
          {t("marketing.pages.alternatives.hero.body")}
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {COMPARE_LIST.map((c) => (
            <Link key={c.slug} href={`/alternatives/${c.slug}`} className="surface hover-lift p-5">
              <div className="text-sm font-semibold">
                {c.competitor} {t("marketing.pages.alternatives.card.alternativesSuffix")}
              </div>
              <p className="mt-2 text-xs text-[var(--text-secondary)]">{c.blurb}</p>
              <div className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-[var(--org-primary)]">
                {t("marketing.pages.alternatives.card.readLongForm")} <ArrowRight size={12} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <CTASection
        title={t("marketing.pages.alternatives.cta.title")}
        subtitle={t("marketing.pages.alternatives.cta.subtitle")}
      />
    </div>
  );
}
