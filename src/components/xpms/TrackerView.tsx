import Link from "next/link";
import { MetricCard } from "@/components/ui/MetricCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui";
import { EmptyState } from "@/components/ui/EmptyState";
import { money } from "@/components/detail/DetailShell";
import { getRequestT } from "@/lib/i18n/request";

export type TrackerRow = {
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

export const SELECT_COLUMNS = [
  "atom_id",
  "project_id",
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
].join(",");

export function trackerTotals(atoms: TrackerRow[]) {
  const rootDepth = atoms.length === 0 ? 0 : atoms.reduce((m, r) => Math.min(m, r.wbs_depth ?? 0), Infinity);
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
  return {
    rootDepth,
    totalBudget,
    totalActual,
    totalCommitted,
    totalVariance,
    totalTasks,
    totalTasksDone,
    totalDeliv,
    totalDelivApproved,
    projectPct,
  };
}

/**
 * TrackerView — WBS tree + project rollup metric cards. Shared by the
 * console tracker, the producer portal tracker, and (in a compact
 * form) the mobile tracker.
 */
export async function TrackerView({
  atoms,
  atomHrefBuilder,
  emptyAction,
  compact = false,
}: {
  atoms: TrackerRow[];
  /** Click target for each atom row. Receives atom_id, returns a URL. */
  atomHrefBuilder?: (atomId: string) => string;
  /** Custom action node for the empty state (CTA back to a catalog or admin). */
  emptyAction?: React.ReactNode;
  /** Card layout for small screens — no table, just summary cards. */
  compact?: boolean;
}) {
  const { t: tr } = await getRequestT();
  if (atoms.length === 0) {
    return (
      <EmptyState
        title={tr("components.trackerView.noAtoms", undefined, "No Atoms Yet")}
        description={tr(
          "components.trackerView.noAtomsDesc",
          undefined,
          "Pin work to canonical XPMS atoms to see budget, schedule, and submittal progress roll up the WBS tree.",
        )}
        action={emptyAction}
      />
    );
  }
  const t = trackerTotals(atoms);

  return (
    <div className="space-y-4">
      <div className="metric-grid">
        <MetricCard
          label={tr("components.trackerView.budget", undefined, "Budget")}
          value={money(t.totalBudget)}
          delta={
            t.totalActual > 0
              ? {
                  value: tr("components.trackerView.actualDelta", { amount: money(t.totalActual) }, "{amount} actual"),
                  positive: t.totalActual <= t.totalBudget,
                }
              : undefined
          }
        />
        <MetricCard
          label={tr("components.trackerView.committed", undefined, "Committed")}
          value={money(t.totalCommitted)}
          delta={
            t.totalCommitted > 0
              ? {
                  value: tr(
                    "components.trackerView.remainingDelta",
                    { amount: money(t.totalBudget - t.totalActual - t.totalCommitted) },
                    "{amount} remaining",
                  ),
                  positive: true,
                }
              : undefined
          }
        />
        <MetricCard
          label={tr("components.trackerView.variance", undefined, "Variance")}
          value={money(t.totalVariance)}
          delta={
            t.totalVariance !== 0
              ? {
                  value:
                    t.totalVariance > 0
                      ? tr("components.trackerView.overBaseline", undefined, "over baseline")
                      : tr("components.trackerView.underBaseline", undefined, "under baseline"),
                  positive: t.totalVariance <= 0,
                }
              : undefined
          }
          accent={t.totalVariance > 0}
        />
        <MetricCard
          label={tr("components.trackerView.progress", undefined, "Progress")}
          value={`${t.projectPct}%`}
          delta={
            t.totalTasks > 0
              ? {
                  value: tr(
                    "components.trackerView.tasksDoneDelta",
                    { done: t.totalTasksDone, total: t.totalTasks },
                    "{done}/{total} tasks done",
                  ),
                  positive: t.projectPct >= 50,
                }
              : t.totalDeliv > 0
                ? {
                    value: tr(
                      "components.trackerView.submittalsApprovedDelta",
                      { done: t.totalDelivApproved, total: t.totalDeliv },
                      "{done}/{total} submittals approved",
                    ),
                    positive: true,
                  }
                : undefined
          }
        />
      </div>

      {compact ? (
        <div className="space-y-2">
          {atoms.map((row) => {
            const rowPct = pct(row.pct_complete_rollup);
            const indent = (row.wbs_depth ?? t.rootDepth) - t.rootDepth;
            const inner = (
              <>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-mono text-[10px] text-[var(--p-text-2)]">{row.wbs_path}</div>
                    <div className="mt-0.5 truncate text-sm font-medium">{row.name}</div>
                    <div className="font-mono text-[10px] text-[var(--p-text-2)]">{row.identifier}</div>
                  </div>
                  <Badge variant={row.state === "tpc" ? "brand" : "muted"}>{row.state.toUpperCase()}</Badge>
                </div>
                <div className="mt-2 flex items-center gap-3 text-xs">
                  <span className="font-mono">{money(row.budget_cents_rollup ?? 0)}</span>
                  {row.pct_complete_rollup != null && (
                    <span className="flex-1">
                      <ProgressBar
                        value={rowPct}
                        showLabel
                        aria-label={tr("components.trackerView.progressAria", { pct: rowPct }, "Progress {pct}%")}
                      />
                    </span>
                  )}
                </div>
              </>
            );
            return (
              <div key={row.atom_id} className="surface p-3" style={{ marginLeft: `${indent * 8}px` }}>
                {atomHrefBuilder ? (
                  <Link href={atomHrefBuilder(row.atom_id)} className="block">
                    {inner}
                  </Link>
                ) : (
                  inner
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="surface overflow-hidden">
          <div className="ps-table">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] tracking-[0.2em] text-[var(--p-text-2)] uppercase">
                  <th className="px-4 py-3 text-start">
                    {tr("components.trackerView.colWbsAtom", undefined, "WBS / Atom")}
                  </th>
                  <th className="px-3 py-3 text-right">{tr("components.trackerView.budget", undefined, "Budget")}</th>
                  <th className="px-3 py-3 text-right">{tr("components.trackerView.actual", undefined, "Actual")}</th>
                  <th className="px-3 py-3 text-right">
                    {tr("components.trackerView.committed", undefined, "Committed")}
                  </th>
                  <th className="px-3 py-3 text-right">
                    {tr("components.trackerView.variance", undefined, "Variance")}
                  </th>
                  <th className="px-3 py-3 text-start">{tr("components.trackerView.tasks", undefined, "Tasks")}</th>
                  <th className="px-3 py-3 text-start">
                    {tr("components.trackerView.submittals", undefined, "Submittals")}
                  </th>
                  <th className="px-4 py-3 text-start">
                    {tr("components.trackerView.progress", undefined, "Progress")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {atoms.map((row) => {
                  const indent = (row.wbs_depth ?? t.rootDepth) - t.rootDepth;
                  const rowPct = pct(row.pct_complete_rollup);
                  const variance = row.variance_cost_cents_rollup ?? 0;
                  const nameEl = atomHrefBuilder ? (
                    <Link
                      className="text-sm font-medium hover:text-[var(--p-accent)]"
                      href={atomHrefBuilder(row.atom_id)}
                      style={{ paddingLeft: `${indent * 16}px` }}
                    >
                      {row.name}
                    </Link>
                  ) : (
                    <span className="text-sm font-medium" style={{ paddingLeft: `${indent * 16}px` }}>
                      {row.name}
                    </span>
                  );
                  return (
                    <tr key={row.atom_id} className="border-t border-[var(--p-border)]">
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-2" style={{ paddingLeft: `${indent * 16}px` }}>
                          <span className="font-mono text-[10px] text-[var(--p-text-2)]">{row.wbs_path}</span>
                        </div>
                        <div className="mt-0.5 flex items-center gap-2">
                          {nameEl}
                          <Badge variant={row.state === "tpc" ? "brand" : "muted"}>{row.state.toUpperCase()}</Badge>
                        </div>
                        <div
                          className="mt-0.5 font-mono text-[10px] text-[var(--p-text-2)]"
                          style={{ paddingLeft: `${indent * 16}px` }}
                        >
                          {row.identifier}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-xs">{money(row.budget_cents_rollup ?? 0)}</td>
                      <td className="px-3 py-3 text-right font-mono text-xs">
                        {money(row.actual_cost_cents_rollup ?? 0)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-xs">
                        {money(row.committed_cents_rollup ?? 0)}
                      </td>
                      <td
                        className={`px-3 py-3 text-right font-mono text-xs ${
                          variance > 0
                            ? "text-[var(--p-danger)]"
                            : variance < 0
                              ? "text-[var(--p-success)]"
                              : "text-[var(--p-text-2)]"
                        }`}
                      >
                        {variance === 0 ? "—" : money(variance)}
                      </td>
                      <td className="px-3 py-3 text-xs">
                        {(row.task_count_rollup ?? 0) === 0 ? (
                          <span className="text-[var(--p-text-2)]">—</span>
                        ) : (
                          <span className="font-mono">
                            {row.tasks_done_rollup ?? 0}/{row.task_count_rollup ?? 0}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-xs">
                        {(row.deliverable_count_rollup ?? 0) === 0 ? (
                          <span className="text-[var(--p-text-2)]">—</span>
                        ) : (
                          <span className="font-mono">
                            {row.deliverables_approved_rollup ?? 0}/{row.deliverable_count_rollup ?? 0}
                            {(row.deliverables_open_rollup ?? 0) > 0 && (
                              <span className="ms-1 text-[var(--p-text-2)]">
                                ·{" "}
                                {tr(
                                  "components.trackerView.openCount",
                                  { count: row.deliverables_open_rollup ?? 0 },
                                  "{count} open",
                                )}
                              </span>
                            )}
                          </span>
                        )}
                      </td>
                      <td className="min-w-[140px] px-4 py-3">
                        {row.pct_complete_rollup == null ? (
                          <span className="text-xs text-[var(--p-text-2)]">—</span>
                        ) : (
                          <ProgressBar
                            value={rowPct}
                            showLabel
                            aria-label={tr("components.trackerView.progressAria", { pct: rowPct }, "Progress {pct}%")}
                          />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
