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

  // Now safe to roll the approved amount onto the parent PO. The CO
  // status guard above stopped one CO from being approved twice, but
  // two SIBLING COs against the same PO could still race the read-
  // modify-write below — both read amount=$100, both add their delta,
  // both write back, and the second clobbers the first.
  //
  // Defense: read+CAS in a bounded retry loop, using the prior amount
  // as an optimistic lock. We never write a value that depends on a
  // stale read.
  if (to === "approved") {
    const delta = Number(co.amount_cents);
    let attempts = 0;
    while (attempts < 5) {
      attempts += 1;
      const { data: po } = await supabase
        .from("purchase_orders")
        .select("amount_cents")
        .eq("org_id", session.orgId)
        .eq("id", co.purchase_order_id)
        .maybeSingle();
      if (!po) break;
      const prior = Number(po.amount_cents);
      const { data: rolled, error: rollErr } = await supabase
        .from("purchase_orders")
        .update({ amount_cents: prior + delta } as never)
        .eq("org_id", session.orgId)
        .eq("id", co.purchase_order_id)
        .eq("amount_cents", prior)
        .select("id");
      if (rollErr) throw new Error(rollErr.message);
      if (rolled && (rolled as Array<{ id: string }>).length > 0) break;
      // Sibling rollup landed first — re-read and retry.
    }
    if (attempts >= 5) {
      throw new Error("PO amount rollup contended — refresh and retry");
    }
  }

  revalidatePath(`/console/procurement/po-change-orders/${id}`);
  revalidatePath("/console/procurement/po-change-orders");
}
