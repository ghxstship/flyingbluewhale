import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { CTASection } from "@/components/marketing/CTASection";
import { buildMetadata, breadcrumbSchema } from "@/lib/seo";
import { JsonLd } from "@/components/marketing/JsonLd";
import { COMPARE_LIST } from "@/lib/compare";

export const metadata: Metadata = buildMetadata({
  title: "Alternatives — Production Software, Side By Side",
  description:
    "Looking for an alternative? Here's how production teams evaluate Cvent, Procore, DocuSign, Monday, Notion, and the rest.",
  path: "/alternatives",
  keywords: [
    "production software alternatives",
    "event management software alternatives",
    "Cvent alternatives",
    "Procore alternatives events",
    "tour management alternatives",
  ],
  ogImageEyebrow: "Alternatives",
  ogImageTitle: "Production Software, Side By Side.",
});

export default function AlternativesIndex() {
  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Alternatives", href: "/alternatives" },
  ];

  return (
    <div>
      <JsonLd data={[breadcrumbSchema(crumbs)]} />
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="text-xs font-semibold tracking-[0.25em] text-[var(--org-primary)] uppercase">Alternatives</div>
        <h1 className="mt-3 text-5xl font-semibold tracking-tight text-balance sm:text-6xl">
          Production Software, Side By Side.
        </h1>
        <p className="mt-5 max-w-3xl text-lg text-[var(--text-secondary)]">
          Each page below is the long-form on a tool production teams commonly evaluate — what it does well, where the
          gaps land for live work, and what teams reach for instead.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {COMPARE_LIST.map((c) => (
            <Link key={c.slug} href={`/alternatives/${c.slug}`} className="surface hover-lift p-5">
              <div className="text-sm font-semibold">{c.competitor} alternatives</div>
              <p className="mt-2 text-xs text-[var(--text-secondary)]">{c.blurb}</p>
              <div className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-[var(--org-primary)]">
                Read the long-form <ArrowRight size={12} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <CTASection title="ATLVS Is Open." subtitle="Free forever for small teams. Migrate when you're ready." />
    </div>
  );
}
