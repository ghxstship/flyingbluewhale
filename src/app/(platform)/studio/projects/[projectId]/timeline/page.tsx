export const dynamic = "force-dynamic";

import { ModuleHeader } from "@/components/Shell";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getRequestT } from "@/lib/i18n/request";
import type { GanttRow } from "@/components/ui/GanttChart";
import { TimelineGantt } from "./TimelineGantt";

/**
 * Project Timeline — the kit <GanttChart> (IMPLEMENTATION §3, CAL archetype)
 * over the project's real tasks + events. Tasks span created_at → due_at;
 * events span starts_at → ends_at. Distinct from the multi-view /schedule
 * surface: this is the dedicated Gantt altitude.
 */
export default async function Page({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const { t } = await getRequestT();
  const session = await requireSession();
  const supabase = await createClient();

  const [{ data: project }, { data: tasks }, { data: events }] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name, start_date, end_date")
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .eq("id", projectId)
      .maybeSingle(),
    supabase
      .from("tasks")
      .select("id, title, task_state, due_at, created_at")
      .eq("project_id", projectId)
      .order("due_at", { ascending: true, nullsFirst: false }),
    supabase
      .from("events")
      .select("id, name, event_state, starts_at, ends_at")
      .eq("project_id", projectId)
      .order("starts_at", { ascending: true }),
  ]);

  const ms = (iso: string | null): number | null => {
    if (!iso) return null;
    const n = new Date(iso).getTime();
    return Number.isFinite(n) ? n : null;
  };

  const rows: GanttRow[] = [
    ...(tasks ?? []).flatMap((task) => {
      const start = ms(task.created_at);
      const end = ms(task.due_at) ?? start;
      if (start == null || end == null) return [];
      return [
        {
          id: `task-${task.id}`,
          label: task.title,
          lane: t("console.projects.timeline.tasksLane", undefined, "Tasks"),
          start,
          end: Math.max(end, start + 3600_000),
          tone: "var(--chart-2)",
        } satisfies GanttRow,
      ];
    }),
    ...(events ?? []).flatMap((e) => {
      const start = ms(e.starts_at);
      const end = ms(e.ends_at) ?? start;
      if (start == null || end == null) return [];
      return [
        {
          id: `event-${e.id}`,
          label: e.name,
          lane: t("console.projects.timeline.eventsLane", undefined, "Events"),
          start,
          end: Math.max(end, start + 3600_000),
          tone: "var(--chart-4)",
        } satisfies GanttRow,
      ];
    }),
  ];

  return (
    <>
      <ModuleHeader
        eyebrow={project?.name ?? t("console.projects.timeline.projectEyebrow", undefined, "Project")}
        title={t("console.projects.timeline.title", undefined, "Timeline")}
        subtitle={t("console.projects.timeline.subtitle", undefined, "Gantt view of tasks and events")}
        breadcrumbs={[
          { label: t("console.projects.timeline.breadcrumbProjects", undefined, "Projects"), href: "/studio/projects" },
          {
            label: project?.name ?? t("console.projects.timeline.projectEyebrow", undefined, "Project"),
            href: `/studio/projects/${projectId}`,
          },
          { label: t("console.projects.timeline.title", undefined, "Timeline") },
        ]}
        action={
          <Button href={`/studio/projects/${projectId}/schedule`} variant="secondary" size="sm">
            {t("console.projects.timeline.scheduleViews", undefined, "All views")}
          </Button>
        }
      />
      <div className="page-content max-w-6xl">
        {rows.length === 0 ? (
          <EmptyState
            title={t("console.projects.timeline.emptyTitle", undefined, "Nothing on the timeline yet")}
            description={t(
              "console.projects.timeline.emptyDescription",
              undefined,
              "Tasks with due dates and scheduled events plot here as Gantt bars.",
            )}
          />
        ) : (
          <div className="surface p-4">
            <TimelineGantt rows={rows} today={Date.now()} />
          </div>
        )}
      </div>
    </>
  );
}
