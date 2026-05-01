"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function transitionPoChangeOrder(
  id: string,
  to: "submitted" | "in_review" | "approved" | "rejected" | "void",
): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  const patch: Record<string, unknown> = { status: to };
  if (to === "approved") {
    patch.approved_at = new Date().toISOString();
    patch.approved_by = session.userId;

    // Roll the approved CO amount onto the parent PO's amount_cents.
    const { data: co } = await supabase
      .from("po_change_orders")
      .select("amount_cents, purchase_order_id")
      .eq("org_id", session.orgId)
      .eq("id", id)
      .maybeSingle();
    if (co) {
      const { data: po } = await supabase
        .from("purchase_orders")
        .select("amount_cents")
        .eq("org_id", session.orgId)
        .eq("id", co.purchase_order_id)
        .maybeSingle();
      if (po) {
        await supabase
          .from("purchase_orders")
          .update({ amount_cents: Number(po.amount_cents) + Number(co.amount_cents) } as never)
          .eq("org_id", session.orgId)
          .eq("id", co.purchase_order_id);
      }
    }
  }
  await supabase
    .from("po_change_orders")
    .update(patch as never)
    .eq("org_id", session.orgId)
    .eq("id", id);
  revalidatePath(`/console/procurement/po-change-orders/${id}`);
  revalidatePath("/console/procurement/po-change-orders");
}
