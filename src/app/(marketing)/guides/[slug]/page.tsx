// ISR (H2-08 / IK-030) — regenerate static HTML every 5 min.
// Shortens to 60s if editorial cadence picks up; `revalidate` alone is enough,
// no `dynamic = 'force-static'` because some pages read query params.
export const revalidate = 300;

import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { FAQSection } from "@/components/marketing/FAQ";
import { CTASection } from "@/components/marketing/CTASection";
import { buildMetadata, articleSchema, faqSchema } from "@/lib/seo";
import { urlFor } from "@/lib/urls";
import { MARKETING_GUIDES, MARKETING_GUIDE_LIST } from "@/lib/marketing-guides";
import { getRequestT } from "@/lib/i18n/request";

export function generateStaticParams() {
  return MARKETING_GUIDE_LIST.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const g = MARKETING_GUIDES[slug];
  const { t } = await getRequestT();
  if (!g)
    return buildMetadata({
      title: t("marketing.pages.guides.detail.meta.fallbackTitle"),
      description: "",
      path: `/guides/${slug}`,
    });
  return buildMetadata({
    title: g.title,
    description: g.blurb,
    path: `/guides/${g.slug}`,
    keywords: g.keywords,
    ogImageEyebrow: t("marketing.pages.guides.detail.eyebrow"),
    ogImageTitle: g.title,
  });
}

export default async function GuideDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = MARKETING_GUIDES[slug];
  if (!g) notFound();
  const { t } = await getRequestT();

  const crumbs = [
    { label: t("marketing.pages.guides.detail.crumbs.home"), href: "/" },
    { label: t("marketing.pages.guides.detail.crumbs.guides"), href: "/guides" },
    { label: g.title, href: `/guides/${g.slug}` },
  ];

  return (
    <div>
      <JsonLd
        data={[
          articleSchema({
            headline: g.title,
            description: g.blurb,
            datePublished: "2026-04-01",
            url: urlFor("marketing", `/guides/`),
          }),
          faqSchema(g.faqs),
        ]}
      />
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <article className="mx-auto max-w-3xl px-6 pt-8 pb-12">
        <div className="eyebrow eyebrow-brand">{t("marketing.pages.guides.detail.eyebrow")}</div>
        <h1 className="hed-xl mt-4">{g.title}</h1>
        <div className="mt-3 font-mono text-xs text-[var(--text-muted)]">{g.readingTime}</div>
        <p className="mt-6 text-lg text-[var(--text-secondary)]">{g.hero}</p>

        <div className="surface mt-8 p-6">
          <div className="eyebrow">{t("marketing.pages.guides.detail.tldrLabel")}</div>
          <div className="mt-2 text-sm">{g.tldr}</div>
        </div>

        <div className="mt-12 space-y-10 text-[15px] leading-7 text-[var(--text-secondary)]">
          {g.sections.map((s, i) => (
            <section key={i}>
              <h2 className="hed-lg mt-10 text-[var(--text-primary)]">{s.heading}</h2>
              {s.body.map((p, j) =>
                p === "" ? (
                  <div key={j} className="h-2" />
                ) : (
                  <p key={j} className="mt-4">
                    {p}
                  </p>
                ),
              )}
              {s.list && (
                <ul className="mt-4 ml-5 list-disc space-y-1.5">
                  {s.list.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap gap-1.5 border-t border-[var(--border)] pt-6">
          {g.keywords.map((k) => (
            <span
              key={k}
              className="rounded-full bg-[var(--surface-inset)] px-2.5 py-1 text-[11px] text-[var(--text-muted)]"
            >
              {k}
            </span>
          ))}
        </div>
      </article>

      <FAQSection title={t("marketing.pages.guides.detail.faqTitle", { title: g.title })} faqs={g.faqs} />

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="hed-lg">{t("marketing.pages.guides.detail.otherGuides")}</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {MARKETING_GUIDE_LIST.filter((x) => x.slug !== g.slug).map((x) => (
            <Link key={x.slug} href={`/guides/${x.slug}`} className="surface hover-lift p-5">
              <div className="text-sm font-semibold">{x.title}</div>
              <div className="mt-1 text-xs text-[var(--text-muted)]">{x.blurb}</div>
            </Link>
          ))}
        </div>
      </section>

      <CTASection
        title={t("marketing.pages.guides.detail.cta.title")}
        subtitle={t("marketing.pages.guides.detail.cta.subtitle")}
      />
    </div>
  );
}
