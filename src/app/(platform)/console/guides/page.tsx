import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";

export const dynamic = "force-dynamic";

/**
 * Org-wide event guides index. Shows every per-persona guide across every
 * project so producers can audit Boarding-Pass coverage and jump straight
 * to the editor. Per-project editing lives at
 * `/console/projects/[projectId]/guides`.
 */
export default async function GuidesIndex() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Knowledge" title="Guides" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("event_guides")
    .select("id, persona, project_id, updated_at, projects:project_id(name)")
    .eq("org_id", session.orgId)
    .order("updated_at", { ascending: false });
  const rows = (data ?? []) as Array<{
    id: string;
    persona: string;
    project_id: string;
    updated_at: string | null;
    projects: { name: string } | null;
  }>;

  return (
    <>
      <ModuleHeader
        eyebrow="Knowledge"
        title="Guides"
        subtitle={`${rows.length} guide${rows.length === 1 ? "" : "s"} across your projects`}
      />
      <div className="page-content">
        {rows.length === 0 ? (
          <EmptyState
            title="No event guides yet"
            description="Per-persona event guides — the Boarding Pass for crew, artists, vendors, sponsors, and guests — are authored from each project's detail page."
            action={
              <Link className="text-sm text-[var(--org-primary)]" href="/console/projects">
                Open Projects →
              </Link>
            }
          />
        ) : (
          <div className="surface overflow-x-auto">
            <table className="data-table w-full text-sm">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Persona</th>
                  <th>Updated</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((g) => (
                  <tr key={g.id}>
                    <td>{g.projects?.name ?? "—"}</td>
                    <td>
                      <Badge variant="muted">{g.persona}</Badge>
                    </td>
                    <td className="font-mono text-xs">
                      {g.updated_at ? new Date(g.updated_at).toLocaleDateString() : "—"}
                    </td>
                    <td>
                      <Link
                        href={`/console/projects/${g.project_id}/guides/${g.persona}`}
                        className="text-[var(--org-primary)] hover:underline"
                      >
                        Edit →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
