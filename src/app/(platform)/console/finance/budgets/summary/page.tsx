import { ModuleHeader } from "@/components/ModuleHeader";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT, getRequestFormatters } from "@/lib/i18n/request";
import { XPMS_DEPARTMENTS, XPMS_DISCIPLINES, XPMS_LINE_TYPES, XPMS_PHASES, XPMS_XYZ } from "@/lib/finance/xpms-budget";

/**
 * XPMS Universal Budget Template — Summary rollups (server-rendered).
 *
 * Mirrors the `Summary` sheet of XPMS_Universal_Budget_Template.xlsx:
 *
 *   • By Department (10 XPMS classes)
 *   • By Phase (8-Gate, Scope only)
 *   • Project Billing / Draw Schedule
 *   • By Line Type (Scope/Fee/Contingency/Allowance/Markup)
 *   • By Discipline (Scope only)
 *   • By XYZ (cost behaviour)
 *
 * Phase + Discipline rollups filter on `line_type = 'Scope'` so Fee
 * and Contingency never inflate a phase total (the locked rule from
 * the template's KEY RULES section).
 */
export const dynamic = "force-dynamic";

type BudgetRow = {
  amount_cents: number | null;
  forecast_cents: number | null;
  actual_cents: number | null;
  spent_cents: number | null;
  estimate_cents: number | null;
  committed_cents: number | null;
  department: string | null;
  discipline: string | null;
  xpms_phase: string | null;
  xyz: string | null;
  line_type: string | null;
};

type Rollup = { label: string; estimate: number; budget: number; forecast: number; actual: number; variance: number };

function emptyRollup(label: string): Rollup {
  return { label, estimate: 0, budget: 0, forecast: 0, actual: 0, variance: 0 };
}

function accumulate(target: Rollup, row: BudgetRow) {
  target.estimate += row.estimate_cents ?? 0;
  target.budget += row.amount_cents ?? 0;
  target.forecast += row.forecast_cents ?? 0;
  target.actual += row.actual_cents ?? row.spent_cents ?? 0;
}

function finalize(rollup: Rollup): Rollup {
  rollup.variance = rollup.budget - rollup.forecast;
  return rollup;
}

function rollupByKey<K extends keyof BudgetRow>(
  rows: BudgetRow[],
  key: K,
  keys: readonly string[],
  filter?: (row: BudgetRow) => boolean,
): Rollup[] {
  const map = new Map<string, Rollup>(keys.map((k) => [k, emptyRollup(k)]));
  for (const row of rows) {
    if (filter && !filter(row)) continue;
    const v = (row[key] ?? "") as string;
    const target = map.get(v);
    if (target) accumulate(target, row);
  }
  const list: Rollup[] = keys.map((k) => finalize(map.get(k)!));
  return list;
}

function total(rows: Rollup[]): Rollup {
  const sum = emptyRollup("TOTAL");
  for (const r of rows) {
    sum.estimate += r.estimate;
    sum.budget += r.budget;
    sum.forecast += r.forecast;
    sum.actual += r.actual;
  }
  sum.variance = sum.budget - sum.forecast;
  return sum;
}

export default async function BudgetSummaryPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow="Finance"
          title={t("console.finance.budgets.summary.title", undefined, "Budget Summary")}
        />
        <div className="page-content text-sm text-[var(--text-muted)]">
          {t("common.configureSupabase", undefined, "Configure Supabase.")}
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  const { data: budgets } = await supabase
    .from("budgets")
    .select(
      "amount_cents, forecast_cents, actual_cents, spent_cents, estimate_cents, committed_cents, department, discipline, xpms_phase, xyz, line_type",
    )
    .eq("org_id", session.orgId);

  const rows = (budgets ?? []) as unknown as BudgetRow[];
  const isScope = (r: BudgetRow) => (r.line_type ?? "Scope") === "Scope";

  const byDept = rollupByKey(rows, "department", XPMS_DEPARTMENTS);
  const byPhase = rollupByKey(rows, "xpms_phase", XPMS_PHASES, isScope);
  const byLineType = rollupByKey(rows, "line_type", XPMS_LINE_TYPES);
  const byDiscipline = rollupByKey(rows, "discipline", XPMS_DISCIPLINES, isScope);
  const byXyz = rollupByKey(rows, "xyz", XPMS_XYZ);

  // Draw schedule for the active project context. The Summary sheet
  // computes draws as % × SUM(Budget). With no project filter here we
  // surface the org-wide budget; if the operator wants per-project
  // draws the project finance page already does it.
  const totalBudget = rows.reduce((acc, r) => acc + (r.amount_cents ?? 0), 0);
  const drawSchedule = [
    { label: "Mobilization deposit", trigger: "Phase 1 · Discovery / contract", pct: 0.5 },
    { label: "Progress draw", trigger: "Phase 5 · Build start", pct: 0.3 },
    { label: "Final balance", trigger: "Phase 8 · Close / final acceptance", pct: 0.2 },
  ];

  return (
    <>
      <ModuleHeader
        eyebrow="Finance"
        title={t("console.finance.budgets.summary.title", undefined, "Budget Summary")}
        subtitle={t(
          "console.finance.budgets.summary.subtitle",
          undefined,
          "Live XPMS rollups. Phase curve = Scope only — Fee & Contingency roll up separately.",
        )}
      />
      <div className="page-content space-y-8">
        <RollupTable
          title="By Department (XPMS Class)"
          rollups={byDept}
          totalLabel="TOTAL"
          fmt={(c) => fmt.money(c / 100)}
        />
        <RollupTable
          title="By Phase (8-Gate Lifecycle — Scope only)"
          rollups={byPhase}
          totalLabel="TOTAL"
          fmt={(c) => fmt.money(c / 100)}
        />
        <DrawSchedule totalBudget={totalBudget} schedule={drawSchedule} fmt={(c) => fmt.money(c / 100)} />
        <RollupTable
          title="By Line Type"
          rollups={byLineType}
          totalLabel="GRAND TOTAL"
          fmt={(c) => fmt.money(c / 100)}
          showPercent
        />
        <RollupTable
          title="By Discipline (Scope only)"
          rollups={byDiscipline}
          totalLabel="TOTAL"
          fmt={(c) => fmt.money(c / 100)}
        />
        <RollupTable
          title="By XYZ (cost behaviour — all-in)"
          rollups={byXyz}
          totalLabel="TOTAL"
          fmt={(c) => fmt.money(c / 100)}
        />
      </div>
    </>
  );
}

