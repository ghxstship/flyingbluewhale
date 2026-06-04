import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Sparkles } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { CTASection } from "@/components/marketing/CTASection";
import { FAQSection } from "@/components/marketing/FAQ";
import { Button } from "@/components/ui/Button";
import { buildMetadata, breadcrumbSchema, CANONICAL_CTAS, softwareApplicationSchema, SITE } from "@/lib/seo";
import { AI_USES } from "@/lib/marketing/ai-uses";
import { getRequestT } from "@/lib/i18n/request";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestT();
  return buildMetadata({
    title: t("marketing.pages.ai.meta.title"),
    description: t("marketing.pages.ai.meta.description"),
    path: "/ai",
    keywords: [
      "AI for event production",
      "production AI assistant",
      "AI for advancing",
      "AI for incident reports",
      "AI for tour management",
      "AI for live events",
      "Claude for production",
    ],
    ogImageEyebrow: t("marketing.pages.ai.meta.ogImageEyebrow"),
    ogImageTitle: t("marketing.pages.ai.meta.ogImageTitle"),
  });
}

export default async function AiHub() {
  const { t } = await getRequestT();
  const HUB_FAQS = [
    {
      q: t("marketing.pages.ai.faq.otherOrgs.q"),
      a: t("marketing.pages.ai.faq.otherOrgs.a"),
    },
    {
      q: t("marketing.pages.ai.faq.training.q"),
      a: t("marketing.pages.ai.faq.training.a"),
    },
    {
      q: t("marketing.pages.ai.faq.model.q"),
      a: t("marketing.pages.ai.faq.model.a"),
    },
    {
      q: t("marketing.pages.ai.faq.wrong.q"),
      a: t("marketing.pages.ai.faq.wrong.a"),
    },
    {
      q: t("marketing.pages.ai.faq.freeTier.q"),
      a: t("marketing.pages.ai.faq.freeTier.a"),
    },
  ];
  const crumbs = [
    { label: t("marketing.pages.ai.breadcrumbs.home"), href: "/" },
    { label: t("marketing.pages.ai.breadcrumbs.ai"), href: "/ai" },
  ];

  return (
    <div>
      <JsonLd
        data={[
          breadcrumbSchema(crumbs),
          softwareApplicationSchema({
            name: "ATLVS AI Assistant",
            description: t("marketing.pages.ai.jsonLd.description"),
            url: `${SITE.baseUrl}/ai`,
            price: "0",
          }),
        ]}
      />
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="eyebrow eyebrow-brand">{t("marketing.pages.ai.hero.eyebrow")}</div>
        <h1 className="hed-3xl mt-4">
          {t("marketing.pages.ai.hero.titleLine1")}
          <br />
          {t("marketing.pages.ai.hero.titleLine2")}
        </h1>
        <p className="mt-5 max-w-3xl text-lg text-[var(--text-secondary)]">{t("marketing.pages.ai.hero.subtitle")}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href={CANONICAL_CTAS.primary.href}>{CANONICAL_CTAS.primary.label}</Button>
          <Button href={CANONICAL_CTAS.secondary.href} variant="secondary">
            {CANONICAL_CTAS.secondary.label}
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="hed-xl">{t("marketing.pages.ai.drafts.title")}</h2>
        <p className="mt-3 max-w-2xl text-sm text-[var(--text-secondary)]">{t("marketing.pages.ai.drafts.subtitle")}</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {AI_USES.map((u) => (
            <Link key={u.slug} href={`/ai/${u.slug}`} className="surface hover-lift p-5">
              <span
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg"
                style={{
                  background: "color-mix(in oklab, var(--org-primary) 12%, transparent)",
                  color: "var(--org-primary)",
                }}
              >
                <Sparkles size={16} aria-hidden="true" />
              </span>
              <h3 className="mt-3 text-base font-semibold">{u.title}</h3>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">{u.short}</p>
              <div className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-[var(--org-primary)]">
                {t("marketing.pages.ai.drafts.cardCta")} <ArrowRight size={12} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="surface p-8 md:p-10">
          <div className="grid gap-8 md:grid-cols-2 md:items-center">
            <div>
              <div className="eyebrow eyebrow-brand">{t("marketing.pages.ai.rules.eyebrow")}</div>
              <h2 className="hed-lg mt-3">{t("marketing.pages.ai.rules.title")}</h2>
              <p className="mt-3 text-sm text-[var(--text-secondary)]">{t("marketing.pages.ai.rules.subtitle")}</p>
            </div>
            <ul className="space-y-3 text-sm">
              {[
                t("marketing.pages.ai.rules.items.0"),
                t("marketing.pages.ai.rules.items.1"),
                t("marketing.pages.ai.rules.items.2"),
                t("marketing.pages.ai.rules.items.3"),
                t("marketing.pages.ai.rules.items.4"),
                t("marketing.pages.ai.rules.items.5"),
              ].map((line) => (
                <li key={line} className="flex items-start gap-2">
                  <span className="status-dot status-dot-success mt-2" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <FAQSection title={t("marketing.pages.ai.faq.title")} faqs={HUB_FAQS} />

      <CTASection title={t("marketing.pages.ai.cta.title")} subtitle={t("marketing.pages.ai.cta.subtitle")} />
    </div>
  );
}
