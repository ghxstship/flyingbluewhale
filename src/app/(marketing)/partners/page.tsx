import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { CTASection } from "@/components/marketing/CTASection";
import { Button } from "@/components/ui/Button";
import { buildMetadata, breadcrumbSchema, CANONICAL_CTAS } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Partners — Production Consultants + Implementation Partners",
  description:
    "ATLVS-trained production consultants who help teams migrate, configure, and optimize on the platform. Partner directory launching Q1.",
  path: "/partners",
  keywords: [
    "ATLVS partners",
    "ATLVS implementation partners",
    "production software consultants",
    "ATLVS Technologies partner program",
  ],
  ogImageEyebrow: "Partners",
  ogImageTitle: "Implementation + Consulting.",
});

const TRACKS = [
  {
    name: "Implementation Partners",
    body: "Production consultants who help teams migrate from spreadsheets / Asana / Master Tour onto ATLVS in 1-3 days.",
    forWho: "For agencies + consultants",
  },
  {
    name: "Build Partners",
    body: "Studios who customize ATLVS for specialized verticals — touring opera, immersive theatre, theme-park installs.",
    forWho: "For technical studios",
  },
  {
    name: "Solution Partners",
    body: "Industry experts (EHS, rigging, broadcast) who bundle ATLVS with their service.",
    forWho: "For domain specialists",
  },
];

export default function PartnersPage() {
  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Partners", href: "/partners" },
  ];

  return (
    <div>
      <JsonLd data={[breadcrumbSchema(crumbs)]} />
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="eyebrow eyebrow-brand">Partners</div>
        <h1 className="hed-3xl mt-4">Implementation + Consulting.</h1>
        <p className="mt-5 max-w-3xl text-lg text-[var(--text-secondary)]">
          ATLVS-trained production consultants who help teams migrate, configure, and optimize on the platform. Partner
          directory launching Q1 with vetted profiles, project portfolios, and rate cards.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href="/contact">Apply to the partner program</Button>
          <Button href={CANONICAL_CTAS.primary.href} variant="secondary">
            {CANONICAL_CTAS.primary.label}
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="hed-lg">Three Partner Tracks.</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {TRACKS.map((t) => (
            <div key={t.name} className="surface p-6">
              <div className="eyebrow eyebrow-brand">{t.forWho}</div>
              <h3 className="mt-2 text-base font-semibold">{t.name}</h3>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">{t.body}</p>
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
          <h2 className="hed-lg mt-3">Partner Directory.</h2>
          <p className="mt-3 max-w-2xl text-sm text-[var(--text-secondary)]">
            Browse vetted partners by region, vertical, certification level, and language. Each profile lists project
            portfolio, recent customers, rate card, and direct booking link. Q1 launch.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button href="/contact" variant="secondary">
              Get on the early-access list
            </Button>
          </div>
        </div>
      </section>

      <CTASection
        title="Want To Partner?"
        subtitle="Tell us about your production-consulting practice — region, vertical, recent projects, and how you'd want to plug into ATLVS."
        primaryLabel="Apply to the program"
        primaryHref={CANONICAL_CTAS.secondary.href}
        secondaryLabel={CANONICAL_CTAS.primary.label}
        secondaryHref={CANONICAL_CTAS.primary.href}
      />
    </div>
  );
}
