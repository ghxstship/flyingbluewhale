"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
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
  // CO approval rolls the change-order amount onto the parent PO —
  // manager+ only. Without this gate a lower-priv user could craft a
  // POST that approves a CO and silently raises the committed PO total.
  if (!isManagerPlus(session)) throw new Error("Only manager+ can transition PO change orders");
  const supabase = await createClient();

  const { data: co } = await supabase
    .from("po_change_orders")
    .select("change_order_state, amount_cents, purchase_order_id")
    .eq("org_id", session.orgId)
    .eq("id", id)
    .maybeSingle();
  if (!co) throw new Error("Change order not found");
  const current = (co as { change_order_state: PoChangeOrderStatus }).change_order_state;
  const allowed = PO_CO_TRANSITIONS[current] ?? [];
  if (!allowed.includes(to)) {
    throw new Error(`Cannot move ${current} → ${to}. Allowed: ${allowed.join(", ") || "(terminal)"}`);
  }

  const patch: Record<string, unknown> = { change_order_state: to };
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
    .eq("change_order_state", current as "draft")
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

async function guardCoEditable(coId: string, orgId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("po_change_orders")
    .select("change_order_state")
    .eq("id", coId)
    .eq("org_id", orgId)
    .maybeSingle();
  if (!data) return false;
  const s = (data as { change_order_state: PoChangeOrderStatus }).change_order_state;
  // Lines are locked once the CO leaves the proposed/draft window — after
  // submit, the bid is "in flight" and shouldn't drift under the
  // approver's feet.
  return s === "draft" || s === "submitted";
}

async function refreshCoAmount(coId: string, orgId: string): Promise<void> {
  const supabase = await createClient();
  const { data: lines } = await supabase
    .from("po_change_order_lines")
    .select("quantity, unit_price_cents")
    .eq("po_change_order_id", coId)
    .eq("org_id", orgId);
  const total = ((lines ?? []) as Array<{ quantity: number; unit_price_cents: number }>).reduce(
    (acc, l) => acc + Math.round(Number(l.quantity) * l.unit_price_cents),
    0,
  );
  // Keep the rolled-up CO amount honest. Lines are SoT; amount_cents
  // on the parent is a denorm we maintain via this action.
  const { error } = await supabase
    .from("po_change_orders")
    .update({ amount_cents: total })
    .eq("id", coId)
    .eq("org_id", orgId);
  if (error) throw new Error(`Could not refresh change-order amount: ${error.message}`);
}

const AddLineSchema = z.object({
  coId: z.string().uuid(),
  description: z.string().trim().min(1).max(500),
  quantity: z.coerce.number().nonnegative().finite(),
  unit_price_dollars: z.coerce.number().nonnegative().finite(),
});

export async function addCoLine(fd: FormData): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const parsed = AddLineSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return;
  if (!(await guardCoEditable(parsed.data.coId, session.orgId))) return;

  const supabase = await createClient();
  const { data: maxPos } = await supabase
    .from("po_change_order_lines")
    .select("position")
    .eq("po_change_order_id", parsed.data.coId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextPos = ((maxPos?.position as number | undefined) ?? 0) + 1;

  const { error: insertErr } = await supabase.from("po_change_order_lines").insert({
    org_id: session.orgId,
    po_change_order_id: parsed.data.coId,
    position: nextPos,
    description: parsed.data.description,
    quantity: parsed.data.quantity,
    unit_price_cents: Math.round(parsed.data.unit_price_dollars * 100),
  });
  if (insertErr) throw new Error(`Could not add change-order line: ${insertErr.message}`);

  await refreshCoAmount(parsed.data.coId, session.orgId);
  revalidatePath(`/console/procurement/po-change-orders/${parsed.data.coId}`);
}

const DeleteLineSchema = z.object({
  coId: z.string().uuid(),
  lineId: z.string().uuid(),
});

export async function deleteCoLine(fd: FormData): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const parsed = DeleteLineSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return;
  if (!(await guardCoEditable(parsed.data.coId, session.orgId))) return;

  const supabase = await createClient();
  const { error: deleteErr } = await supabase
    .from("po_change_order_lines")
    .delete()
    .eq("id", parsed.data.lineId)
    .eq("po_change_order_id", parsed.data.coId)
    .eq("org_id", session.orgId);
  if (deleteErr) throw new Error(`Could not delete change-order line: ${deleteErr.message}`);

  await refreshCoAmount(parsed.data.coId, session.orgId);
  revalidatePath(`/console/procurement/po-change-orders/${parsed.data.coId}`);
}
