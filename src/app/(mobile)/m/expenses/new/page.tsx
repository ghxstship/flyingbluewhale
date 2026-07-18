import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { fetchLookupOptions } from "@/lib/enum-lookup";
import { hasSupabase } from "@/lib/env";
import { ExpenseForm } from "./ExpenseForm";

export const dynamic = "force-dynamic";

/**
 * COMPVSS · File Expense — the kit `expense` FormScreen, finally mounted.
 *
 * The spec had existed since the kit rebuild and was in
 * UNMOUNTED_PHOTO_SPECS: written, complete, reachable from nowhere. G1 in
 * the parity audit and the joint highest-impact gap in the register — the
 * device with the camera could not file the expense the camera is for.
 *
 * Kit 32 (drawer canon v2.8): now a server page so the kit form's Cost Code
 * select carries the org's REAL cost centers (same injection the PO form
 * uses — seed strings would be a lie); the client leaf lives in
 * `ExpenseForm.tsx`.
 */
export default async function NewExpensePage() {
  let costCodeOptions: string[] = [];
  // Category is lookup-backed (ref_expense_category); inject its display labels
  // in sort_order instead of the kit's hardcoded 7. The action maps the picked
  // label back to `category_code`. Empty until Supabase is configured.
  let categoryOptions: string[] = [];

  if (hasSupabase) {
    const session = await requireSession();
    const supabase = await createClient();
    const { data: codes } = await supabase
      .from("cost_centers")
      .select("code, name")
      .eq("org_id", session.orgId)
      .eq("active", true)
      .order("code", { ascending: true })
      .limit(100);
    costCodeOptions = ((codes ?? []) as { code: string; name: string }[]).map(
      (c) => `${c.code} · ${c.name}`,
    );
    categoryOptions = (await fetchLookupOptions("ref_expense_category")).map((o) => o.label);
  }

  return <ExpenseForm costCodeOptions={costCodeOptions} categoryOptions={categoryOptions} />;
}
