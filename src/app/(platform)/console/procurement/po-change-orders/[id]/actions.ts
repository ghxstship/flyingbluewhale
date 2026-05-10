"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type PoChangeOrderStatus = "draft" | "submitted" | "in_review" | "approved" | "rejected" | "void";

// PO change-order FSM: draft → submitted → in_review → approved | rejected.
// `void` allowed from any non-approved/non-void state. approved + rejected
// + void are terminal. Approval is the financially-load-bearing transition
// (rolls CO amount onto parent PO) so double-approval would double-count.
const PO_CO_TRANSITIONS: Record<PoChangeOrderStatus, readonly PoChangeOrderStatus[]> = {
  draft: ["submitted", "void"],
  submitted: ["in_review", "approved", "rejected", "void"],
  in_review: ["approved", "rejected", "void"],
  approved: [],
  rejected: [],
  void: [],
};

export async function transitionPoChangeOrder(id: string, to: PoChangeOrderStatus): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();

  const { data: co } = await supabase
    .from("po_change_orders")
    .select("status, amount_cents, purchase_order_id")
    .eq("org_id", session.orgId)
    .eq("id", id)
    .maybeSingle();
  if (!co) throw new Error("Change order not found");
  const current = (co as { status: PoChangeOrderStatus }).status;
  const allowed = PO_CO_TRANSITIONS[current] ?? [];
  if (!allowed.includes(to)) {
    throw new Error(`Cannot move ${current} → ${to}. Allowed: ${allowed.join(", ") || "(terminal)"}`);
  }

  const patch: Record<string, unknown> = { status: to };
  if (to === "approved") {
    patch.approved_at = new Date().toISOString();
    patch.approved_by = session.userId;
  }

  // Conditional CO status update FIRST. Only the request that flips the
  // status under our nose wins — if rows.length === 0 a concurrent
  // approve/reject already landed and we must not re-roll the PO amount.
  const { data: updated, error } = await supabase
    .from("po_change_orders")
    .update(patch as never)
    .eq("org_id", session.orgId)
    .eq("id", id)
    .eq("status", current as "draft")
    .select("id");
  if (error) throw new Error(error.message);
  if (!updated || updated.length === 0) {
    throw new Error("Change order status changed concurrently — refresh and retry");
  }

  // Now safe to roll the approved amount onto the parent PO. Even if two
  // operators raced, only one survived the conditional update above.
  if (to === "approved") {
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

  revalidatePath(`/console/procurement/po-change-orders/${id}`);
  revalidatePath("/console/procurement/po-change-orders");
}
