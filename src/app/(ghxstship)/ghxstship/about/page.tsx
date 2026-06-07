import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { CATALOG_STATS, paths } from "@/lib/ghxstship";
import { GhxstshipJsonLd, breadcrumbSchema, organizationSchema } from "@/components/ghxstship/JsonLd";
import { getRequestT } from "@/lib/i18n/request";

type Translate = Awaited<ReturnType<typeof getRequestT>>["t"];

export const dynamic = "force-static";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestT();
  return {
    title: t("ghxstship.about.meta.title", undefined, "About GHXSTSHIP — Experiential Production Company"),
    description: t(
      "ghxstship.about.meta.description",
      undefined,
      "GHXSTSHIP is the experiential production company behind festivals, theme park attractions, theatrical productions, brand activations, and premium hospitality. Anchored in Miami, New York, Chicago, Los Angeles. Built ATLVS to run our own work — and now yours.",
    ),
    alternates: { canonical: "https://ghxstship.pro/ghxstship/about" },
  };
}

function buildPrinciples(t: Translate) {
  return [
    {
      eyebrow: "01",
      title: t("ghxstship.about.principles.p1.title", undefined, "One operating system, internal and external."),
      body: t(
        "ghxstship.about.principles.p1.body",
        undefined,
        "Every engagement runs on the same data model that publishes our public services catalog. Vendors, deliverables, compliance checks, budgets, schedules — all carry stable identifiers you can audit end to end. Same schema runs internally on our ATLVS software. Same schema is what you read on this site.",
      ),
    },
    {
      eyebrow: "02",
      title: t("ghxstship.about.principles.p2.title", undefined, "Receipts, not promises."),
      body: t(
        "ghxstship.about.principles.p2.body",
        undefined,
        "Stamped engineering, signed certificates of insurance, executed master service agreements, fire-marshal sign-offs, sustainability reports — every deliverable lands in your folder structure with a stable name and a clear chain of custody.",
      ),
    },
    {
      eyebrow: "03",
      title: t("ghxstship.about.principles.p3.title", undefined, "Operator language, no apologies."),
      body: t(
        "ghxstship.about.principles.p3.body",
        undefined,
        "We speak in load-in, advance, run-of-show, RFI, paddock, dry-dock, clean zone, front-of-house, and union jurisdictions. If you already know what those words mean, you’ll feel at home. If you don’t, we’ll translate.",
      ),
    },
    {
      eyebrow: "04",
      title: t("ghxstship.about.principles.p4.title", undefined, "Anchored, not headquartered."),
      body: t(
        "ghxstship.about.principles.p4.body",
        undefined,
        "We have full-time teams and dedicated fabrication in Miami, New York, Chicago, and Los Angeles. We deploy from those anchors into eight satellite cities and across national and international tiers. The team that briefs you is the team that builds it.",
      ),
    },
  ];
}

