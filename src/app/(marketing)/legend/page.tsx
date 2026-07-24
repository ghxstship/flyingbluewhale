// ISR — regenerate static HTML every 5 min. Uses the static English
// translator (no session, no cookies) so the page stays static-compatible.
//
// Shell normalization (2026-07-24): this page restores the apex /legend
// marketing slot to the (marketing) shell, matching the /atlvs, /compvss,
// and /gvteway siblings. The LEG3ND app keeps every route under /legend/*
// (its index is /legend/hub); only this bare index path moved shells. The
// original (marketing)/legend page was removed in 9d13d2d3 because the app
// shell also claimed the bare path — that collision is resolved by re-homing
// the app index, not by merging marketing into the product shell.
export const revalidate = 300;

import type { Metadata } from "next";
import Link from "next/link";
import {
  BadgeCheck,
  BookOpen,
  Building2,
  GraduationCap,
  Map,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { FAQSection } from "@/components/marketing/FAQ";
import { FeatureGrid } from "@/components/marketing/FeatureGrid";
import { StatStrip } from "@/components/marketing/StatStrip";
import { CTASection } from "@/components/marketing/CTASection";
import { buildMetadata, softwareApplicationSchema, CANONICAL_CTAS, SITE } from "@/lib/seo";
import { urlFor } from "@/lib/urls";
import { getStaticEnT } from "../_lib/static-t";
import { Wordmark } from "@/components/brand/Wordmark";

// LEG3ND accent (molten orange) comes from the theme: the wrapper sets
// `data-ui="saas" data-platform="legend"` so `--p-accent*` resolve to the
// LEG3ND ramp for this subtree — no inline hexes.
const K = "marketing.pages.legendHome";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getStaticEnT();
  return buildMetadata({
    title: t(`${K}.meta.title`, undefined, "LEG3ND: The Organization Hub, Knowledge, and the Academy"),
    description: t(
      `${K}.meta.description`,
      undefined,
      "Brand, org chart, cost codes, locations, catalogs, templates, the knowledge base, courses, and certifications. Configure the organization once and every project inherits it.",
    ),
    path: "/legend",
    keywords: [
      "LEG3ND",
      "organization hub",
      "event production knowledge base",
      "production LMS",
      "crew training courses",
      "crew certifications",
      "safety signage library",
      "production templates",
    ],
    ogImageEyebrow: "LEG3ND",
    ogImageTitle: t(`${K}.meta.ogImageTitle`, undefined, "Where the Organization Lives."),
  });
}

