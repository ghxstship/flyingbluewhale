// ISR — regenerate static HTML every 5 min.
export const revalidate = 300;

import Link from "next/link";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { CTASection } from "@/components/marketing/CTASection";
import { buildMetadata } from "@/lib/seo";
import { COMPARE_LIST } from "@/lib/compare";
import { getRequestT } from "@/lib/i18n/request";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestT();
  return buildMetadata({
    title: t("marketing.pages.compare.meta.title"),
    description: t("marketing.pages.compare.meta.description"),
    path: "/compare",
    keywords: ["ATLVS Technologies comparison"],
    ogImageEyebrow: t("marketing.pages.compare.meta.ogImageEyebrow"),
    ogImageTitle: t("marketing.pages.compare.meta.ogImageTitle"),
  });
}

export default async function ComparePage() {
  const { t } = await getRequestT();
  const crumbs = [
    { label: t("marketing.pages.compare.breadcrumbs.home"), href: "/" },
    { label: t("marketing.pages.compare.breadcrumbs.current"), href: "/compare" },
  ];

  return (
    <div>
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="text-xs font-semibold tracking-[0.25em] text-[var(--org-primary)] uppercase">
          {t("marketing.pages.compare.hero.eyebrow")}
        </div>
        <h1 className="mt-3 text-5xl font-semibold tracking-tight sm:text-6xl">
          {t("marketing.pages.compare.hero.title")}
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-[var(--text-secondary)]">{t("marketing.pages.compare.hero.body")}</p>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid gap-4 md:grid-cols-3">
          {COMPARE_LIST.map((c) => (
            <Link key={c.slug} href={`/compare/${c.slug}`} className="surface hover-lift p-6">
              <div className="text-[11px] font-semibold tracking-[0.2em] text-[var(--text-muted)] uppercase">
                {t("marketing.pages.compare.card.eyebrow")} {c.competitor}
              </div>
              <div className="mt-3 text-2xl font-semibold tracking-tight">{t("marketing.pages.compare.card.cta")}</div>
              <div className="mt-3 text-sm text-[var(--text-secondary)]">{c.blurb}</div>
            </Link>
          ))}
        </div>
      </section>

      <CTASection
        title={t("marketing.pages.compare.cta.title")}
        subtitle={t("marketing.pages.compare.cta.subtitle")}
        primaryLabel={t("marketing.pages.compare.cta.primaryLabel")}
        primaryHref="/signup"
        secondaryLabel={t("marketing.pages.compare.cta.secondaryLabel")}
        secondaryHref="/contact"
      />
    </div>
  );
}
