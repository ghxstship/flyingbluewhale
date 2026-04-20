export const dynamic = "force-dynamic";

import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { fmtDate } from "@/components/detail/DetailShell";

/**
 * Roadmap — quarterly grouping of tasks + milestones. Uses tasks and
 * events tables; a "milestone" here is any event whose status == "scheduled".
 */
function quarterOf(isoDate: string | null | undefined): string {
  if (!isoDate) return "Unscheduled";
  const d = new Date(isoDate);
  const q = Math.floor(d.getMonth() / 3) + 1;
  return `Q${q} ${d.getFullYear()}`;
}

export default async function Page({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const [{ data: project }, { data: tasks }, { data: events }] = await Promise.all([
    supabase.from("projects").select("id, name").eq("org_id", session.orgId).eq("id", projectId).maybeSingle(),
    supabase.from("tasks").select("id, title, due_at, status").eq("project_id", projectId),
    supabase.from("events").select("id, name, starts_at, status").eq("project_id", projectId).eq("status", "scheduled"),
  ]);
  type Item = { id: string; label: string; kind: "task" | "milestone"; date: string | null; status: string };
  const items: Item[] = [
    ...((tasks ?? []).map((t): Item => ({ id: t.id, label: t.title, kind: "task", date: t.due_at, status: t.status ?? "open" }))),
    ...((events ?? []).map((e): Item => ({ id: e.id, label: e.name, kind: "milestone", date: e.starts_at, status: e.status ?? "scheduled" }))),
  ];
  const byQuarter = new Map<string, Item[]>();
  for (const i of items) {
    const q = quarterOf(i.date);
    const list = byQuarter.get(q) ?? [];
    list.push(i);
    byQuarter.set(q, list);
  }
  const order = Array.from(byQuarter.keys()).sort();
  return (
    <>
      <ModuleHeader
        eyebrow={project?.name ?? "Project"}
        title="Roadmap"
        subtitle="Quarterly view of tasks and milestones."
        breadcrumbs={[
          { label: "Projects", href: "/console/projects" },
          { label: project?.name ?? "Project", href: `/console/projects/${projectId}` },
          { label: "Roadmap" },
        ]}
      />
      <div className="page-content max-w-5xl space-y-6">
        {items.length === 0 ? (
          <EmptyState title="Roadmap empty" description="Add tasks with due dates or confirmed events to populate this view." />
        ) : order.map((q) => (
          <section key={q} className="surface p-5">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">{q}</div>
            <ul className="mt-3 divide-y divide-[var(--border-color)]">
              {(byQuarter.get(q) ?? []).map((i) => (
                <li key={`${i.kind}-${i.id}`} className="flex items-center justify-between py-2 text-sm">
                  <span>
                    <span className="me-2 inline-block rounded bg-[var(--surface-inset)] px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-[var(--text-muted)]">{i.kind}</span>
                    {i.label}
                  </span>
                  <span className="flex items-center gap-2">
                    <StatusBadge status={i.status} />
                    <span className="font-mono text-xs text-[var(--text-muted)]">{fmtDate(i.date)}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
