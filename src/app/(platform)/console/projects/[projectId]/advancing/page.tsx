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
  const [{ data: project }, { data: deliverables }] = await Promise.all([
    supabase.from("projects").select("id, name, slug").eq("org_id", session.orgId).eq("id", projectId).maybeSingle(),
    supabase.from("deliverables").select("id, title, type, status, version, deadline, updated_at").eq("project_id", projectId).is("deleted_at", null).order("updated_at", { ascending: false }),
  ]);
  return (
    <>
      <ModuleHeader
        eyebrow={project?.name ?? "Project"}
        title="Advancing"
        subtitle="Every deliverable across personas for this project."
        breadcrumbs={[
          { label: "Projects", href: "/console/projects" },
          { label: project?.name ?? "Project", href: `/console/projects/${projectId}` },
          { label: "Advancing" },
        ]}
        action={project ? <Link className="inline-flex items-center gap-1 rounded bg-[var(--org-primary)] px-3 py-1.5 text-xs font-medium text-white" href={`/p/${project.slug}/artist/advancing`}>Open portal view →</Link> : undefined}
      />
      <div className="page-content max-w-5xl">
        {!deliverables || deliverables.length === 0 ? (
          <EmptyState title="No deliverables yet" description="Artists, vendors, crew, and other stakeholders submit advancing materials via their portal pages." />
        ) : (
          <table className="data-table w-full text-sm">
            <thead><tr><th>Title</th><th>Type</th><th>Status</th><th>v</th><th>Deadline</th><th>Updated</th></tr></thead>
            <tbody>
              {deliverables.map((d) => (
                <tr key={d.id}>
                  <td>{d.title ?? "Untitled"}</td>
                  <td className="font-mono text-xs">{d.type}</td>
                  <td><StatusBadge status={d.status} /></td>
                  <td className="font-mono text-xs">{d.version}</td>
                  <td className="font-mono text-xs">{fmtDate(d.deadline)}</td>
                  <td className="font-mono text-xs">{fmtDate(d.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
