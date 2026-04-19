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
import { MARKETING_GUIDE_LIST } from "@/lib/marketing-guides";

export const metadata: Metadata = buildMetadata({
  title: "Guides — production ops, advancing, and KBYG",
  description:
    "Long-form guides to production operations. Event advancing, Know Before You Go, and the modern production-ops platform thesis. Written by operators.",
  path: "/guides",
  keywords: ["event production guides", "advancing guide", "KBYG guide", "production operations guide"],
  ogImageEyebrow: "Guides",
  ogImageTitle: "Written by operators.",
});

export default function GuidesPage() {
  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Guides", href: "/guides" },
  ];

  return (
    <div>
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <section className="mx-auto max-w-4xl px-6 pt-8 pb-10">
        <div className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--org-primary)]">Guides</div>
        <h1 className="mt-3 text-5xl font-semibold tracking-tight sm:text-6xl">Written by Operators.</h1>
        <p className="mt-5 max-w-2xl text-lg text-[var(--text-secondary)]">
          Deep-dive guides to the fundamentals of production operations — the disciplines, the taxonomies, and the
          tooling that makes a show work.
        </p>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-8">
        <ul className="space-y-4">
          {MARKETING_GUIDE_LIST.map((g) => (
            <li key={g.slug}>
              <Link href={`/guides/${g.slug}`} className="surface-raised hover-lift block p-6">
                <div className="font-mono text-xs text-[var(--text-muted)]">{g.readingTime}</div>
                <div className="mt-2 text-xl font-semibold tracking-tight">{g.title}</div>
                <div className="mt-2 text-sm text-[var(--text-secondary)]">{g.blurb}</div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <CTASection title="Ship your ops" subtitle="Start free on the Access tier." />
    </div>
  );
}
