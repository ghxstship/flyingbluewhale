import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { MetricCard } from "@/components/ui/MetricCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { money } from "@/components/detail/DetailShell";
import { SELECT_COLUMNS, trackerTotals, type TrackerRow } from "@/components/xpms/TrackerView";

export const dynamic = "force-dynamic";

/**
 * /m/tracker — cross-project field view of the WBS rollup. Lists each
 * project the user has access to (RLS-bounded on xpms_atoms) with
 * budget / progress / variance summary cards. Tap into a project to
 * reach the desktop-grade tracker (no mobile drill-down yet).
 */
export default async function MobileTrackerPage() {
  if (!hasSupabase) {
    return <div className="px-4 pt-6 pb-24 text-sm text-[var(--text-muted)]">Configure Supabase.</div>;
  }
  const session = await requireSession();
  const supabase = await createClient();

  // Pull all atoms in the user's org, then bucket by project_id to
  // render per-project rollup cards. RLS still filters to atoms the
  // caller can see. project_id is included in the base SELECT_COLUMNS.
  const { data: rows } = await supabase
    .from("v_xpms_atom_rollup_recursive")
    .select(SELECT_COLUMNS)
    .eq("org_id", session.orgId)
    .not("project_id", "is", null)
    .order("project_id", { ascending: true })
    .order("wbs_path", { ascending: true });

  const atoms = (rows ?? []) as unknown as (TrackerRow & { project_id: string })[];

  // Resolve project names — one round-trip rather than N joins.
  const projectIds = Array.from(new Set(atoms.map((a) => a.project_id)));
  const { data: projectRows } =
    projectIds.length > 0
      ? await supabase
          .from("projects")
          .select("id, name, slug")
          .eq("org_id", session.orgId)
          .is("deleted_at", null)
          .in("id", projectIds)
      : { data: [] };
  const projectMap = new Map((projectRows ?? []).map((p) => [p.id, p]));

  // Bucket atoms per project and compute totals.
  const byProject = new Map<string, TrackerRow[]>();
  for (const a of atoms) {
    const list = byProject.get(a.project_id) ?? [];
    list.push(a);
    byProject.set(a.project_id, list);
  }
  const sections = Array.from(byProject.entries())
    .map(([projectId, list]) => ({
      project: projectMap.get(projectId) ?? null,
      projectId,
      totals: trackerTotals(list),
      atomCount: list.length,
    }))
    .filter((s) => s.project)
    .sort((a, b) => (a.project!.name ?? "").localeCompare(b.project!.name ?? ""));

  return (
    <main className="space-y-4 px-4 pt-4 pb-24">
      <header>
        <div className="text-[10px] font-semibold tracking-[0.2em] text-[var(--text-muted)] uppercase">XPMS</div>
        <h1 className="mt-1 text-xl font-semibold">Tracker</h1>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          {sections.length} project{sections.length === 1 ? "" : "s"} · {atoms.length} atom
          {atoms.length === 1 ? "" : "s"}
        </p>
      </header>
      {sections.length === 0 ? (
        <EmptyState
          title="No Projects Yet"
          description="Projects with a WBS atom assigned will appear here once any work is pinned."
        />
      ) : (
        sections.map(({ project, projectId, totals, atomCount }) => (
          <Link
            key={projectId}
            href={`/console/projects/${projectId}/tracker`}
            className="surface hover-lift block p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{project!.name}</div>
                <div className="font-mono text-[10px] text-[var(--text-muted)]">
                  {atomCount} atom{atomCount === 1 ? "" : "s"}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="font-mono text-xs">{totals.projectPct}%</div>
              </div>
            </div>
            <div className="mt-2">
              <ProgressBar value={totals.projectPct} aria-label={`Progress ${totals.projectPct}%`} />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <MetricCard label="Budget" value={money(totals.totalBudget)} />
              <MetricCard label="Actual" value={money(totals.totalActual)} />
              <MetricCard label="Variance" value={money(totals.totalVariance)} accent={totals.totalVariance > 0} />
            </div>
          </Link>
        ))
      )}
    </main>
  );
}