export default async function AboutPage() {
  const { t } = await getRequestT();
  const PRINCIPLES = buildPrinciples(t);
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
          <div className="text-xs font-semibold tracking-[0.25em] uppercase" style={{ color: "var(--p-accent)" }}>
            {t("ghxstship.about.hero.eyebrow", undefined, "About")}
          </div>
          <h1 className="mt-4 text-5xl uppercase sm:text-7xl" style={{ fontFamily: "var(--font-display)" }}>
            {t("ghxstship.about.hero.heading.line1", undefined, "The studio")}
            <br />
            {t("ghxstship.about.hero.heading.line2", undefined, "behind the studio.")}
          </h1>
          <p className="mt-6 max-w-3xl text-lg text-[var(--p-text-2)]">
            {t(
              "ghxstship.about.hero.body",
              {
                serviceCount: CATALOG_STATS.serviceCount,
                classCount: CATALOG_STATS.classCount,
                solutionCount: CATALOG_STATS.solutionCount,
              },
              "GHXSTSHIP is an experiential production company building festivals, theme park attractions, immersive experiences, theatrical productions, brand activations, and premium hospitality at scale. We span {serviceCount} services across {classCount} disciplines and {solutionCount} industries. We’re anchored in Miami, New York City, Chicago, and Los Angeles, and we deliver nationally and internationally.",
            )}
          </p>
        </section>

        <section className="mx-auto max-w-6xl px-6">
          <div className="grid gap-5 sm:grid-cols-2">
            {PRINCIPLES.map((p) => (
              <div key={p.eyebrow} className="surface hover-lift p-8">
                <div className="text-xs font-semibold tracking-[0.25em] uppercase" style={{ color: "var(--p-accent)" }}>
                  {p.eyebrow}
                </div>
                <h2 className="mt-3 text-2xl uppercase sm:text-3xl" style={{ fontFamily: "var(--font-display)" }}>
                  {p.title}
                </h2>
                <p className="mt-3 text-[var(--p-text-2)]">{p.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6">
          <div className="grid gap-10 md:grid-cols-2">
            <div>
              <h2 className="text-3xl uppercase sm:text-4xl" style={{ fontFamily: "var(--font-display)" }}>
                {t("ghxstship.about.lineage.heading", undefined, "The lineage.")}
              </h2>
              <div className="mt-6 space-y-4 text-sm text-[var(--p-text-2)]">
                <p>
                  {t(
                    "ghxstship.about.lineage.p1",
                    undefined,
                    "GHXSTSHIP Industries is the parent. ATLVS Technologies — operating ATLVS, GVTEWAY, and COMPVSS — is the software arm we built so we’d stop running production on spreadsheets.",
                  )}
                </p>
                <p>
                  {t(
                    "ghxstship.about.lineage.p2",
                    undefined,
                    "ATLVS is the producer’s console. GVTEWAY is the stakeholder portal. COMPVSS is the offline-first field app. The same data model powers all three. The same data model publishes this catalog.",
                  )}
                </p>
                <p>
                  {t(
                    "ghxstship.about.lineage.p3",
                    undefined,
                    "When we tell a client we’re running their engagement on the same system that publishes the catalog they read before they hired us, we mean it literally. Same vendor records. Same compliance framework. Same deliverable definitions.",
                  )}
                </p>
              </div>
            </div>
            <div>
              <h2 className="text-3xl uppercase sm:text-4xl" style={{ fontFamily: "var(--font-display)" }}>
                {t("ghxstship.about.roster.heading", undefined, "The roster.")}
              </h2>
              <div className="mt-6 space-y-4 text-sm text-[var(--p-text-2)]">
                <p>
                  {t(
                    "ghxstship.about.roster.p1",
                    undefined,
                    "Producers, project managers, account managers, A1s, L1s, V1s, riggers, engineers — PE-stamped where it matters — hospitality leads, federation liaisons, fixers, conservators, art handlers, stage managers, broadcast directors, brand ambassadors. Inside our four anchor markets, full-time on payroll. Across satellite markets and the international tier, deep bench under master agreement.",
                  )}
                </p>
                <p>
                  {t(
                    "ghxstship.about.roster.p2",
                    undefined,
                    "Every named role is a row in the catalog. Every catalog row is a real human with an availability calendar, a credentialing posture, and a published rate.",
                  )}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6">
          <div className="surface-raised p-10">
            <h2 className="text-3xl uppercase sm:text-4xl" style={{ fontFamily: "var(--font-display)" }}>
              {t("ghxstship.about.briefUs.heading", undefined, "Brief us.")}
            </h2>
            <p className="mt-3 max-w-xl text-[var(--p-text-2)]">
              {t(
                "ghxstship.about.briefUs.body",
                undefined,
                "A paragraph in plain English is fine. A six-hundred-line RFP is fine. A drunk voice memo at 2am that becomes a festival is the most fun. We answer all three.",
              )}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button href={paths.contact()} size="lg">
                {t("ghxstship.common.startProject", undefined, "Start a Project")}
              </Button>
              <Button href={paths.pricing()} size="lg" variant="secondary">
                {t("ghxstship.common.seePricing", undefined, "See pricing")}
              </Button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
