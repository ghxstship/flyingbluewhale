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
import { getRequestT } from "@/lib/i18n/request";
import { AdvancingTransitionRow } from "./AdvancingTransitionRow";

export default async function Page({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();
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
      .select("id, title, type, fulfillment_state, version, deadline, updated_at, data")
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
        eyebrow={project?.name ?? t("console.projects.advancing.eyebrowFallback", undefined, "Project")}
        title={t("console.projects.advancing.title", undefined, "Advancing")}
        subtitle={t(
          "console.projects.advancing.subtitle",
          undefined,
          "Every deliverable across talent, vendors, crew.",
        )}
        breadcrumbs={[
          {
            label: t("console.projects.advancing.breadcrumbs.projects", undefined, "Projects"),
            href: "/console/projects",
          },
          {
            label: project?.name ?? t("console.projects.advancing.eyebrowFallback", undefined, "Project"),
            href: `/console/projects/${projectId}`,
          },
          { label: t("console.projects.advancing.breadcrumbs.advancing", undefined, "Advancing") },
        ]}
        action={
          project ? (
            <Button href={`/p/${project.slug}/artist/advancing`} size="sm">
              {t("console.projects.advancing.openPortalView", undefined, "Open Portal View →")}
            </Button>
          ) : undefined
        }
      />
      <div className="page-content max-w-6xl space-y-5">
        {!deliverables || deliverables.length === 0 ? (
          <EmptyState
            title={t("console.projects.advancing.empty.title", undefined, "No Deliverables Yet")}
            description={t(
              "console.projects.advancing.empty.description",
              undefined,
              "Riders, plans, and lists land here as your stakeholders submit them from their portal pages.",
            )}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="ps-table w-full text-sm">
              <thead>
                <tr>
                  <th>{t("console.projects.advancing.columns.title", undefined, "Title")}</th>
                  <th>{t("console.projects.advancing.columns.type", undefined, "Type")}</th>
                  <th>{t("console.projects.advancing.columns.status", undefined, "Status")}</th>
                  <th>{t("console.projects.advancing.columns.version", undefined, "v")}</th>
                  <th>{t("console.projects.advancing.columns.deadline", undefined, "Deadline")}</th>
                  <th>{t("console.projects.advancing.columns.updated", undefined, "Updated")}</th>
                  <th className="text-end">{t("console.projects.advancing.columns.actions", undefined, "Actions")}</th>
                </tr>
              </thead>
              <tbody>
                {deliverables.map((d) => {
                  const data = (d.data as { fulfilled_at?: string } | null) ?? null;
                  return (
                    <tr key={d.id}>
                      <td>{d.title ?? t("console.projects.advancing.untitled", undefined, "Untitled")}</td>
                      <td className="font-mono text-xs">{d.type}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={d.fulfillment_state} />
                          <DueDateBadge dueAt={d.deadline} status={d.fulfillment_state} iconOnly size="sm" />
                          {data?.fulfilled_at && (
                            <StatusChip tone="success">
                              {t("console.projects.advancing.fulfilled", undefined, "Fulfilled")}
                            </StatusChip>
                          )}
                        </div>
                      </td>
                      <td className="font-mono text-xs">{d.version}</td>
                      <td className="font-mono text-xs">{fmtDate(d.deadline)}</td>
                      <td className="font-mono text-xs">{fmtDate(d.updated_at)}</td>
                      <td className="text-end">
                        <AdvancingTransitionRow
                          id={d.id}
                          status={d.fulfillment_state as string}
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
          <div aria-label={t("console.projects.advancing.commentsAria", undefined, "Comments")}>
            {/* CommentThread (P2.1) lands here */}
          </div>
          <ActivityDrawer
            targetTable={recentDeliverableId ? "deliverables" : "projects"}
            targetId={recentDeliverableId ?? projectId}
            initial={activity}
            title={
              recentDeliverableId
                ? t("console.projects.advancing.activity.latestDeliverable", undefined, "Latest Deliverable Activity")
                : t("console.projects.advancing.activity.project", undefined, "Project Activity")
            }
          />
        </div>
      </div>
    </>
  );
}
