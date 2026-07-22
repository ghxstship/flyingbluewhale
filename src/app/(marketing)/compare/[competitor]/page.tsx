// ISR — regenerate static HTML every 5 min.
export const revalidate = 300;

import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Check, X, Minus } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { FAQSection } from "@/components/marketing/FAQ";
import { CTASection } from "@/components/marketing/CTASection";
import {
  buildMetadata,
  faqSchema,
  breadcrumbSchema,
  reviewSchema,
  webPageSchema,
  formatReviewedDate,
  CONTENT_REVISED,
  CANONICAL_CTAS,
  SITE,
} from "@/lib/seo";
import { Button } from "@/components/ui/Button";
import { COMPARE, COMPARE_LIST } from "@/lib/compare";
import { getStaticEnT } from "../../_lib/static-t";

export function generateStaticParams() {
  return COMPARE_LIST.map((c) => ({ competitor: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ competitor: string }> }): Promise<Metadata> {
  const { competitor } = await params;
  const { t } = await getStaticEnT();
  const c = COMPARE[competitor];
  if (!c)
    return buildMetadata({
      title: t("marketing.pages.compare.detail.metadata.fallbackTitle"),
      description: "",
      path: `/compare/${competitor}`,
    });
  return buildMetadata({
    title: `ATLVS Technologies vs. ${c.competitor}`,
    description: c.blurb,
    path: `/compare/${c.slug}`,
    keywords: c.keywords,
    ogImageEyebrow: `vs. ${c.competitor}`,
    ogImageTitle: t("marketing.pages.compare.detail.metadata.ogImageTitle"),
  });
}

function CellMark({ value, yesLabel, noLabel }: { value: string | boolean; yesLabel: string; noLabel: string }) {
  if (value === true) return <Check size={16} className="text-[var(--p-success)]" aria-label={yesLabel} />;
  if (value === false) return <X size={16} className="text-[var(--p-text-2)]" aria-label={noLabel} />;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-[var(--p-text-2)]">
      <Minus size={12} className="text-[var(--p-text-2)]" />
      {value}
    </span>
  );
}

