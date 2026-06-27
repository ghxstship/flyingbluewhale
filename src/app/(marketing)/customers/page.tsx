import Link from "next/link";
import type { Metadata } from "next";
import { Clock } from "lucide-react";
import { JsonLd } from "@/components/marketing/JsonLd";
import { CTASection } from "@/components/marketing/CTASection";
import { Button } from "@/components/ui/Button";
import { buildMetadata, breadcrumbSchema, CANONICAL_CTAS } from "@/lib/seo";
import { PUBLISHED_CUSTOMER_STORIES, IN_PROGRESS_CUSTOMER_STORIES } from "@/lib/marketing/customers";
import { INDUSTRIES } from "@/lib/marketing/industries";
import { getRequestT } from "@/lib/i18n/request";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestT();
  return buildMetadata({
    title: t("marketing.pages.customers.metadata.title"),
    description: t("marketing.pages.customers.metadata.description"),
    path: "/customers",
    keywords: [
      t("marketing.pages.customers.metadata.keywords.0"),
      t("marketing.pages.customers.metadata.keywords.1"),
      t("marketing.pages.customers.metadata.keywords.2"),
      t("marketing.pages.customers.metadata.keywords.3"),
    ],
    ogImageEyebrow: t("marketing.pages.customers.metadata.ogImageEyebrow"),
    ogImageTitle: t("marketing.pages.customers.metadata.ogImageTitle"),
  });
}

export default async function CustomersHub() {
  const { t } = await getRequestT();
  const crumbs = [
    { label: t("marketing.pages.customers.crumbs.home"), href: "/" },
    { label: t("marketing.pages.customers.crumbs.customers"), href: "/customers" },
  ];

  return (
    <div>
      <JsonLd data={[breadcrumbSchema(crumbs)]} />
      <section className="mx-auto max-w-6xl px-6 pt-12 pb-12">
        <div className="text-xs font-semibold tracking-[0.25em] text-[var(--p-accent)] uppercase">
          {t("marketing.pages.customers.hero.eyebrow")}
        </div>
        <h1 className="mt-3 text-5xl font-semibold tracking-tight text-balance sm:text-7xl">
          {t("marketing.pages.customers.hero.title")}
        </h1>
        <p className="mt-5 max-w-3xl text-lg text-[var(--p-text-2)]">{t("marketing.pages.customers.hero.body")}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href={CANONICAL_CTAS.secondary.href}>{t("marketing.pages.customers.hero.primaryCta")}</Button>
          <Button href={CANONICAL_CTAS.primary.href} variant="secondary">
            {CANONICAL_CTAS.primary.label}
          </Button>
        </div>
      </section>

      {PUBLISHED_CUSTOMER_STORIES.length > 0 ? (
        <section className="mx-auto max-w-6xl px-6 py-12">
          <h2 className="text-2xl font-semibold tracking-tight">{t("marketing.pages.customers.published.title")}</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {PUBLISHED_CUSTOMER_STORIES.map((s) => (
              <Link key={s.slug} href={`/customers/${s.slug}`} className="surface hover-lift p-5">
                <div className="text-[11px] font-semibold tracking-[0.2em] text-[var(--p-accent)] uppercase">
                  {INDUSTRIES[s.industry]?.name ?? s.industry}
                </div>
                <h3 className="mt-2 text-base font-semibold">{s.displayName}</h3>
                <p className="mt-2 text-sm text-[var(--p-text-2)]">{s.teaser}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex items-baseline justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">{t("marketing.pages.customers.landingSoon.title")}</h2>
          <span className="text-xs text-[var(--p-text-2)]">
            {t("marketing.pages.customers.landingSoon.count", { count: IN_PROGRESS_CUSTOMER_STORIES.length })}
          </span>
        </div>
        <p className="mt-3 max-w-2xl text-sm text-[var(--p-text-2)]">
          {t("marketing.pages.customers.landingSoon.body")}
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-2">
          {IN_PROGRESS_CUSTOMER_STORIES.map((s) => (
            <article key={s.slug} className="surface p-6">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-semibold tracking-[0.2em] text-[var(--p-accent)] uppercase">
                  {INDUSTRIES[s.industry]?.name ?? s.industry}
                </div>
                <div className="inline-flex items-center gap-1 rounded-full border border-[var(--p-border)] bg-[var(--p-surface-2)] px-2 py-0.5 text-[10px] font-medium text-[var(--p-text-2)]">
                  <Clock size={10} aria-hidden="true" />
                  {s.expectedPublish}
                </div>
              </div>
              <h3 className="mt-2 text-base font-semibold">{s.displayName}</h3>
              <p className="mt-2 text-sm text-[var(--p-text-2)]">{s.teaser}</p>
              <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-[var(--p-border)] pt-4">
                {s.metrics.map((m) => (
                  <div key={m.label}>
                    <dt className="text-[10px] tracking-wide text-[var(--p-text-2)] uppercase">{m.label}</dt>
                    <dd className="mt-1 font-mono text-base font-semibold">{m.value}</dd>
                  </div>
                ))}
              </dl>
            </article>
          ))}
        </div>
      </section>

      <CTASection
        title={t("marketing.pages.customers.cta.title")}
        subtitle={t("marketing.pages.customers.cta.subtitle")}
        primaryLabel={t("marketing.pages.customers.cta.primaryLabel")}
        primaryHref={CANONICAL_CTAS.secondary.href}
        secondaryLabel={t("marketing.pages.customers.cta.secondaryLabel")}
      />
    </div>
  );
}
