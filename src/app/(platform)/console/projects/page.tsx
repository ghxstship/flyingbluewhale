import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { requireSession } from "@/lib/auth";
import { listProjects } from "@/lib/db/projects";
import { hasSupabase } from "@/lib/env";
import { formatDate } from "@/lib/i18n/format";
import { toTitle } from "@/lib/format";
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
        subtitle={`${projects.length} Total`}
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
                status: p.project_state,
                startDate: p.start_date ?? null,
                endDate: p.end_date ?? null,
                budgetCents: p.budget_cents ?? 0,
              }))}
            />
            <DataTable
              rows={projects}
              rowHref={(p) => `/console/projects/${p.id}`}
              emptyLabel="No Projects"
              columns={[
                { key: "name", header: "Name", render: (p) => p.name, accessor: (p) => p.name, sortable: true },
                { key: "slug", header: "Slug", render: (p) => p.slug, accessor: (p) => p.slug, mono: true },
                {
                  key: "project_state",
                  header: "State",
                  render: (p) => (
                    <Badge variant={p.project_state === "active" ? "success" : "muted"}>
                      {toTitle(p.project_state)}
                    </Badge>
                  ),
                  accessor: (p) => p.project_state,
                  filterable: true,
                  groupable: true,
                },
                {
                  key: "start_date",
                  header: "Start",
                  render: (p) => p.start_date ?? "—",
                  accessor: (p) => p.start_date ?? "",
                  mono: true,
                  sortable: true,
                },
                {
                  key: "end_date",
                  header: "End",
                  render: (p) => p.end_date ?? "—",
                  accessor: (p) => p.end_date ?? "",
                  mono: true,
                  sortable: true,
                },
                {
                  key: "updated_at",
                  header: "Updated",
                  render: (p) => formatDate(p.updated_at),
                  accessor: (p) => p.updated_at,
                  mono: true,
                  sortable: true,
                },
              ]}
            />
          </>
        )}
      </div>
    </>
  );
}
