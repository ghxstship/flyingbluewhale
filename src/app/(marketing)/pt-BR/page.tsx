import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { JsonLd } from "@/components/marketing/JsonLd";
import { FAQSection } from "@/components/marketing/FAQ";
import { CTASection } from "@/components/marketing/CTASection";
import { getRequestT } from "@/lib/i18n/request";
import {
  buildMetadata,
  organizationSchema,
  websiteSchema,
  softwareApplicationSchema,
  CANONICAL_CTAS,
  SITE,
} from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestT();
  return buildMetadata({
    title: t("marketing.pages.pt-BR.metadata.title"),
    description: t("marketing.pages.pt-BR.metadata.description"),
    path: "/pt-BR",
    ogLocale: "pt_BR",
    languages: {
      "en-US": `${SITE.baseUrl}/`,
      "es-ES": `${SITE.baseUrl}/es-ES`,
    },
    keywords: [
      t("marketing.pages.pt-BR.metadata.keywords.productionManagement"),
      t("marketing.pages.pt-BR.metadata.keywords.eventOperations"),
      t("marketing.pages.pt-BR.metadata.keywords.festivalSoftware"),
      t("marketing.pages.pt-BR.metadata.keywords.advancingSoftware"),
      t("marketing.pages.pt-BR.metadata.keywords.liveEventProduction"),
    ],
    ogImageTitle: t("marketing.pages.pt-BR.metadata.ogImageTitle"),
  });
}

export default async function HomePT() {
  const { t } = await getRequestT();

  const FAQ_PT = [
    {
      q: t("marketing.pages.pt-BR.faq.q1.question"),
      a: t("marketing.pages.pt-BR.faq.q1.answer"),
    },
    {
      q: t("marketing.pages.pt-BR.faq.q2.question"),
      a: t("marketing.pages.pt-BR.faq.q2.answer"),
    },
    {
      q: t("marketing.pages.pt-BR.faq.q3.question"),
      a: t("marketing.pages.pt-BR.faq.q3.answer"),
    },
    {
      q: t("marketing.pages.pt-BR.faq.q4.question"),
      a: t("marketing.pages.pt-BR.faq.q4.answer"),
    },
  ];

  return (
    <div lang="pt-BR">
      <JsonLd
        data={[
          organizationSchema(),
          websiteSchema(),
          softwareApplicationSchema({
            name: "ATLVS Technologies",
            description: t("marketing.pages.pt-BR.jsonLd.description"),
            url: `${SITE.baseUrl}/pt-BR`,
            price: "0",
          }),
        ]}
      />

      <section className="relative mx-auto max-w-6xl px-6 pt-24 pb-12 text-balance">
        <div className="eyebrow eyebrow-brand">ATLVS Technologies</div>
        <h1 className="mt-4 text-5xl leading-[1.05] font-semibold tracking-tight sm:text-7xl">
          {t("marketing.pages.pt-BR.hero.titleLine1")}
          <br />
          {t("marketing.pages.pt-BR.hero.titleLine2")}
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-[var(--p-text-2)]">{t("marketing.pages.pt-BR.hero.subtitle")}</p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Button href={CANONICAL_CTAS.primary.href} size="lg">
            {t("marketing.pages.pt-BR.hero.primaryCta")}
          </Button>
          <Button href={CANONICAL_CTAS.secondary.href} size="lg" variant="secondary">
            {t("marketing.pages.pt-BR.hero.secondaryCta")}
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="hed-xl">ATLVS · GVTEWAY · COMPVSS</h2>
        <p className="mt-3 max-w-2xl text-sm text-[var(--p-text-2)]">{t("marketing.pages.pt-BR.apps.subtitle")}</p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            {
              name: "ATLVS",
              body: t("marketing.pages.pt-BR.apps.atlvs.body"),
              href: "/solutions/atlvs",
            },
            {
              name: "GVTEWAY",
              body: t("marketing.pages.pt-BR.apps.gvteway.body"),
              href: "/solutions/gvteway",
            },
            {
              name: "COMPVSS",
              body: t("marketing.pages.pt-BR.apps.compvss.body"),
              href: "/solutions/compvss",
            },
          ].map((app) => (
            <Link key={app.name} href={app.href} className="surface hover-lift p-6">
              <div className="text-sm font-semibold">{app.name}</div>
              <p className="mt-2 text-sm text-[var(--p-text-2)]">{app.body}</p>
              <div className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-[var(--p-accent)]">
                {t("marketing.pages.pt-BR.apps.seeMore")} <ArrowRight size={12} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <FAQSection title={t("marketing.pages.pt-BR.faq.title")} faqs={FAQ_PT} />

      <CTASection
        title={t("marketing.pages.pt-BR.cta.title")}
        subtitle={t("marketing.pages.pt-BR.cta.subtitle")}
        primaryLabel={t("marketing.pages.pt-BR.cta.primaryLabel")}
        secondaryLabel={t("marketing.pages.pt-BR.cta.secondaryLabel")}
      />
    </div>
  );
}
