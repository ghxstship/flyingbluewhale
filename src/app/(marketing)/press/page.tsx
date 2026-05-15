import Link from "next/link";
import type { Metadata } from "next";
import { Download, Mail } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { CTASection } from "@/components/marketing/CTASection";
import { Button } from "@/components/ui/Button";
import { buildMetadata, breadcrumbSchema, SITE, CANONICAL_CTAS } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Press — Brand, Logos, Spokespersons",
  description:
    "Press kit, brand guidelines, logo lockups, and spokesperson contact for journalists, analysts, and partners covering ATLVS Technologies.",
  path: "/press",
  keywords: ["ATLVS press kit", "ATLVS Technologies brand", "ATLVS media kit", "press contact"],
  ogImageEyebrow: "Press",
  ogImageTitle: "Press + Brand.",
});

const FACTS = [
  { label: "Legal name", value: "ATLVS Technologies, Inc." },
  { label: "Brand", value: "ATLVS" },
  { label: "Parent", value: "GHXSTSHIP Industries" },
  { label: "Founded", value: "2024" },
  { label: "Apex domain", value: SITE.domain },
  { label: "Categories", value: "Production operations · live event ops · advancing platform" },
  {
    label: "Sub-products",
    value:
      "ATLVS (production operations workspace, red) · GVTEWAY (stakeholder portal, blue) · COMPVSS (field PWA, yellow)",
  },
];

export default function PressPage() {
  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Press", href: "/press" },
  ];

  return (
    <div>
      <JsonLd data={[breadcrumbSchema(crumbs)]} />
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="eyebrow eyebrow-brand">Press</div>
        <h1 className="hed-3xl mt-4">Press + Brand.</h1>
        <p className="mt-5 max-w-3xl text-lg text-[var(--text-secondary)]">
          For journalists, analysts, and partners covering ATLVS. Quick facts below; full press kit landing Q4.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="hed-lg">Quick Facts.</h2>
        <div className="surface mt-6 overflow-hidden">
          {FACTS.map((f, i) => (
            <div
              key={f.label}
              className={`grid grid-cols-1 gap-2 p-5 sm:grid-cols-[160px_1fr] ${i < FACTS.length - 1 ? "border-b border-[var(--border-color)]" : ""}`}
            >
              <div className="eyebrow">{f.label}</div>
              <div className="text-sm">{f.value}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="surface relative overflow-hidden p-8 md:p-10">
          <span
            className="absolute inset-x-0 top-0 h-1"
            style={{ background: "linear-gradient(90deg, var(--org-primary), var(--org-accent))" }}
          />
          <div className="eyebrow eyebrow-brand">Coming Soon</div>
          <h2 className="hed-lg mt-3">Full Press Kit.</h2>
          <p className="mt-3 max-w-2xl text-sm text-[var(--text-secondary)]">
            Logo lockups (full color, mono, knockout) in SVG + PNG. Brand guidelines (typography, color tokens,
            spacing). Product screenshot library across all three shells. Founder bios + headshots. Q4 launch.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button href="/contact" variant="secondary">
              <Download size={14} className="mr-1.5" aria-hidden="true" />
              Request preview kit
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="surface p-8">
          <div className="eyebrow">Press Contact</div>
          <div className="mt-3 flex items-center gap-2 text-sm">
            <Mail size={14} aria-hidden="true" className="text-[var(--text-muted)]" />
            <Link href="mailto:press@atlvs.pro" className="font-medium text-[var(--org-primary)]">
              press@atlvs.pro
            </Link>
          </div>
          <p className="mt-3 text-xs text-[var(--text-muted)]">
            Spokespersons available for interview on production operations, AI-grounded workflows, the move off
            fragmented stacks, and the marketplace canon. Response within one business day.
          </p>
        </div>
      </section>

      <CTASection
        title="ATLVS Is Open."
        subtitle="Free for small teams. Per-org pricing the rest of the way up."
        primaryLabel={CANONICAL_CTAS.primary.label}
        primaryHref={CANONICAL_CTAS.primary.href}
        secondaryLabel={CANONICAL_CTAS.secondary.label}
        secondaryHref={CANONICAL_CTAS.secondary.href}
      />
    </div>
  );
}
