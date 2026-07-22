import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { urlFor } from "@/lib/urls";
import { DOC_TEMPLATES } from "@/lib/documents/registry";

export const dynamic = "force-dynamic";

/**
 * Templates pillar (MIRROR): one place to see every template family the org
 * configures. Counts are live; each family deep-links to its editing home
 * (console or field app) until the canonical-home move.
 */
export default async function TemplatesPillarPage() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Organization Hub" title="Templates" />
        <ConfigureSupabase />
      </>
    );
  }
  const session = await requireSession();
  const db = (await createClient()) as unknown as LooseSupabase;

  const [{ count: jobTemplateCount }, { count: fieldTemplateCount }, { count: advancePresetCount }] =
    await Promise.all([
      db
        .from("job_templates")
        .select("id", { count: "exact", head: true })
        .eq("org_id", session.orgId)
        .is("deleted_at", null),
      db
        .from("field_templates")
        .select("id", { count: "exact", head: true })
        .eq("org_id", session.orgId)
        .is("deleted_at", null),
      db
        .from("org_advance_presets")
        .select("id", { count: "exact", head: true })
        .eq("org_id", session.orgId)
        .is("deleted_at", null),
    ]);

  const families: {
    href: string;
    title: string;
    count: string;
    blurb: string;
    linkLabel: string;
  }[] = [
    {
      href: urlFor("platform", "/documents"),
      title: "Document templates",
      count: `${DOC_TEMPLATES.length} templates`,
      blurb: "The kit document library: proposals, invoices, riders, run of shows, SOPs, and more. Every merge field record-backed.",
      linkLabel: "Open in console",
    },
    {
      href: urlFor("platform", "/settings/job-templates"),
      title: "Job templates",
      count:
        jobTemplateCount == null
          ? "In console"
          : jobTemplateCount === 1
            ? "1 template"
            : `${jobTemplateCount} templates`,
      blurb: "Reusable job shapes for dispatch and subcontractor work orders.",
      linkLabel: "Open in console",
    },
    {
      href: urlFor("mobile", "/templates"),
      title: "Field templates",
      count:
        fieldTemplateCount == null
          ? "In the field app"
          : fieldTemplateCount === 1
            ? "1 template"
            : `${fieldTemplateCount} templates`,
      blurb: "Checklists, forms, and inspection shapes the COMPVSS field app runs on site.",
      linkLabel: "Open in COMPVSS",
    },
    {
      href: urlFor("platform", "/settings/advancing"),
      title: "Advance packet presets",
      count:
        advancePresetCount == null
          ? "In console"
          : advancePresetCount === 1
            ? "1 preset"
            : `${advancePresetCount} presets`,
      blurb: "The org preset matrix that seeds every advance campaign's sections per audience.",
      linkLabel: "Open in console",
    },
  ];

  return (
    <>
      <ModuleHeader
        eyebrow="Organization Hub"
        title="Templates"
        subtitle="Configure once, reuse on every project. Four template families, one library."
        breadcrumbs={[
          { label: "LEG3ND" },
          { label: "Organization Hub", href: "/legend/hub" },
          { label: "Templates" },
        ]}
      />
      <div className="page-content">
        <div className="section-grid">
          {families.map((f) => (
            <div key={f.title} className="surface flex flex-col p-5">
              <div className="flex items-baseline justify-between gap-3">
                <div className="ps-h text-lg">{f.title}</div>
                <span className="ps-id shrink-0 text-xs text-[var(--p-text-2)]">{f.count}</span>
              </div>
              <p className="mt-1.5 flex-1 text-sm text-[var(--p-text-2)]">{f.blurb}</p>
              <div className="mt-4">
                <Link
                  href={f.href}
                  className="focus-ring text-sm font-medium text-[var(--p-accent-text)] hover:underline"
                >
                  {f.linkLabel}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
