import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Calculator, Ruler } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { CTASection } from "@/components/marketing/CTASection";
import { buildMetadata, breadcrumbSchema } from "@/lib/seo";
import { getRequestT } from "@/lib/i18n/request";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestT();
  return buildMetadata({
    title: t("marketing.pages.tools.meta.title"),
    description: t("marketing.pages.tools.meta.description"),
    path: "/tools",
    keywords: [
      "per diem calculator",
      "event capacity calculator",
      "venue occupancy calculator",
      "production calculator",
      "free event planning tools",
    ],
    ogImageEyebrow: t("marketing.pages.tools.meta.ogImageEyebrow"),
    ogImageTitle: t("marketing.pages.tools.meta.ogImageTitle"),
  });
}

export default async function ToolsIndex() {
  const { t } = await getRequestT();

  const TOOLS = [
    {
      slug: "per-diem-calculator",
      title: t("marketing.pages.tools.items.perDiem.title"),
      short: t("marketing.pages.tools.items.perDiem.short"),
      icon: Calculator,
    },
    {
      slug: "capacity-calculator",
      title: t("marketing.pages.tools.items.capacity.title"),
      short: t("marketing.pages.tools.items.capacity.short"),
      icon: Ruler,
    },
  ];

  const crumbs = [
    { label: t("marketing.pages.tools.breadcrumbs.home"), href: "/" },
    { label: t("marketing.pages.tools.breadcrumbs.tools"), href: "/tools" },
  ];

  return (
    <div>
      <JsonLd data={[breadcrumbSchema(crumbs)]} />
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="eyebrow eyebrow-brand">{t("marketing.pages.tools.hero.eyebrow")}</div>
        <h1 className="hed-2xl mt-4">{t("marketing.pages.tools.hero.title")}</h1>
        <p className="mt-5 max-w-3xl text-lg text-[var(--text-secondary)]">{t("marketing.pages.tools.hero.body")}</p>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-4 sm:grid-cols-2">
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link key={tool.slug} href={`/tools/${tool.slug}`} className="surface hover-lift p-6">
                <div className="flex items-center gap-3">
                  <span
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg"
                    style={{
                      background: "color-mix(in oklab, var(--org-primary) 12%, transparent)",
                      color: "var(--org-primary)",
                    }}
                  >
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <div>
                    <div className="text-base font-semibold">{tool.title}</div>
                  </div>
                </div>
                <p className="mt-3 text-sm text-[var(--text-secondary)]">{tool.short}</p>
                <div className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-[var(--org-primary)]">
                  {t("marketing.pages.tools.card.cta")} <ArrowRight size={12} />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <CTASection title={t("marketing.pages.tools.cta.title")} subtitle={t("marketing.pages.tools.cta.subtitle")} />
    </div>
  );
}
