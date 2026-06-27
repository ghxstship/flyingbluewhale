import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { FAQSection } from "@/components/marketing/FAQ";
import { CTASection } from "@/components/marketing/CTASection";
import { Button } from "@/components/ui/Button";
import {
  buildMetadata,
  softwareApplicationSchema,
  breadcrumbSchema,
  faqSchema,
  reviewSchema,
  CANONICAL_CTAS,
} from "@/lib/seo";
import { urlFor } from "@/lib/urls";
import { MODULES } from "@/lib/marketing/modules";
import { getRequestT } from "@/lib/i18n/request";

export function generateStaticParams() {
  return Object.keys(MODULES).map((module) => ({ module }));
}

export async function generateMetadata({ params }: { params: Promise<{ module: string }> }): Promise<Metadata> {
  const { module } = await params;
  const config = MODULES[module];
  const { t } = await getRequestT();
  if (!config) {
    return buildMetadata({
      title: t("marketing.features.detail.fallbackTitle", undefined, "Feature"),
      description: t(
        "marketing.features.detail.fallbackDescription",
        undefined,
        "ATLVS Technologies — one platform for the whole production.",
      ),
      path: `/features/${module}`,
    });
  }
  return buildMetadata({
    title: `${config.name} — ${config.title}`,
    description: config.blurb,
    path: `/features/${config.slug}`,
    keywords: config.keywords,
    ogImageEyebrow: config.eyebrow,
    ogImageTitle: config.name,
  });
}

