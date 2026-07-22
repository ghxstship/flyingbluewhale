import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { DOC_TEMPLATES } from "@/lib/documents/registry";

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
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="LEG3ND" title="Organization Hub" />
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

  const orgName = (org?.name_override as string | null) ?? (org?.name as string | null) ?? "Your organization";
  const n = (count: number | null | undefined, singular: string, plural: string) =>
    count == null ? plural : count === 1 ? `1 ${singular}` : `${count} ${plural}`;

  const pillars: { href: string; title: string; summary: string; blurb: string }[] = [
    {
      href: "/legend/hub/brand",
      title: "Brand Studio",
      summary: org?.logo_url ? `${orgName} · logo set` : orgName,
      blurb: "Identity, logo, colors, and white-label modes. Applied across every shell and document.",
    },
    {
      href: "/legend/hub/organization",
      title: "Organization",
      summary: n(positionCount, "position", "positions"),
      blurb: "The position library and reporting lines, classed by XPMS department.",
    },
    {
      href: "/legend/hub/finance-codes",
      title: "Finance Codes",
      summary: n(costCenterCount, "cost center", "cost centers"),
      blurb: "GL codes and cost centers on the XPMS department canon, 0000 through 9000.",
    },
    {
      href: "/legend/hub/locations",
      title: "Locations",
      summary: n(locationCount, "location", "locations"),
      blurb: "Company locations and venues. The canonical space registry.",
    },
    {
      href: "/legend/hub/catalogs",
      title: "Catalogs",
      summary: n(catalogCount, "catalog item", "catalog items"),
      blurb: "The master asset catalog and the signage library. Every assignable thing.",
    },
    {
      href: "/legend/hub/templates",
      title: "Templates",
      summary: `${DOC_TEMPLATES.length} doc templates`,
      blurb: "Document, job, field, and advance-packet templates. Configure once, reuse everywhere.",
    },
    {
      href: "/legend/resources",
      title: "Knowledge",
      summary: n(resourceCount, "resource", "resources"),
      blurb: "The Standard, the knowledge base, and curated resources.",
    },
    {
      href: "/legend/learn",
      title: "Academy",
      summary: n(courseCount, "course", "courses"),
      blurb: "Courses, certifications, badges, and the leaderboard.",
    },
  ];

  return (
    <>
      <ModuleHeader
        eyebrow="LEG3ND"
        title="Organization Hub"
        subtitle="Configure your organization once. Every project inherits it."
        breadcrumbs={[{ label: "LEG3ND" }, { label: "Organization Hub" }]}
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
