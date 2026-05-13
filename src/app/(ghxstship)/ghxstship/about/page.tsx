import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { CATALOG_STATS, paths } from "@/lib/ghxstship";
import { GhxstshipJsonLd, breadcrumbSchema, organizationSchema } from "@/components/ghxstship/JsonLd";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "About GHXSTSHIP — Experiential Production Company",
  description:
    "GHXSTSHIP is the experiential production company behind festivals, theme park attractions, theatrical productions, brand activations, and premium hospitality. Anchored in Miami, New York, Chicago, Los Angeles. Built ATLVS to run our own work — and now yours.",
  alternates: { canonical: "https://ghxstship.pro/ghxstship/about" },
};

const PRINCIPLES = [
  {
    eyebrow: "01",
    title: "One operating system, internal and external.",
    body: "Every engagement runs on the same data model that publishes our public services catalog. Vendors, deliverables, compliance checks, budgets, schedules — all carry stable identifiers you can audit end to end. Same schema runs internally on our ATLVS software. Same schema is what you read on this site.",
  },
  {
    eyebrow: "02",
    title: "Receipts, not promises.",
    body: "Stamped engineering, signed certificates of insurance, executed master service agreements, fire-marshal sign-offs, sustainability reports — every deliverable lands in your folder structure with a stable name and a clear chain of custody.",
  },
  {
    eyebrow: "03",
    title: "Operator language, no apologies.",
    body: "We speak in load-in, advance, run-of-show, RFI, paddock, dry-dock, clean zone, front-of-house, and union jurisdictions. If you already know what those words mean, you'll feel at home. If you don't, we'll translate.",
  },
  {
    eyebrow: "04",
    title: "Anchored, not headquartered.",
    body: "We have full-time teams and dedicated fabrication in Miami, New York, Chicago, and Los Angeles. We deploy from those anchors into eight satellite cities and across national and international tiers. The team that briefs you is the team that builds it.",
  },
];

export default function AboutPage() {
  return (
    <>
      <GhxstshipJsonLd
        data={[
          breadcrumbSchema([
            { label: "GHXSTSHIP", href: "/ghxstship" },
            { label: "About", href: "/ghxstship/about" },
          ]),
          organizationSchema(),
        ]}
      />
      <div className="space-y-20 pb-24">
        <section className="mx-auto max-w-6xl px-6 pt-16">
          <div className="text-xs font-semibold tracking-[0.25em] uppercase" style={{ color: "var(--org-primary)" }}>
            About
          </div>
          <h1 className="mt-4 text-5xl uppercase sm:text-7xl" style={{ fontFamily: "var(--font-display)" }}>
            The studio
            <br />
            behind the studio.
          </h1>
          <p className="mt-6 max-w-3xl text-lg text-[var(--text-secondary)]">
            GHXSTSHIP is an experiential production company building festivals, theme park attractions, immersive
            experiences, theatrical productions, brand activations, and premium hospitality at scale. We span{" "}
            {CATALOG_STATS.serviceCount} services across {CATALOG_STATS.classCount} disciplines and{" "}
            {CATALOG_STATS.solutionCount} industries. We&apos;re anchored in Miami, New York City, Chicago, and Los
            Angeles, and we deliver nationally and internationally.
          </p>
        </section>

        <section className="mx-auto max-w-6xl px-6">
          <div className="grid gap-5 sm:grid-cols-2">
            {PRINCIPLES.map((p) => (
              <div key={p.eyebrow} className="surface hover-lift p-8">
                <div
                  className="text-xs font-semibold tracking-[0.25em] uppercase"
                  style={{ color: "var(--org-primary)" }}
                >
                  {p.eyebrow}
                </div>
                <h2 className="mt-3 text-2xl uppercase sm:text-3xl" style={{ fontFamily: "var(--font-display)" }}>
                  {p.title}
                </h2>
                <p className="mt-3 text-[var(--text-secondary)]">{p.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6">
          <div className="grid gap-10 md:grid-cols-2">
            <div>
              <h2 className="text-3xl uppercase sm:text-4xl" style={{ fontFamily: "var(--font-display)" }}>
                The lineage.
              </h2>
              <div className="mt-6 space-y-4 text-sm text-[var(--text-secondary)]">
                <p>
                  GHXSTSHIP Industries is the parent. ATLVS Technologies — operating ATLVS, GVTEWAY, and COMPVSS — is
                  the software arm we built so we&apos;d stop running production on spreadsheets.
                </p>
                <p>
                  ATLVS is the producer&apos;s console. GVTEWAY is the stakeholder portal. COMPVSS is the offline-first
                  field app. The same data model powers all three. The same data model publishes this catalog.
                </p>
                <p>
                  When we tell a client we&apos;re running their engagement on the same system that publishes the
                  catalog they read before they hired us, we mean it literally. Same vendor records. Same compliance
                  framework. Same deliverable definitions.
                </p>
              </div>
            </div>
            <div>
              <h2 className="text-3xl uppercase sm:text-4xl" style={{ fontFamily: "var(--font-display)" }}>
                The roster.
              </h2>
              <div className="mt-6 space-y-4 text-sm text-[var(--text-secondary)]">
                <p>
                  Producers, project managers, account managers, A1s, L1s, V1s, riggers, engineers (PE-stamped where it
                  matters), hospitality leads, federation liaisons, fixers, conservators, art handlers, stage managers,
                  broadcast directors, brand ambassadors. Inside our four anchor markets, full-time on payroll. Across
                  satellite markets and the international tier, deep bench under master agreement.
                </p>
                <p>
                  Every named role is a row in the catalog. Every catalog row is a real human with an availability
                  calendar, a credentialing posture, and a published rate.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6">
          <div className="surface-raised p-10">
            <h2 className="text-3xl uppercase sm:text-4xl" style={{ fontFamily: "var(--font-display)" }}>
              Brief us.
            </h2>
            <p className="mt-3 max-w-xl text-[var(--text-secondary)]">
              A paragraph in plain English is fine. A six-hundred-line RFP is fine. A drunk voice memo at 2am that
              becomes a festival is the most fun. We answer all three.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button href={paths.contact()} size="lg">
                Start a Project
              </Button>
              <Button href={paths.pricing()} size="lg" variant="secondary">
                See pricing
              </Button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
