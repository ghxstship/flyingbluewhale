import Link from "next/link";
import type { Metadata } from "next";
import { JsonLd } from "@/components/marketing/JsonLd";
import { CTASection } from "@/components/marketing/CTASection";
import { buildMetadata, breadcrumbSchema } from "@/lib/seo";
import { GLOSSARY, GLOSSARY_CATEGORIES, type GlossaryTerm } from "@/lib/marketing/glossary";
import { getRequestT } from "@/lib/i18n/request";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestT();
  return buildMetadata({
    title: t("marketing.pages.glossary.meta.title"),
    description: t("marketing.pages.glossary.meta.description"),
    path: "/glossary",
    keywords: [
      "event production glossary",
      "live event terminology",
      "production vocabulary",
      "what is advancing",
      "what is ROS",
      "what is KBYG",
    ],
    ogImageEyebrow: t("marketing.pages.glossary.meta.ogImageEyebrow"),
    ogImageTitle: t("marketing.pages.glossary.meta.ogImageTitle"),
  });
}

export default async function GlossaryIndex() {
  const { t } = await getRequestT();
  const crumbs = [
    { label: t("marketing.pages.glossary.breadcrumbs.home"), href: "/" },
    { label: t("marketing.pages.glossary.breadcrumbs.glossary"), href: "/glossary" },
  ];

  const byCategory = new Map<GlossaryTerm["category"], GlossaryTerm[]>();
  for (const term of GLOSSARY) {
    const list = byCategory.get(term.category) ?? [];
    list.push(term);
    byCategory.set(term.category, list);
  }

  return (
    <div>
      <JsonLd
        data={[
          breadcrumbSchema(crumbs),
          {
            "@context": "https://schema.org",
            "@type": "DefinedTermSet",
            name: t("marketing.pages.glossary.jsonLd.name"),
            hasDefinedTerm: GLOSSARY.map((t) => ({
              "@type": "DefinedTerm",
              name: t.term,
              description: t.short,
              url: `/glossary/${t.slug}`,
            })),
          },
        ]}
      />
      <section className="mx-auto max-w-6xl px-6 pt-12 pb-12">
        <div className="eyebrow eyebrow-brand">{t("marketing.pages.glossary.hero.eyebrow")}</div>
        <h1 className="hed-2xl mt-4">{t("marketing.pages.glossary.hero.title")}</h1>
        <p className="mt-5 max-w-3xl text-lg text-[var(--p-text-2)]">{t("marketing.pages.glossary.hero.body")}</p>
      </section>

      {GLOSSARY_CATEGORIES.filter((cat) => byCategory.has(cat.slug)).map((cat) => (
        <section key={cat.slug} className="mx-auto max-w-6xl px-6 py-8">
          <div className="eyebrow eyebrow-brand">{cat.label}</div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {(byCategory.get(cat.slug) ?? []).map((t) => (
              <Link key={t.slug} href={`/glossary/${t.slug}`} className="surface hover-lift p-4">
                <div className="text-sm font-semibold">{t.term}</div>
                <p className="mt-1 text-xs text-[var(--p-text-2)]">{t.short}</p>
              </Link>
            ))}
          </div>
        </section>
      ))}

      <CTASection
        title={t("marketing.pages.glossary.cta.title")}
        subtitle={t("marketing.pages.glossary.cta.subtitle")}
      />
    </div>
  );
}
