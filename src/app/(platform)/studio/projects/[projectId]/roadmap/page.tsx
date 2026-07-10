export const dynamic = "force-dynamic";

import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { fmtDate } from "@/components/detail/DetailShell";
import { getRequestT } from "@/lib/i18n/request";

/**
 * Roadmap — quarterly grouping of tasks + milestones. Uses tasks and
 * events tables; a "milestone" here is any event whose status == "scheduled".
 */
function quarterOf(isoDate: string | null | undefined, unscheduledLabel: string): string {
  if (!isoDate) return unscheduledLabel;
  const d = new Date(isoDate);
  const q = Math.floor(d.getMonth() / 3) + 1;
  return `Q${q} ${d.getFullYear()}`;
}

export default async function Page({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();
  const [{ data: project }, { data: tasks }, { data: events }] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name")
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .eq("id", projectId)
      .maybeSingle(),
    supabase.from("tasks").select("id, title, due_at, task_state").eq("project_id", projectId),
    supabase
      .from("events")
      .select("id, name, starts_at, event_state")
      .eq("project_id", projectId)
      .eq("event_state", "scheduled"),
  ]);
  type Item = { id: string; label: string; kind: "task" | "milestone"; date: string | null; status: string };
  const unscheduledLabel = t("console.projects.roadmap.unscheduled", undefined, "Unscheduled");
  const items: Item[] = [
    ...(tasks ?? []).map(
      (task): Item => ({
        id: task.id,
        label: task.title,
        kind: "task",
        date: task.due_at,
        status: task.task_state ?? "open",
      }),
    ),
    ...(events ?? []).map(
      (e): Item => ({
        id: e.id,
        label: e.name,
        kind: "milestone",
        date: e.starts_at,
        status: e.event_state ?? "scheduled",
      }),
    ),
  ];
  const byQuarter = new Map<string, Item[]>();
  for (const i of items) {
    const q = quarterOf(i.date, unscheduledLabel);
    const list = byQuarter.get(q) ?? [];
    list.push(i);
    byQuarter.set(q, list);
  }
  const order = Array.from(byQuarter.keys()).sort();
  return (
    <>
      <ModuleHeader
        eyebrow={project?.name ?? t("console.projects.roadmap.eyebrowFallback", undefined, "Project")}
        title={t("console.projects.roadmap.title", undefined, "Roadmap")}
        subtitle={t("console.projects.roadmap.subtitle", undefined, "Quarterly View Of Tasks And Milestones")}
        breadcrumbs={[
          { label: t("console.projects.roadmap.breadcrumbProjects", undefined, "Projects"), href: "/studio/projects" },
          {
            label: project?.name ?? t("console.projects.roadmap.eyebrowFallback", undefined, "Project"),
            href: `/studio/projects/${projectId}`,
          },
          { label: t("console.projects.roadmap.title", undefined, "Roadmap") },
        ]}
      />
      <div className="page-content max-w-5xl space-y-6">
        {items.length === 0 ? (
          <EmptyState
            title={t("console.projects.roadmap.emptyTitle", undefined, "Roadmap Empty")}
            description={t(
              "console.projects.roadmap.emptyDescription",
              undefined,
              "Add tasks with due dates or confirmed events to populate this view.",
            )}
          />
        ) : (
          order.map((q) => (
            <section key={q} className="surface p-5">
              <div className="text-[11px] tracking-[0.2em] text-[var(--p-text-2)] uppercase">{q}</div>
              <ul className="mt-3 divide-y divide-[var(--p-border)]">
                {(byQuarter.get(q) ?? []).map((i) => (
                  <li key={`${i.kind}-${i.id}`} className="flex items-center justify-between py-2 text-sm">
                    <span>
                      <span className="me-2 inline-block rounded bg-[var(--p-surface-2)] px-1.5 py-0.5 text-[11px] tracking-wider text-[var(--p-text-2)] uppercase">
                        {i.kind === "task"
                          ? t("console.projects.roadmap.kindTask", undefined, "task")
                          : t("console.projects.roadmap.kindMilestone", undefined, "milestone")}
                      </span>
                      {i.label}
                    </span>
                    <span className="flex items-center gap-2">
                      <StatusBadge status={i.status} />
                      <span className="font-mono text-xs text-[var(--p-text-2)]">{fmtDate(i.date)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
    </>
  );
}
