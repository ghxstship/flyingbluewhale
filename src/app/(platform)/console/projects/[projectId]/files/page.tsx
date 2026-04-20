export const dynamic = "force-dynamic";

import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/EmptyState";
import { fmtDate } from "@/components/detail/DetailShell";

export default async function Page({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const [{ data: project }, { data: files }] = await Promise.all([
    supabase.from("projects").select("id, name").eq("org_id", session.orgId).eq("id", projectId).maybeSingle(),
    supabase.from("deliverables").select("id, title, type, file_path, updated_at").eq("project_id", projectId).is("deleted_at", null).not("file_path", "is", null).order("updated_at", { ascending: false }),
  ]);
  return (
    <>
      <ModuleHeader
        eyebrow={project?.name ?? "Project"}
        title="Files"
        subtitle={`${files?.length ?? 0} uploaded deliverable${(files?.length ?? 0) === 1 ? "" : "s"}`}
        breadcrumbs={[
          { label: "Projects", href: "/console/projects" },
          { label: project?.name ?? "Project", href: `/console/projects/${projectId}` },
          { label: "Files" },
        ]}
      />
      <div className="page-content max-w-5xl">
        {!files || files.length === 0 ? (
          <EmptyState title="No files uploaded" description="Deliverables that have attached file paths appear here. Upload from the relevant portal." />
        ) : (
          <ul className="space-y-2">
            {files.map((f) => (
              <li key={f.id}>
                <Link href={`/api/v1/deliverables/${f.id}/download`} className="surface hover-lift flex items-center justify-between p-4">
                  <div>
                    <div className="text-sm font-medium">{f.title ?? "Untitled"}</div>
                    <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)] font-mono">{f.type}</div>
                  </div>
                  <div className="text-xs text-[var(--text-muted)] font-mono">{fmtDate(f.updated_at)}</div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
