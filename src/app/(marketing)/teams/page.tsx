import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { CTASection } from "@/components/marketing/CTASection";
import { buildMetadata, breadcrumbSchema } from "@/lib/seo";
import { TEAMS } from "@/lib/marketing/teams";

export const metadata: Metadata = buildMetadata({
  title: "Built For Production Roles — Tour, Production, Stage, Festival, Site, Tech, Talent, EHS",
  description:
    "ATLVS Technologies is tuned to the role you actually run. Per-role landing pages with the modules each persona lives in, the workflows that matter, and the FAQs they ask.",
  path: "/teams",
  keywords: [
    "production software by role",
    "tour manager software",
    "production manager software",
    "stage manager software",
    "festival director software",
    "EHS lead software",
    "TD software event production",
  ],
  ogImageEyebrow: "Built For",
  ogImageTitle: "The Role You Run.",
});

export default function TeamsHub() {
  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Built For", href: "/teams" },
  ];

  return (
    <div>
      <JsonLd data={[breadcrumbSchema(crumbs)]} />
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="text-xs font-semibold tracking-[0.25em] text-[var(--org-primary)] uppercase">Built For</div>
        <h1 className="mt-3 text-5xl font-semibold tracking-tight text-balance sm:text-7xl">The Role You Run.</h1>
        <p className="mt-5 max-w-3xl text-lg text-[var(--text-secondary)]">
          One platform, eight production roles. Each gets the modules they live in day-to-day, the workflows that move
          first, and the FAQs operators actually ask. Same backbone, different starting point.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3">
          {TEAMS.map((t) => (
            <Link key={t.slug} href={`/teams/${t.slug}`} className="surface hover-lift p-6">
              <div className="text-[11px] font-semibold tracking-[0.2em] text-[var(--org-primary)] uppercase">
                {t.hero.eyebrow}
              </div>
              <h3 className="mt-2 text-lg font-semibold">{t.role}</h3>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">{t.blurb}</p>
              <div className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-[var(--org-primary)]">
                See the fit <ArrowRight size={12} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <CTASection
        title="The Console Is Open."
        subtitle="Free, forever, for small teams. Per-org pricing the rest of the way up."
      />
    </div>
  );
}
