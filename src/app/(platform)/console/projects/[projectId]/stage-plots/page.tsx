export const dynamic = "force-dynamic";

import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { NewStagePlotButton } from "@/components/stage-plots/NewStagePlotButton";
import { getRequestT } from "@/lib/i18n/request";

/** Stage plot list for a project — Opportunity #11 UI surface. */

export default async function StagePlotsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();
  const [{ data: project }, { data: plots }] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name")
      .eq("id", projectId)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .maybeSingle(),
    supabase
      .from("stage_plots")
      .select("id, name, width_ft, depth_ft, updated_at")
      .eq("project_id", projectId)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false }),
  ]);

  return (
    <>
      <ModuleHeader
        eyebrow={project?.name ?? t("console.projects.stagePlots.eyebrowFallback", undefined, "Project")}
        title={t("console.projects.stagePlots.title", undefined, "Stage Plots")}
        subtitle={t(
          "console.projects.stagePlots.subtitle",
          undefined,
          "Interactive 2D Layouts — Mics, Amps, Risers, Truss",
        )}
        breadcrumbs={[
          {
            label: t("console.projects.stagePlots.breadcrumbProjects", undefined, "Projects"),
            href: "/console/projects",
          },
          {
            label: project?.name ?? t("console.projects.stagePlots.eyebrowFallback", undefined, "Project"),
            href: `/console/projects/${projectId}`,
          },
          { label: t("console.projects.stagePlots.title", undefined, "Stage Plots") },
        ]}
        action={<NewStagePlotButton projectId={projectId} />}
      />
      <div className="page-content max-w-5xl">
        {plots && plots.length > 0 ? (
          <table className="ps-table w-full text-sm">
            <thead>
              <tr>
                <th>{t("console.projects.stagePlots.colName", undefined, "Name")}</th>
                <th>{t("console.projects.stagePlots.colDimensions", undefined, "Dimensions")}</th>
                <th>{t("console.projects.stagePlots.colLastUpdated", undefined, "Last updated")}</th>
              </tr>
            </thead>
            <tbody>
              {plots.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link
                      href={`/console/projects/${projectId}/stage-plots/${p.id}`}
                      className="font-medium hover:underline"
                    >
                      {p.name}
                    </Link>
                  </td>
                  <td className="font-mono text-xs">
                    {p.width_ft && p.depth_ft ? `${p.width_ft}′ × ${p.depth_ft}′` : "—"}
                  </td>
                  <td className="font-mono text-xs">{new Date(p.updated_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="surface p-6 text-center text-sm text-[var(--p-text-2)]">
            {t("console.projects.stagePlots.emptyPrefix", undefined, "No stage plots yet. Click")}{" "}
            <strong>{t("console.projects.stagePlots.emptyAction", undefined, "New stage plot")}</strong>{" "}
            {t("console.projects.stagePlots.emptySuffix", undefined, "above to open the canvas editor.")}
          </div>
        )}
      </div>
    </>
  );
}
