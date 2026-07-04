"use server";
import { revalidatePath } from "next/cache";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { NEXT_SUB_INVOICE_STATES, waiverOnFile, type SubInvoiceState } from "@/lib/subcontractor";

/**
 * Advance an AP-sub invoice (submitted → approved/rejected → paid).
 * Phase A §09: sub invoices are `invoices` rows with source='ap_sub' —
 * this action is the lens-side transition over the merged store. The
 * waiver gate is enforced here for a friendly error AND by the DB
 * trigger `trg_invoices_ap_waiver_gate` as the backstop.
 */
export async function transitionSubInvoiceForm(id: string, to: SubInvoiceState): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const supabase = await createClient();
  const { data: cur } = await supabase
    .from("invoices")
    .select("invoice_state, source, lien_waiver_id, waiver:lien_waiver_id(waiver_state)")
    .eq("id", id)
    .eq("org_id", session.orgId)
    .eq("source", "ap_sub")
    .single();
  if (!cur) return;
  const from = cur.invoice_state as SubInvoiceState;
  if (!(NEXT_SUB_INVOICE_STATES[from] ?? []).includes(to)) return;
  const waiverState = (cur.waiver as { waiver_state: string | null } | null)?.waiver_state ?? null;
  if (to === "paid" && !waiverOnFile(waiverState)) return; // waiver gate — blocks pay
  const patch: { invoice_state: SubInvoiceState; approved_at?: string; paid_at?: string } = { invoice_state: to };
  if (to === "approved") patch.approved_at = new Date().toISOString();
  if (to === "paid") patch.paid_at = new Date().toISOString();
  await supabase.from("invoices").update(patch).eq("id", id).eq("org_id", session.orgId).eq("source", "ap_sub");
  revalidatePath("/studio/finance/sub-invoices");
  revalidatePath("/studio/finance/invoices");
}
