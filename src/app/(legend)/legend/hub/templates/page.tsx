import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { urlFor } from "@/lib/urls";
import { DOC_TEMPLATES } from "@/lib/documents/registry";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

/**
 * Templates pillar: one place to see every template family the org
 * configures. Counts are live. Job templates are hub-native (canonical home,
 * decision 6 rider); the remaining families deep-link to their editing homes
 * (doc templates ride the code-defined registry via the console documents
 * hub, field templates are COMPVSS-native for offline use, advance-packet
 * presets are advancing-engine config).
 */
export default async function TemplatesPillarPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.legend.hub.templates.eyebrow", undefined, "Organization Hub")}
          title={t("console.legend.hub.templates.title", undefined, "Templates")}
        />
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

  const nTemplates = (count: number) =>
    t("console.legend.hub.templates.nTemplates", { count }, `${count} templates`);

  const families: {
    href: string;
    title: string;
    count: string;
    blurb: string;
    linkLabel: string;
  }[] = [
    {
      href: urlFor("platform", "/documents"),
      title: t("console.legend.hub.templates.doc.title", undefined, "Document templates"),
      count: nTemplates(DOC_TEMPLATES.length),
      blurb: t(
        "console.legend.hub.templates.doc.blurb",
        undefined,
        "The kit document library: proposals, invoices, riders, run of shows, SOPs, and more. Every merge field record-backed.",
      ),
      linkLabel: t("console.legend.hub.templates.openInConsole", undefined, "Open in console"),
    },
    {
      href: "/legend/hub/templates/job-templates",
      title: t("console.legend.hub.templates.job.title", undefined, "Job templates"),
      count:
        jobTemplateCount == null
          ? t("console.legend.hub.templates.job.inTheHub", undefined, "In the hub")
          : jobTemplateCount === 1
            ? t("console.legend.hub.templates.oneTemplate", undefined, "1 template")
            : nTemplates(jobTemplateCount),
      blurb: t(
        "console.legend.hub.templates.job.blurb",
        undefined,
        "Reusable job shapes for dispatch and subcontractor work orders.",
      ),
      linkLabel: t("console.legend.hub.templates.job.open", undefined, "Open in the hub"),
    },
    {
      href: urlFor("mobile", "/templates"),
      title: t("console.legend.hub.templates.field.title", undefined, "Field templates"),
      count:
        fieldTemplateCount == null
          ? t("console.legend.hub.templates.field.inTheFieldApp", undefined, "In the field app")
          : fieldTemplateCount === 1
            ? t("console.legend.hub.templates.oneTemplate", undefined, "1 template")
            : nTemplates(fieldTemplateCount),
      blurb: t(
        "console.legend.hub.templates.field.blurb",
        undefined,
        "Checklists, forms, and inspection shapes the COMPVSS field app runs on site.",
      ),
      linkLabel: t("console.legend.hub.templates.field.open", undefined, "Open in COMPVSS"),
    },
    {
      href: urlFor("platform", "/settings/advancing"),
      title: t("console.legend.hub.templates.advance.title", undefined, "Advance packet presets"),
      count:
        advancePresetCount == null
          ? t("console.legend.hub.templates.advance.inConsole", undefined, "In console")
          : advancePresetCount === 1
            ? t("console.legend.hub.templates.onePreset", undefined, "1 preset")
            : t("console.legend.hub.templates.nPresets", { count: advancePresetCount }, `${advancePresetCount} presets`),
      blurb: t(
        "console.legend.hub.templates.advance.blurb",
        undefined,
        "The org preset matrix that seeds every advance campaign's sections per audience.",
      ),
      linkLabel: t("console.legend.hub.templates.openInConsole", undefined, "Open in console"),
    },
  ];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.legend.hub.templates.eyebrow", undefined, "Organization Hub")}
        title={t("console.legend.hub.templates.title", undefined, "Templates")}
        subtitle={t(
          "console.legend.hub.templates.subtitle",
          undefined,
          "Configure once, reuse on every project. Four template families, one library.",
        )}
        breadcrumbs={[
          { label: t("console.legend.hub.breadcrumb", undefined, "LEG3ND") },
          { label: t("console.legend.hub.title", undefined, "Organization Hub"), href: "/legend/hub" },
          { label: t("console.legend.hub.templates.title", undefined, "Templates") },
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
