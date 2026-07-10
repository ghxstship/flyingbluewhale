/**
 * /alternatives/[competitor] — narrative long-form variant of the
 * /compare/[competitor] page. Targets "alternative to X" search intent
 * with a different content shape (story, pros/cons, then alternatives)
 * rather than the head-to-head feature table.
 *
 * Pulls the same `COMPARE` data so it stays in sync; flips the framing.
 */

export const revalidate = 300;

import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { FAQSection } from "@/components/marketing/FAQ";
import { CTASection } from "@/components/marketing/CTASection";
import { Button } from "@/components/ui/Button";
import {
  buildMetadata,
  faqSchema,
  breadcrumbSchema,
  webPageSchema,
  formatReviewedDate,
  CONTENT_REVISED,
  CANONICAL_CTAS,
  SITE,
} from "@/lib/seo";
import { COMPARE, COMPARE_LIST } from "@/lib/compare";
import { getStaticEnT } from "../../_lib/static-t";

export function generateStaticParams() {
  return COMPARE_LIST.map((c) => ({ competitor: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ competitor: string }> }): Promise<Metadata> {
  const { competitor } = await params;
  const c = COMPARE[competitor];
  const { t } = await getStaticEnT();
  if (!c)
    return buildMetadata({
      title: t("marketing.pages.alternatives.competitor.metadata.fallbackTitle"),
      description: "",
      path: `/alternatives/${competitor}`,
    });
  return buildMetadata({
    title: t("marketing.pages.alternatives.competitor.metadata.title", { competitor: c.competitor }),
    description: t("marketing.pages.alternatives.competitor.metadata.description", { competitor: c.competitor }),
    path: `/alternatives/${c.slug}`,
    keywords: [
      `${c.competitor} alternative`,
      `alternative to ${c.competitor}`,
      `${c.competitor} vs ATLVS`,
      ...(c.keywords ?? []),
    ],
    ogImageEyebrow: t("marketing.pages.alternatives.competitor.metadata.ogImageEyebrow", { competitor: c.competitor }),
    ogImageTitle: t("marketing.pages.alternatives.competitor.metadata.ogImageTitle"),
  });
}

export default async function AlternativesPage({ params }: { params: Promise<{ competitor: string }> }) {
  const { competitor } = await params;
  const c = COMPARE[competitor];
  if (!c) notFound();
  const { t, locale } = await getStaticEnT();

  const crumbs = [
    { label: t("marketing.pages.alternatives.competitor.crumbs.home"), href: "/" },
    { label: t("marketing.pages.alternatives.competitor.crumbs.alternatives"), href: "/alternatives" },
    {
      label: t("marketing.pages.alternatives.competitor.crumbs.competitorAlternatives", { competitor: c.competitor }),
      href: `/alternatives/${c.slug}`,
    },
  ];

  // Pros/cons derived from the comparison data — pros are the features the
  // competitor handles, cons are the features they don't. Keeps both pages
  // in lockstep.
  const pros = c.features.filter((f) => f.them === true).slice(0, 5);
  const cons = c.features.filter((f) => f.them === false).slice(0, 5);

  return (
    <div>
      <JsonLd
        data={[
          webPageSchema({
            url: `${SITE.baseUrl}/alternatives/${c.slug}`,
            name: t("marketing.pages.alternatives.competitor.hero.title", { competitor: c.competitor }),
            description: c.blurb,
          }),
          breadcrumbSchema(crumbs),
          faqSchema(c.faqs),
        ]}
      />
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="eyebrow eyebrow-brand">
          {t("marketing.pages.alternatives.competitor.hero.eyebrow", { competitor: c.competitor })}
        </div>
        <h1 className="hed-xl mt-4">
          {t("marketing.pages.alternatives.competitor.hero.title", { competitor: c.competitor })}
        </h1>
        <p className="mt-5 max-w-3xl text-lg text-[var(--p-text-2)]">
          {t("marketing.pages.alternatives.competitor.hero.body", { competitor: c.competitor })}
        </p>
        <p className="mt-5 text-xs text-[var(--p-text-2)]">
          {t("common.lastUpdated", { date: formatReviewedDate(CONTENT_REVISED, locale) })}
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="hed-xl">
          {t("marketing.pages.alternatives.competitor.pros.title", { competitor: c.competitor })}
        </h2>
        <p className="mt-3 max-w-2xl text-sm text-[var(--p-text-2)]">
          {t("marketing.pages.alternatives.competitor.pros.body", { competitor: c.competitor })}
        </p>
        <ul className="mt-6 space-y-3 text-sm">
          {pros.length > 0 ? (
            pros.map((p) => (
              <li key={p.feature} className="flex items-start gap-2">
                <span className="ps-dot ps-dot ps-dot--ok mt-2" />
                <span>{p.feature}</span>
              </li>
            ))
          ) : (
            <li className="text-[var(--p-text-2)]">{t("marketing.pages.alternatives.competitor.pros.fallback")}</li>
          )}
          {c.whenTheyWin.map((w) => (
            <li key={w} className="flex items-start gap-2">
              <span className="ps-dot ps-dot ps-dot--ok mt-2" />
              <span>{w}</span>
            </li>
          ))}
        </ul>
      </section>

      {cons.length > 0 ? (
        <section className="mx-auto max-w-6xl px-6 py-12">
          <h2 className="hed-xl">{t("marketing.pages.alternatives.competitor.cons.title")}</h2>
          <p className="mt-3 max-w-2xl text-sm text-[var(--p-text-2)]">
            {t("marketing.pages.alternatives.competitor.cons.body")}
          </p>
          <ul className="mt-6 space-y-3 text-sm">
            {cons.map((p) => (
              <li key={p.feature} className="flex items-start gap-2">
                <span className="ps-dot ps-dot ps-dot--danger mt-2" />
                <span>{p.feature}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="surface p-8 md:p-10">
          <div className="eyebrow eyebrow-brand">{t("marketing.pages.alternatives.competitor.atlvsAlt.eyebrow")}</div>
          <h2 className="hed-lg mt-3">{c.headline}</h2>
          <p className="mt-4 text-sm text-[var(--p-text-2)]">{c.hero}</p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {c.whyWeWin.slice(0, 3).map((w) => (
              <div key={w.title} className="rounded-lg border border-[var(--p-border)] bg-[var(--p-surface-2)] p-4">
                <div className="text-sm font-semibold">{w.title}</div>
                <p className="mt-2 text-xs text-[var(--p-text-2)]">{w.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button href={CANONICAL_CTAS.primary.href}>{CANONICAL_CTAS.primary.label}</Button>
            <Link href={`/compare/${c.slug}`} className="ps-btn ps-btn--ghost">
              {t("marketing.pages.alternatives.competitor.atlvsAlt.compareLink")}
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="hed-lg">{t("marketing.pages.alternatives.competitor.migrate.title")}</h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--p-text-2)]">
          {t("marketing.pages.alternatives.competitor.migrate.body", { competitor: c.competitor })}
        </p>
        <div className="surface mt-6 p-6">
          <ol className="list-decimal space-y-2 ps-5 text-sm text-[var(--p-text-2)]">
            {c.migration.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ol>
        </div>
      </section>

      <FAQSection
        title={t("marketing.pages.alternatives.competitor.faq.title", { competitor: c.competitor })}
        faqs={c.faqs}
      />

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="hed-lg">{t("marketing.pages.alternatives.competitor.other.title")}</h2>
        <p className="mt-3 text-sm text-[var(--p-text-2)]">{t("marketing.pages.alternatives.competitor.other.body")}</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {COMPARE_LIST.filter((other) => other.slug !== c.slug)
            .slice(0, 12)
            .map((other) => (
              <Link key={other.slug} href={`/alternatives/${other.slug}`} className="surface hover-lift p-4 text-sm">
                <div className="font-medium">
                  {t("marketing.pages.alternatives.competitor.other.itemLabel", { competitor: other.competitor })}
                </div>
              </Link>
            ))}
        </div>
      </section>

      <CTASection
        title={t("marketing.pages.alternatives.competitor.cta.title")}
        subtitle={t("marketing.pages.alternatives.competitor.cta.subtitle")}
      />
    </div>
  );
}
