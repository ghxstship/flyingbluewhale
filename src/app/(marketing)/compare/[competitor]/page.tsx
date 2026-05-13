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
import { buildMetadata, faqSchema, breadcrumbSchema, reviewSchema, CANONICAL_CTAS } from "@/lib/seo";
import { Button } from "@/components/ui/Button";
import { COMPARE, COMPARE_LIST } from "@/lib/compare";

export function generateStaticParams() {
  return COMPARE_LIST.map((c) => ({ competitor: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ competitor: string }> }): Promise<Metadata> {
  const { competitor } = await params;
  const c = COMPARE[competitor];
  if (!c) return buildMetadata({ title: "Compare", description: "", path: `/compare/${competitor}` });
  return buildMetadata({
    title: `ATLVS Technologies vs. ${c.competitor}`,
    description: c.blurb,
    path: `/compare/${c.slug}`,
    keywords: c.keywords,
    ogImageEyebrow: `vs. ${c.competitor}`,
    ogImageTitle: "What we are.",
  });
}

function CellMark({ value }: { value: string | boolean }) {
  if (value === true) return <Check size={16} className="text-[var(--success)]" aria-label="Yes" />;
  if (value === false) return <X size={16} className="text-[var(--text-muted)]" aria-label="No" />;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-[var(--text-secondary)]">
      <Minus size={12} className="text-[var(--text-muted)]" />
      {value}
    </span>
  );
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
      <JsonLd
        data={[
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
        <div className="text-xs font-semibold tracking-[0.25em] text-[var(--org-primary)] uppercase">
          ATLVS vs. {c.competitor}
        </div>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">{c.headline}</h1>
        <p className="mt-5 max-w-3xl text-lg text-[var(--text-secondary)]">{c.hero}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href={CANONICAL_CTAS.primary.href}>{CANONICAL_CTAS.primary.label}</Button>
          <Button href={CANONICAL_CTAS.secondary.href} variant="secondary">
            {CANONICAL_CTAS.secondary.label}
          </Button>
        </div>
        <div className="surface mt-8 p-5">
          <div className="text-[11px] font-semibold tracking-[0.2em] text-[var(--text-muted)] uppercase">
            Bottom line
          </div>
          <div className="mt-2 text-sm font-medium">{c.bottomLine}</div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Feature Comparison.</h2>
        <p className="mt-3 max-w-2xl text-sm text-[var(--text-secondary)]">Side by side, without the marketing math.</p>
        <div className="surface mt-8 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-color)] bg-[var(--surface-inset)]">
                  <th className="px-4 py-3 text-left text-[11px] font-semibold tracking-[0.2em] text-[var(--text-muted)] uppercase">
                    Feature
                  </th>
                  <th
                    className="px-4 py-3 text-left text-[11px] font-semibold tracking-[0.2em] uppercase"
                    style={{ color: "var(--org-primary)" }}
                  >
                    ATLVS
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold tracking-[0.2em] text-[var(--text-muted)] uppercase">
                    {c.competitor}
                  </th>
                </tr>
              </thead>
              <tbody>
                {c.features.map((row) => (
                  <tr key={row.feature} className="border-b border-[var(--border-color)] last:border-b-0">
                    <td className="px-4 py-3 align-top">
                      <div className="font-medium">{row.feature}</div>
                      {row.note ? <div className="mt-1 text-xs text-[var(--text-muted)]">{row.note}</div> : null}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <CellMark value={row.us} />
                    </td>
                    <td className="px-4 py-3 align-top">
                      <CellMark value={row.them} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-3xl font-semibold tracking-tight">Where We Win.</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {c.whyWeWin.map((w) => (
            <div key={w.title} className="surface p-6">
              <div className="text-sm font-semibold">{w.title}</div>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">{w.body}</p>
            </div>
          ))}
        </div>
      </section>

      {c.whenTheyWin.length > 0 ? (
        <section className="mx-auto max-w-6xl px-6 py-12">
          <h2 className="text-2xl font-semibold tracking-tight">When {c.competitor} Wins.</h2>
          <p className="mt-3 max-w-2xl text-sm text-[var(--text-secondary)]">
            We're not the answer to every problem. These are the cases where they're the right call.
          </p>
          <ul className="mt-6 space-y-3 text-sm">
            {c.whenTheyWin.map((w) => (
              <li key={w} className="flex items-start gap-2">
                <span className="status-dot status-dot-warning mt-2" />
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
            <figcaption className="mt-4 text-xs tracking-wide text-[var(--text-muted)] uppercase">
              — {c.quote.attribution}
            </figcaption>
          </figure>
        </section>
      ) : null}

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-2xl font-semibold tracking-tight">Migration Path.</h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--text-secondary)]">For teams moving from {c.competitor}.</p>
        <div className="surface mt-6 p-6">
          <ol className="list-decimal space-y-2 pl-5 text-sm text-[var(--text-secondary)]">
            {c.migration.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ol>
        </div>
        <div className="mt-6">
          <Link href={`/alternatives/${c.slug}`} className="text-sm font-medium text-[var(--org-primary)]">
            Read the long-form on {c.competitor} alternatives →
          </Link>
        </div>
      </section>

      <FAQSection title={`vs. ${c.competitor} · FAQ`} faqs={c.faqs} />

      <CTASection title="The Console Is Open." subtitle="Free forever for small teams. Migrate when you're ready." />
    </div>
  );
}
