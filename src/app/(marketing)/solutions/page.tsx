// ISR — regenerate static HTML every 5 min.
export const revalidate = 300;

import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { FAQSection } from "@/components/marketing/FAQ";
import { CTASection } from "@/components/marketing/CTASection";
import { buildMetadata } from "@/lib/seo";
import { getRequestT } from "@/lib/i18n/request";
import { Wordmark } from "@/components/brand/Wordmark";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestT();
  return buildMetadata({
    title: t("marketing.pages.solutions.metadata.title"),
    description: t("marketing.pages.solutions.metadata.description"),
    path: "/solutions",
    keywords: [
      "live events software",
      "concerts production platform",
      "festivals and tours software",
      "immersive experience operations",
      "brand activation platform",
      "corporate events software",
      "theatrical production software",
      "broadcast tv film production",
      "ATLVS GVTEWAY COMPVSS",
    ],
  });
}

export default async function SolutionsIndex() {
  const { t } = await getRequestT();
  const crumbs = [
    { label: t("marketing.pages.solutions.crumbs.home"), href: "/" },
    { label: t("marketing.pages.solutions.crumbs.solutions"), href: "/solutions" },
  ];
  const APPS = [
    {
      slug: "atlvs",
      name: "ATLVS",
      tier: t("marketing.pages.solutions.apps.atlvs.tier"),
      title: t("marketing.pages.solutions.apps.atlvs.title"),
      body: t("marketing.pages.solutions.apps.atlvs.body"),
      bullets: [
        t("marketing.pages.solutions.apps.atlvs.bullets.0"),
        t("marketing.pages.solutions.apps.atlvs.bullets.1"),
        t("marketing.pages.solutions.apps.atlvs.bullets.2"),
        t("marketing.pages.solutions.apps.atlvs.bullets.3"),
      ],
      href: "/solutions/atlvs",
    },
    {
      slug: "gvteway",
      name: "GVTEWAY",
      tier: t("marketing.pages.solutions.apps.gvteway.tier"),
      title: t("marketing.pages.solutions.apps.gvteway.title"),
      body: t("marketing.pages.solutions.apps.gvteway.body"),
      bullets: [
        t("marketing.pages.solutions.apps.gvteway.bullets.0"),
        t("marketing.pages.solutions.apps.gvteway.bullets.1"),
        t("marketing.pages.solutions.apps.gvteway.bullets.2"),
        t("marketing.pages.solutions.apps.gvteway.bullets.3"),
      ],
      href: "/solutions/gvteway",
    },
    {
      slug: "compvss",
      name: "COMPVSS",
      tier: t("marketing.pages.solutions.apps.compvss.tier"),
      title: t("marketing.pages.solutions.apps.compvss.title"),
      body: t("marketing.pages.solutions.apps.compvss.body"),
      bullets: [
        t("marketing.pages.solutions.apps.compvss.bullets.0"),
        t("marketing.pages.solutions.apps.compvss.bullets.1"),
        t("marketing.pages.solutions.apps.compvss.bullets.2"),
        t("marketing.pages.solutions.apps.compvss.bullets.3"),
      ],
      href: "/solutions/compvss",
    },
    {
      slug: "legend",
      name: "LEG3ND",
      tier: t("marketing.pages.solutions.apps.legend.tier"),
      title: t("marketing.pages.solutions.apps.legend.title"),
      body: t("marketing.pages.solutions.apps.legend.body"),
      bullets: [
        t("marketing.pages.solutions.apps.legend.bullets.0"),
        t("marketing.pages.solutions.apps.legend.bullets.1"),
        t("marketing.pages.solutions.apps.legend.bullets.2"),
        t("marketing.pages.solutions.apps.legend.bullets.3"),
      ],
      href: "/solutions/legend",
    },
  ] as const;

  const INDUSTRIES = [
    {
      slug: "live-events",
      name: t("marketing.pages.solutions.industries.live-events.name"),
      blurb: t("marketing.pages.solutions.industries.live-events.blurb"),
    },
    {
      slug: "concerts",
      name: t("marketing.pages.solutions.industries.concerts.name"),
      blurb: t("marketing.pages.solutions.industries.concerts.blurb"),
    },
    {
      slug: "festivals-tours",
      name: t("marketing.pages.solutions.industries.festivals-tours.name"),
      blurb: t("marketing.pages.solutions.industries.festivals-tours.blurb"),
    },
    {
      slug: "immersive-experiences",
      name: t("marketing.pages.solutions.industries.immersive-experiences.name"),
      blurb: t("marketing.pages.solutions.industries.immersive-experiences.blurb"),
    },
    {
      slug: "brand-activations",
      name: t("marketing.pages.solutions.industries.brand-activations.name"),
      blurb: t("marketing.pages.solutions.industries.brand-activations.blurb"),
    },
    {
      slug: "corporate-events",
      name: t("marketing.pages.solutions.industries.corporate-events.name"),
      blurb: t("marketing.pages.solutions.industries.corporate-events.blurb"),
    },
    {
      slug: "theatrical-performances",
      name: t("marketing.pages.solutions.industries.theatrical-performances.name"),
      blurb: t("marketing.pages.solutions.industries.theatrical-performances.blurb"),
    },
    {
      slug: "broadcast-tv-film",
      name: t("marketing.pages.solutions.industries.broadcast-tv-film.name"),
      blurb: t("marketing.pages.solutions.industries.broadcast-tv-film.blurb"),
    },
  ];
  return (
    <>
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="text-xs font-semibold tracking-[0.25em] text-[var(--p-accent-text)] uppercase">
          {t("marketing.pages.solutions.hero.eyebrow")}
        </div>
        <h1 className="mt-3 text-5xl font-semibold tracking-tight">{t("marketing.pages.solutions.hero.title")}</h1>
        <p className="mt-4 max-w-2xl text-lg text-[var(--p-text-2)]">{t("marketing.pages.solutions.hero.body")}</p>
      </section>

      {/* Apps */}
      <section className="mx-auto max-w-6xl px-6 py-8">
        <h2 className="text-3xl font-semibold tracking-tight">{t("marketing.pages.solutions.apps.heading")}</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {APPS.map((a) => (
            <Link
              key={a.slug}
              href={a.href}
              data-theme="atlvs-product"
              data-platform={a.slug}
              className="surface hover-lift relative overflow-hidden p-7"
            >
              <span className="absolute inset-x-0 top-0 h-1" style={{ background: "var(--p-accent)" }} />
              <div className="flex items-center justify-between">
                {/* App brand mark — canonical Jost wordmark lockup in the app
                    accent color. <Wordmark> carries its own aria-label (solid
                    name) and renders the spaced crossbar-less treatment. */}
                <Wordmark word={a.name} style={{ color: "var(--p-accent-text)", fontSize: 13 }} />
                <span className="font-mono text-[10px] text-[var(--p-text-2)]">{a.tier}</span>
              </div>
              <h3 className="mt-3 text-lg font-semibold tracking-tight">{a.title}</h3>
              <p className="mt-2 text-sm text-[var(--p-text-2)]">{a.body}</p>
              <ul className="mt-4 space-y-1.5 text-xs text-[var(--p-text-2)]">
                {a.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2">
                    <span
                      className="mt-[6px] inline-block h-1 w-1 shrink-0 rounded-full"
                      style={{ background: "var(--p-accent)" }}
                    />
                    {b}
                  </li>
                ))}
              </ul>
              <div className="mt-5 inline-flex items-center gap-1 text-xs font-medium">
                {t("marketing.pages.solutions.apps.cta")} <ArrowRight size={12} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Industries */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-3xl font-semibold tracking-tight">{t("marketing.pages.solutions.industries.heading")}</h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--p-text-2)]">
          {t("marketing.pages.solutions.industries.body")}
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          {INDUSTRIES.map((i) => (
            <Link key={i.slug} href={`/solutions/${i.slug}`} className="surface hover-lift p-5">
              <div className="text-sm font-semibold">{i.name}</div>
              <div className="mt-1 text-xs text-[var(--p-text-2)]">{i.blurb}</div>
            </Link>
          ))}
        </div>
      </section>

      <FAQSection
        title={t("marketing.pages.solutions.faq.title")}
        faqs={[
          {
            q: t("marketing.pages.solutions.faq.items.0.q"),
            a: t("marketing.pages.solutions.faq.items.0.a"),
          },
          {
            q: t("marketing.pages.solutions.faq.items.1.q"),
            a: t("marketing.pages.solutions.faq.items.1.a"),
          },
          {
            q: t("marketing.pages.solutions.faq.items.2.q"),
            a: t("marketing.pages.solutions.faq.items.2.a"),
          },
          {
            q: t("marketing.pages.solutions.faq.items.3.q"),
            a: t("marketing.pages.solutions.faq.items.3.a"),
          },
        ]}
      />

      <CTASection
        title={t("marketing.pages.solutions.cta.title")}
        primaryLabel={t("marketing.pages.solutions.cta.primaryLabel")}
        primaryHref="/signup"
        secondaryLabel={t("marketing.pages.solutions.cta.secondaryLabel")}
        secondaryHref="/contact"
      />
    </>
  );
}
