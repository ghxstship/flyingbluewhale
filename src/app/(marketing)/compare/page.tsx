// ISR (H2-08 / IK-030) — regenerate static HTML every 5 min.
// Shortens to 60s if editorial cadence picks up; `revalidate` alone is enough,
// no `dynamic = 'force-static'` because some pages read query params.
export const revalidate = 300;

import Link from "next/link";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { CTASection } from "@/components/marketing/CTASection";
import { buildMetadata } from "@/lib/seo";
import { COMPARE_LIST } from "@/lib/compare";

export const metadata: Metadata = buildMetadata({
  title: "Compare — Head-to-Head with Asana, Monday, Spreadsheets",
  description:
    "Honest head-to-head. Asana is a to-do list in a suit. Monday is a spreadsheet that learned to smile. We run shows. Read the bill.",
  path: "/compare",
  keywords: ["Second Star Technologies comparison", "asana alternative events", "monday alternative events", "spreadsheet alternative"],
  ogImageEyebrow: "Head-to-Head",
  ogImageTitle: "Read the bill.",
});

export default function ComparePage() {
  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Compare", href: "/compare" },
  ];

  return (
    <div>
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--org-primary)]">Read the bill</div>
        <h1 className="mt-3 text-5xl font-semibold tracking-tight sm:text-6xl">Head-to-Head.</h1>
        <p className="mt-5 max-w-2xl text-lg text-[var(--text-secondary)]">
          Honest comparisons against the tools already on your tour rider. We&apos;ll tell you when we win. We&apos;ll tell you when we don&apos;t. No chart-of-fives sales trick — we respect you too much.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid gap-4 md:grid-cols-3">
          {COMPARE_LIST.map((c) => (
            <Link key={c.slug} href={`/compare/${c.slug}`} className="surface-raised hover-lift p-6">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">vs.</div>
              <div className="mt-3 text-2xl font-semibold tracking-tight">{c.competitor}</div>
              <div className="mt-3 text-sm text-[var(--text-secondary)]">{c.blurb}</div>
            </Link>
          ))}
        </div>
      </section>

      <CTASection title="Pick the Show You&apos;re Running." subtitle="GA is free, forever. No card. No rehearsal required." />
    </div>
  );
}
