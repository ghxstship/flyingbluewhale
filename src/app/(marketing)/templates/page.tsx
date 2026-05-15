import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { CTASection } from "@/components/marketing/CTASection";
import { buildMetadata, breadcrumbSchema } from "@/lib/seo";
import { TEMPLATES } from "@/lib/marketing/templates";

export const metadata: Metadata = buildMetadata({
  title: "Templates — Production Artifacts, Ready to Run",
  description:
    "Pre-built ROS, advancing checklists, riders, call sheets, safety briefs, and vendor onboarding templates — open one in ATLVS in seconds.",
  path: "/templates",
  keywords: [
    "event production templates",
    "festival ROS template",
    "tour advancing checklist",
    "stage rider template",
    "daily safety brief template",
    "incident report form",
    "vendor COI checklist",
  ],
  ogImageEyebrow: "Templates",
  ogImageTitle: "Production Artifacts, Ready To Run.",
});

export default function TemplatesIndex() {
  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Templates", href: "/templates" },
  ];

  return (
    <div>
      <JsonLd data={[breadcrumbSchema(crumbs)]} />
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="eyebrow eyebrow-brand">Templates</div>
        <h1 className="hed-2xl mt-4">Production Artifacts, Ready To Run.</h1>
        <p className="mt-5 max-w-3xl text-lg text-[var(--text-secondary)]">
          ROS, advancing checklists, riders, call sheets, safety briefs, vendor onboarding — the artifacts every
          production team writes from scratch on every show. Pre-built, opinionated, opened in ATLVS in seconds.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {TEMPLATES.map((t) => (
            <Link key={t.slug} href={`/templates/${t.slug}`} className="surface hover-lift p-5">
              <div className="eyebrow eyebrow-brand">{t.category}</div>
              <h3 className="mt-2 text-base font-semibold">{t.title}</h3>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">{t.short}</p>
              <div className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-[var(--org-primary)]">
                Open this template <ArrowRight size={12} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <CTASection
        title="ATLVS Is Open."
        subtitle="Free, forever, for small teams. Open these templates inside ATLVS."
      />
    </div>
  );
}
