import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Button } from "@/components/ui/Button";
import { JsonLd } from "@/components/marketing/JsonLd";
import { FAQSection } from "@/components/marketing/FAQ";
import { CTASection } from "@/components/marketing/CTASection";
import { buildMetadata, breadcrumbSchema, faqSchema, CANONICAL_CTAS } from "@/lib/seo";
import { DEMO_PERSONAS, DEMO_PERSONAS_BY_SLUG } from "@/lib/marketing/demo-personas";
import { MODULES } from "@/lib/marketing/modules";
import { getRequestT } from "@/lib/i18n/request";

export function generateStaticParams() {
  return DEMO_PERSONAS.map((p) => ({ persona: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ persona: string }> }): Promise<Metadata> {
  const { persona } = await params;
  const { t } = await getRequestT();
  const p = DEMO_PERSONAS_BY_SLUG[persona];
  if (!p)
    return buildMetadata({
      title: t("marketing.pages.demo-persona.metadata.fallbackTitle"),
      description: t("marketing.pages.demo-persona.metadata.fallbackDescription"),
      path: `/demo/${persona}`,
    });
  return buildMetadata({
    title: `${t("marketing.pages.demo-persona.metadata.titlePrefix")} ${p.buyer} — ${p.hero}`,
    description: p.subhero,
    path: `/demo/${p.slug}`,
    keywords: [`${p.buyer.toLowerCase()} demo`, `${p.buyer.toLowerCase()} software demo`],
    ogImageEyebrow: `${t("marketing.pages.demo-persona.metadata.ogEyebrowPrefix")} ${p.buyer}`,
    ogImageTitle: p.hero,
  });
}

export default async function DemoSplinter({ params }: { params: Promise<{ persona: string }> }) {
  const { persona } = await params;
  const { t } = await getRequestT();
  const p = DEMO_PERSONAS_BY_SLUG[persona];
  if (!p) notFound();

  const crumbs = [
    { label: t("marketing.pages.demo-persona.breadcrumbs.home"), href: "/" },
    { label: t("marketing.pages.demo-persona.breadcrumbs.demo"), href: "/demo" },
    { label: p.buyer, href: `/demo/${p.slug}` },
  ];

  return (
    <div>
      <JsonLd data={[breadcrumbSchema(crumbs), faqSchema(p.faqs)]} />
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="eyebrow eyebrow-brand">
          {t("marketing.pages.demo-persona.hero.eyebrowPrefix")} {p.buyer}
        </div>
        <h1 className="hed-2xl mt-4">{p.hero}</h1>
        <p className="mt-5 max-w-3xl text-lg text-[var(--p-text-2)]">{p.subhero}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href={`${CANONICAL_CTAS.primary.href}?from=demo-${p.slug}`}>{CANONICAL_CTAS.primary.label}</Button>
          <Button href={`${CANONICAL_CTAS.secondary.href}?from=demo-${p.slug}`} variant="secondary">
            {CANONICAL_CTAS.secondary.label}
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="hed-xl">{t("marketing.pages.demo-persona.outcomes.heading")}</h2>
        <ul className="mt-6 space-y-3 text-sm">
          {p.outcomes.map((o) => (
            <li key={o} className="flex items-start gap-2">
              <span className="ps-dot ps-dot ps-dot--ok mt-2" />
              <span>{o}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="hed-lg">{t("marketing.pages.demo-persona.modules.heading")}</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {p.modules
            .map((slug) => MODULES[slug])
            .filter((m): m is NonNullable<typeof m> => Boolean(m))
            .map((m) => (
              <Link
                key={m.slug}
                href={`/features/${m.slug}`}
                className="surface hover-lift group flex items-center justify-between p-4 text-sm"
              >
                <span className="font-medium">{m.name}</span>
                <ArrowRight size={14} className="cta-nudge text-[var(--p-text-2)]" />
              </Link>
            ))}
        </div>
      </section>

      <FAQSection title={`${p.buyer} · ${t("marketing.pages.demo-persona.faq.titleSuffix")}`} faqs={p.faqs} />

      <CTASection
        title={t("marketing.pages.demo-persona.cta.title")}
        subtitle={t("marketing.pages.demo-persona.cta.subtitle")}
      />
    </div>
  );
}
