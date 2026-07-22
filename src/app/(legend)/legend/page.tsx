import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { getRequestT } from "@/lib/i18n/request";
import { urlFor } from "@/lib/urls";

export const dynamic = "force-dynamic";

/**
 * LEG3ND landing — the Organization Hub product surface (public).
 *
 * Repositioned 2026-07-22 (marketing rebuild §9 + the app ownership canon:
 * LEG3ND owns 0000 Executive, the org level itself). The hub tile leads;
 * knowledge/LMS/resources remain first-class tiles beneath it. This page also
 * serves the apex /legend marketing URL (the (marketing)/legend page was
 * removed: route groups share one path space, so two pages at /legend are a
 * fatal Next collision — found the hard way in commit 9d13d2d3).
 */
export default async function LegendHubPage() {
  const { t } = await getRequestT();
  // Cross-shell tiles route through `urlFor("platform", …)` (URL canon) so
  // the subdomain/path-prefix decision stays in one place.
  const tiles = [
    {
      href: "/legend/hub",
      title: t("console.legend.tiles.hub.title", undefined, "Organization Hub"),
      blurb: t("console.legend.tiles.hub.blurb", undefined, "Brand, org chart, cost codes, locations, catalogs, templates. Configure once, every project inherits it."),
    },
    {
      href: "/legend/start",
      title: t("console.legend.tiles.start.title", undefined, "Start Your Organization"),
      blurb: t("console.legend.tiles.start.blurb", undefined, "New organizations begin here: the guided setup that installs the XPMS 2.5 base kit."),
    },
    {
      href: urlFor("platform", "/knowledge"),
      title: t("console.legend.tiles.standard.title", undefined, "The Standard"),
      blurb: t("console.legend.tiles.standard.blurb", undefined, "Knowledge base — the canonical how-we-work reference."),
    },
    {
      href: "/legend/learn",
      title: t("console.legend.tiles.courses.title", undefined, "Courses"),
      blurb: t("console.legend.tiles.courses.blurb", undefined, "LMS — learn, assess, certify on the XPMS 2.5 protocol."),
    },
    {
      href: "/legend/certifications",
      title: t("console.legend.tiles.certs.title", undefined, "Certifications"),
      blurb: t("console.legend.tiles.certs.blurb", undefined, "Credentials, recert windows, and expiry tracking."),
    },
    {
      href: "/legend/resources",
      title: t("console.legend.tiles.resources.title", undefined, "Resources"),
      blurb: t("console.legend.tiles.resources.blurb", undefined, "Curated documents, links, templates, and references."),
    },
    {
      href: urlFor("platform", "/settings/catalog"),
      title: t("console.legend.tiles.catalog.title", undefined, "Catalog"),
      blurb: t("console.legend.tiles.catalog.blurb", undefined, "The priced atom / URID master catalog."),
    },
    {
      href: "/legend/signage",
      title: t("console.legend.tiles.signage.title", undefined, "Signage"),
      blurb: t("console.legend.tiles.signage.blurb", undefined, "ISO 7010 / DOT-AIGA / ISA life-safety sign library."),
    },
    {
      href: "/legend/engine",
      title: t("console.legend.tiles.engine.title", undefined, "Compliance Engine"),
      blurb: t("console.legend.tiles.engine.blurb", undefined, "XMCE — author rules, run checks, triage findings."),
    },
    {
      href: urlFor("platform", "/safety/incidents"),
      title: t("console.legend.tiles.safety.title", undefined, "Safety"),
      blurb: t("console.legend.tiles.safety.blurb", undefined, "Incidents, crisis, medical, and safeguarding."),
    },
    {
      href: "/legend/community",
      title: t("console.legend.tiles.community.title", undefined, "Community"),
      blurb: t("console.legend.tiles.community.blurb", undefined, "Cohort feed, members, and contribution points."),
    },
    {
      href: "/legend/leaderboard",
      title: t("console.legend.tiles.leaderboard.title", undefined, "Leaderboard"),
      blurb: t("console.legend.tiles.leaderboard.blurb", undefined, "Points, tiers, and achievements — shared with COMPVSS."),
    },
    {
      href: "/legend/store",
      title: t("console.legend.tiles.store.title", undefined, "Store"),
      blurb: t("console.legend.tiles.store.blurb", undefined, "Buy credits and redeem vouchers for courses + exams."),
    },
    {
      href: "/legend/compliance",
      title: t("console.legend.tiles.matrix.title", undefined, "Recert Matrix"),
      blurb: t("console.legend.tiles.matrix.blurb", undefined, "Org credential health — member × certification, by state."),
    },
  ];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.legend.eyebrow", undefined, "LEG3ND")}
        title={t("console.legend.title", undefined, "Knowledge")}
        subtitle={t("console.legend.subtitle", undefined, "Knowledge · LMS · Resources — on the XPMS 2.5 protocol.")}
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
