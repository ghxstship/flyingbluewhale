import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

/**
 * LEG3ND hub (kit v5) — the Knowledge · LMS · Resources product landing.
 * Tiles link to The Standard / Courses / Certifications / Resources / Catalog
 * / Signage / Compliance Engine / Safety. The /console/legend subtree is
 * re-skinned to Production Orange + airport-signage type by layout.tsx.
 */
export default async function LegendHubPage() {
  const { t } = await getRequestT();
  const tiles = [
    {
      href: "/console/knowledge",
      title: t("console.legend.tiles.standard.title", undefined, "The Standard"),
      blurb: t("console.legend.tiles.standard.blurb", undefined, "Knowledge base — the canonical how-we-work reference."),
    },
    {
      href: "/console/workforce/courses",
      title: t("console.legend.tiles.courses.title", undefined, "Courses"),
      blurb: t("console.legend.tiles.courses.blurb", undefined, "LMS — training tracks, lessons, and quizzes."),
    },
    {
      href: "/console/accreditation",
      title: t("console.legend.tiles.certs.title", undefined, "Certifications"),
      blurb: t("console.legend.tiles.certs.blurb", undefined, "Credentials, accreditation, and expiry tracking."),
    },
    {
      href: "/console/legend/resources",
      title: t("console.legend.tiles.resources.title", undefined, "Resources"),
      blurb: t("console.legend.tiles.resources.blurb", undefined, "Curated documents, links, templates, and references."),
    },
    {
      href: "/console/settings/catalog",
      title: t("console.legend.tiles.catalog.title", undefined, "Catalog"),
      blurb: t("console.legend.tiles.catalog.blurb", undefined, "The priced atom / URID master catalog."),
    },
    {
      href: "/console/legend/signage",
      title: t("console.legend.tiles.signage.title", undefined, "Signage"),
      blurb: t("console.legend.tiles.signage.blurb", undefined, "ISO 7010 / DOT-AIGA / ISA life-safety sign library."),
    },
    {
      href: "/console/legend/engine",
      title: t("console.legend.tiles.engine.title", undefined, "Compliance Engine"),
      blurb: t("console.legend.tiles.engine.blurb", undefined, "XMCE — author rules, run checks, triage findings."),
    },
    {
      href: "/console/safety/incidents",
      title: t("console.legend.tiles.safety.title", undefined, "Safety"),
      blurb: t("console.legend.tiles.safety.blurb", undefined, "Incidents, crisis, medical, and safeguarding."),
    },
  ];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.legend.eyebrow", undefined, "LEG3ND")}
        title={t("console.legend.title", undefined, "Knowledge")}
        subtitle={t("console.legend.subtitle", undefined, "Knowledge · LMS · Resources — on the XPMS 2.0 protocol.")}
      />
      <div className="page-content">
        <div className="section-grid">
          {tiles.map((tile) => (
            <Link key={tile.href} href={tile.href} className="surface hover-lift focus-ring block p-5">
              <div className="ps-h text-lg">{tile.title}</div>
              <p className="mt-1.5 text-sm text-[var(--p-text-2)]">{tile.blurb}</p>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
