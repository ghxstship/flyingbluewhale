import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { FAQSection } from "@/components/marketing/FAQ";
import { CTASection } from "@/components/marketing/CTASection";
import { Button } from "@/components/ui/Button";
import { buildMetadata, breadcrumbSchema, faqSchema, softwareApplicationSchema, CANONICAL_CTAS, SITE } from "@/lib/seo";
import { AI_USES, AI_USES_BY_SLUG } from "@/lib/marketing/ai-uses";
import { MODULES } from "@/lib/marketing/modules";
import { getRequestT } from "@/lib/i18n/request";

export function generateStaticParams() {
  return AI_USES.map((u) => ({ slug: u.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { t } = await getRequestT();
  const u = AI_USES_BY_SLUG[slug];
  if (!u)
    return buildMetadata({
      title: t("marketing.pages.ai-slug.meta.fallbackTitle"),
      description: SITE.description,
      path: `/ai/${slug}`,
    });
  return buildMetadata({
    title: `${u.title} — ${u.short}`,
    description: u.short,
    path: `/ai/${u.slug}`,
    keywords: [u.title.toLowerCase(), `${u.title.toLowerCase()} software`, `production ${u.slug} ai`],
    ogImageEyebrow: t("marketing.pages.ai-slug.meta.ogEyebrow"),
    ogImageTitle: u.title,
  });
}

export default async function AiUsePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { t } = await getRequestT();
  const u = AI_USES_BY_SLUG[slug];
  if (!u) notFound();

  const crumbs = [
    { label: t("marketing.pages.ai-slug.breadcrumbs.home"), href: "/" },
    { label: t("marketing.pages.ai-slug.breadcrumbs.ai"), href: "/ai" },
    { label: u.title, href: `/ai/${u.slug}` },
  ];

  const sibling = AI_USES.filter((other) => other.slug !== u.slug);

  return (
    <div>
      <JsonLd
        data={[
          breadcrumbSchema(crumbs),
          softwareApplicationSchema({
            name: `Aurora AI · ${u.title}`,
            description: u.short,
            url: `${SITE.baseUrl}/ai/${u.slug}`,
          }),
          faqSchema(u.faqs),
        ]}
      />
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="eyebrow eyebrow-brand">
          {t("marketing.pages.ai-slug.hero.eyebrowPrefix")} · {u.title.replace(/^AI For /, "")}
        </div>
        <h1 className="hed-2xl mt-4">{u.title}.</h1>
        <p className="mt-5 max-w-3xl text-lg text-[var(--p-text-2)]">{u.hero}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href={CANONICAL_CTAS.primary.href}>{CANONICAL_CTAS.primary.label}</Button>
          <Button href={CANONICAL_CTAS.secondary.href} variant="secondary">
            {CANONICAL_CTAS.secondary.label}
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="surface p-6">
            <div className="eyebrow">{t("marketing.pages.ai-slug.sections.reads.eyebrow")}</div>
            <ul className="mt-4 space-y-2 text-sm">
              {u.reads.map((r) => (
                <li key={r} className="flex items-start gap-2">
                  <span className="ps-dot ps-dot--info mt-2" />
                  <span className="text-[var(--p-text-2)]">{r}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="surface p-6">
            <div className="eyebrow eyebrow-brand">{t("marketing.pages.ai-slug.sections.outputs.eyebrow")}</div>
            <ul className="mt-4 space-y-2 text-sm">
              {u.outputs.map((o) => (
                <li key={o} className="flex items-start gap-2">
                  <span className="ps-dot ps-dot ps-dot--ok mt-2" />
                  <span>{o}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="hed-lg">{t("marketing.pages.ai-slug.sections.surfaces.title")}</h2>
        <ul className="mt-6 space-y-3 text-sm">
          {u.surfaces.map((s) => (
            <li key={s} className="flex items-start gap-2">
              <span className="ps-dot ps-dot--info mt-2" />
              <span>{s}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="hed-lg">{t("marketing.pages.ai-slug.sections.modules.title")}</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {u.modules
            .map((m) => MODULES[m])
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

      {u.faqs.length > 0 ? (
        <FAQSection title={`${u.title} · ${t("marketing.pages.ai-slug.sections.faq.suffix")}`} faqs={u.faqs} />
      ) : null}

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="hed-lg">{t("marketing.pages.ai-slug.sections.siblings.title")}</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {sibling.map((s) => (
            <Link
              key={s.slug}
              href={`/ai/${s.slug}`}
              className="surface hover-lift group flex items-center justify-between p-4 text-sm"
            >
              <span className="font-medium">{s.title}</span>
              <ArrowRight size={14} className="cta-nudge text-[var(--p-text-2)]" />
            </Link>
          ))}
        </div>
      </section>

      <CTASection title={t("marketing.pages.ai-slug.cta.title")} subtitle={t("marketing.pages.ai-slug.cta.subtitle")} />
    </div>
  );
}
