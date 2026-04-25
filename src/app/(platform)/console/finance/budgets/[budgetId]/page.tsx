export const dynamic = "force-dynamic";

import { ModuleHeader } from "@/components/Shell";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { fmtDate, money } from "@/components/detail/DetailShell";
import { reconcileBudget, computeBudgetSpend } from "./actions";

export default async function Page({ params }: { params: Promise<{ budgetId: string }> }) {
  const { budgetId } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const { data: budget } = await supabase
    .from("budgets")
    .select("id, name, amount_cents, spent_cents, category, project_id, created_at")
    .eq("org_id", session.orgId)
    .eq("id", budgetId)
    .maybeSingle();

  if (!budget) {
    return (
      <>
        <ModuleHeader eyebrow="Finance" title="Budget" />
        <div className="page-content">
          <div className="surface p-6 text-sm text-[var(--text-muted)]">Not found.</div>
        </div>
      </>
    );
  }

  const recomputed = await computeBudgetSpend(supabase, {
    orgId: session.orgId,
    projectId: budget.project_id,
    category: budget.category,
  });

  let expensesQ = supabase
    .from("expenses")
    .select("id, description, amount_cents, spent_at, category")
    .eq("org_id", session.orgId);
  if (budget.project_id) expensesQ = expensesQ.eq("project_id", budget.project_id);
  if (budget.category) expensesQ = expensesQ.eq("category", budget.category);
  const { data: expenses } = await expensesQ
    .order("spent_at", { ascending: false })
    .limit(50);

  let invoicesQ = supabase
    .from("invoices")
    .select("id, number, amount_cents, paid_at")
    .eq("org_id", session.orgId)
    .eq("status", "paid");
  if (budget.project_id) invoicesQ = invoicesQ.eq("project_id", budget.project_id);
  const { data: invoices } = await invoicesQ.order("paid_at", { ascending: false }).limit(50);

  const variance = recomputed - budget.spent_cents;
  const utilization =
    budget.amount_cents > 0 ? (recomputed / budget.amount_cents) * 100 : 0;
  const remaining = budget.amount_cents - recomputed;

  return (
    <>
      <ModuleHeader
        eyebrow="Finance"
        title={budget.name}
        subtitle={budget.category ?? undefined}
        breadcrumbs={[
          { label: "Finance", href: "/console/finance" },
          { label: "Budgets", href: "/console/finance/budgets" },
          { label: budget.name },
        ]}
        action={
          <form action={reconcileBudget}>
            <input type="hidden" name="id" value={budget.id} />
            <button
              type="submit"
              className="rounded-md border border-[var(--border-color)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-inset)] hover:text-[var(--text-primary)]"
            >
              Reconcile to actuals
            </button>
          </form>
        }
      />
      <div className="page-content max-w-5xl space-y-5">
        <section className="surface p-5">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">Budget</div>
              <div className="mt-1 text-lg font-semibold">{money(budget.amount_cents)}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">Computed actual</div>
              <div className="mt-1 text-lg font-semibold">{money(recomputed)}</div>
              <div className="mt-0.5 text-[10px] text-[var(--text-muted)]">
                Stored: {money(budget.spent_cents)}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">Remaining</div>
              <div
                className={`mt-1 text-lg font-semibold ${
                  remaining >= 0 ? "text-[var(--text-primary)]" : "text-[var(--color-error)]"
                }`}
              >
                {money(remaining)}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">Variance vs stored</div>
              <div
                className={`mt-1 text-lg font-semibold ${
                  variance === 0
                    ? "text-[var(--text-muted)]"
                    : variance > 0
                      ? "text-[var(--color-warning)]"
                      : "text-emerald-600"
                }`}
              >
                {variance === 0 ? "—" : `${variance > 0 ? "+" : ""}${money(variance)}`}
              </div>
              {variance !== 0 && (
                <div className="mt-0.5 text-[10px] text-[var(--text-muted)]">Reconcile to clear</div>
              )}
            </div>
          </div>
          <div className="mt-4">
            <ProgressBar value={utilization} showLabel />
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="surface">
            <header className="border-b border-[var(--border-color)] px-4 py-2.5">
              <h3 className="text-sm font-semibold">Expenses</h3>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                {(expenses ?? []).length} entr{(expenses ?? []).length === 1 ? "y" : "ies"} matching project + category
              </p>
            </header>
            <table className="data-table w-full text-sm">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Description</th>
                  <th className="text-end">Amount</th>
                </tr>
              </thead>
              <tbody>
                {(expenses ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-[var(--text-muted)]">
                      No matching expenses.
                    </td>
                  </tr>
                ) : (
                  (expenses ?? []).map((e) => (
                    <tr key={e.id}>
                      <td className="font-mono text-xs">{fmtDate(e.spent_at)}</td>
                      <td>{e.description}</td>
                      <td className="text-end font-mono text-xs">{money(e.amount_cents)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </section>

          <section className="surface">
            <header className="border-b border-[var(--border-color)] px-4 py-2.5">
              <h3 className="text-sm font-semibold">Paid invoices</h3>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                {(invoices ?? []).length} matching project
              </p>
            </header>
            <table className="data-table w-full text-sm">
              <thead>
                <tr>
                  <th>Paid</th>
                  <th>Invoice</th>
                  <th className="text-end">Amount</th>
                </tr>
              </thead>
              <tbody>
                {(invoices ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-[var(--text-muted)]">
                      No paid invoices on this project.
                    </td>
                  </tr>
                ) : (
                  (invoices ?? []).map((i) => (
                    <tr key={i.id}>
                      <td className="font-mono text-xs">{fmtDate(i.paid_at)}</td>
                      <td className="font-mono text-xs">{i.number}</td>
                      <td className="text-end font-mono text-xs">{money(i.amount_cents)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </section>
        </div>

        <section className="surface p-4 text-xs text-[var(--text-muted)]">
          <Badge variant="muted">Created</Badge>{" "}
          <span className="font-mono">{fmtDate(budget.created_at)}</span>
        </section>
      </div>
    </>
  );
}
