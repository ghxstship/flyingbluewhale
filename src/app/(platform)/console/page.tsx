import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { RouteTabs } from "@/components/ui/RouteTabs";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { listProjects, projectStats } from "@/lib/db/projects";
import { hasSupabase } from "@/lib/env";
import { EmptyState } from "@/components/ui/EmptyState";
import { getRequestFormatters } from "@/lib/i18n/request";

// Dashboard hub tabs — folds the previous Dashboard sidebar group
// (Overview, Portfolio, Action Items, Command Palette) into one record-
// style hub. Command Palette page deleted — cmd-K is canonical.
const DASHBOARD_TABS = [
  { label: "Overview", href: "/console" },
  { label: "Portfolio", href: "/console/dashboards" },
  { label: "Action Items", href: "/console/action-items" },
];

export const dynamic = "force-dynamic";

export default async function ConsoleDashboard() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader title="Workspace" subtitle="Operations dashboard" tabs={<RouteTabs tabs={DASHBOARD_TABS} />} />
        <div className="page-content">
          <div className="surface p-6">
            <div className="text-xs font-semibold tracking-wider text-[var(--color-warning)] uppercase">
              Not configured
            </div>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Supabase env vars are missing. Copy <code className="font-mono text-xs">.env.example</code> →{" "}
              <code className="font-mono text-xs">.env.local</code> and fill in your project credentials, then restart
              the dev server.
            </p>
          </div>
        </div>
      </>
    );
  }

  const session = await requireSession();

  const fmt = await getRequestFormatters();
  // No-org users (community/viewer with no membership, or fresh accounts mid-invite)
  // would otherwise pass `""` into a UUID column and crash with 22P02. Render a
  // first-class empty state inviting them to create or join an org instead.
  if (!session.orgId) {
    return (
      <>
        <ModuleHeader
          title="Workspace"
          subtitle={`Logged in as ${session.email}`}
          tabs={<RouteTabs tabs={DASHBOARD_TABS} />}
        />
        <div className="page-content">
          <EmptyState
            title="No Organization Yet"
            description="The operations workspace is org-scoped. Create your first organization, or accept an invitation from your team."
            action={
              <div className="flex flex-wrap items-center gap-3">
                <Button href="/me/organizations">Create Organization</Button>
                <Link href="/me" className="text-xs text-[var(--org-primary)]">
                  ← Back To Dashboard
                </Link>
              </div>
            }
          />
        </div>
      </>
    );
  }

  const [projects, stats] = await Promise.all([listProjects(session.orgId), projectStats(session.orgId)]);

  return (
    <>
      <ModuleHeader
        title="Workspace"
        subtitle={`Logged in as ${session.email} · ${session.role}`}
        action={<Button href="/console/projects/new">+ New Project</Button>}
        tabs={<RouteTabs tabs={DASHBOARD_TABS} />}
      />
      <div className="page-content space-y-6">
        <div className="metric-grid">
          <MetricCard label="Projects" value={fmt.number(stats.total)} />
          <MetricCard label="Active" value={fmt.number(stats.byState.active)} accent />
          <MetricCard label="Draft" value={fmt.number(stats.byState.draft)} />
          <MetricCard label="Archived" value={fmt.number(stats.byState.archived + stats.byState.complete)} />
        </div>

        <section>
          <div className="flex items-center justify-between pb-3">
            <h2 className="text-base font-semibold">Recent Projects</h2>
            <Link href="/console/projects" className="text-xs font-medium text-[var(--org-primary)] hover:underline">
              View all →
            </Link>
          </div>
          {projects.length === 0 ? (
            <div className="surface">
              <EmptyState
                size="compact"
                title="No Projects Yet"
                description="Spin up your first project to see it here."
                action={
                  <Button href="/console/projects/new" size="sm">
                    + New Project
                  </Button>
                }
              />
            </div>
          ) : (
            <DataTable
              rows={projects.slice(0, 8)}
              rowHref={(p) => `/console/projects/${p.id}`}
              tableId="t:/console:recent-projects"
              searchable={false}
              emptyLabel="No Recent Projects"
              columns={[
                { key: "name", header: "Name", render: (p) => p.name, accessor: (p) => p.name, sortable: true },
                {
                  key: "project_state",
                  header: "State",
                  render: (p) => <StatusBadge status={p.project_state} />,
                  accessor: (p) => p.project_state,
                  filterable: true,
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
              ]}
            />
          )}
        </section>
      </div>
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, "success" | "info" | "warning" | "muted" | "default"> = {
    active: "success",
    draft: "info",
    paused: "warning",
    archived: "muted",
    complete: "default",
  };
  return <Badge variant={map[status] ?? "default"}>{status}</Badge>;
}
