export const dynamic = "force-dynamic";

import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { fmtDate } from "@/components/detail/DetailShell";
import { countLabel } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";

export default async function Page({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();
  const [{ data: project }, { data: tasks }] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name")
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .eq("id", projectId)
      .maybeSingle(),
    supabase
      .from("tasks")
      .select("id, title, status, priority, due_at, assigned_to")
      .eq("project_id", projectId)
      .order("due_at", { ascending: true, nullsFirst: false }),
  ]);
  return (
    <>
      <ModuleHeader
        eyebrow={project?.name ?? t("console.projects.tasks.eyebrowFallback", undefined, "Project")}
        title={t("console.projects.tasks.title", undefined, "Tasks")}
        subtitle={countLabel(tasks?.length ?? 0, t("console.projects.tasks.countNoun", undefined, "Task"))}
        breadcrumbs={[
          { label: t("console.projects.tasks.breadcrumbProjects", undefined, "Projects"), href: "/console/projects" },
          {
            label: project?.name ?? t("console.projects.tasks.eyebrowFallback", undefined, "Project"),
            href: `/console/projects/${projectId}`,
          },
          { label: t("console.projects.tasks.title", undefined, "Tasks") },
        ]}
      />
      <div className="page-content max-w-5xl">
        {!tasks || tasks.length === 0 ? (
          <EmptyState
            title={t("console.projects.tasks.emptyTitle", undefined, "No Tasks Yet")}
            description={t(
              "console.projects.tasks.emptyDescription",
              undefined,
              "Project tasks land here once you add the first one.",
            )}
            action={
              <Link className="text-sm font-medium text-[var(--p-accent)]" href="/console/tasks/new">
                {t("console.projects.tasks.newTaskCta", undefined, "New Task →")}
              </Link>
            }
          />
        ) : (
          <table className="ps-table w-full text-sm">
            <thead>
              <tr>
                <th>{t("console.projects.tasks.colTitle", undefined, "Title")}</th>
                <th>{t("console.projects.tasks.colStatus", undefined, "Status")}</th>
                <th>{t("console.projects.tasks.colPriority", undefined, "Priority")}</th>
                <th>{t("console.projects.tasks.colDue", undefined, "Due")}</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id}>
                  <td>
                    <Link href={`/console/tasks/${task.id}`} className="hover:underline">
                      {task.title}
                    </Link>
                  </td>
                  <td>
                    <StatusBadge status={task.status ?? "open"} />
                  </td>
                  <td className="font-mono text-xs">{task.priority ?? "—"}</td>
                  <td className="font-mono text-xs">{fmtDate(task.due_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
