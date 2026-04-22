import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CheckCircle2, Quote } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Badge } from "@/components/ui/Badge";
import { JsonLd } from "@/components/marketing/JsonLd";
import { CTASection } from "@/components/marketing/CTASection";
import { buildMetadata, articleSchema } from "@/lib/seo";
import { COMMUNITY, COMMUNITY_LIST } from "@/lib/community";

export function generateStaticParams() {
  return COMMUNITY_LIST.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = COMMUNITY[slug];
  if (!c) return buildMetadata({ title: "Case study", description: "", path: `/community/${slug}` });
  return buildMetadata({
    title: `${c.name} — ${c.headline}`,
    description: c.blurb,
    path: `/community/${c.slug}`,
    keywords: c.keywords,
    ogImageEyebrow: "Case study",
    ogImageTitle: c.name,
  });
}

export default async function CaseStudy({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = COMMUNITY[slug];
  if (!c) notFound();

  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Community", href: "/community" },
    { label: c.name, href: `/community/${c.slug}` },
  ];

  return (
    <div>
      <JsonLd
        data={[articleSchema({
            headline: c.headline,
            description: c.blurb,
            datePublished: "2026-01-01",
            url: `https://flyingbluewhale.app/community/${c.slug}`,
          }),
        ]}
      />
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--org-primary)]">Case study · {c.industry}</div>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">{c.headline}</h1>
        <p className="mt-5 max-w-3xl text-lg text-[var(--text-secondary)]">{c.hero}</p>
        <div className="mt-3 font-mono text-xs text-[var(--text-muted)]">{c.timeline}</div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          {c.stats.map((s) => (
            <div key={s.label} className="surface-raised p-5">
              <div className="text-3xl font-semibold tracking-tight text-[var(--org-primary)]">{s.value}</div>
              <div className="mt-2 text-[11px] uppercase tracking-wider text-[var(--text-muted)]">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="surface-raised p-6">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">Challenge</div>
            <ul className="mt-4 space-y-3 text-sm text-[var(--text-secondary)]">
              {c.challenge.map((x) => <li key={x}>· {x}</li>)}
            </ul>
          </div>
          <div className="surface-raised p-6">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">Solution</div>
            <ul className="mt-4 space-y-3 text-sm text-[var(--text-secondary)]">
              {c.solution.map((x) => <li key={x}>· {x}</li>)}
            </ul>
          </div>
          <div className="surface-raised p-6">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">Outcome</div>
            <ul className="mt-4 space-y-3 text-sm">
              {c.outcome.map((x) => (
                <li key={x} className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-[var(--org-primary)]" />
                  <span>{x}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-12">
        <div className="surface-raised relative p-10">
          <Quote size={48} className="absolute left-6 top-6 text-[var(--org-primary)] opacity-20" />
          <blockquote className="mt-4 text-xl italic text-[var(--text-primary)]">"{c.quote.text}"</blockquote>
          <cite className="mt-4 block text-sm not-italic text-[var(--text-muted)]">— {c.quote.attribution}</cite>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="surface-raised p-8">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">Modules used</div>
          <div className="mt-4 flex flex-wrap gap-2">
            {c.modules.map((m) => (
              <Badge key={m} variant="brand-soft">{m}</Badge>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">More from the community</h2>
          <Link href="/community" className="text-sm text-[var(--org-primary)]">See all →</Link>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {COMMUNITY_LIST.filter((x) => x.slug !== c.slug).map((x) => (
            <Link key={x.slug} href={`/community/${x.slug}`} className="surface-raised hover-lift p-5">
              <div className="text-sm font-semibold">{x.name}</div>
              <div className="mt-1 text-xs text-[var(--text-muted)]">{x.blurb}</div>
            </Link>
          ))}
        </div>
      </section>

      <CTASection title="Ship your next show on Second Star Technologies" subtitle="Free on the Access tier. 14-day trial of Professional." />
    </div>
  );
}
