import Link from "next/link";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/marketing/Breadcrumb";
import { JsonLd } from "@/components/marketing/JsonLd";
import { CTASection } from "@/components/marketing/CTASection";
import { buildMetadata, breadcrumbSchema } from "@/lib/seo";
import { COMPARE_LIST } from "@/lib/compare";

export const metadata: Metadata = buildMetadata({
  title: "Compare flyingbluewhale to Asana, Monday, and spreadsheets",
  description:
    "Head-to-head comparisons of flyingbluewhale against the tools production teams use today. Honest about when we win and when we don't.",
  path: "/compare",
  keywords: ["flyingbluewhale comparison", "asana alternative events", "monday alternative events", "spreadsheet alternative"],
  ogImageEyebrow: "Compare",
  ogImageTitle: "How we compare.",
});

export default function ComparePage() {
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Compare", path: "/compare" },
  ];

  return (
    <div>
      <JsonLd data={[breadcrumbSchema(crumbs)]} />
      <Breadcrumbs crumbs={crumbs} />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--org-primary)]">Compare</div>
        <h1 className="mt-3 text-5xl font-semibold tracking-tight sm:text-6xl">Head-to-head.</h1>
        <p className="mt-5 max-w-2xl text-lg text-[var(--text-secondary)]">
          Honest comparisons of flyingbluewhale against the tools production teams already use. We'll tell you when
          we win and when we don't.
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

      <CTASection title="Try flyingbluewhale" subtitle="Free forever on the Portal tier. No credit card." />
    </div>
  );
}
