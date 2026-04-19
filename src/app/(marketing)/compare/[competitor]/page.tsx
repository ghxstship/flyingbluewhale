// ISR (H2-08 / IK-030) — regenerate static HTML every 5 min.
// Shortens to 60s if editorial cadence picks up; `revalidate` alone is enough,
// no `dynamic = 'force-static'` because some pages read query params.
export const revalidate = 300;

import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Check, X, Minus, Quote, CheckCircle2 } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { FAQSection } from "@/components/marketing/FAQ";
import { CTASection } from "@/components/marketing/CTASection";
import { buildMetadata, faqSchema } from "@/lib/seo";
import { COMPARE, COMPARE_LIST } from "@/lib/compare";

export function generateStaticParams() {
  return COMPARE_LIST.map((c) => ({ competitor: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ competitor: string }> }): Promise<Metadata> {
  const { competitor } = await params;
  const c = COMPARE[competitor];
  if (!c) return buildMetadata({ title: "Compare", description: "", path: `/compare/${competitor}` });
  return buildMetadata({
    title: c.headline,
    description: c.blurb,
    path: `/compare/${c.slug}`,
    keywords: c.keywords,
    ogImageEyebrow: `vs. ${c.competitor}`,
    ogImageTitle: "How we compare.",
  });
}

function Cell({ value }: { value: string | boolean }) {
  if (value === true) return <Check size={16} className="text-[var(--org-primary)]" />;
  if (value === false) return <X size={14} className="text-[var(--text-muted)] opacity-50" />;
  if (value === "—") return <Minus size={14} className="text-[var(--text-muted)]" />;
  return <span className="text-xs text-[var(--text-secondary)]">{value}</span>;
}

export default async function CompareDetail({ params }: { params: Promise<{ competitor: string }> }) {
  const { competitor } = await params;
  const c = COMPARE[competitor];
  if (!c) notFound();

  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Compare", href: "/compare" },
    { label: `vs. ${c.competitor}`, href: `/compare/${c.slug}` },
  ];

  return (
    <div>
      <JsonLd data={[faqSchema(c.faqs)]} />
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--org-primary)]">Compare · flyingbluewhale vs. {c.competitor}</div>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">{c.headline}</h1>
        <p className="mt-5 max-w-3xl text-lg text-[var(--text-secondary)]">{c.hero}</p>
        <div className="surface-raised mt-8 p-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">Bottom line</div>
          <div className="mt-2 text-sm font-medium">{c.bottomLine}</div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Feature-by-feature.</h2>
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead>
              <tr className="border-b border-[var(--border)] text-xs uppercase tracking-wider text-[var(--text-muted)]">
                <th className="py-3 pr-4 font-semibold">Feature</th>
                <th className="py-3 pr-4 text-center font-semibold text-[var(--org-primary)]">flyingbluewhale</th>
                <th className="py-3 pr-4 text-center font-semibold">{c.competitor}</th>
              </tr>
            </thead>
            <tbody>
              {c.features.map((f) => (
                <tr key={f.feature} className="border-b border-[var(--border)]">
                  <td className="py-3 pr-4 text-sm">
                    <div>{f.feature}</div>
                    {f.note && <div className="mt-0.5 text-[11px] text-[var(--text-muted)]">{f.note}</div>}
                  </td>
                  <td className="py-3 pr-4 text-center"><Cell value={f.us} /></td>
                  <td className="py-3 pr-4 text-center"><Cell value={f.them} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Why We Win.</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {c.whyWeWin.map((w) => (
            <div key={w.title} className="surface-raised p-6">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[var(--org-primary)]" />
                <div className="text-sm font-semibold">{w.title}</div>
              </div>
              <p className="mt-3 text-sm text-[var(--text-secondary)]">{w.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="surface-raised p-8">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">When {c.competitor} wins</div>
          <ul className="mt-4 space-y-2 text-sm text-[var(--text-secondary)]">
            {c.whenTheyWin.map((x) => <li key={x}>· {x}</li>)}
          </ul>
        </div>
      </section>

      {c.quote && (
        <section className="mx-auto max-w-4xl px-6 py-12">
          <div className="surface-raised relative p-10">
            <Quote size={48} className="absolute left-6 top-6 text-[var(--org-primary)] opacity-20" />
            <blockquote className="mt-4 text-xl italic">"{c.quote.text}"</blockquote>
            <cite className="mt-4 block text-sm not-italic text-[var(--text-muted)]">— {c.quote.attribution}</cite>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-2xl font-semibold tracking-tight">Migration Path</h2>
        <div className="surface-raised mt-6 p-6">
          <ol className="list-decimal space-y-2 pl-5 text-sm text-[var(--text-secondary)]">
            {c.migration.map((m) => <li key={m}>{m}</li>)}
          </ol>
        </div>
      </section>

      <FAQSection title={`flyingbluewhale vs. ${c.competitor} · FAQ`} faqs={c.faqs} />

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-2xl font-semibold tracking-tight">Other Comparisons</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {COMPARE_LIST.filter((x) => x.slug !== c.slug).map((x) => (
            <Link key={x.slug} href={`/compare/${x.slug}`} className="surface-raised hover-lift p-5">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">vs.</div>
              <div className="mt-2 text-sm font-semibold">{x.competitor}</div>
              <div className="mt-2 text-xs text-[var(--text-muted)]">{x.blurb}</div>
            </Link>
          ))}
        </div>
      </section>

      <CTASection title="Try flyingbluewhale" subtitle="Free for Life on the Access tier. Migrate when you're ready." />
    </div>
  );
}
