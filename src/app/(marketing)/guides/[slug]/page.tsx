// ISR (H2-08 / IK-030) — regenerate static HTML every 5 min.
// Shortens to 60s if editorial cadence picks up; `revalidate` alone is enough,
// no `dynamic = 'force-static'` because some pages read query params.
export const revalidate = 300;

import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/marketing/Breadcrumb";
import { JsonLd } from "@/components/marketing/JsonLd";
import { FAQSection } from "@/components/marketing/FAQ";
import { CTASection } from "@/components/marketing/CTASection";
import { buildMetadata, breadcrumbSchema, articleSchema, faqSchema } from "@/lib/seo";
import { MARKETING_GUIDES, MARKETING_GUIDE_LIST } from "@/lib/marketing-guides";

export function generateStaticParams() {
  return MARKETING_GUIDE_LIST.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const g = MARKETING_GUIDES[slug];
  if (!g) return buildMetadata({ title: "Guide", description: "", path: `/guides/${slug}` });
  return buildMetadata({
    title: g.title,
    description: g.blurb,
    path: `/guides/${g.slug}`,
    keywords: g.keywords,
    ogImageEyebrow: "Guide",
    ogImageTitle: g.title,
  });
}

export default async function GuideDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = MARKETING_GUIDES[slug];
  if (!g) notFound();

  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Guides", path: "/guides" },
    { name: g.title, path: `/guides/${g.slug}` },
  ];

  return (
    <div>
      <JsonLd
        data={[
          breadcrumbSchema(crumbs),
          articleSchema({
            headline: g.title,
            description: g.blurb,
            datePublished: "2026-04-01",
            url: `https://flyingbluewhale.app/guides/${g.slug}`,
          }),
          faqSchema(g.faqs),
        ]}
      />
      <Breadcrumbs crumbs={crumbs} />

      <article className="mx-auto max-w-3xl px-6 pt-8 pb-12">
        <div className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--org-primary)]">Guide</div>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">{g.title}</h1>
        <div className="mt-3 font-mono text-xs text-[var(--text-muted)]">{g.readingTime}</div>
        <p className="mt-6 text-lg text-[var(--text-secondary)]">{g.hero}</p>

        <div className="surface-raised mt-8 p-6">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">TL;DR</div>
          <div className="mt-2 text-sm">{g.tldr}</div>
        </div>

        <div className="mt-12 space-y-10 text-[15px] leading-7 text-[var(--text-secondary)]">
          {g.sections.map((s, i) => (
            <section key={i}>
              <h2 className="mt-10 text-2xl font-semibold tracking-tight text-[var(--text-primary)]">{s.heading}</h2>
              {s.body.map((p, j) => (
                p === "" ? <div key={j} className="h-2" /> : <p key={j} className="mt-4">{p}</p>
              ))}
              {s.list && (
                <ul className="mt-4 ml-5 list-disc space-y-1.5">
                  {s.list.map((item) => <li key={item}>{item}</li>)}
                </ul>
              )}
            </section>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap gap-1.5 border-t border-[var(--border)] pt-6">
          {g.keywords.map((k) => (
            <span key={k} className="rounded-full bg-[var(--surface-inset)] px-2.5 py-1 text-[11px] text-[var(--text-muted)]">
              {k}
            </span>
          ))}
        </div>
      </article>

      <FAQSection title={`${g.title} · FAQ`} faqs={g.faqs} />

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-2xl font-semibold tracking-tight">Other guides</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {MARKETING_GUIDE_LIST.filter((x) => x.slug !== g.slug).map((x) => (
            <Link key={x.slug} href={`/guides/${x.slug}`} className="surface-raised hover-lift p-5">
              <div className="text-sm font-semibold">{x.title}</div>
              <div className="mt-1 text-xs text-[var(--text-muted)]">{x.blurb}</div>
            </Link>
          ))}
        </div>
      </section>

      <CTASection title="Run your ops on flyingbluewhale" subtitle="Start free. No credit card." />
    </div>
  );
}
