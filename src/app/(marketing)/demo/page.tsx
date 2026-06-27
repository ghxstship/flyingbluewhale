import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { JsonLd } from "@/components/marketing/JsonLd";
import { FAQSection } from "@/components/marketing/FAQ";
import { CTASection } from "@/components/marketing/CTASection";
import { buildMetadata, breadcrumbSchema, CANONICAL_CTAS } from "@/lib/seo";
import { DEMO_PERSONAS } from "@/lib/marketing/demo-personas";
import { getRequestT } from "@/lib/i18n/request";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestT();
  return buildMetadata({
    title: t("marketing.pages.demo.metadata.title"),
    description: t("marketing.pages.demo.metadata.description"),
    path: "/demo",
    keywords: [
      "ATLVS demo",
      "event production software demo",
      "book a production software walkthrough",
      "festival software demo",
      "tour management software demo",
    ],
    ogImageEyebrow: t("marketing.pages.demo.metadata.ogImageEyebrow"),
    ogImageTitle: t("marketing.pages.demo.metadata.ogImageTitle"),
  });
}

export default async function DemoIndex() {
  const { t } = await getRequestT();

  const FAQS = [
    {
      q: t("marketing.pages.demo.faqs.walkthrough.q"),
      a: t("marketing.pages.demo.faqs.walkthrough.a"),
    },
    {
      q: t("marketing.pages.demo.faqs.salesCall.q"),
      a: t("marketing.pages.demo.faqs.salesCall.a"),
    },
    {
      q: t("marketing.pages.demo.faqs.tryWithoutCall.q"),
      a: t("marketing.pages.demo.faqs.tryWithoutCall.a"),
    },
  ];

  const crumbs = [
    { label: t("marketing.pages.demo.breadcrumbs.home"), href: "/" },
    { label: t("marketing.pages.demo.breadcrumbs.demo"), href: "/demo" },
  ];

  return (
    <div>
      <JsonLd data={[breadcrumbSchema(crumbs)]} />
      <section className="mx-auto max-w-6xl px-6 pt-12 pb-12">
        <div className="eyebrow eyebrow-accent">
          {t("marketing.pages.demo.hero.eyebrow")}
        </div>
        <h1 className="hed-3xl mt-3">
          {t("marketing.pages.demo.hero.title")}
        </h1>
        <p className="mt-5 max-w-3xl text-lg text-[var(--p-text-2)]">{t("marketing.pages.demo.hero.subtitle")}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href={CANONICAL_CTAS.primary.href}>{CANONICAL_CTAS.primary.label}</Button>
          <Button href={CANONICAL_CTAS.secondary.href} variant="secondary">
            {CANONICAL_CTAS.secondary.label}
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="hed-xl">{t("marketing.pages.demo.personas.title")}</h2>
        <p className="mt-3 max-w-2xl text-sm text-[var(--p-text-2)]">{t("marketing.pages.demo.personas.subtitle")}</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {DEMO_PERSONAS.map((p) => (
            <Link key={p.slug} href={`/demo/${p.slug}`} className="surface hover-lift p-6">
              <div className="eyebrow eyebrow-accent">
                {p.buyer}
              </div>
              <h3 className="mt-2 text-xl font-semibold">{p.hero}</h3>
              <p className="mt-2 text-sm text-[var(--p-text-2)]">{p.subhero}</p>
              <div className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-[var(--p-accent)]">
                {t("marketing.pages.demo.personas.cta")} <ArrowRight size={12} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <FAQSection title={t("marketing.pages.demo.faqs.title")} faqs={FAQS} />

      <CTASection title={t("marketing.pages.demo.cta.title")} subtitle={t("marketing.pages.demo.cta.subtitle")} />
    </div>
  );
}
