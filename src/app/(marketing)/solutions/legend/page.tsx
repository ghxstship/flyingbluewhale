// ISR — regenerate static HTML every 5 min.
export const revalidate = 300;

import type { Metadata } from "next";
import {
  BookOpen,
  GraduationCap,
  Award,
  FolderOpen,
  Package,
  Signpost,
  ShieldCheck,
  HardHat,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { FAQSection } from "@/components/marketing/FAQ";
import { FeatureGrid } from "@/components/marketing/FeatureGrid";
import { CTASection } from "@/components/marketing/CTASection";
import { buildMetadata, productSchema, CANONICAL_CTAS } from "@/lib/seo";
import { urlFor } from "@/lib/urls";
import { Wordmark } from "@/components/brand/Wordmark";

// LEG3ND accent — Production Orange. No `data-platform="legend"` exists (LEG3ND
// rides the type axis, not the platform overlay), so accents are inlined here
// rather than routed through `--p-accent`, which would resolve to ATLVS pink.
const LEGEND = "#E8500A";
const LEGEND_TEXT = "#C2410C"; // AA-on-canvas variant for text/links.

const ONE_LINER =
  "The knowledge the world is built on — the Standard, courses, certifications, the catalog, and the compliance engine.";

export const metadata: Metadata = buildMetadata({
  title: "LEG3ND — Knowledge, LMS & Compliance",
  description: `${ONE_LINER} The knowledge layer of the ATLVS world engine, on the XPMS 2.0 protocol.`,
  path: "/solutions/legend",
  keywords: [
    "LEG3ND",
    "production knowledge base",
    "event LMS",
    "safety certifications",
    "compliance engine",
    "ISO 7010 signage library",
  ],
  ogImageEyebrow: "LEG3ND",
  ogImageTitle: "The knowledge the world is built on.",
});

export default function LegendPage() {
  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Solutions", href: "/solutions" },
    { label: "LEG3ND", href: "/solutions/legend" },
  ];

  return (
    <div>
      <JsonLd
        data={[
          productSchema({
            name: "LEG3ND",
            description: ONE_LINER,
            url: urlFor("marketing", "/solutions/legend"),
            price: "0",
          }),
        ]}
      />
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="eyebrow">
          <Wordmark word="LEG3ND" style={{ color: LEGEND_TEXT }} />
        </div>
        <h1 className="mt-3 text-5xl font-semibold tracking-tight sm:text-6xl">The knowledge the world is built on.</h1>
        <p className="mt-5 max-w-2xl text-lg text-[var(--p-text-2)]">
          {ONE_LINER} It is the knowledge layer of the ATLVS world engine — the Standard, the LMS, certifications, the
          priced catalog, and the compliance engine, all on the XPMS 2.0 protocol.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href={CANONICAL_CTAS.primary.href}>{CANONICAL_CTAS.primary.label}</Button>
          <Button href={CANONICAL_CTAS.secondary.href} variant="secondary">
            {CANONICAL_CTAS.secondary.label}
          </Button>
        </div>
      </section>

      {/* The eight pillars */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">One library. Every discipline.</h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--p-text-2)]">
          The reference layer every other app reads from — authored once, governed in one place, versioned like code.
        </p>
        <div className="mt-8">
          <FeatureGrid
            cols={3}
            features={[
              {
                icon: BookOpen,
                title: "The Standard",
                body: "The canonical knowledge base — how the work is actually run, written down and searchable.",
              },
              {
                icon: GraduationCap,
                title: "Courses & LMS",
                body: "Structured learning with lessons, quizzes, and completion tracking — onboarding to mastery.",
              },
              {
                icon: Award,
                title: "Certifications",
                body: "Issue, track, and expire credentials. The same certs gate scans in COMPVSS at the door.",
              },
              {
                icon: FolderOpen,
                title: "Resources hub",
                body: "Templates, SOPs, and reference docs — one home, no more shared-drive archaeology.",
              },
              {
                icon: Package,
                title: "Catalog",
                body: "Priced atoms and URIDs — the costed building blocks estimates and procurement draw from.",
              },
              {
                icon: Signpost,
                title: "Signage library",
                body: "ISO 7010, DOT-AIGA, and ISA pictograms — production-ready safety wayfinding, standardized.",
              },
              {
                icon: ShieldCheck,
                title: "XMCE compliance engine",
                body: "Machine-checkable compliance — rules evaluated against the live record, not a binder.",
              },
              {
                icon: HardHat,
                title: "Safety",
                body: "RAMS, briefings, and emergency response plans wired to the projects that depend on them.",
              },
            ]}
          />
        </div>
      </section>

      {/* XPMS 2.0 protocol callout */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="surface grid gap-10 p-10 md:grid-cols-2 md:items-center">
          <div>
            <div className="text-[11px] font-semibold tracking-[0.2em] uppercase" style={{ color: LEGEND_TEXT }}>
              On the XPMS 2.0 protocol
            </div>
            <h3 className="mt-3 text-3xl font-semibold tracking-tight">Knowledge that the rest of the world reads.</h3>
            <p className="mt-4 text-sm text-[var(--p-text-2)]">
              LEG3ND isn&rsquo;t a wiki bolted on the side. Certifications gate field scans. Catalog atoms price
              estimates. Compliance rules evaluate against live projects. The knowledge layer is wired into the same
              record store the whole platform runs on.
            </p>
          </div>
          <ul className="space-y-3 text-sm">
            {[
              "The Standard — one canonical, versioned knowledge base",
              "Courses & LMS with quizzes and completion badges",
              "Certifications that gate COMPVSS gate scans",
              "Priced catalog atoms feeding estimates & procurement",
              "ISO 7010 / DOT-AIGA / ISA signage pictograms",
              "XMCE machine-checkable compliance against the live record",
            ].map((x) => (
              <li key={x} className="flex items-start gap-2">
                <CheckCircle2 size={16} className="mt-0.5" style={{ color: LEGEND }} />
                <span>{x}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <FAQSection
        title="LEG3ND · FAQ"
        faqs={[
          {
            q: "What is LEG3ND?",
            a: "The knowledge layer of the ATLVS platform — the Standard (knowledge base), Courses & LMS, Certifications, a Resources hub, a priced Catalog, the Signage library, the XMCE compliance engine, and Safety, all on the XPMS 2.0 protocol.",
          },
          {
            q: "How is it different from a wiki or a separate LMS?",
            a: "It shares the same record store as the rest of the platform. Certifications gate field scans in COMPVSS, catalog atoms price estimates in ATLVS, and compliance rules evaluate against live projects — none of which a standalone wiki or LMS can do.",
          },
          {
            q: "What is the signage library?",
            a: "A production-ready set of ISO 7010, DOT-AIGA, and ISA pictograms for safety wayfinding — standardized so every site speaks the same visual language.",
          },
          {
            q: "What does the compliance engine check?",
            a: "XMCE evaluates machine-checkable rules against the live record rather than a static binder, so compliance status reflects the actual state of a project at any moment.",
          },
        ]}
      />

      <CTASection
        title="Build your next world on a shared body of knowledge."
        subtitle="Free forever on the Access tier. Per-org pricing the rest of the way up."
        primaryLabel={CANONICAL_CTAS.primary.label}
        primaryHref="/signup"
        secondaryLabel={CANONICAL_CTAS.secondary.label}
        secondaryHref="/contact"
      />
    </div>
  );
}
