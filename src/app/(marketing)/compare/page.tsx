// ISR — regenerate static HTML every 5 min.
export const revalidate = 300;

import Link from "next/link";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { CTASection } from "@/components/marketing/CTASection";
import { buildMetadata } from "@/lib/seo";
import { COMPARE_LIST } from "@/lib/compare";

export const metadata: Metadata = buildMetadata({
  title: "From the General-Purpose Tools",
  description: "Notes for teams arriving from a general-purpose tool. We don't run scorecards. We define what we are.",
  path: "/compare",
  keywords: ["ATLVS Technologies comparison"],
  ogImageEyebrow: "Category Notes",
  ogImageTitle: "We Don't Compare. We Define.",
});

export default function ComparePage() {
  const crumbs = [
    { label: "Home", href: "/" },
    { label: "From general-purpose tools", href: "/compare" },
  ];

  return (
    <div>
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="text-xs font-semibold tracking-[0.25em] text-[var(--org-primary)] uppercase">
          Category Notes
        </div>
        <h1 className="hed-2xl mt-3">We Don&apos;t Compare. We Define.</h1>
        <p className="mt-5 max-w-2xl text-lg text-[var(--text-secondary)]">
          Producers land here because a general-purpose tool taught them what they didn&apos;t want. These pages are
          notes for the search engine — what we are, said plainly. No scorecards.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid gap-4 md:grid-cols-3">
          {COMPARE_LIST.map((c) => (
            <Link key={c.slug} href={`/compare/${c.slug}`} className="surface hover-lift p-6">
              <div className="text-[11px] font-semibold tracking-[0.2em] text-[var(--text-muted)] uppercase">
                Coming from {c.competitor}
              </div>
              <div className="hed-lg mt-3">Read the notes</div>
              <div className="mt-3 text-sm text-[var(--text-secondary)]">{c.blurb}</div>
            </Link>
          ))}
        </div>
      </section>

      <CTASection
        title="ATLVS Is Open."
        subtitle="Free forever for small teams."
      />
    </div>
  );
}
