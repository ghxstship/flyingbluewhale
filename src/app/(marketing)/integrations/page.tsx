import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Button } from "@/components/ui/Button";
import { JsonLd } from "@/components/marketing/JsonLd";
import { CTASection } from "@/components/marketing/CTASection";
import { buildMetadata, breadcrumbSchema } from "@/lib/seo";
import { INTEGRATIONS, INTEGRATION_CATEGORIES, type Integration } from "@/lib/marketing/integrations";
import { getRequestT } from "@/lib/i18n/request";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestT();
  return buildMetadata({
    title: t("marketing.pages.integrations.meta.title"),
    description: t("marketing.pages.integrations.meta.description"),
    path: "/integrations",
    keywords: [
      "event production integrations",
      "Stripe Connect event payouts",
      "Anthropic Claude integration",
      "Supabase event platform",
      "production webhooks API",
    ],
    ogImageEyebrow: t("marketing.pages.integrations.meta.ogImageEyebrow"),
    ogImageTitle: t("marketing.pages.integrations.meta.ogImageTitle"),
  });
}

export default async function IntegrationsIndex() {
  const { t } = await getRequestT();
  const crumbs = [
    { label: t("marketing.pages.integrations.breadcrumbs.home"), href: "/" },
    { label: t("marketing.pages.integrations.breadcrumbs.integrations"), href: "/integrations" },
  ];

  const byCategory = new Map<Integration["category"], Integration[]>();
  for (const i of INTEGRATIONS) {
    const list = byCategory.get(i.category) ?? [];
    list.push(i);
    byCategory.set(i.category, list);
  }

  return (
    <div>
      <JsonLd data={[breadcrumbSchema(crumbs)]} />
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="eyebrow eyebrow-brand">{t("marketing.pages.integrations.hero.eyebrow")}</div>
        <h1 className="hed-3xl mt-4">{t("marketing.pages.integrations.hero.title")}</h1>
        <p className="mt-5 max-w-3xl text-lg text-[var(--p-text-2)]">{t("marketing.pages.integrations.hero.body")}</p>
      </section>

      {INTEGRATION_CATEGORIES.filter((cat) => byCategory.has(cat.slug)).map((cat) => (
        <section key={cat.slug} className="mx-auto max-w-6xl px-6 py-8">
          <div className="eyebrow eyebrow-brand">{cat.label}</div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {(byCategory.get(cat.slug) ?? []).map((i) => (
              <Link key={i.slug} href={`/integrations/${i.slug}`} className="surface hover-lift p-5">
                <div className="text-sm font-semibold">{i.name}</div>
                <p className="mt-2 text-xs text-[var(--p-text-2)]">{i.short}</p>
                <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-[var(--p-accent)]">
                  {t("marketing.pages.integrations.card.howItsWired")} <ArrowRight size={11} />
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}

      <section className="mx-auto max-w-6xl px-6 pb-12">
        <div className="surface flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="eyebrow eyebrow-brand">{t("marketing.pages.integrations.partner.eyebrow")}</div>
            <h3 className="mt-2 text-lg font-semibold">{t("marketing.pages.integrations.partner.title")}</h3>
            <p className="mt-1 text-sm text-[var(--p-text-2)]">{t("marketing.pages.integrations.partner.body")}</p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/integrations/partners"
              className="rounded-md border border-[var(--p-border)] px-4 py-2 text-sm font-medium hover:bg-[var(--p-surface)]"
            >
              {t("marketing.pages.integrations.partner.directoryCta")}
            </Link>
            <Button href="/integrations/submit" variant="primary" size="sm">
              {t("marketing.pages.integrations.partner.submitCta")}
            </Button>
          </div>
        </div>
      </section>

      <CTASection
        title={t("marketing.pages.integrations.cta.title")}
        subtitle={t("marketing.pages.integrations.cta.subtitle")}
      />
    </div>
  );
}
