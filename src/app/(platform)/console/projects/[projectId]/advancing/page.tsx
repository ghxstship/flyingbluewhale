export const dynamic = "force-dynamic";

import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { StatusChip } from "@/components/ui/StatusChip";
import { DueDateBadge } from "@/components/ui/DueDateBadge";
import { fmtDate } from "@/components/detail/DetailShell";
import { ActivityDrawer } from "@/components/collab/activity";
import { getActivityForRecord } from "@/lib/db/activity";
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
      .is("deleted_at", null)
      .eq("id", projectId)
      .maybeSingle(),
    supabase
      .from("deliverables")
      .select("id, title, type, status, version, deadline, updated_at, data")
      .eq("project_id", projectId)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false }),
  ]);
  // The advancing page is the closest "deliverable detail" surface in the
  // current IA — there is no per-deliverable page yet. Scope the activity
  // feed to the most recently touched deliverable so the drawer shows the
  // record activity from the row a user just edited; fall back to the
  // project itself when there are no deliverables yet.
  const recentDeliverableId = deliverables?.[0]?.id ?? null;
  const activity = await getActivityForRecord({
    orgId: session.orgId,
    targetTable: recentDeliverableId ? "deliverables" : "projects",
    targetId: recentDeliverableId ?? projectId,
    limit: 50,
  });
  return (
    <>
      <ModuleHeader
        eyebrow={project?.name ?? "Project"}
        title="Advancing"
        subtitle="Every deliverable across talent, vendors, crew."
        breadcrumbs={[
          { label: "Projects", href: "/console/projects" },
          { label: project?.name ?? "Project", href: `/console/projects/${projectId}` },
          { label: "Advancing" },
        ]}
        action={
          project ? (
            <Button href={`/p/${project.slug}/artist/advancing`} size="sm">
              Open Portal View →
            </Button>
          ) : undefined
        }
      />
      <div className="page-content max-w-6xl space-y-5">
        {!deliverables || deliverables.length === 0 ? (
          <EmptyState
            title="No Deliverables Yet"
            description="Riders, plans, and lists land here as your stakeholders submit them from their portal pages."
          />
        ) : (
          <div className="overflow-x-auto">
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
                          <DueDateBadge dueAt={d.deadline} status={d.status} iconOnly size="sm" />
                          {data?.fulfilled_at && <StatusChip tone="success">Fulfilled</StatusChip>}
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

        <div className="grid gap-4 lg:grid-cols-2">
          <div aria-label="Comments">{/* CommentThread (P2.1) lands here */}</div>
          <ActivityDrawer
            targetTable={recentDeliverableId ? "deliverables" : "projects"}
            targetId={recentDeliverableId ?? projectId}
            initial={activity}
            title={recentDeliverableId ? "Latest Deliverable Activity" : "Project Activity"}
          />
        </div>
      </div>
    </>
  );
}
