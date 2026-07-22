// ISR — regenerate static HTML every 5 min. Uses the static English
// translator (no session, no cookies) so the page stays static-compatible.
export const revalidate = 300;

import type { Metadata } from "next";
import {
  Award,
  BookOpen,
  Boxes,
  Landmark,
  LayoutTemplate,
  MapPin,
  Network,
  Palette,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { FAQSection } from "@/components/marketing/FAQ";
import { FeatureGrid } from "@/components/marketing/FeatureGrid";
import { StatStrip } from "@/components/marketing/StatStrip";
import { CTASection } from "@/components/marketing/CTASection";
import { buildMetadata, softwareApplicationSchema, SITE } from "@/lib/seo";
import { urlFor } from "@/lib/urls";
import { getStaticEnT } from "../_lib/static-t";
import { Wordmark } from "@/components/brand/Wordmark";

// LEG3ND accent (molten orange) comes from the theme: the wrapper sets
// `data-theme="atlvs-product" data-platform="legend"`, so `--p-accent*`
// resolve to the LEG3ND ramp for this subtree — no inline hexes.
const K = "marketing.pages.legendHome";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getStaticEnT();
  return buildMetadata({
    title: t(`${K}.meta.title`, undefined, "LEG3ND: The Organization Hub"),
    description: t(
      `${K}.meta.description`,
      undefined,
      "Configure your organization once and every project inherits it: brand studio, org chart, finance codes, locations, catalogs, templates, knowledge, and the academy. Built on XPMS 2.5.",
    ),
    path: "/legend",
    keywords: [
      "LEG3ND",
      "organization hub",
      "production standards",
      "white label event documents",
      "cost center codes",
      "asset catalog software",
      "production LMS",
      "crew certifications",
      "XPMS",
    ],
    ogImageEyebrow: "LEG3ND",
    ogImageTitle: t(`${K}.meta.ogImageTitle`, undefined, "Configure Once. Every Project Inherits It."),
  });
}

