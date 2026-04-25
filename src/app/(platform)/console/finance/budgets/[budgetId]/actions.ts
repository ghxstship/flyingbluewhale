"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * Reconcile a budget by recomputing `spent_cents` from real expenses +
 * paid invoices that share the same project_id (and category, when
 * present). Persists the result so dashboards/list views stay accurate.
 *
 * Read-time also computes this — but persisting once on reconcile means
 * the list view doesn't have to re-aggregate on every render.
 */
export async function reconcileBudget(formData: FormData) {
  const session = await requireSession();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  const { data: budget } = await supabase
    .from("budgets")
    .select("id, project_id, category, amount_cents")
    .eq("org_id", session.orgId)
    .eq("id", id)
    .maybeSingle();
  if (!budget) return;
  const computed = await computeBudgetSpend(supabase, {
    orgId: session.orgId,
    projectId: budget.project_id,
    category: budget.category,
  });
  await supabase
    .from("budgets")
    .update({ spent_cents: computed })
    .eq("id", id)
    .eq("org_id", session.orgId);
  revalidatePath("/console/finance/budgets");
  revalidatePath(`/console/finance/budgets/${id}`);
}

export async function computeBudgetSpend(
  supabase: Awaited<ReturnType<typeof createClient>>,
  args: { orgId: string; projectId: string | null; category: string | null },
): Promise<number> {
  // Expenses (any status — operators reconcile on actuals, not approvals).
  let q = supabase
    .from("expenses")
    .select("amount_cents")
    .eq("org_id", args.orgId);
  if (args.projectId) q = q.eq("project_id", args.projectId);
  if (args.category) q = q.eq("category", args.category);
  const { data: expenses } = await q;
  const expensesTotal = (expenses ?? []).reduce((s, r) => s + (r.amount_cents ?? 0), 0);

  // Paid invoices count as spend too when categorized.
  let iq = supabase
    .from("invoices")
    .select("amount_cents")
    .eq("org_id", args.orgId)
    .eq("status", "paid");
  if (args.projectId) iq = iq.eq("project_id", args.projectId);
  const { data: invoices } = await iq;
  const invoicesTotal = (invoices ?? []).reduce((s, r) => s + (r.amount_cents ?? 0), 0);

  return expensesTotal + invoicesTotal;
}
