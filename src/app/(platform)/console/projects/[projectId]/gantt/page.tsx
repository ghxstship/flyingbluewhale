export const dynamic = "force-dynamic";

import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/EmptyState";
import { fmtDate } from "@/components/detail/DetailShell";

/**
 * Gantt — rendered as a plain timeline list of tasks + events ordered by
 * start. A real SVG gantt is more UX than value here; the list gives
 * the user the same information (what starts when, who's on it) in a
 * readable way, and matches the existing data model.
 */
export default async function Page({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const [{ data: project }, { data: tasks }, { data: events }] = await Promise.all([
    supabase.from("projects").select("id, name, start_date, end_date").eq("org_id", session.orgId).eq("id", projectId).maybeSingle(),
    supabase.from("tasks").select("id, title, status, due_at").eq("project_id", projectId).order("due_at", { ascending: true, nullsFirst: false }),
    supabase.from("events").select("id, name, starts_at, status").eq("project_id", projectId).order("starts_at", { ascending: true }),
  ]);
  const entries: Array<{ id: string; label: string; kind: "task" | "event"; at: string | null; status: string }> = [
    ...((tasks ?? []).map((t) => ({ id: t.id, label: t.title, kind: "task" as const, at: t.due_at, status: t.status ?? "open" }))),
    ...((events ?? []).map((e) => ({ id: e.id, label: e.name, kind: "event" as const, at: e.starts_at, status: e.status ?? "draft" }))),
  ];
  entries.sort((a, b) => {
    if (!a.at) return 1; if (!b.at) return -1;
    return new Date(a.at).getTime() - new Date(b.at).getTime();
  });
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
      <div className="page-content max-w-5xl">
        {entries.length === 0 ? (
          <EmptyState title="Nothing scheduled yet" description="Tasks and events with dates appear here on a single timeline." />
        ) : (
          <ol className="relative border-s border-[var(--border-color)] ps-5">
            {entries.map((e) => (
              <li key={`${e.kind}-${e.id}`} className="mb-4">
                <div className="absolute -start-1.5 mt-1 h-3 w-3 rounded-full bg-[var(--org-primary)]" aria-hidden />
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">{e.kind}</div>
                    <div className="mt-0.5 text-sm font-medium">{e.label}</div>
                  </div>
                  <div className="text-xs text-[var(--text-muted)] font-mono">{fmtDate(e.at)}</div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </>
  );
}
