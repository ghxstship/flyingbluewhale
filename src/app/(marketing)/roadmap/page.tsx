import Link from "next/link";
import type { Metadata } from "next";
import { Clock } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { CTASection } from "@/components/marketing/CTASection";
import { buildMetadata, breadcrumbSchema, CANONICAL_CTAS } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Roadmap — What's Shipping Next",
  description:
    "Public-facing roadmap with three-quarter horizon. Confirmed work, in-progress work, and the requests we're sizing.",
  path: "/roadmap",
  keywords: ["ATLVS roadmap", "production software roadmap", "ATLVS Technologies upcoming features"],
  ogImageEyebrow: "Roadmap",
  ogImageTitle: "What's Shipping Next.",
});

type RoadmapItem = { title: string; body: string; tag?: string };
type RoadmapQuarter = { label: string; status: "in_flight" | "next" | "exploring"; items: RoadmapItem[] };

const ROADMAP: RoadmapQuarter[] = [
  {
    label: "Q3 2026 · In Flight",
    status: "in_flight",
    items: [
      {
        title: "AI use-case pages",
        body: "Six production-AI surfaces shipped on /ai (advancing, incidents, scheduling, proposals, recaps, safety).",
        tag: "Shipped",
      },
      {
        title: "Programmatic feature × industry farm",
        body: "160 cross-context pages live at /features/[module]/[industry].",
        tag: "Shipped",
      },
      {
        title: "Comparison expansion + alternatives narrative",
        body: "21 competitors + 21 alternatives narrative variants + footer column.",
        tag: "Shipped",
      },
      { title: "Glossary surface", body: "40 production-ops terms with DefinedTerm schema.", tag: "Shipped" },
      {
        title: "Free tools hub",
        body: "Per-diem calculator + capacity calculator live; 8 more sized for Q4.",
        tag: "Partial",
      },
      {
        title: "Customer stories — Phase 1",
        body: "Six launch-partner case studies; anonymized teasers visible, full stories landing through Q4.",
        tag: "In progress",
      },
    ],
  },
  {
    label: "Q4 2026 · Next",
    status: "next",
    items: [
      { title: "Savings calculator on /pricing", body: "Drop in current stack line items; computes annual vs. ATLVS." },
      { title: "Pricing layered AI tiers", body: "AI usage caps + add-on options per Crew, Production, Festival." },
      { title: "URL-routed locales beyond home", body: "Top 13 pages translated to es-ES + pt-BR with full hreflang." },
      { title: "Customer stories — Phase 2", body: "Four more launch-partner case studies with downloadable PDF." },
      {
        title: "Templates expansion to 25+",
        body: "Stage plot, RFI, COI checklist, run-of-show, change order library.",
      },
      {
        title: "Six more free tools",
        body: "Load-in scheduler, manifest builder, rig-load calc, ROS time-math, set-conflict checker, credentials counter.",
      },
    ],
  },
  {
    label: "Q1 2027 · Exploring",
    status: "exploring",
    items: [
      {
        title: "Mega-menu navigation",
        body: "Replace the column dropdowns with grouped grids + icons + descriptions.",
      },
      { title: "Press / brand / media kit", body: "Downloadable logo lockups, brand guidelines, screenshot library." },
      {
        title: "Partner directory",
        body: "Service-provider directory for production consultants who specialize on ATLVS.",
      },
      { title: "Roadmap upvoting", body: "Read-only today; auth'd upvote + comment in 2027." },
    ],
  },
];

const STATUS_LABEL: Record<RoadmapQuarter["status"], string> = {
  in_flight: "In Flight",
  next: "Next",
  exploring: "Exploring",
};

const STATUS_COLOR: Record<RoadmapQuarter["status"], string> = {
  in_flight: "var(--success)",
  next: "var(--org-primary)",
  exploring: "var(--text-muted)",
};

export default function RoadmapPage() {
  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Roadmap", href: "/roadmap" },
  ];

  return (
    <div>
      <JsonLd data={[breadcrumbSchema(crumbs)]} />
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="text-xs font-semibold tracking-[0.25em] text-[var(--org-primary)] uppercase">Roadmap</div>
        <h1 className="mt-3 text-5xl font-semibold tracking-tight text-balance sm:text-7xl">What's Shipping Next.</h1>
        <p className="mt-5 max-w-3xl text-lg text-[var(--text-secondary)]">
          Three-quarter horizon. In Flight is committed and tracking to date. Next is sized and prioritized. Exploring
          is on the table for the quarter after.
        </p>
        <p className="mt-3 max-w-3xl text-sm text-[var(--text-muted)]">
          Want to influence the order?{" "}
          <Link href="/contact" className="text-[var(--org-primary)] underline underline-offset-2">
            Send a note
          </Link>{" "}
          — we read every line.
        </p>
      </section>

      {ROADMAP.map((q) => (
        <section key={q.label} className="mx-auto max-w-6xl px-6 py-8">
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: STATUS_COLOR[q.status] }}
              aria-hidden="true"
            />
            <h2 className="text-2xl font-semibold tracking-tight">{q.label}</h2>
            <span
              className="rounded-full border border-[var(--border-color)] bg-[var(--surface-inset)] px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase"
              style={{ color: STATUS_COLOR[q.status] }}
            >
              {STATUS_LABEL[q.status]}
            </span>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {q.items.map((item) => (
              <div key={item.title} className="surface p-5">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">{item.title}</div>
                  {item.tag ? (
                    <span className="rounded-full border border-[var(--border-color)] bg-[var(--surface-inset)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-muted)]">
                      <Clock size={9} className="mr-1 inline-block" aria-hidden="true" />
                      {item.tag}
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">{item.body}</p>
              </div>
            ))}
          </div>
        </section>
      ))}

      <CTASection
        title="The Console Is Open."
        subtitle="Free for small teams. Per-org pricing the rest of the way up."
        primaryLabel={CANONICAL_CTAS.primary.label}
        primaryHref={CANONICAL_CTAS.primary.href}
        secondaryLabel={CANONICAL_CTAS.secondary.label}
        secondaryHref={CANONICAL_CTAS.secondary.href}
      />
    </div>
  );
}
