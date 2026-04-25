export const dynamic = "force-dynamic";

import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/EmptyState";
import { fmtDate } from "@/components/detail/DetailShell";
import { GanttChart, type GanttRow } from "./GanttChart";

export default async function Page({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const [{ data: project }, { data: tasks }, { data: events }] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name, start_date, end_date")
      .eq("org_id", session.orgId)
      .eq("id", projectId)
      .maybeSingle(),
    supabase
      .from("tasks")
      .select("id, title, status, due_at, created_at")
      .eq("project_id", projectId)
      .order("due_at", { ascending: true, nullsFirst: false }),
    supabase
      .from("events")
      .select("id, name, starts_at, ends_at, status")
      .eq("project_id", projectId)
      .order("starts_at", { ascending: true }),
  ]);

  // Normalize tasks (which only have a single due_at) into bars from
  // created_at → due_at. Events get their proper start/end window.
  const rows: GanttRow[] = [
    ...((tasks ?? []).map((t) => ({
      id: `task-${t.id}`,
      label: t.title,
      lane: "Tasks" as const,
      start: t.created_at,
      end: t.due_at ?? t.created_at,
      status: t.status ?? "open",
    }))),
    ...((events ?? []).map((e) => ({
      id: `event-${e.id}`,
      label: e.name,
      lane: "Events" as const,
      start: e.starts_at,
      end: e.ends_at ?? e.starts_at,
      status: e.status ?? "draft",
    }))),
  ].filter((r) => r.start && r.end);

  return (
    <>
      <ModuleHeader
        eyebrow={project?.name ?? "Project"}
        title="Gantt"
        subtitle={project ? `${fmtDate(project.start_date)} → ${fmtDate(project.end_date)}` : undefined}
        breadcrumbs={[
          { label: "Projects", href: "/console/projects" },
          { label: project?.name ?? "Project", href: `/console/projects/${projectId}` },
          { label: "Gantt" },
        ]}
      />
      <div className="page-content max-w-6xl">
        {rows.length === 0 ? (
          <EmptyState
            title="Nothing scheduled yet"
            description="Tasks and events with dates appear here on a single timeline."
          />
        ) : (
          <GanttChart
            rows={rows}
            projectStart={project?.start_date ?? null}
            projectEnd={project?.end_date ?? null}
          />
        )}
      </div>
    </>
  );
}
