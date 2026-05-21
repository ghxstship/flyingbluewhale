export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { MetricCard } from "@/components/ui/MetricCard";
import { Badge } from "@/components/ui";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { money } from "@/components/detail/DetailShell";
import type { LooseSupabase } from "@/lib/supabase/loose";

type RollupRow = {
  atom_id: string;
  identifier: string;
  name: string;
  phase: string;
  state: "uac" | "tpc";
  wbs_path: string;
  wbs_depth: number;
  budget_cents_rollup: number | null;
  actual_cost_cents_rollup: number | null;
  committed_cents_rollup: number | null;
  invoiced_cents_rollup: number | null;
  variance_cost_cents_rollup: number | null;
  variance_count_rollup: number | null;
  task_count_rollup: number | null;
  tasks_done_rollup: number | null;
  deliverable_count_rollup: number | null;
  deliverables_approved_rollup: number | null;
  deliverables_open_rollup: number | null;
  descendant_count: number | null;
  pct_complete_rollup: number | string | null;
};

function pct(n: number | string | null | undefined): number {
  if (n == null) return 0;
  const v = typeof n === "string" ? Number(n) : n;
  return Math.round(Math.max(0, Math.min(1, v)) * 100);
}

export default async function TrackerPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("id, name, xpms_phase, budget_cents")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .eq("id", projectId)
    .maybeSingle();
  if (!project) notFound();

  // View isn't in the typed Database yet; LooseSupabase per CLAUDE.md
  // until `supabase gen types` is rerun.
  const loose = supabase as unknown as LooseSupabase;
  const { data: rows } = (await loose
    .from("v_xpms_atom_rollup_recursive")
    .select(
      [
        "atom_id",
        "identifier",
        "name",
        "phase",
        "state",
        "wbs_path",
        "wbs_depth",
        "budget_cents_rollup",
        "actual_cost_cents_rollup",
        "committed_cents_rollup",
        "invoiced_cents_rollup",
        "variance_cost_cents_rollup",
        "variance_count_rollup",
        "task_count_rollup",
        "tasks_done_rollup",
        "deliverable_count_rollup",
        "deliverables_approved_rollup",
        "deliverables_open_rollup",
        "descendant_count",
        "pct_complete_rollup",
      ].join(","),
    )
    .eq("project_id", projectId)
    .order("wbs_path", { ascending: true })) as { data: RollupRow[] | null };

  const atoms = rows ?? [];
  const rootDepth = atoms.reduce((m, r) => Math.min(m, r.wbs_depth ?? 0), Infinity);

  // Project-level rollup: sum across the shallowest depth rows so we
  // don't double-count parents and descendants.
  const roots = atoms.filter((r) => r.wbs_depth === rootDepth);
  const totalBudget = roots.reduce((s, r) => s + (r.budget_cents_rollup ?? 0), 0);
  const totalActual = roots.reduce((s, r) => s + (r.actual_cost_cents_rollup ?? 0), 0);
  const totalCommitted = roots.reduce((s, r) => s + (r.committed_cents_rollup ?? 0), 0);
  const totalVariance = roots.reduce((s, r) => s + (r.variance_cost_cents_rollup ?? 0), 0);
  const totalTasks = roots.reduce((s, r) => s + (r.task_count_rollup ?? 0), 0);
  const totalTasksDone = roots.reduce((s, r) => s + (r.tasks_done_rollup ?? 0), 0);
  const totalDeliv = roots.reduce((s, r) => s + (r.deliverable_count_rollup ?? 0), 0);
  const totalDelivApproved = roots.reduce((s, r) => s + (r.deliverables_approved_rollup ?? 0), 0);
  const projectPct =
    totalBudget > 0
      ? Math.round(
          (roots.reduce((s, r) => s + Number(r.pct_complete_rollup ?? 0) * (r.budget_cents_rollup ?? 0), 0) /
            totalBudget) *
            100,
        )
      : totalTasks > 0
        ? Math.round((totalTasksDone / totalTasks) * 100)
        : 0;

  return (
    <>
      <ModuleHeader
        eyebrow={project.name}
        title="Tracker"
        subtitle={`${atoms.length} atom${atoms.length === 1 ? "" : "s"} · ${project.xpms_phase ?? "draft"} phase`}
        breadcrumbs={[
          { label: "Projects", href: "/console/projects" },
          { label: project.name, href: `/console/projects/${projectId}` },
          { label: "Tracker" },
        ]}
      />
      <div className="page-content space-y-4">
        {atoms.length === 0 ? (
          <EmptyState
            title="No Atoms Yet"
            description="Pin work to canonical XPMS atoms to see budget, schedule, and submittal progress roll up the WBS tree. Atoms are created from the XPMS Catalog."
            action={
              <Link className="text-sm text-[var(--org-primary)]" href="/console/xpms">
                Open Catalog →
              </Link>
            }
          />
        ) : (
          <>
            <div className="metric-grid">
              <MetricCard
                label="Budget"
                value={money(totalBudget)}
                delta={
                  totalActual > 0
                    ? {
                        value: `${money(totalActual)} actual`,
                        positive: totalActual <= totalBudget,
                      }
                    : undefined
                }
              />
              <MetricCard
                label="Committed"
                value={money(totalCommitted)}
                delta={
                  totalCommitted > 0
                    ? { value: `${money(totalBudget - totalActual - totalCommitted)} remaining`, positive: true }
                    : undefined
                }
              />
              <MetricCard
                label="Variance"
                value={money(totalVariance)}
                delta={
                  totalVariance !== 0
                    ? { value: totalVariance > 0 ? "over baseline" : "under baseline", positive: totalVariance <= 0 }
                    : undefined
                }
                accent={totalVariance > 0}
              />
              <MetricCard
                label="Progress"
                value={`${projectPct}%`}
                delta={
                  totalTasks > 0
                    ? { value: `${totalTasksDone}/${totalTasks} tasks done`, positive: projectPct >= 50 }
                    : totalDeliv > 0
                      ? { value: `${totalDelivApproved}/${totalDeliv} submittals approved`, positive: true }
                      : undefined
                }
              />
            </div>

            <div className="surface overflow-hidden">
              <div className="data-table">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[10px] tracking-[0.2em] text-[var(--text-muted)] uppercase">
                      <th className="px-4 py-3 text-left">WBS / Atom</th>
                      <th className="px-3 py-3 text-right">Budget</th>
                      <th className="px-3 py-3 text-right">Actual</th>
                      <th className="px-3 py-3 text-right">Committed</th>
                      <th className="px-3 py-3 text-right">Variance</th>
                      <th className="px-3 py-3 text-left">Tasks</th>
                      <th className="px-3 py-3 text-left">Submittals</th>
                      <th className="px-4 py-3 text-left">Progress</th>
                    </tr>
                  </thead>
                  <tbody>
                    {atoms.map((row) => {
                      const indent = (row.wbs_depth ?? rootDepth) - rootDepth;
                      const rowPct = pct(row.pct_complete_rollup);
                      const variance = row.variance_cost_cents_rollup ?? 0;
                      return (
                        <tr key={row.atom_id} className="border-t border-[var(--border)]">
                          <td className="px-4 py-3">
                            <div className="flex items-start gap-2" style={{ paddingLeft: `${indent * 16}px` }}>
                              <span className="font-mono text-[10px] text-[var(--text-muted)]">{row.wbs_path}</span>
                            </div>
                            <div className="mt-0.5 flex items-center gap-2">
                              <Link
                                className="text-sm font-medium hover:text-[var(--org-primary)]"
                                href={`/console/xpms/atoms?focus=${row.atom_id}`}
                                style={{ paddingLeft: `${indent * 16}px` }}
                              >
                                {row.name}
                              </Link>
                              <Badge variant={row.state === "tpc" ? "brand" : "muted"}>{row.state.toUpperCase()}</Badge>
                            </div>
                            <div
                              className="mt-0.5 font-mono text-[10px] text-[var(--text-muted)]"
                              style={{ paddingLeft: `${indent * 16}px` }}
                            >
                              {row.identifier}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-right font-mono text-xs">
                            {money(row.budget_cents_rollup ?? 0)}
                          </td>
                          <td className="px-3 py-3 text-right font-mono text-xs">
                            {money(row.actual_cost_cents_rollup ?? 0)}
                          </td>
                          <td className="px-3 py-3 text-right font-mono text-xs">
                            {money(row.committed_cents_rollup ?? 0)}
                          </td>
                          <td
                            className={`px-3 py-3 text-right font-mono text-xs ${
                              variance > 0
                                ? "text-[var(--color-error)]"
                                : variance < 0
                                  ? "text-emerald-600"
                                  : "text-[var(--text-muted)]"
                            }`}
                          >
                            {variance === 0 ? "—" : money(variance)}
                          </td>
                          <td className="px-3 py-3 text-xs">
                            {(row.task_count_rollup ?? 0) === 0 ? (
                              <span className="text-[var(--text-muted)]">—</span>
                            ) : (
                              <span className="font-mono">
                                {row.tasks_done_rollup ?? 0}/{row.task_count_rollup ?? 0}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-xs">
                            {(row.deliverable_count_rollup ?? 0) === 0 ? (
                              <span className="text-[var(--text-muted)]">—</span>
                            ) : (
                              <span className="font-mono">
                                {row.deliverables_approved_rollup ?? 0}/{row.deliverable_count_rollup ?? 0}
                                {(row.deliverables_open_rollup ?? 0) > 0 && (
                                  <span className="ml-1 text-[var(--text-muted)]">
                                    · {row.deliverables_open_rollup} open
                                  </span>
                                )}
                              </span>
                            )}
                          </td>
                          <td className="min-w-[140px] px-4 py-3">
                            {row.pct_complete_rollup == null ? (
                              <span className="text-xs text-[var(--text-muted)]">—</span>
                            ) : (
                              <ProgressBar value={rowPct} showLabel aria-label={`Progress ${rowPct}%`} />
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
