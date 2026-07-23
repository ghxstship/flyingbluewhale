import { ModuleHeader } from "@/components/Shell";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import { urlFor } from "@/lib/urls";
import { getRequestT } from "@/lib/i18n/request";
import { getOrgDocSettings } from "@/lib/documents/org-settings";
import {
  buildAdvanceItems,
  buildDocItems,
  buildFieldItems,
  buildJobItems,
  familyCreateHref,
  TEMPLATE_FAMILIES,
  type TemplateFamily,
  type TemplateLibraryItem,
} from "@/lib/templates/library";
import { TemplateLibrary } from "./TemplateLibrary";

export const dynamic = "force-dynamic";

/**
 * The ONE template library (L-P2). All four template families in one surface
 * with real data: the code-defined doc registry (with per-type merge-field
 * meta + the org configurator over org_doc_template_settings), hub-native job
 * templates inline, COMPVSS field templates, and the advance-packet preset
 * matrix. Unified search/filter across families rides the client island;
 * every item deep-links to its native editor/preview.
 *
 * Configurator enforcement rule: a DISABLED doc type is hidden from creation
 * pickers (here + the /studio/documents hub) but stays renderable for
 * existing records. See src/lib/documents/org-settings.ts.
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
  const supabase = await createClient();

  const [jobRes, fieldRes, advanceRes, docSettings] = await Promise.all([
    supabase
      .from("job_templates")
      .select("id, name, trade, steps:job_template_steps(count)")
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("field_templates")
      .select("id, name, category, summary, use_count")
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(200),
    supabase
      .from("org_advance_presets")
      .select("audience_type")
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .limit(500),
    getOrgDocSettings(supabase, session.orgId),
  ]);

  const jobRows = (jobRes.data ?? []) as unknown as Array<{
    id: string;
    name: string;
    trade: string | null;
    steps: { count: number }[] | null;
  }>;
  const fieldRows = (fieldRes.data ?? []) as unknown as Array<{
    id: string;
    name: string;
    category: string;
    summary: string | null;
    use_count: number;
  }>;
  const presetRows = (advanceRes.data ?? []) as Array<{ audience_type: string }>;

  const audienceCounts = new Map<string, number>();
  for (const row of presetRows) {
    audienceCounts.set(row.audience_type, (audienceCounts.get(row.audience_type) ?? 0) + 1);
  }

  const items: TemplateLibraryItem[] = [
    ...buildDocItems(docSettings),
    ...buildJobItems(
      jobRows.map((r) => ({
        id: r.id,
        name: r.name,
        trade: r.trade,
        stepCount: r.steps?.[0]?.count ?? 0,
      })),
    ),
    ...buildFieldItems(
      fieldRows.map((r) => ({
        id: r.id,
        name: r.name,
        category: r.category,
        summary: r.summary,
        useCount: r.use_count,
      })),
    ),
    ...buildAdvanceItems(
      Array.from(audienceCounts.entries()).map(([audienceType, sectionCount]) => ({
        audienceType,
        sectionCount,
      })),
    ),
  ];

  const createHrefs = Object.fromEntries(
    TEMPLATE_FAMILIES.map((f) => [f, familyCreateHref(f)]),
  ) as Record<TemplateFamily, string | null>;
  const homeHrefs: Record<TemplateFamily, string> = {
    doc: urlFor("platform", "/documents"),
    job: "/legend/hub/templates/job-templates",
    field: urlFor("mobile", "/templates"),
    advance: urlFor("platform", "/settings/advancing"),
  };

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
        <TemplateLibrary
          items={items}
          canManage={isManagerPlus(session)}
          createHrefs={createHrefs}
          homeHrefs={homeHrefs}
        />
      </div>
    </>
  );
}
