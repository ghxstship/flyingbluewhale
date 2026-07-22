import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { ExpensesView, type ExpenseRow } from "./ExpensesView";

/**
 * COMPVSS · Expenses — my own expenses, newest first.
 *
 * Deliberately self-scoped with an explicit `submitter_id` filter, not just
 * an org filter: expenses RLS is org-member-readable, so "everyone's spend"
 * is one missing predicate away, and that predicate is the only thing
 * standing between a crew member and their colleagues' finances. /m/requests
 * shipped exactly that bug (audit D6).
 */
export const dynamic = "force-dynamic";

export default async function ExpensesPage({ searchParams }: { searchParams: Promise<{ warn?: string }> }) {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return <div className="screen">{t("m.expenses.configureSupabase", undefined, "Configure Supabase.")}</div>;
  }
  const session = await requireSession();
  const fmt = await getRequestFormatters();
  const supabase = await createClient();
  const { warn } = await searchParams;

  const { data } = await supabase
    .from("expenses")
    .select("id, description, amount_cents, currency, expense_state, spent_at, receipt_path, billable, expense_type")
    .eq("org_id", session.orgId)
    .eq("submitter_id", session.userId)
    .order("spent_at", { ascending: false })
    .limit(100);

  const rows: ExpenseRow[] = (
    (data ?? []) as {
      id: string;
      description: string;
      amount_cents: number;
      currency: string | null;
      expense_state: string;
      billable: boolean;
      expense_type: string | null;
      spent_at: string;
      receipt_path: string | null;
    }[]
  ).map((e) => ({
    id: e.id,
    description: e.description,
    // The row's own currency, not the viewer's default: `currency` was selected
    // and never passed, so a non-USD org saw its expenses rendered in the wrong
    // one. `fmt.money` takes the override — it was simply never given.
    amount: fmt.money(e.amount_cents, e.currency ?? undefined),
    // Raw values so the owner's edit form can prefill losslessly (the
    // formatted `amount`/`spent` above are display-only).
    amountInput: (e.amount_cents / 100).toFixed(2),
    spentIso: e.spent_at ? String(e.spent_at).slice(0, 10) : "",
    state: e.expense_state,
    spent: fmt.date(e.spent_at),
    hasReceipt: Boolean(e.receipt_path),
    billable: e.billable === true,
    // Provenance facet the scanner import writes (e.g. product-scan intake);
    // shown on the record so an imported expense is distinguishable.
    expenseType: e.expense_type ?? null,
  }));

  return (
    <ExpensesView rows={rows} warning={warn ?? null} canManage={isManagerPlus(session)} />
  );
}
