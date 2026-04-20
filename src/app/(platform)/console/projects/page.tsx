import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { requireSession } from "@/lib/auth";
import { listProjects } from "@/lib/db/projects";
import { hasSupabase } from "@/lib/env";
import { formatDate } from "@/lib/i18n/format";
import { EmptyState } from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader title="Projects" />
        <div className="page-content">
          <div className="card p-6 text-sm text-[var(--color-text-secondary)]">Configure Supabase to load projects.</div>
        </div>
      </>
    );
  }

  const session = await requireSession();
  const projects = await listProjects(session.orgId);

  return (
    <>
      <ModuleHeader
        title="Projects"
        subtitle={`${projects.length} total`}
        action={<Button href="/console/projects/new">+ New project</Button>}
      />
      <div className="page-content">
        {projects.length === 0 ? (
          <EmptyState
            title="No projects yet"
            description="A project is the top-level container for events, deliverables, invoices, and crew."
            action={<Button href="/console/projects/new">Create your first project</Button>}
          />
        ) : (
          <div className="card-elevated">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Slug</th>
                  <th>Status</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <Link href={`/console/projects/${p.id}`} className="text-[var(--color-text-primary)]">
                        {p.name}
                      </Link>
                    </td>
                    <td className="text-mono text-xs text-[var(--color-text-tertiary)]">{p.slug}</td>
                    <td><Badge variant={p.status === "active" ? "success" : "muted"}>{p.status}</Badge></td>
                    <td className="text-mono text-xs">{p.start_date ?? "—"}</td>
                    <td className="text-mono text-xs">{p.end_date ?? "—"}</td>
                    <td className="text-mono text-xs text-[var(--color-text-tertiary)]">
                      {formatDate(p.updated_at)}
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
