import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { CTASection } from "@/components/marketing/CTASection";
import { Button } from "@/components/ui/Button";
import { buildMetadata, breadcrumbSchema, CANONICAL_CTAS, SITE } from "@/lib/seo";
import { TEMPLATES, TEMPLATES_BY_SLUG } from "@/lib/marketing/templates";
import { MODULES } from "@/lib/marketing/modules";
import { getRequestT } from "@/lib/i18n/request";

export function generateStaticParams() {
  return TEMPLATES.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { t: tr } = await getRequestT();
  const tpl = TEMPLATES_BY_SLUG[slug];
  if (!tpl)
    return buildMetadata({
      title: tr("marketing.pages.templates.detail.metadata.fallbackTitle"),
      description: SITE.description,
      path: `/templates/${slug}`,
    });
  return buildMetadata({
    title: `${tpl.title} — ${tr("marketing.pages.templates.detail.metadata.titleSuffix")}`,
    description: tpl.short,
    path: `/templates/${tpl.slug}`,
    keywords: [tpl.title.toLowerCase(), `${tpl.title.toLowerCase()} template`],
    ogImageEyebrow: tr("marketing.pages.templates.detail.metadata.ogEyebrow"),
    ogImageTitle: tpl.title,
  });
}

export default async function TemplateDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { t: tr } = await getRequestT();
  const t = TEMPLATES_BY_SLUG[slug];
  if (!t) notFound();

  const moduleInfo = MODULES[t.module];
  const crumbs = [
    { label: tr("marketing.pages.templates.detail.crumbs.home"), href: "/" },
    { label: tr("marketing.pages.templates.detail.crumbs.templates"), href: "/templates" },
    { label: t.title, href: `/templates/${t.slug}` },
  ];

  return (
    <div>
      <JsonLd data={[breadcrumbSchema(crumbs)]} />
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="eyebrow eyebrow-brand">
          {tr("marketing.pages.templates.detail.hero.eyebrow")} · {t.category}
        </div>
        <h1 className="hed-2xl mt-4">{t.title}</h1>
        <p className="mt-5 max-w-3xl text-lg text-[var(--p-text-2)]">{t.long}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href={`${CANONICAL_CTAS.primary.href}?template=${t.slug}`}>
            {tr("marketing.pages.templates.detail.hero.ctaPrimary")}
          </Button>
          <Button href={CANONICAL_CTAS.secondary.href} variant="secondary">
            {CANONICAL_CTAS.secondary.label}
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="hed-xl">{tr("marketing.pages.templates.detail.whatsInIt.title")}</h2>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {t.whatsInIt.map((line) => (
            <li key={line} className="surface p-4 text-sm">
              {line}
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="surface p-6">
          <div className="eyebrow">{tr("marketing.pages.templates.detail.bestFor.eyebrow")}</div>
          <div className="mt-4 flex flex-wrap gap-2">
            {t.bestFor.map((p) => (
              <span
                key={p}
                className="rounded-full border border-[var(--p-border)] bg-[var(--p-surface-2)] px-3 py-1.5 text-xs font-medium"
              >
                {p}
              </span>
            ))}
          </div>
          {moduleInfo ? (
            <div className="mt-6 border-t border-[var(--p-border)] pt-4 text-sm">
              <span className="text-[var(--p-text-2)]">{tr("marketing.pages.templates.detail.livesIn.label")} </span>
              <Link href={`/features/${moduleInfo.slug}`} className="font-medium text-[var(--p-accent)]">
                {moduleInfo.name} →
              </Link>
            </div>
          ) : null}
        </div>
      </section>

      <CTASection
        title={tr("marketing.pages.templates.detail.cta.title")}
        subtitle={tr("marketing.pages.templates.detail.cta.subtitle")}
      />
    </div>
  );
}
