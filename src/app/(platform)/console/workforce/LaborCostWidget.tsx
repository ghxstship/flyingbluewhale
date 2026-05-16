/**
 * LaborCostWidget — shows this week's logged hours, projected labor cost,
 * and variance against the org's labor budget category.
 * Competitive parity: Connecteam "Projected Sales + Projected Labor %"
 * scheduling insight (launched early 2026).
 */

function usd(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function LaborCostWidget({
  laborMinutes,
  laborCostCents,
  totalBudgetCents,
}: {
  laborMinutes: number;
  laborCostCents: number;
  totalBudgetCents: number;
}) {
  const laborHours = laborMinutes / 60;
  const budgetPct =
    totalBudgetCents > 0 ? Math.round((laborCostCents / totalBudgetCents) * 100) : null;
  const overBudget = budgetPct !== null && budgetPct > 100;

  return (
    <div className="surface p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
        Labor Cost — This Week
      </h3>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] text-[var(--text-muted)]">Hours Logged</p>
          <p className="mt-0.5 text-2xl font-bold tabular-nums">
            {laborHours.toFixed(1)}
            <span className="ml-1 text-sm font-normal text-[var(--text-muted)]">h</span>
          </p>
        </div>
        <div>
          <p className="text-[10px] text-[var(--text-muted)]">Projected Cost</p>
          <p className="mt-0.5 text-2xl font-bold tabular-nums">
            {laborCostCents > 0 ? usd(laborCostCents) : "—"}
          </p>
        </div>
      </div>

      {totalBudgetCents > 0 && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--text-muted)]">
              vs. {usd(totalBudgetCents)} labor budget
            </span>
            <span
              className={`font-semibold tabular-nums ${
                overBudget ? "text-[var(--color-error)]" : "text-[var(--color-success)]"
              }`}
            >
              {budgetPct}%
            </span>
          </div>
          <div className="mt-1.5 h-1.5 w-full rounded-full bg-[var(--surface-inset)]">
            <div
              className={`h-1.5 rounded-full transition-all ${
                overBudget ? "bg-[var(--color-error)]" : "bg-[var(--color-success)]"
              }`}
              style={{ width: `${Math.min(budgetPct ?? 0, 100)}%` }}
            />
          </div>
          {overBudget && (
            <p className="mt-1 text-[10px] text-[var(--color-error)]">
              Over budget by {usd(laborCostCents - totalBudgetCents)}
            </p>
          )}
        </div>
      )}

      {totalBudgetCents === 0 && (
        <p className="mt-3 text-[10px] text-[var(--text-muted)]">
          Set a Labor budget at Finance → Budgets to track variance here.
        </p>
      )}
    </div>
  );
}