export default async function LegendHomePage() {
  const { t } = await getStaticEnT();

  const crumbs = [
    { label: t(`${K}.crumbs.home`, undefined, "Home"), href: "/" },
    { label: "LEG3ND", href: "/legend" },
  ];

  return (
    <div data-ui="saas" data-theme="atlvs-product" data-platform="legend">
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

      {/* Hero — the org level, configured once */}
      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="eyebrow eyebrow-accent">
          <Wordmark word="LEG3ND" style={{ color: "var(--p-accent-text)" }} />
        </div>
        <h1 className="hed-3xl mt-3 max-w-4xl">
          {t(`${K}.hero.title`, undefined, "Set up the organization once. Every world inherits it.")}
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-[var(--p-text-2)]">
          {t(
            `${K}.hero.body`,
            undefined,
            "The brand kit lives in a designer's folder, the cost codes in a spreadsheet, the safety training in someone's head. LEG3ND is where all of it gets one home: the hub that configures your organization, the knowledge base that says how you work, and the academy that trains and certifies the people doing it.",
          )}
        </p>
        {/* Entity line — the canonical LEG3ND one-liner, verbatim. */}
        <p className="mt-4 max-w-2xl text-sm text-[var(--p-text-2)]">{SITE.apps.legend.tagline}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href={CANONICAL_CTAS.primary.href}>{CANONICAL_CTAS.primary.label}</Button>
          <Button href={urlFor("legend", "/learn")} variant="secondary">
            {t(`${K}.hero.secondaryCta`, undefined, "Browse the course catalog")}
          </Button>
        </div>
      </section>

      <StatStrip
        stats={[
          {
            value: t(`${K}.stats.hub.value`, undefined, "One hub"),
            label: t(`${K}.stats.hub.label`, undefined, "Every project inherits it"),
          },
          {
            value: t(`${K}.stats.templates.value`, undefined, "11"),
            label: t(`${K}.stats.templates.label`, undefined, "Template families, versioned"),
          },
          {
            value: t(`${K}.stats.signs.value`, undefined, "60"),
            label: t(`${K}.stats.signs.label`, undefined, "Public-domain safety signs"),
          },
          {
            value: t(`${K}.stats.catalog.value`, undefined, "Public"),
            label: t(`${K}.stats.catalog.label`, undefined, "Course catalog, no login"),
          },
        ]}
      />

      {/* Feature walk */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="hed-xl">{t(`${K}.features.heading`, undefined, "What lives here.")}</h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--p-text-2)]">
          {t(
            `${K}.features.body`,
            undefined,
            "Every surface below is live today. The catalog and credential verification are public; the rest opens with your organization.",
          )}
        </p>
        <div className="mt-8">
          <FeatureGrid
            cols={3}
            features={[
              {
                icon: Building2,
                title: t(`${K}.features.hub.title`, undefined, "The Organization Hub"),
                body: t(
                  `${K}.features.hub.body`,
                  undefined,
                  "Brand studio, org chart and positions, finance codes, locations, catalogs, and templates. Change a cost code here and every budget line that references it follows.",
                ),
              },
              {
                icon: BookOpen,
                title: t(`${K}.features.standard.title`, undefined, "The Standard"),
                body: t(
                  `${K}.features.standard.body`,
                  undefined,
                  "The canonical how-we-work knowledge base. When the answer to a question at 2am is written down, the show does not depend on who happens to be awake.",
                ),
              },
              {
                icon: GraduationCap,
                title: t(`${K}.features.lms.title`, undefined, "Courses and learning paths"),
                body: t(
                  `${K}.features.lms.body`,
                  undefined,
                  "Training tracks with lessons, quizzes, and live sessions. Learners see one path from first course to earned credential; managers see who has finished what.",
                ),
              },
              {
                icon: BadgeCheck,
                title: t(`${K}.features.certs.title`, undefined, "Certifications"),
                body: t(
                  `${K}.features.certs.body`,
                  undefined,
                  "Credentials with recert windows and expiry tracking. Every certificate carries a public verification link, so a holder can prove it without an email chain.",
                ),
              },
              {
                icon: Map,
                title: t(`${K}.features.signage.title`, undefined, "The signage library"),
                body: t(
                  `${K}.features.signage.body`,
                  undefined,
                  "The 60 public-domain AIGA and U.S. DOT symbol signs, colored by function the way airports do it, ready to place on any site plan or wayfinding package.",
                ),
              },
              {
                icon: ShieldCheck,
                title: t(`${K}.features.xmce.title`, undefined, "The XMCE compliance engine"),
                body: t(
                  `${K}.features.xmce.body`,
                  undefined,
                  "The recert matrix and decision queue that keep required credentials current across the whole roster, before an expired card becomes a site problem.",
                ),
              },
            ]}
          />
        </div>
      </section>

      {/* Configure once — the inheritance story */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="eyebrow eyebrow-accent">{t(`${K}.inherit.eyebrow`, undefined, "The org level")}</div>
        <h2 className="hed-xl mt-3">{t(`${K}.inherit.heading`, undefined, "Configured here. Read everywhere.")}</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <p className="text-sm text-[var(--p-text-2)]">
            {t(
              `${K}.inherit.col1`,
              undefined,
              "New organizations begin in LEG3ND with a guided setup that installs the base kit: cost centers, catalogs, templates, and the starting org chart, in one pass instead of forty settings screens.",
            )}
          </p>
          <p className="text-sm text-[var(--p-text-2)]">
            {t(
              `${K}.inherit.col2`,
              undefined,
              "From then on the hub is the single source. A project opened in the ATLVS console picks up your templates and finance codes; a crew shift in COMPVSS reads the same training and credential records the academy wrote.",
            )}
          </p>
          <p className="text-sm text-[var(--p-text-2)]">
            {t(
              `${K}.inherit.col3`,
              undefined,
              "Templates are versioned, records remember which template made them, and publishing is a separate permission from editing. The org's memory survives the person who set it up.",
            )}
          </p>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href={urlFor("legend", "/start")} variant="secondary">
            {t(`${K}.inherit.startCta`, undefined, "Start your organization")}
          </Button>
          <Button href={urlFor("legend", "/for-institutions")} variant="secondary">
            {t(`${K}.inherit.institutionsCta`, undefined, "LEG3ND for institutions")}
          </Button>
        </div>
      </section>

      <FAQSection
        title={t(`${K}.faq.title`, undefined, "LEG3ND, asked and answered")}
        faqs={[
          {
            q: t(`${K}.faq.public.q`, undefined, "What can I see without an account?"),
            a: t(
              `${K}.faq.public.a`,
              undefined,
              "The course catalog, course previews, the institutions page, and any credential verification link someone shares with you. The hub, the knowledge base, and your learning records open when you sign in.",
            ),
          },
          {
            q: t(`${K}.faq.org.q`, undefined, "Where do organizations get created?"),
            a: t(
              `${K}.faq.org.a`,
              undefined,
              "Here. LEG3ND owns the org level of the ecosystem: the guided setup creates the organization and installs the base kit, and the other apps join worlds that already exist.",
            ),
          },
          {
            q: t(`${K}.faq.verify.q`, undefined, "Can a third party check a crew member's certification?"),
            a: t(
              `${K}.faq.verify.a`,
              undefined,
              "Yes. Every issued certificate has a public verification page at a stable link, showing the credential, the holder, and whether it is current. No login and no phone call to the office.",
            ),
          },
          {
            q: t(`${K}.faq.templates.q`, undefined, "What counts as a template?"),
            a: t(
              `${K}.faq.templates.a`,
              undefined,
              "Eleven families cover documents, proposals, projects, jobs, field forms, inspections, emails, guides, deliverables, notifications, and advance packets. Each keeps version history, and records remember the template that made them.",
            ),
          },
          {
            q: t(`${K}.faq.signage.q`, undefined, "Are the safety signs really free to use?"),
            a: t(
              `${K}.faq.signage.a`,
              undefined,
              "The symbol set is the 60 public-domain AIGA and U.S. DOT signs, so the pictograms themselves carry no license fee. LEG3ND adds the function-colored panels, the metadata, and the placement tooling.",
            ),
          },
        ]}
      />

      <CTASection
        title={t(`${K}.cta.title`, undefined, "Give the organization a home.")}
        subtitle={t(
          `${K}.cta.subtitle`,
          undefined,
          "The setup takes an afternoon. Everything you configure outlives the show it was configured for.",
        )}
      />
    </div>
  );
}
