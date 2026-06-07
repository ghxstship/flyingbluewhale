import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { CTASection } from "@/components/marketing/CTASection";
import { buildMetadata, breadcrumbSchema, definedTermSchema, SITE } from "@/lib/seo";
import { GLOSSARY, GLOSSARY_BY_SLUG } from "@/lib/marketing/glossary";
import { MODULES } from "@/lib/marketing/modules";
import { getRequestT } from "@/lib/i18n/request";

export function generateStaticParams() {
  return GLOSSARY.map((entry) => ({ slug: entry.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const entry = GLOSSARY_BY_SLUG[slug];
  const { t } = await getRequestT();
  if (!entry) {
    return buildMetadata({
      title: t("marketing.glossary.detail.fallbackTitle", undefined, "Glossary"),
      description: SITE.description,
      path: `/glossary/${slug}`,
    });
  }
  return buildMetadata({
    title: t("marketing.glossary.detail.meta.title", { term: entry.term }, "{term} — Definition"),
    description: entry.short,
    path: `/glossary/${entry.slug}`,
    keywords: [
      entry.term.toLowerCase(),
      `what is ${entry.term.toLowerCase()}`,
      `${entry.term.toLowerCase()} definition`,
      ...(entry.aka ?? []),
    ],
    ogImageEyebrow: t("marketing.glossary.crumbsLabel", undefined, "Glossary"),
    ogImageTitle: entry.term,
  });
}

export default async function GlossaryDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = GLOSSARY_BY_SLUG[slug];
  if (!entry) notFound();
  const { t } = await getRequestT();

  const crumbs = [
    { label: t("common.home", undefined, "Home"), href: "/" },
    { label: t("marketing.glossary.crumbsLabel", undefined, "Glossary"), href: "/glossary" },
    { label: entry.term, href: `/glossary/${entry.slug}` },
  ];

  return (
    <div>
      <JsonLd
        data={[
          breadcrumbSchema(crumbs),
          definedTermSchema({
            name: entry.term,
            description: entry.long,
            url: `${SITE.baseUrl}/glossary/${entry.slug}`,
            inDefinedTermSet: `${SITE.baseUrl}/glossary`,
          }),
        ]}
      />
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <article className="mx-auto max-w-3xl px-6 pt-8 pb-12">
        <div className="eyebrow eyebrow-brand">
          {t(
            "marketing.glossary.detail.eyebrow",
            { category: entry.category.replace(/-/g, " ") },
            "Glossary · {category}",
          )}
        </div>
        <h1 className="hed-2xl mt-4">{entry.term}</h1>
        {entry.aka && entry.aka.length > 0 ? (
          <p className="mt-3 text-sm text-[var(--p-text-2)]">
            {t("marketing.glossary.detail.also", { list: entry.aka.join(", ") }, "Also: {list}")}
          </p>
        ) : null}
        <p className="mt-6 text-lg leading-relaxed text-[var(--p-text-2)]">{entry.long}</p>
      </article>

      {entry.modules && entry.modules.length > 0 ? (
        <section className="mx-auto max-w-3xl px-6 py-8">
          <div className="surface p-6">
            <div className="eyebrow eyebrow-brand">
              {t("marketing.glossary.detail.howAtlvsHandles", undefined, "How ATLVS Handles This")}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {entry.modules
                .map((m) => MODULES[m])
                .filter((m): m is NonNullable<typeof m> => Boolean(m))
                .map((m) => (
                  <Link
                    key={m.slug}
                    href={`/features/${m.slug}`}
                    className="rounded-full border border-[var(--p-border)] bg-[var(--p-surface-2)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--p-surface)]"
                  >
                    {m.name} →
                  </Link>
                ))}
            </div>
          </div>
        </section>
      ) : null}

      {entry.related.length > 0 ? (
        <section className="mx-auto max-w-3xl px-6 py-8">
          <h2 className="eyebrow">{t("marketing.glossary.detail.relatedTerms", undefined, "Related terms")}</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {entry.related
              .map((r) => GLOSSARY_BY_SLUG[r])
              .filter((r): r is NonNullable<typeof r> => Boolean(r))
              .map((r) => (
                <Link
                  key={r.slug}
                  href={`/glossary/${r.slug}`}
                  className="surface hover-lift flex items-center justify-between p-3 text-sm"
                >
                  <span>{r.term}</span>
                  <ArrowRight size={12} className="cta-nudge text-[var(--p-text-2)]" />
                </Link>
              ))}
          </div>
        </section>
      ) : null}

      <CTASection
        title={t("marketing.glossary.detail.cta.title", undefined, "ATLVS Is Open.")}
        subtitle={t(
          "marketing.glossary.detail.cta.subtitle",
          undefined,
          "Free forever for small teams. Per-org pricing the rest of the way up.",
        )}
      />
    </div>
  );
}
