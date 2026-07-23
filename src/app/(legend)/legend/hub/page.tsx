import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { DOC_TEMPLATES } from "@/lib/documents/registry";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

/**
 * Organization Hub landing (marketing rebuild P3 + the decision 6 rider's
 * canonical-home migration).
 *
 * LEG3ND is where an org's constants live: identity, structure, money codes,
 * places, things, knowledge, templates, and training. The hub surfaces each
 * pillar with a live summary, and the pillars are the CANONICAL read/write
 * homes: Brand Studio, Organization, Finance Codes, Locations, Catalogs, and
 * Job Templates carry full CRUD here; the console counterparts
 * (/studio/settings/{branding,catalog,job-templates}, /studio/locations)
 * redirect in.
 */
export default async function OrganizationHubPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.legend.hub.eyebrow", undefined, "LEG3ND")}
          title={t("console.legend.hub.title", undefined, "Organization Hub")}
        />
        <ConfigureSupabase />
      </>
    );
  }
  const session = await requireSession();
  const db = (await createClient()) as unknown as LooseSupabase;

  const [
    { data: org },
    { count: positionCount },
    { count: costCenterCount },
    { count: locationCount },
    { count: catalogCount },
    { count: resourceCount },
    { count: courseCount },
  ] = await Promise.all([
    db.from("orgs").select("name, name_override, logo_url").eq("id", session.orgId).maybeSingle(),
    db.from("positions").select("id", { count: "exact", head: true }).eq("org_id", session.orgId).eq("active", true),
    db
      .from("cost_centers")
      .select("id", { count: "exact", head: true })
      .eq("org_id", session.orgId)
      .eq("active", true),
    db.from("locations").select("id", { count: "exact", head: true }).eq("org_id", session.orgId),
    db
      .from("master_catalog_items")
      .select("id", { count: "exact", head: true })
      .eq("org_id", session.orgId)
      .is("deleted_at", null),
    db
      .from("resources")
      .select("id", { count: "exact", head: true })
      .eq("org_id", session.orgId)
      .is("deleted_at", null),
    db
      .from("legend_courses")
      .select("id", { count: "exact", head: true })
      .eq("org_id", session.orgId)
      .is("deleted_at", null),
  ]);

  const orgName =
    (org?.name_override as string | null) ??
    (org?.name as string | null) ??
    t("console.legend.hub.yourOrganization", undefined, "Your organization");
  const n = (count: number | null | undefined, singular: string, plural: string) =>
    count == null ? plural : count === 1 ? `1 ${singular}` : `${count} ${plural}`;

  const pillars: { href: string; title: string; summary: string; blurb: string }[] = [
    {
      href: "/legend/hub/brand",
      title: t("console.legend.hub.pillars.brand.title", undefined, "Brand Studio"),
      summary: org?.logo_url
        ? t("console.legend.hub.pillars.brand.logoSet", { orgName }, `${orgName} · logo set`)
        : orgName,
      blurb: t(
        "console.legend.hub.pillars.brand.blurb",
        undefined,
        "Identity, logo, colors, and white-label modes. Applied across every shell and document.",
      ),
    },
    {
      href: "/legend/hub/organization",
      title: t("console.legend.hub.pillars.organization.title", undefined, "Organization"),
      summary: n(
        positionCount,
        t("console.legend.hub.pillars.organization.singular", undefined, "position"),
        t("console.legend.hub.pillars.organization.plural", undefined, "positions"),
      ),
      blurb: t(
        "console.legend.hub.pillars.organization.blurb",
        undefined,
        "The position library and reporting lines, classed by XPMS department.",
      ),
    },
    {
      href: "/legend/hub/finance-codes",
      title: t("console.legend.hub.pillars.financeCodes.title", undefined, "Finance Codes"),
      summary: n(
        costCenterCount,
        t("console.legend.hub.pillars.financeCodes.singular", undefined, "cost center"),
        t("console.legend.hub.pillars.financeCodes.plural", undefined, "cost centers"),
      ),
      blurb: t(
        "console.legend.hub.pillars.financeCodes.blurb",
        undefined,
        "GL codes and cost centers on the XPMS department canon, 0000 through 9000.",
      ),
    },
    {
      href: "/legend/hub/locations",
      title: t("console.legend.hub.pillars.locations.title", undefined, "Locations"),
      summary: n(
        locationCount,
        t("console.legend.hub.pillars.locations.singular", undefined, "location"),
        t("console.legend.hub.pillars.locations.plural", undefined, "locations"),
      ),
      blurb: t(
        "console.legend.hub.pillars.locations.blurb",
        undefined,
        "Company locations and venues. The canonical space registry.",
      ),
    },
    {
      href: "/legend/hub/catalogs",
      title: t("console.legend.hub.pillars.catalogs.title", undefined, "Catalogs"),
      summary: n(
        catalogCount,
        t("console.legend.hub.pillars.catalogs.singular", undefined, "catalog item"),
        t("console.legend.hub.pillars.catalogs.plural", undefined, "catalog items"),
      ),
      blurb: t(
        "console.legend.hub.pillars.catalogs.blurb",
        undefined,
        "The master asset catalog and the signage library. Every assignable thing.",
      ),
    },
    {
      href: "/legend/hub/templates",
      title: t("console.legend.hub.pillars.templates.title", undefined, "Templates"),
      summary: t(
        "console.legend.hub.pillars.templates.count",
        { count: DOC_TEMPLATES.length },
        `${DOC_TEMPLATES.length} doc templates`,
      ),
      blurb: t(
        "console.legend.hub.pillars.templates.blurb",
        undefined,
        "Document, job, field, and advance-packet templates. Configure once, reuse everywhere.",
      ),
    },
    {
      href: "/legend/resources",
      title: t("console.legend.hub.pillars.knowledge.title", undefined, "Knowledge"),
      summary: n(
        resourceCount,
        t("console.legend.hub.pillars.knowledge.singular", undefined, "resource"),
        t("console.legend.hub.pillars.knowledge.plural", undefined, "resources"),
      ),
      blurb: t(
        "console.legend.hub.pillars.knowledge.blurb",
        undefined,
        "The Standard, the knowledge base, and curated resources.",
      ),
    },
    {
      href: "/legend/learn",
      title: t("console.legend.hub.pillars.academy.title", undefined, "Academy"),
      summary: n(
        courseCount,
        t("console.legend.hub.pillars.academy.singular", undefined, "course"),
        t("console.legend.hub.pillars.academy.plural", undefined, "courses"),
      ),
      blurb: t(
        "console.legend.hub.pillars.academy.blurb",
        undefined,
        "Courses, certifications, badges, and the leaderboard.",
      ),
    },
  ];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.legend.hub.eyebrow", undefined, "LEG3ND")}
        title={t("console.legend.hub.title", undefined, "Organization Hub")}
        subtitle={t("console.legend.hub.subtitle", undefined, "Configure your organization once. Every project inherits it.")}
        breadcrumbs={[
          { label: t("console.legend.hub.eyebrow", undefined, "LEG3ND") },
          { label: t("console.legend.hub.title", undefined, "Organization Hub") },
        ]}
      />
      <div className="page-content">
        <div className="section-grid">
          {pillars.map((pillar) => (
            <Link key={pillar.href} href={pillar.href} className="surface hover-lift focus-ring block p-5">
              <div className="flex items-baseline justify-between gap-3">
                <div className="ps-h text-lg">{pillar.title}</div>
                <span className="ps-id shrink-0 text-xs text-[var(--p-text-2)]">{pillar.summary}</span>
              </div>
              <p className="mt-1.5 text-sm text-[var(--p-text-2)]">{pillar.blurb}</p>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
