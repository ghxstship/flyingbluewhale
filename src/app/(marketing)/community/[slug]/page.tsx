import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CheckCircle2, Quote } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Badge } from "@/components/ui/Badge";
import { JsonLd } from "@/components/marketing/JsonLd";
import { CTASection } from "@/components/marketing/CTASection";
import { buildMetadata, articleSchema } from "@/lib/seo";
import { urlFor } from "@/lib/urls";
import { COMMUNITY, COMMUNITY_LIST } from "@/lib/community";
import { getRequestT } from "@/lib/i18n/request";

export function generateStaticParams() {
  return COMMUNITY_LIST.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { t } = await getRequestT();
  const c = COMMUNITY[slug];
  if (!c)
    return buildMetadata({
      title: t("marketing.pages.community.detail.metadata.fallbackTitle"),
      description: "",
      path: `/community/${slug}`,
    });
  return buildMetadata({
    title: `${c.name} — ${c.headline}`,
    description: c.blurb,
    path: `/community/${c.slug}`,
    keywords: c.keywords,
    ogImageEyebrow: t("marketing.pages.community.detail.metadata.ogEyebrow"),
    ogImageTitle: c.name,
  });
}

export default async function CaseStudy({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { t } = await getRequestT();
  const c = COMMUNITY[slug];
  if (!c) notFound();

  const crumbs = [
    { label: t("marketing.pages.community.detail.breadcrumbs.home"), href: "/" },
    { label: t("marketing.pages.community.detail.breadcrumbs.community"), href: "/community" },
    { label: c.name, href: `/community/${c.slug}` },
  ];

  return (
    <div>
      <JsonLd
        data={[
          articleSchema({
            headline: c.headline,
            description: c.blurb,
            datePublished: "2026-01-01",
            url: urlFor("marketing", `/community/`),
          }),
        ]}
      />
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="eyebrow eyebrow-brand">
          {t("marketing.pages.community.detail.hero.eyebrow")} · {c.industry}
        </div>
        <h1 className="hed-xl mt-4">{c.headline}</h1>
        <p className="mt-5 max-w-3xl text-lg text-[var(--p-text-2)]">{c.hero}</p>
        <div className="mt-3 font-mono text-xs text-[var(--p-text-2)]">{c.timeline}</div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          {c.stats.map((s) => (
            <div key={s.label} className="surface p-5">
              <div className="hed-xl text-[var(--p-accent)]">{s.value}</div>
              <div className="eyebrow mt-2">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="surface p-6">
            <div className="eyebrow">{t("marketing.pages.community.detail.sections.challenge")}</div>
            <ul className="mt-4 space-y-3 text-sm text-[var(--p-text-2)]">
              {c.challenge.map((x) => (
                <li key={x}>· {x}</li>
              ))}
            </ul>
          </div>
          <div className="surface p-6">
            <div className="eyebrow">{t("marketing.pages.community.detail.sections.solution")}</div>
            <ul className="mt-4 space-y-3 text-sm text-[var(--p-text-2)]">
              {c.solution.map((x) => (
                <li key={x}>· {x}</li>
              ))}
            </ul>
          </div>
          <div className="surface p-6">
            <div className="eyebrow">{t("marketing.pages.community.detail.sections.outcome")}</div>
            <ul className="mt-4 space-y-3 text-sm">
              {c.outcome.map((x) => (
                <li key={x} className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-[var(--p-accent)]" />
                  <span>{x}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-12">
        <div className="surface relative p-10">
          <Quote size={48} className="absolute start-6 top-6 text-[var(--p-accent)] opacity-20" />
          <blockquote className="mt-4 text-xl text-[var(--p-text-1)] italic">"{c.quote.text}"</blockquote>
          <cite className="mt-4 block text-sm text-[var(--p-text-2)] not-italic">— {c.quote.attribution}</cite>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="surface p-8">
          <div className="eyebrow">{t("marketing.pages.community.detail.modules.label")}</div>
          <div className="mt-4 flex flex-wrap gap-2">
            {c.modules.map((m) => (
              <Badge key={m} variant="brand-soft">
                {m}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex items-center justify-between">
          <h2 className="hed-lg">{t("marketing.pages.community.detail.more.title")}</h2>
          <Link href="/community" className="text-sm text-[var(--p-accent)]">
            {t("marketing.pages.community.detail.more.seeAll")}
          </Link>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {COMMUNITY_LIST.filter((x) => x.slug !== c.slug).map((x) => (
            <Link key={x.slug} href={`/community/${x.slug}`} className="surface hover-lift p-5">
              <div className="text-sm font-semibold">{x.name}</div>
              <div className="mt-1 text-xs text-[var(--p-text-2)]">{x.blurb}</div>
            </Link>
          ))}
        </div>
      </section>

      <CTASection
        title={t("marketing.pages.community.detail.cta.title")}
        subtitle={t("marketing.pages.community.detail.cta.subtitle")}
      />
    </div>
  );
}
