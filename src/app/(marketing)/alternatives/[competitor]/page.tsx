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
import { buildMetadata, faqSchema, breadcrumbSchema, CANONICAL_CTAS } from "@/lib/seo";
import { COMPARE, COMPARE_LIST } from "@/lib/compare";

export function generateStaticParams() {
  return COMPARE_LIST.map((c) => ({ competitor: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ competitor: string }> }): Promise<Metadata> {
  const { competitor } = await params;
  const c = COMPARE[competitor];
  if (!c) return buildMetadata({ title: "Alternatives", description: "", path: `/alternatives/${competitor}` });
  return buildMetadata({
    title: `${c.competitor} Alternatives for Production Teams`,
    description: `Looking for an alternative to ${c.competitor}? Here's what production teams reach for and why.`,
    path: `/alternatives/${c.slug}`,
    keywords: [
      `${c.competitor} alternative`,
      `alternative to ${c.competitor}`,
      `${c.competitor} vs ATLVS`,
      ...(c.keywords ?? []),
    ],
    ogImageEyebrow: `${c.competitor} Alternatives`,
    ogImageTitle: `For Production Teams.`,
  });
}

export default async function AlternativesPage({ params }: { params: Promise<{ competitor: string }> }) {
  const { competitor } = await params;
  const c = COMPARE[competitor];
  if (!c) notFound();

  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Alternatives", href: "/alternatives" },
    { label: `${c.competitor} alternatives`, href: `/alternatives/${c.slug}` },
  ];

  // Pros/cons derived from the comparison data — pros are the features the
  // competitor handles, cons are the features they don't. Keeps both pages
  // in lockstep.
  const pros = c.features.filter((f) => f.them === true).slice(0, 5);
  const cons = c.features.filter((f) => f.them === false).slice(0, 5);

  return (
    <div>
      <JsonLd data={[breadcrumbSchema(crumbs), faqSchema(c.faqs)]} />
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="eyebrow eyebrow-brand">{c.competitor} Alternatives</div>
        <h1 className="hed-xl mt-4">{c.competitor} Alternatives, For Production Teams.</h1>
        <p className="mt-5 max-w-3xl text-lg text-[var(--text-secondary)]">
          If you're searching for an alternative to {c.competitor}, you've probably outgrown one of these: the per-seat
          cost math, missing production primitives, or the workflow that doesn't survive the second show. Here's what to
          look at — and what's worked for teams that switched.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="hed-xl">What {c.competitor} Does Well.</h2>
        <p className="mt-3 max-w-2xl text-sm text-[var(--text-secondary)]">
          Setting the record straight before talking alternatives. {c.competitor} earned its place — here's where it
          shines.
        </p>
        <ul className="mt-6 space-y-3 text-sm">
          {pros.length > 0 ? (
            pros.map((p) => (
              <li key={p.feature} className="flex items-start gap-2">
                <span className="status-dot status-dot-success mt-2" />
                <span>{p.feature}</span>
              </li>
            ))
          ) : (
            <li className="text-[var(--text-muted)]">Strong category presence and brand recognition.</li>
          )}
          {c.whenTheyWin.map((w) => (
            <li key={w} className="flex items-start gap-2">
              <span className="status-dot status-dot-success mt-2" />
              <span>{w}</span>
            </li>
          ))}
        </ul>
      </section>

      {cons.length > 0 ? (
        <section className="mx-auto max-w-6xl px-6 py-12">
          <h2 className="hed-xl">Where Production Teams Hit The Wall.</h2>
          <p className="mt-3 max-w-2xl text-sm text-[var(--text-secondary)]">
            These are the gaps we hear from teams searching for an alternative. Your mileage may vary.
          </p>
          <ul className="mt-6 space-y-3 text-sm">
            {cons.map((p) => (
              <li key={p.feature} className="flex items-start gap-2">
                <span className="status-dot status-dot-error mt-2" />
                <span>{p.feature}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="surface p-8 md:p-10">
          <div className="eyebrow eyebrow-brand">The ATLVS Alternative</div>
          <h2 className="hed-lg mt-3">{c.headline}</h2>
          <p className="mt-4 text-sm text-[var(--text-secondary)]">{c.hero}</p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {c.whyWeWin.slice(0, 3).map((w) => (
              <div
                key={w.title}
                className="rounded-lg border border-[var(--border-color)] bg-[var(--surface-inset)] p-4"
              >
                <div className="text-sm font-semibold">{w.title}</div>
                <p className="mt-2 text-xs text-[var(--text-secondary)]">{w.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button href={CANONICAL_CTAS.primary.href}>{CANONICAL_CTAS.primary.label}</Button>
            <Button href={`/compare/${c.slug}`} variant="secondary">
              Head-to-head comparison →
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="hed-lg">How To Migrate.</h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--text-secondary)]">
          The path teams take to move off {c.competitor}.
        </p>
        <div className="surface mt-6 p-6">
          <ol className="list-decimal space-y-2 pl-5 text-sm text-[var(--text-secondary)]">
            {c.migration.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ol>
        </div>
      </section>

      <FAQSection title={`${c.competitor} Alternatives · FAQ`} faqs={c.faqs} />

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="hed-lg">Other Alternatives To Consider.</h2>
        <p className="mt-3 text-sm text-[var(--text-secondary)]">See how production teams evaluate other tools.</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {COMPARE_LIST.filter((other) => other.slug !== c.slug)
            .slice(0, 12)
            .map((other) => (
              <Link key={other.slug} href={`/alternatives/${other.slug}`} className="surface hover-lift p-4 text-sm">
                <div className="font-medium">{other.competitor} alternatives</div>
              </Link>
            ))}
        </div>
      </section>

      <CTASection title="ATLVS Is Open." subtitle="Free forever for small teams. Migrate when you're ready." />
    </div>
  );
}
