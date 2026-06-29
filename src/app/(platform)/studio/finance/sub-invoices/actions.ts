"use server";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { NEXT_SUB_INVOICE_STATES, type SubInvoiceState } from "@/lib/subcontractor";

/** Advance a sub-invoice (submitted → approved/rejected → paid). Server-gated. */
export async function transitionSubInvoiceForm(id: string, to: SubInvoiceState): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  const { data: cur } = await supabase
    .from("sub_invoices")
    .select("invoice_state")
    .eq("id", id)
    .eq("org_id", session.orgId)
    .single();
  if (!cur) return;
  const from = cur.invoice_state as SubInvoiceState;
  if (!(NEXT_SUB_INVOICE_STATES[from] ?? []).includes(to)) return;
  const patch: { invoice_state: SubInvoiceState; approved_at?: string; paid_at?: string } = { invoice_state: to };
  if (to === "approved") patch.approved_at = new Date().toISOString();
  if (to === "paid") patch.paid_at = new Date().toISOString();
  await supabase.from("sub_invoices").update(patch).eq("id", id).eq("org_id", session.orgId);
  revalidatePath("/studio/finance/sub-invoices");
}
