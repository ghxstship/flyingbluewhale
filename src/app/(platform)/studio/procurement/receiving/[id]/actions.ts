"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { emitAudit } from "@/lib/audit";
import { actionFail, formFail } from "@/lib/forms/fail";

const Schema = z.object({
  po_line_item_id: z.string().uuid(),
  qty_received: z.string().min(1),
  qty_rejected: z.string().optional().or(z.literal("")),
  notes: z.string().max(1000).optional().or(z.literal("")),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function addReceiptLine(receiptId: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can record received lines" };
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();

  const received = Number(parsed.data.qty_received);
  const rejected = parsed.data.qty_rejected ? Number(parsed.data.qty_rejected) : 0;
  if (!Number.isFinite(received) || received < 0) return { error: "Bad received quantity" };
  if (!Number.isFinite(rejected) || rejected < 0) return { error: "Bad rejected quantity" };

  // Confirm the receipt is org-scoped + resolve its PO so we can verify the
  // chosen line item actually belongs to the same PO (no cross-PO lines).
  const { data: receipt } = await supabase
    .from("goods_receipts")
    .select("id, po_id")
    .eq("id", receiptId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!receipt) return { error: "Receipt not found" };

  const { data: line } = await supabase
    .from("po_line_items")
    .select("id")
    .eq("id", parsed.data.po_line_item_id)
    .eq("purchase_order_id", receipt.po_id)
    .maybeSingle();
  if (!line) return { error: "That line item does not belong to this receipt's purchase order" };

  const { error } = await supabase.from("goods_receipt_lines").insert({
    receipt_id: receipt.id,
    po_line_item_id: parsed.data.po_line_item_id,
    qty_received: received,
    qty_rejected: rejected,
    notes: parsed.data.notes || null,
  });
  if (error) return actionFail(error.message, fd);

  revalidatePath(`/studio/procurement/receiving/${receiptId}`);
  return { ok: true };
}

export type MatchReceiptState = { error?: string } | null;

/**
 * v7.8 record action — "Confirm Match · Close PO". A complete (non-partial)
 * goods receipt confirms the PO's goods leg, so the linked purchase order
 * advances sent/acknowledged → fulfilled and gets a `[receipt:<id>]`
 * lineage marker appended to its notes (purchase_orders has no receipt FK;
 * the marker doubles as the queryable back-link). Already-fulfilled POs are
 * treated as idempotent success — a double-click just lands on the PO.
 *
 * NOTE the honest-coverage rule: the invoice leg of 3-way match is NOT
 * wired here because AR invoices carry no PO linkage (that arrives with the
 * Phase A sub_invoices merge).
 */
export async function matchReceiptToPoAction(receiptId: string): Promise<MatchReceiptState> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can match receipts" };
  const supabase = await createClient();

  const { data: receipt, error: loadError } = await supabase
    .from("goods_receipts")
    .select("id, po_id, partial")
    .eq("org_id", session.orgId)
    .eq("id", receiptId)
    .maybeSingle();
  if (loadError) return { error: loadError.message };
  if (!receipt) return { error: "Receipt not found" };
  if (receipt.partial) {
    return { error: "Only a complete receipt can close the purchase order. Mark it complete first." };
  }
  if (!receipt.po_id) return { error: "Receipt is not linked to a purchase order" };

  const { data: po } = await supabase
    .from("purchase_orders")
    .select("id, po_state, notes")
    .eq("org_id", session.orgId)
    .eq("id", receipt.po_id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!po) return { error: "Linked purchase order not found" };

  // Idempotency: an already-fulfilled PO means a prior match (or another
  // path) closed it — success, just land on the PO.
  if (po.po_state === "fulfilled") {
    redirect(`/studio/procurement/purchase-orders/${po.id}`);
  }
  if (po.po_state !== "sent" && po.po_state !== "acknowledged") {
    return { error: `Purchase order must be sent or acknowledged before matching (currently ${po.po_state})` };
  }

  // Lineage marker into the PO's free-text notes; skip if a retry already
  // wrote it. Conditional update (`.eq("po_state", current)`) closes the
  // TOCTOU between the gate read and the write.
  const marker = `[receipt:${receiptId}]`;
  const notes = po.notes?.includes(marker) ? po.notes : [po.notes?.trim() || null, marker].filter(Boolean).join("\n");
  const { data: updated, error: updateError } = await supabase
    .from("purchase_orders")
    .update({ po_state: "fulfilled", notes })
    .eq("org_id", session.orgId)
    .eq("id", po.id)
    .eq("po_state", po.po_state)
    .select("id");
  if (updateError) return { error: updateError.message };
  if (!updated || updated.length === 0) {
    return { error: "Purchase order changed concurrently. Refresh and retry." };
  }

  await emitAudit({
    actorId: session.userId,
    orgId: session.orgId,
    actorEmail: session.email,
    action: "goods_receipt.matched_to_po",
    targetTable: "purchase_orders",
    targetId: po.id,
    metadata: { receiptId, poId: po.id },
  });

  revalidatePath(`/studio/procurement/receiving/${receiptId}`);
  revalidatePath("/studio/procurement/receiving");
  revalidatePath(`/studio/procurement/purchase-orders/${po.id}`);
  revalidatePath("/studio/procurement/purchase-orders");
  redirect(`/studio/procurement/purchase-orders/${po.id}`);
}
