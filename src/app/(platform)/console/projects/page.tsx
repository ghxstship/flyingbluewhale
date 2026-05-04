import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { requireSession } from "@/lib/auth";
import { listProjects } from "@/lib/db/projects";
import { hasSupabase } from "@/lib/env";
import { formatDate } from "@/lib/i18n/format";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProjectPortfolioGrid, type PortfolioEntry } from "./ProjectPortfolioGrid";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader title="Projects" />
        <div className="page-content">
          <div className="surface p-6 text-sm text-[var(--text-secondary)]">Configure Supabase to load projects.</div>
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
        action={<Button href="/console/projects/new">+ New Project</Button>}
      />
      <div className="page-content space-y-5">
        {projects.length === 0 ? (
          <EmptyState
            title="No Projects Yet"
            description="A project is the top-level container for events, deliverables, invoices, and crew."
            action={<Button href="/console/projects/new">Create Your First Project</Button>}
          />
        ) : (
          <>
            <ProjectPortfolioGrid
              entries={projects.map<PortfolioEntry>((p) => ({
                id: p.id,
                name: p.name,
                status: p.status,
                startDate: p.start_date ?? null,
                endDate: p.end_date ?? null,
                budgetCents: p.budget_cents ?? 0,
              }))}
            />
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
                      <Link href={`/console/projects/${p.id}`} className="hover:text-[var(--org-primary)]">
                        {p.name}
                      </Link>
                    </td>
                    <td className="font-mono text-xs text-[var(--text-muted)]">{p.slug}</td>
                    <td>
                      <Badge variant={p.status === "active" ? "success" : "muted"}>{p.status}</Badge>
                    </td>
                    <td className="font-mono text-xs">{p.start_date ?? "—"}</td>
                    <td className="font-mono text-xs">{p.end_date ?? "—"}</td>
                    <td className="font-mono text-xs text-[var(--text-muted)]">{formatDate(p.updated_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </>
  );
}