export default async function CompareDetail({ params }: { params: Promise<{ competitor: string }> }) {
  const { competitor } = await params;
  const { t, locale } = await getStaticEnT();
  const c = COMPARE[competitor];
  if (!c) notFound();

  const crumbs = [
    { label: t("marketing.pages.compare.detail.breadcrumbs.home"), href: "/" },
    { label: t("marketing.pages.compare.detail.breadcrumbs.compare"), href: "/compare" },
    { label: `vs. ${c.competitor}`, href: `/compare/${c.slug}` },
  ];

  return (
    <div>
      <JsonLd
        data={[
          webPageSchema({
            url: `${SITE.baseUrl}/compare/${c.slug}`,
            name: `ATLVS Technologies vs. ${c.competitor}`,
            description: c.blurb,
          }),
          breadcrumbSchema(crumbs),
          faqSchema(c.faqs),
          ...(c.quote
            ? [
                reviewSchema({
                  itemName: "ATLVS Technologies",
                  rating: 5,
                  reviewBody: c.quote.text,
                  authorName: c.quote.attribution,
                }),
              ]
            : []),
        ]}
      />
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="eyebrow eyebrow-brand">ATLVS vs. {c.competitor}</div>
        <h1 className="hed-xl mt-4">{c.headline}</h1>
        <p className="mt-5 max-w-3xl text-lg text-[var(--p-text-2)]">{c.hero}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href={CANONICAL_CTAS.primary.href}>{CANONICAL_CTAS.primary.label}</Button>
          <Button href={CANONICAL_CTAS.secondary.href} variant="secondary">
            {CANONICAL_CTAS.secondary.label}
          </Button>
        </div>
        <div className="surface mt-8 p-5">
          <div className="eyebrow">{t("marketing.pages.compare.detail.bottomLine.eyebrow")}</div>
          <div className="mt-2 text-sm font-medium">{c.bottomLine}</div>
        </div>
        <p className="mt-4 text-xs text-[var(--p-text-2)]">
          {t("common.lastUpdated", { date: formatReviewedDate(CONTENT_REVISED, locale) })}
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="hed-xl">{t("marketing.pages.compare.detail.features.title")}</h2>
        <p className="mt-3 max-w-2xl text-sm text-[var(--p-text-2)]">
          {t("marketing.pages.compare.detail.features.subtitle")}
        </p>
        <div className="surface mt-8 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="ps-table w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--p-border)] bg-[var(--p-surface-2)]">
                  <th className="eyebrow px-4 py-3 text-start">
                    {t("marketing.pages.compare.detail.features.columnFeature")}
                  </th>
                  <th
                    className="eyebrow px-4 py-3 text-start"
                    style={{ color: "var(--p-accent)" }}
                  >
                    ATLVS
                  </th>
                  <th className="eyebrow px-4 py-3 text-start">{c.competitor}</th>
                </tr>
              </thead>
              <tbody>
                {c.features.map((row) => (
                  <tr key={row.feature} className="border-b border-[var(--p-border)] last:border-b-0">
                    <td className="px-4 py-3 align-top">
                      <div className="font-medium">{row.feature}</div>
                      {row.note ? <div className="mt-1 text-xs text-[var(--p-text-2)]">{row.note}</div> : null}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <CellMark
                        value={row.us}
                        yesLabel={t("marketing.pages.compare.detail.features.yes")}
                        noLabel={t("marketing.pages.compare.detail.features.no")}
                      />
                    </td>
                    <td className="px-4 py-3 align-top">
                      <CellMark
                        value={row.them}
                        yesLabel={t("marketing.pages.compare.detail.features.yes")}
                        noLabel={t("marketing.pages.compare.detail.features.no")}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="hed-xl">{t("marketing.pages.compare.detail.whyWeWin.title")}</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {c.whyWeWin.map((w) => (
            <div key={w.title} className="surface p-6">
              <div className="text-sm font-semibold">{w.title}</div>
              <p className="mt-2 text-sm text-[var(--p-text-2)]">{w.body}</p>
            </div>
          ))}
        </div>
      </section>

      {c.whenTheyWin.length > 0 ? (
        <section className="mx-auto max-w-6xl px-6 py-12">
          <h2 className="hed-lg">
            {t("marketing.pages.compare.detail.whenTheyWin.title", { competitor: c.competitor })}
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-[var(--p-text-2)]">
            {t("marketing.pages.compare.detail.whenTheyWin.subtitle")}
          </p>
          <ul className="mt-6 space-y-3 text-sm">
            {c.whenTheyWin.map((w) => (
              <li key={w} className="flex items-start gap-2">
                <span className="ps-dot ps-dot ps-dot--warn mt-2" />
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {c.quote ? (
        <section className="mx-auto max-w-6xl px-6 py-12">
          <figure className="surface p-8 md:p-10">
            <blockquote className="text-xl leading-relaxed font-medium tracking-tight text-balance sm:text-2xl">
              &ldquo;{c.quote.text}&rdquo;
            </blockquote>
            <figcaption className="eyebrow mt-4">
              — {c.quote.attribution}
            </figcaption>
          </figure>
        </section>
      ) : null}

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="hed-lg">{t("marketing.pages.compare.detail.migration.title")}</h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--p-text-2)]">
          {t("marketing.pages.compare.detail.migration.subtitle", { competitor: c.competitor })}
        </p>
        <div className="surface mt-6 p-6">
          <ol className="list-decimal space-y-2 ps-5 text-sm text-[var(--p-text-2)]">
            {c.migration.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ol>
        </div>
        <div className="mt-6">
          <Link href={`/alternatives/${c.slug}`} className="text-sm font-medium text-[var(--p-accent)]">
            {t("marketing.pages.compare.detail.migration.longFormLink", { competitor: c.competitor })}
          </Link>
        </div>
      </section>

      <FAQSection title={`vs. ${c.competitor} · FAQ`} faqs={c.faqs} />

      <CTASection
        title={t("marketing.pages.compare.detail.cta.title")}
        subtitle={t("marketing.pages.compare.detail.cta.subtitle")}
      />
    </div>
  );
}
