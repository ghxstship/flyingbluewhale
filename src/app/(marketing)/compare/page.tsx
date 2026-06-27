// ISR — regenerate static HTML every 5 min.
export const revalidate = 300;

import Link from "next/link";
import type { Metadata } from "next";
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
  return (
    <div>
      <section className="mx-auto max-w-6xl px-6 pt-12 pb-12">
        <div className="eyebrow eyebrow-accent">
          {t("marketing.pages.compare.hero.eyebrow")}
        </div>
        <h1 className="hed-3xl mt-3">
          {t("marketing.pages.compare.hero.title")}
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-[var(--p-text-2)]">{t("marketing.pages.compare.hero.body")}</p>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid gap-4 md:grid-cols-3">
          {COMPARE_LIST.map((c) => (
            <Link key={c.slug} href={`/compare/${c.slug}`} className="surface hover-lift p-6">
              <div className="eyebrow">
                {t("marketing.pages.compare.card.eyebrow")} {c.competitor}
              </div>
              <div className="mt-3 text-2xl font-semibold tracking-tight">{t("marketing.pages.compare.card.cta")}</div>
              <div className="mt-3 text-sm text-[var(--p-text-2)]">{c.blurb}</div>
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
