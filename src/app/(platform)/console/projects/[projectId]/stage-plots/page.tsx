export const dynamic = "force-dynamic";

import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { NewStagePlotButton } from "@/components/stage-plots/NewStagePlotButton";

/** Stage plot list for a project — Opportunity #11 UI surface. */

export default async function StagePlotsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const [{ data: project }, { data: plots }] = await Promise.all([
    supabase.from("projects").select("id, name").eq("id", projectId).eq("org_id", session.orgId).maybeSingle(),
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
        eyebrow={project?.name ?? "Project"}
        title="Stage plots"
        subtitle="Interactive 2D layouts — drag to place mics, amps, risers, and truss."
        breadcrumbs={[
          { label: "Projects", href: "/console/projects" },
          { label: project?.name ?? "Project", href: `/console/projects/${projectId}` },
          { label: "Stage plots" },
        ]}
        action={<NewStagePlotButton projectId={projectId} />}
      />
      <div className="page-content max-w-5xl">
        {plots && plots.length > 0 ? (
          <table className="data-table w-full text-sm">
            <thead>
              <tr>
                <th>Name</th>
                <th>Dimensions</th>
                <th>Last updated</th>
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
          <div className="surface p-6 text-center text-sm text-[var(--text-muted)]">
            No stage plots yet. Click <strong>New stage plot</strong> above to open the canvas editor.
          </div>
        )}
      </div>
    </>
  );
}
