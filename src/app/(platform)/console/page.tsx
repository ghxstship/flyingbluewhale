import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { requireSession } from "@/lib/auth";
import { listProjects, projectStats } from "@/lib/db/projects";
import { hasSupabase } from "@/lib/env";
import { EmptyState } from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

export default async function ConsoleDashboard() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader title="Console" subtitle="Operations dashboard" />
        <div className="page-content">
          <div className="card p-6">
            <div className="text-label text-[var(--color-warning)]">Not configured</div>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              Supabase env vars are missing. Copy <code className="text-mono">.env.example</code> → <code className="text-mono">.env.local</code> and fill in your project credentials, then restart the dev server.
            </p>
          </div>
        </div>
      </>
    );
  }

  const session = await requireSession();
  const [projects, stats] = await Promise.all([
    listProjects(session.orgId),
    projectStats(session.orgId),
  ]);

  return (
    <>
      <ModuleHeader
        title="Console"
        subtitle={`Logged in as ${session.email} · ${session.role}`}
        action={<Button href="/console/projects/new">+ New project</Button>}
      />
      <div className="page-content space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Projects" value={stats.total} />
          <Stat label="Active" value={stats.byStatus.active} accent />
          <Stat label="Draft" value={stats.byStatus.draft} />
          <Stat label="Archived" value={stats.byStatus.archived + stats.byStatus.complete} />
        </div>

        <section className="card-elevated">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
            <h2 className="text-heading text-sm">Recent projects</h2>
            <Link href="/console/projects" className="text-mono text-xs text-[var(--brand-color)]">View all →</Link>
          </div>
          {projects.length === 0 ? (
            <EmptyState
              size="compact"
              title="No projects yet"
              description="Spin up your first project to see it here."
              action={
                <Link href="/console/projects/new" className="text-xs text-[var(--brand-color)]">
                  Create your first →
                </Link>
              }
            />
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>Name</th><th>Status</th><th>Start</th><th>End</th></tr>
              </thead>
              <tbody>
                {projects.slice(0, 8).map((p) => (
                  <tr key={p.id}>
                    <td>
                      <Link href={`/console/projects/${p.id}`} className="text-[var(--color-text-primary)]">
                        {p.name}
                      </Link>
                    </td>
                    <td><StatusBadge status={p.status} /></td>
                    <td className="text-mono text-xs">{p.start_date ?? "—"}</td>
                    <td className="text-mono text-xs">{p.end_date ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="card-elevated p-4">
      <div className="text-label text-[var(--color-text-tertiary)]">{label}</div>
      <div className={`mt-2 text-display text-3xl ${accent ? "text-[var(--brand-color)]" : "text-[var(--color-text-primary)]"}`}>
        {value}
      </div>
    </div>
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