export default async function FeatureDetail({ params }: { params: Promise<{ module: string }> }) {
  const { module } = await params;
  const config = MODULES[module];
  if (!config) {
    notFound();
  }
  const { t } = await getRequestT();

  const crumbs = [
    { label: t("common.home", undefined, "Home"), href: "/" },
    { label: t("marketing.features.crumbsLabel", undefined, "Features"), href: "/features" },
    { label: config.name, href: `/features/${config.slug}` },
  ];

  // Sibling ecosystem grid: every other module, with the explicit `related`
  // set pinned to the front. ClickUp ships 14 — we surface the full set
  // (currently 20) for tighter PageRank distribution across the farm.
  const relatedSlugs = new Set(config.related.map((r) => r.slug));
  const siblings = [
    ...config.related.map((r) => ({ slug: r.slug, name: MODULES[r.slug]?.name ?? r.label, isRelated: true })),
    ...Object.values(MODULES)
      .filter((m) => m.slug !== config.slug && !relatedSlugs.has(m.slug))
      .map((m) => ({ slug: m.slug, name: m.name, isRelated: false })),
  ];

  return (
    <div>
      <JsonLd
        data={[
          softwareApplicationSchema({
            name: `ATLVS Technologies — ${config.name}`,
            description: config.blurb,
            url: urlFor("marketing", `/features/${config.slug}`),
          }),
          breadcrumbSchema(crumbs),
          faqSchema(config.faqs),
          ...(config.quote
            ? [
                reviewSchema({
                  itemName: `ATLVS Technologies — ${config.name}`,
                  rating: config.quote.rating ?? 5,
                  reviewBody: config.quote.text,
                  authorName: config.quote.attribution,
                }),
              ]
            : []),
        ]}
      />
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="eyebrow eyebrow-accent">{config.eyebrow}</div>
        <h1 className="hed-3xl mt-3">{config.heroTitle}</h1>
        <p className="mt-5 max-w-2xl text-lg text-[var(--p-text-2)]">{config.heroBody}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href={CANONICAL_CTAS.primary.href}>{CANONICAL_CTAS.primary.label}</Button>
          <Button href={CANONICAL_CTAS.secondary.href} variant="secondary">
            {CANONICAL_CTAS.secondary.label}
          </Button>
        </div>
      </section>

      {config.withoutUs && config.withUs ? (
        <section className="mx-auto max-w-6xl px-6 py-12">
          <h2 className="hed-xl">
            {t("marketing.features.detail.beforeAfter.heading", undefined, "Before And After.")}
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-[var(--p-text-2)]">
            {t(
              "marketing.features.detail.beforeAfter.sub",
              undefined,
              "What changes when this module lands in your stack.",
            )}
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="surface p-6">
              <div className="eyebrow">
                {t("marketing.features.detail.beforeAfter.without", undefined, "Without")}
              </div>
              <ul className="mt-4 space-y-3 text-sm">
                {config.withoutUs.map((line) => (
                  <li key={line} className="flex items-start gap-2">
                    <span className="ps-dot ps-dot ps-dot--danger mt-2" />
                    <span className="text-[var(--p-text-2)]">{line}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="surface p-6">
              <div
                className="eyebrow"
                style={{ color: "var(--p-accent)" }}
              >
                {t("marketing.features.detail.beforeAfter.with", undefined, "With ATLVS")}
              </div>
              <ul className="mt-4 space-y-3 text-sm">
                {config.withUs.map((line) => (
                  <li key={line} className="flex items-start gap-2">
                    <span className="ps-dot ps-dot ps-dot--ok mt-2" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="hed-xl">
          {t("marketing.features.detail.whatItDoes", undefined, "What This Module Does.")}
        </h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {config.highlights.map((h) => (
            <div key={h.title} className="surface p-6">
              <div className="text-sm font-semibold">{h.title}</div>
              <p className="mt-2 text-sm text-[var(--p-text-2)]">{h.body}</p>
            </div>
          ))}
        </div>
      </section>

      {config.personas ? (
        <section className="mx-auto max-w-6xl px-6 py-12">
          <div className="surface p-8 md:p-10">
            <div className="eyebrow eyebrow-accent">
              {t("marketing.features.detail.builtFor", undefined, "Built For")}
            </div>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">
              {t("marketing.features.detail.whoRuns", undefined, "Who Runs This Day-To-Day.")}
            </h2>
            <div className="mt-6 flex flex-wrap gap-2">
              {config.personas.map((p) => (
                <span
                  key={p}
                  className="rounded-full border border-[var(--p-border)] bg-[var(--p-surface-2)] px-3 py-1.5 text-xs font-medium text-[var(--p-text-2)]"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {config.quote ? (
        <section className="mx-auto max-w-6xl px-6 py-12">
          <figure className="surface p-8 md:p-10">
            <blockquote className="text-xl leading-relaxed font-medium tracking-tight text-balance sm:text-2xl">
              &ldquo;{config.quote.text}&rdquo;
            </blockquote>
            <figcaption className="mt-4 text-xs tracking-wide text-[var(--p-text-2)] uppercase">
              — {config.quote.attribution}
            </figcaption>
          </figure>
        </section>
      ) : null}

      <CTASection
        title={t("marketing.features.detail.cta.runTitle", { name: config.name }, "Run {name} On Your Next Show.")}
        subtitle={t(
          "marketing.features.detail.cta.runSubtitle",
          undefined,
          "Free, forever, for small teams. Per-org pricing the rest of the way up.",
        )}
      />

      <FAQSection
        title={t("marketing.features.detail.faqTitle", { name: config.name }, "{name} · FAQ")}
        faqs={config.faqs}
      />

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-2xl font-semibold tracking-tight">
          {t("marketing.features.detail.restOfAtlvs", undefined, "The Rest Of ATLVS.")}
        </h2>
        <p className="mt-3 text-sm text-[var(--p-text-2)]">
          {t(
            "marketing.features.detail.restOfAtlvsSub",
            undefined,
            "One database. Every module reads from the same record.",
          )}
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {siblings.map((s) => (
            <Link
              key={s.slug}
              href={`/features/${s.slug}`}
              className={`surface hover-lift group flex items-center justify-between p-4 text-sm ${
                s.isRelated ? "ring-1 ring-[var(--p-accent)]/40" : ""
              }`}
            >
              <span className="font-medium">{s.name}</span>
              <ArrowRight size={14} className="cta-nudge text-[var(--p-text-2)]" />
            </Link>
          ))}
        </div>
      </section>

      <CTASection
        title={t("marketing.features.detail.cta.openTitle", undefined, "ATLVS Is Open.")}
        subtitle={t(
          "marketing.features.detail.cta.openSubtitle",
          undefined,
          "Free, forever, for small teams. Per-org pricing the rest of the way up.",
        )}
      />
    </div>
  );
}