function RollupTable({
  title,
  rollups,
  totalLabel,
  fmt,
  showPercent = false,
}: {
  title: string;
  rollups: Rollup[];
  totalLabel: string;
  fmt: (cents: number) => string;
  showPercent?: boolean;
}) {
  const totals = total(rollups);
  return (
    <section>
      <h2 className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">{title}</h2>
      <div className="surface mt-2 overflow-hidden">
        <table className="data-table w-full text-sm">
          <thead>
            <tr>
              <th className="px-3 py-2 text-left">Segment</th>
              <th className="px-3 py-2 text-right">Estimate</th>
              <th className="px-3 py-2 text-right">Budget</th>
              <th className="px-3 py-2 text-right">Forecast</th>
              <th className="px-3 py-2 text-right">Actual</th>
              <th className="px-3 py-2 text-right">Variance</th>
              {showPercent && <th className="px-3 py-2 text-right">% of Total</th>}
            </tr>
          </thead>
          <tbody>
            {rollups.map((r) => (
              <tr key={r.label} className="border-t border-[var(--border-color)]">
                <td className="px-3 py-2">{r.label}</td>
                <td className="px-3 py-2 text-right font-mono">{fmt(r.estimate)}</td>
                <td className="px-3 py-2 text-right font-mono">{fmt(r.budget)}</td>
                <td className="px-3 py-2 text-right font-mono">{fmt(r.forecast)}</td>
                <td className="px-3 py-2 text-right font-mono">{fmt(r.actual)}</td>
                <td className={`px-3 py-2 text-right font-mono ${r.variance < 0 ? "text-red-500" : ""}`}>
                  {fmt(r.variance)}
                </td>
                {showPercent && (
                  <td className="px-3 py-2 text-right font-mono">
                    {totals.budget === 0 ? "—" : `${((r.budget / totals.budget) * 100).toFixed(1)}%`}
                  </td>
                )}
              </tr>
            ))}
            <tr className="border-t border-[var(--border-color)] bg-[var(--surface-inset)] font-semibold">
              <td className="px-3 py-2">{totalLabel}</td>
              <td className="px-3 py-2 text-right font-mono">{fmt(totals.estimate)}</td>
              <td className="px-3 py-2 text-right font-mono">{fmt(totals.budget)}</td>
              <td className="px-3 py-2 text-right font-mono">{fmt(totals.forecast)}</td>
              <td className="px-3 py-2 text-right font-mono">{fmt(totals.actual)}</td>
              <td className="px-3 py-2 text-right font-mono">{fmt(totals.variance)}</td>
              {showPercent && <td className="px-3 py-2 text-right font-mono">100.0%</td>}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

function DrawSchedule({
  totalBudget,
  schedule,
  fmt,
}: {
  totalBudget: number;
  schedule: Array<{ label: string; trigger: string; pct: number }>;
  fmt: (cents: number) => string;
}) {
  const totalPct = schedule.reduce((a, b) => a + b.pct, 0);
  const totalDraw = Math.round(totalBudget * totalPct);
  return (
    <section>
      <h2 className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">
        Project Billing / Draw Schedule (% of total contract)
      </h2>
      <div className="surface mt-2 overflow-hidden">
        <table className="data-table w-full text-sm">
          <thead>
            <tr>
              <th className="px-3 py-2 text-left">Draw</th>
              <th className="px-3 py-2 text-left">Trigger</th>
              <th className="px-3 py-2 text-right">%</th>
              <th className="px-3 py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {schedule.map((s) => (
              <tr key={s.label} className="border-t border-[var(--border-color)]">
                <td className="px-3 py-2">{s.label}</td>
                <td className="px-3 py-2">{s.trigger}</td>
                <td className="px-3 py-2 text-right font-mono">{(s.pct * 100).toFixed(0)}%</td>
                <td className="px-3 py-2 text-right font-mono">{fmt(Math.round(totalBudget * s.pct))}</td>
              </tr>
            ))}
            <tr className="border-t border-[var(--border-color)] bg-[var(--surface-inset)] font-semibold">
              <td className="px-3 py-2" colSpan={2}>
                TOTAL CONTRACT
              </td>
              <td className="px-3 py-2 text-right font-mono">{(totalPct * 100).toFixed(0)}%</td>
              <td className="px-3 py-2 text-right font-mono">{fmt(totalDraw)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
