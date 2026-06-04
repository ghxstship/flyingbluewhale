export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SELECT_COLUMNS, TrackerView, type TrackerRow } from "@/components/xpms/TrackerView";
import { AtomDrillIn } from "@/components/xpms/AtomDrillIn";
import { fetchAtomDrillIn } from "@/lib/xpms/drill-in";
import { getRequestT } from "@/lib/i18n/request";

export default async function TrackerPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ atom?: string }>;
}) {
  const { projectId } = await params;
  const { atom: focusedAtomId } = await searchParams;
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();
  const { data: project } = await supabase
    .from("projects")
    .select("id, name, xpms_phase")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .eq("id", projectId)
    .maybeSingle();
  if (!project) notFound();

  // View is typed; `wbs_path` resolves to `unknown` (ltree) — narrow cast
  // at the boundary so the renderer can treat it as a string.
  const { data: rows } = await supabase
    .from("v_xpms_atom_rollup_recursive")
    .select(SELECT_COLUMNS)
    .eq("project_id", projectId)
    .order("wbs_path", { ascending: true });

  const atoms = (rows ?? []) as unknown as TrackerRow[];
  const drillIn = focusedAtomId ? await fetchAtomDrillIn(session.orgId, focusedAtomId) : null;

  return (
    <>
      <ModuleHeader
        eyebrow={project.name}
        title={t("console.projects.tracker.title", undefined, "Tracker")}
        subtitle={`${atoms.length} ${atoms.length === 1 ? t("console.projects.tracker.atomSingular", undefined, "Atom") : t("console.projects.tracker.atomPlural", undefined, "Atoms")} · ${project.xpms_phase ?? "draft"} ${t("console.projects.tracker.phase", undefined, "phase")}`}
        breadcrumbs={[
          { label: t("console.projects.breadcrumb", undefined, "Projects"), href: "/console/projects" },
          { label: project.name, href: `/console/projects/${projectId}` },
          { label: t("console.projects.tracker.breadcrumb", undefined, "Tracker") },
        ]}
      />
      <div className="page-content">
        <TrackerView
          atoms={atoms}
          atomHrefBuilder={(id) => `/console/projects/${projectId}/tracker?atom=${id}`}
          emptyAction={
            <Link className="text-sm text-[var(--org-primary)]" href="/console/xpms">
              {t("console.projects.tracker.openCatalog", undefined, "Open Catalog →")}
            </Link>
          }
        />
      </div>
      {drillIn && (
        <AtomDrillIn
          atom={drillIn.atom}
          tasks={drillIn.tasks}
          deliverables={drillIn.deliverables}
          expenses={drillIn.expenses}
          poLines={drillIn.poLines}
          variances={drillIn.variances}
        />
      )}
    </>
  );
}
