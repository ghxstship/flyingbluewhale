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
  title: "Category Notes",
  description:
    "Short notes on how the Atlas sits against the general-purpose tools producers still juggle. No point-by-point scorecards — just the posture.",
  path: "/compare",
  keywords: ["Second Star Technologies comparison", "asana alternative events", "monday alternative events", "spreadsheet alternative"],
  ogImageEyebrow: "Category Notes",
  ogImageTitle: "The Atlas, in context.",
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
        <div className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--org-primary)]">Category Notes</div>
        <h1 className="mt-3 text-5xl font-semibold tracking-tight sm:text-6xl">The Atlas, in Context.</h1>
        <p className="mt-5 max-w-2xl text-lg text-[var(--text-secondary)]">
          Producers land here because a general-purpose tool taught them what they didn&apos;t want. These pages are notes for the search-engine crawl, not scorecards. We don&apos;t compare. We define.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid gap-4 md:grid-cols-3">
          {COMPARE_LIST.map((c) => (
            <Link key={c.slug} href={`/compare/${c.slug}`} className="surface-raised hover-lift p-6">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">Landed from {c.competitor}</div>
              <div className="mt-3 text-2xl font-semibold tracking-tight">Read the notes</div>
              <div className="mt-3 text-sm text-[var(--text-secondary)]">{c.blurb}</div>
            </Link>
          ))}
        </div>
      </section>

      <CTASection title="The Room Is Ready." subtitle="GA is free, forever. No card. No rehearsal required." />
    </div>
  );
}