export default async function LegendHomePage() {
  const { t } = await getStaticEnT();

  const crumbs = [
    { label: t(`${K}.crumbs.home`, undefined, "Home"), href: "/" },
    { label: "LEG3ND", href: "/legend" },
  ];

  return (
    <div data-theme="atlvs-product" data-platform="legend">
      <JsonLd
        data={[
          softwareApplicationSchema({
            name: "LEG3ND",
            appName: "LEG3ND",
            description: SITE.apps.legend.tagline,
            url: urlFor("marketing", "/legend"),
          }),
        ]}
      />
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="eyebrow eyebrow-accent">
          <Wordmark word="LEG3ND" style={{ color: "var(--p-accent-text)" }} />
        </div>
        <h1 className="hed-3xl mt-3 max-w-4xl">
          {t(`${K}.hero.title`, undefined, "Configure your organization once. Every project inherits it.")}
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-[var(--p-text-2)]">
          {t(
            `${K}.hero.body`,
            undefined,
            "Every production reuses the same constants: who you are, how you are structured, where the money codes, where the buildings are, what the gear is called, which documents go out under whose logo. LEG3ND is where those constants live, so no project ever starts from a blank page.",
          )}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href="/signup">{t(`${K}.hero.primaryCta`, undefined, "Start your organization")}</Button>
          <Button href="/pricing" variant="secondary">
            {t(`${K}.hero.secondaryCta`, undefined, "See pricing")}
          </Button>
        </div>
      </section>

      {/* The eight hub pillars */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="hed-xl">{t(`${K}.pillars.heading`, undefined, "Eight pillars, one hub.")}</h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--p-text-2)]">
          {t(
            `${K}.pillars.body`,
            undefined,
            "Everything an organization holds constant across projects, kept in one place and inherited everywhere.",
          )}
        </p>
        <div className="mt-8">
          <FeatureGrid
            cols={4}
            features={[
              {
                icon: Palette,
                title: t(`${K}.pillars.brand.title`, undefined, "Brand Studio"),
                body: t(
                  `${K}.pillars.brand.body`,
                  undefined,
                  "Org and per-event branding, and white-label modes for the documents you send out. A proposal can carry your mark, the client's, or none at all.",
                ),
              },
              {
                icon: Network,
                title: t(`${K}.pillars.organization.title`, undefined, "Organization"),
                body: t(
                  `${K}.pillars.organization.body`,
                  undefined,
                  "The org chart, reporting lines, and a position library, so a new project staffs from named roles instead of a fresh spreadsheet of guesses.",
                ),
              },
              {
                icon: Landmark,
                title: t(`${K}.pillars.finance.title`, undefined, "Finance Codes"),
                body: t(
                  `${K}.pillars.finance.body`,
                  undefined,
                  "GL codes and cost centers on the XPMS department spine, 0000 through 9000. Every budget line on every project rolls up the same way.",
                ),
              },
              {
                icon: MapPin,
                title: t(`${K}.pillars.locations.title`, undefined, "Locations"),
                body: t(
                  `${K}.pillars.locations.body`,
                  undefined,
                  "Offices, venues, and time-clock zones. The geofence a crew member clocks in against is defined here, once.",
                ),
              },
              {
                icon: Boxes,
                title: t(`${K}.pillars.catalogs.title`, undefined, "Catalogs"),
                body: t(
                  `${K}.pillars.catalogs.body`,
                  undefined,
                  "The master catalog of gear, credentials, and consumables, with GTIN barcode bindings and the AIGA signage library alongside it.",
                ),
              },
              {
                icon: LayoutTemplate,
                title: t(`${K}.pillars.templates.title`, undefined, "Templates"),
                body: t(
                  `${K}.pillars.templates.body`,
                  undefined,
                  "A configurator and library for the paperwork of production: 29 document types, job templates, advance-packet presets, and event guide configs.",
                ),
              },
              {
                icon: BookOpen,
                title: t(`${K}.pillars.knowledge.title`, undefined, "Knowledge"),
                body: t(
                  `${K}.pillars.knowledge.body`,
                  undefined,
                  "The Standard and your own knowledge base beside it: SOPs, resources, and the reference material crews actually search mid-show.",
                ),
              },
              {
                icon: Award,
                title: t(`${K}.pillars.academy.title`, undefined, "Academy"),
                body: t(
                  `${K}.pillars.academy.body`,
                  undefined,
                  "A gamified LMS with courses, quizzes, certifications, and badges. Certs earned here follow the crew member onto every roster.",
                ),
              },
            ]}
          />
        </div>
      </section>

      {/* Built on XPMS 2.5 */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="surface p-10">
          <div className="eyebrow eyebrow-accent">{t(`${K}.xpms.eyebrow`, undefined, "Built on XPMS 2.5")}</div>
          <h2 className="hed-xl mt-3">
            {t(`${K}.xpms.heading`, undefined, "Your org starts with the standard, then makes it its own.")}
          </h2>
          <p className="mt-4 max-w-3xl text-sm text-[var(--p-text-2)]">
            {t(
              `${K}.xpms.body1`,
              undefined,
              "XPMS is the production standard underneath the whole ecosystem: a sequential project lifecycle with gated phases, a department taxonomy, and a canonical catalog of the work itself, each unit of work carrying its own identifier.",
            )}
          </p>
          <p className="mt-3 max-w-3xl text-sm text-[var(--p-text-2)]">
            {t(
              `${K}.xpms.body2`,
              undefined,
              "A new organization arrives with the base kit installed, and your customizations layer on top of it rather than replacing it. Opt out of any dataset you do not want.",
            )}
          </p>
        </div>
      </section>

      <StatStrip
        stats={[
          {
            value: t(`${K}.stats.phases.value`, undefined, "9"),
            label: t(`${K}.stats.phases.label`, undefined, "Gated lifecycle phases"),
          },
          {
            value: t(`${K}.stats.departments.value`, undefined, "10"),
            label: t(`${K}.stats.departments.label`, undefined, "Department classes"),
          },
          {
            value: t(`${K}.stats.atoms.value`, undefined, "406"),
            label: t(`${K}.stats.atoms.label`, undefined, "Canonical work atoms"),
          },
          {
            value: t(`${K}.stats.compliance.value`, undefined, "XMCE"),
            label: t(`${K}.stats.compliance.label`, undefined, "Compliance engine"),
          },
        ]}
      />

      {/* Where organizations begin */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-10 md:grid-cols-2 md:items-start">
          <div>
            <div className="eyebrow eyebrow-accent">
              {t(`${K}.begin.eyebrow`, undefined, "Where organizations begin")}
            </div>
            <h2 className="hed-xl mt-3">
              {t(`${K}.begin.heading`, undefined, "New organizations are born here, on the web.")}
            </h2>
            <p className="mt-4 text-sm text-[var(--p-text-2)]">
              {t(
                `${K}.begin.body1`,
                undefined,
                "You create and onboard an organization in LEG3ND on a desktop browser. Onboarding walks the same eight datasets the hub manages, in order, so by the end the org is genuinely configured rather than merely registered.",
              )}
            </p>
            <p className="mt-3 text-sm text-[var(--p-text-2)]">
              {t(
                `${K}.begin.body2`,
                undefined,
                "Crew invites come last on purpose. When the first crew member opens COMPVSS on their phone, the positions, locations, catalogs, and templates they touch already exist.",
              )}
            </p>
            {/* Entity line — the canonical LEG3ND one-liner, verbatim. */}
            <p className="mt-6 text-sm text-[var(--p-text-2)]">{SITE.apps.legend.tagline}</p>
          </div>
          <ol className="space-y-3 text-sm">
            {[
              t(`${K}.begin.steps.identity`, undefined, "Account and org identity: name, slug, logo"),
              t(`${K}.begin.steps.baseKit`, undefined, "Base kit install: XPMS 2.5 defaults, with opt-outs per dataset"),
              t(`${K}.begin.steps.organization`, undefined, "Organization: org chart roots and the position library"),
              t(`${K}.begin.steps.finance`, undefined, "Finance codes: GL and cost centers, editable defaults"),
              t(`${K}.begin.steps.locations`, undefined, "Locations: first venue or office, first time-clock zone"),
              t(`${K}.begin.steps.catalogs`, undefined, "Catalogs: confirm the starter catalog, add your own SKUs"),
              t(`${K}.begin.steps.templates`, undefined, "Templates: activate the documents and guides you use"),
              t(`${K}.begin.steps.invites`, undefined, "Crew invites: now bring the crew in, straight to COMPVSS"),
            ].map((step, i) => (
              <li key={step} className="surface flex items-start gap-3 p-4">
                <span
                  className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                  style={{ background: "var(--p-accent)", color: "var(--p-accent-contrast)" }}
                >
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <FAQSection
        title={t(`${K}.faq.title`, undefined, "LEG3ND, asked and answered")}
        faqs={[
          {
            q: t(`${K}.faq.what.q`, undefined, "What exactly is LEG3ND?"),
            a: t(
              `${K}.faq.what.a`,
              undefined,
              "The organization hub of the ATLVS ecosystem. It holds the datasets every project reuses: branding, org structure, finance codes, locations, catalogs, templates, knowledge, and training. Configure them once and every project inherits them.",
            ),
          },
          {
            q: t(`${K}.faq.create.q`, undefined, "Where do I create an organization?"),
            a: t(
              `${K}.faq.create.a`,
              undefined,
              "In LEG3ND, on the web, from a desktop browser. Crew never create orgs from the field app; they join an existing organization by invite or org code once it is configured.",
            ),
          },
          {
            q: t(`${K}.faq.baseKit.q`, undefined, "What does a brand-new org start with?"),
            a: t(
              `${K}.faq.baseKit.a`,
              undefined,
              "The XPMS 2.5 base kit: 9 gated lifecycle phases, 10 department classes, a starter catalog of 406 canonical work atoms, the budget template, the compliance engine, and the signage library. Every dataset can be edited or opted out of during onboarding.",
            ),
          },
          {
            q: t(`${K}.faq.whiteLabel.q`, undefined, "Can our documents carry a client's brand?"),
            a: t(
              `${K}.faq.whiteLabel.a`,
              undefined,
              "Yes. The Brand Studio manages org and event branding, and outbound documents support white-label modes, so the same proposal template can render under your mark or the client's.",
            ),
          },
          {
            q: t(`${K}.faq.lms.q`, undefined, "Is the LMS a separate purchase?"),
            a: t(
              `${K}.faq.lms.a`,
              undefined,
              "No. The Academy is part of LEG3ND: courses, quizzes, certifications, and badges live alongside the knowledge base, and completions are tracked per crew member.",
            ),
          },
          {
            q: t(`${K}.faq.crew.q`, undefined, "Do crew members need to use LEG3ND?"),
            a: t(
              `${K}.faq.crew.a`,
              undefined,
              "For day-to-day field work, no; crew live in COMPVSS on their phones. They meet LEG3ND when they take a course, earn a certification, or look something up in the knowledge base.",
            ),
          },
        ]}
      />

      <CTASection
        title={t(`${K}.cta.title`, undefined, "Start your organization.")}
        subtitle={t(
          `${K}.cta.subtitle`,
          undefined,
          "Set up the constants once. Every project after that starts warm.",
        )}
        primaryLabel={t(`${K}.cta.primaryLabel`, undefined, "Start your organization")}
        primaryHref="/signup"
      />
    </div>
  );
}
