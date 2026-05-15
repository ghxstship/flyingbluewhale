import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Calculator, Ruler } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { CTASection } from "@/components/marketing/CTASection";
import { buildMetadata, breadcrumbSchema } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Free Tools — Production Calculators",
  description:
    "Per-diem calculator, capacity calculator, and more — free tools production teams use to plan, budget, and run shows.",
  path: "/tools",
  keywords: [
    "per diem calculator",
    "event capacity calculator",
    "venue occupancy calculator",
    "production calculator",
    "free event planning tools",
  ],
  ogImageEyebrow: "Free Tools",
  ogImageTitle: "Production Calculators.",
});

const TOOLS = [
  {
    slug: "per-diem-calculator",
    title: "Per-Diem Calculator",
    short: "Compute crew or talent per-diem totals by city and day count.",
    icon: Calculator,
  },
  {
    slug: "capacity-calculator",
    title: "Venue Capacity Calculator",
    short: "Estimate maximum occupancy from square footage and use type.",
    icon: Ruler,
  },
];

export default function ToolsIndex() {
  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Tools", href: "/tools" },
  ];

  return (
    <div>
      <JsonLd data={[breadcrumbSchema(crumbs)]} />
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="eyebrow eyebrow-brand">Free Tools</div>
        <h1 className="hed-2xl mt-4">Production Calculators.</h1>
        <p className="mt-5 max-w-3xl text-lg text-[var(--text-secondary)]">
          The math production teams redo every Monday morning, automated. Free, no signup, no email gate.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-4 sm:grid-cols-2">
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link key={tool.slug} href={`/tools/${tool.slug}`} className="surface hover-lift p-6">
                <div className="flex items-center gap-3">
                  <span
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg"
                    style={{
                      background: "color-mix(in oklab, var(--org-primary) 12%, transparent)",
                      color: "var(--org-primary)",
                    }}
                  >
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <div>
                    <div className="text-base font-semibold">{tool.title}</div>
                  </div>
                </div>
                <p className="mt-3 text-sm text-[var(--text-secondary)]">{tool.short}</p>
                <div className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-[var(--org-primary)]">
                  Use this tool <ArrowRight size={12} />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <CTASection
        title="ATLVS Is Open."
        subtitle="Free, forever, for small teams. Per-org pricing the rest of the way up."
      />
    </div>
  );
}
