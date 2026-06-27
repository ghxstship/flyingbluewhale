// ISR (H2-08 / IK-030) — regenerate static HTML every 5 min.
// Shortens to 60s if editorial cadence picks up; `revalidate` alone is enough,
// no `dynamic = 'force-static'` because some pages read query params.
export const revalidate = 300;

import Link from "next/link";
import type { Metadata } from "next";
import { CTASection } from "@/components/marketing/CTASection";
import { buildMetadata } from "@/lib/seo";
import { MARKETING_GUIDE_LIST } from "@/lib/marketing-guides";
import { getRequestT } from "@/lib/i18n/request";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestT();
  return buildMetadata({
    title: t("marketing.pages.guides.meta.title"),
    description: t("marketing.pages.guides.meta.description"),
    path: "/guides",
    keywords: ["event production guides", "advancing guide", "KBYG guide", "production operations guide"],
    ogImageEyebrow: t("marketing.pages.guides.meta.ogImageEyebrow"),
    ogImageTitle: t("marketing.pages.guides.meta.ogImageTitle"),
  });
}

export default async function GuidesPage() {
  const { t } = await getRequestT();
  return (
    <div>
      <section className="mx-auto max-w-4xl px-6 pt-12 pb-10">
        <div className="eyebrow eyebrow-brand">{t("marketing.pages.guides.hero.eyebrow")}</div>
        <h1 className="hed-2xl mt-4">{t("marketing.pages.guides.hero.title")}</h1>
        <p className="mt-5 max-w-2xl text-lg text-[var(--p-text-2)]">{t("marketing.pages.guides.hero.subtitle")}</p>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-8">
        <ul className="space-y-4">
          {MARKETING_GUIDE_LIST.map((g) => (
            <li key={g.slug}>
              <Link href={`/guides/${g.slug}`} className="surface hover-lift block p-6">
                <div className="font-mono text-xs text-[var(--p-text-2)]">{g.readingTime}</div>
                <div className="hed-lg mt-3 tracking-tight">{g.title}</div>
                <div className="mt-2 text-sm text-[var(--p-text-2)]">{g.blurb}</div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <CTASection title={t("marketing.pages.guides.cta.title")} subtitle={t("marketing.pages.guides.cta.subtitle")} />
    </div>
  );
}
