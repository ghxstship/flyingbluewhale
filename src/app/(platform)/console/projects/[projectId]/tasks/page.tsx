export const dynamic = "force-dynamic";

import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { fmtDate } from "@/components/detail/DetailShell";

export default async function Page({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const [{ data: project }, { data: tasks }] = await Promise.all([
    supabase.from("projects").select("id, name").eq("org_id", session.orgId).eq("id", projectId).maybeSingle(),
    supabase.from("tasks").select("id, title, status, priority, due_at, assigned_to").eq("project_id", projectId).order("due_at", { ascending: true, nullsFirst: false }),
  ]);
  return (
    <>
      <ModuleHeader
        eyebrow={project?.name ?? "Project"}
        title="Tasks"
        subtitle={`${tasks?.length ?? 0} task${(tasks?.length ?? 0) === 1 ? "" : "s"}`}
        breadcrumbs={[
          { label: "Projects", href: "/console/projects" },
          { label: project?.name ?? "Project", href: `/console/projects/${projectId}` },
          { label: "Tasks" },
        ]}
      />
      <div className="page-content max-w-5xl">
        {!tasks || tasks.length === 0 ? (
          <EmptyState title="No tasks yet" description="Tasks for this project will appear here. Create one from the Tasks module." action={<Link className="text-sm text-[var(--org-primary)]" href="/console/tasks/new">New task →</Link>} />
        ) : (
          <table className="data-table w-full text-sm">
            <thead><tr><th>Title</th><th>Status</th><th>Priority</th><th>Due</th></tr></thead>
            <tbody>
              {tasks.map((t) => (
                <tr key={t.id}>
                  <td><Link href={`/console/tasks/${t.id}`} className="hover:underline">{t.title}</Link></td>
                  <td><StatusBadge status={t.status ?? "open"} /></td>
                  <td className="font-mono text-xs">{t.priority ?? "—"}</td>
                  <td className="font-mono text-xs">{fmtDate(t.due_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
