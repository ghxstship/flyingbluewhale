export const dynamic = "force-dynamic";

import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { fmtDate } from "@/components/detail/DetailShell";
import { AdvancingTransitionRow } from "./AdvancingTransitionRow";

export default async function Page({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const [{ data: project }, { data: deliverables }] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name, slug")
      .eq("org_id", session.orgId)
      .eq("id", projectId)
      .maybeSingle(),
    supabase
      .from("deliverables")
      .select("id, title, type, status, version, deadline, updated_at, data")
      .eq("project_id", projectId)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false }),
  ]);
  return (
    <>
      <ModuleHeader
        eyebrow={project?.name ?? "Project"}
        title="Advancing"
        subtitle="Review, approve, and fulfill every deliverable for this project."
        breadcrumbs={[
          { label: "Projects", href: "/console/projects" },
          { label: project?.name ?? "Project", href: `/console/projects/${projectId}` },
          { label: "Advancing" },
        ]}
        action={
          project ? (
            <Button href={`/p/${project.slug}/artist/advancing`} size="sm">
              Open portal view →
            </Button>
          ) : undefined
        }
      />
      <div className="page-content max-w-6xl">
        {!deliverables || deliverables.length === 0 ? (
          <EmptyState
            title="No deliverables yet"
            description="Artists, vendors, crew, and other stakeholders submit advancing materials via their portal pages."
          />
        ) : (
          <div className="surface overflow-x-auto">
            <table className="data-table w-full text-sm">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>v</th>
                  <th>Deadline</th>
                  <th>Updated</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {deliverables.map((d) => {
                  const data = (d.data as { fulfilled_at?: string } | null) ?? null;
                  return (
                    <tr key={d.id}>
                      <td>{d.title ?? "Untitled"}</td>
                      <td className="font-mono text-xs">{d.type}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={d.status} />
                          {data?.fulfilled_at && (
                            <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600">
                              Fulfilled
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="font-mono text-xs">{d.version}</td>
                      <td className="font-mono text-xs">{fmtDate(d.deadline)}</td>
                      <td className="font-mono text-xs">{fmtDate(d.updated_at)}</td>
                      <td className="text-end">
                        <AdvancingTransitionRow
                          id={d.id}
                          status={d.status as string}
                          fulfilled={Boolean(data?.fulfilled_at)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
