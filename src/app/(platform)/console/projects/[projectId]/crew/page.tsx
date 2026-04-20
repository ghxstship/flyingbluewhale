export const dynamic = "force-dynamic";

import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/EmptyState";
import { money } from "@/components/detail/DetailShell";

export default async function Page({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const [{ data: project }, { data: crew }] = await Promise.all([
    supabase.from("projects").select("id, name").eq("org_id", session.orgId).eq("id", projectId).maybeSingle(),
    // Project-scoped crew comes from crew_members where any assignment
    // metadata references this project. In the current schema crew is
    // org-scoped; the project association is via events/tasks/time
    // entries. We show every crew member + a hint on their relationship
    // to this project.
    supabase.from("crew_members").select("id, name, role, email, day_rate_cents").order("name"),
  ]);
  return (
    <>
      <ModuleHeader
        eyebrow={project?.name ?? "Project"}
        title="Crew"
        subtitle={`${crew?.length ?? 0} roster member${(crew?.length ?? 0) === 1 ? "" : "s"}`}
        breadcrumbs={[
          { label: "Projects", href: "/console/projects" },
          { label: project?.name ?? "Project", href: `/console/projects/${projectId}` },
          { label: "Crew" },
        ]}
      />
      <div className="page-content max-w-5xl">
        {!crew || crew.length === 0 ? (
          <EmptyState title="No crew in the roster" description="Import crew via CSV from People → Crew or add members individually." />
        ) : (
          <table className="data-table w-full text-sm">
            <thead><tr><th>Name</th><th>Role</th><th>Email</th><th>Day rate</th></tr></thead>
            <tbody>
              {crew.map((c) => (
                <tr key={c.id}>
                  <td><Link href={`/console/people/crew/${c.id}`} className="hover:underline">{c.name}</Link></td>
                  <td>{c.role ?? "—"}</td>
                  <td className="text-[var(--text-muted)]">{c.email ?? "—"}</td>
                  <td className="font-mono text-xs">{money(c.day_rate_cents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
