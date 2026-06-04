import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { CTASection } from "@/components/marketing/CTASection";
import { buildMetadata, breadcrumbSchema } from "@/lib/seo";
import { TEMPLATES } from "@/lib/marketing/templates";
import { getRequestT } from "@/lib/i18n/request";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestT();
  return buildMetadata({
    title: t("marketing.pages.templates.meta.title"),
    description: t("marketing.pages.templates.meta.description"),
    path: "/templates",
    keywords: [
      "event production templates",
      "festival ROS template",
      "tour advancing checklist",
      "stage rider template",
      "daily safety brief template",
      "incident report form",
      "vendor COI checklist",
    ],
    ogImageEyebrow: t("marketing.pages.templates.meta.ogImageEyebrow"),
    ogImageTitle: t("marketing.pages.templates.meta.ogImageTitle"),
  });
}

export default async function TemplatesIndex() {
  const { t } = await getRequestT();
  const crumbs = [
    { label: t("marketing.pages.templates.crumbs.home"), href: "/" },
    { label: t("marketing.pages.templates.crumbs.templates"), href: "/templates" },
  ];

  return (
    <div>
      <JsonLd data={[breadcrumbSchema(crumbs)]} />
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="eyebrow eyebrow-brand">{t("marketing.pages.templates.hero.eyebrow")}</div>
        <h1 className="hed-2xl mt-4">{t("marketing.pages.templates.hero.title")}</h1>
        <p className="mt-5 max-w-3xl text-lg text-[var(--text-secondary)]">
          {t("marketing.pages.templates.hero.body")}
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {TEMPLATES.map((tpl) => (
            <Link key={tpl.slug} href={`/templates/${tpl.slug}`} className="surface hover-lift p-5">
              <div className="eyebrow eyebrow-brand">{tpl.category}</div>
              <h3 className="mt-2 text-base font-semibold">{tpl.title}</h3>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">{tpl.short}</p>
              <div className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-[var(--org-primary)]">
                {t("marketing.pages.templates.card.cta")} <ArrowRight size={12} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <CTASection
        title={t("marketing.pages.templates.cta.title")}
        subtitle={t("marketing.pages.templates.cta.subtitle")}
      />
    </div>
  );
}
