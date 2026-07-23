"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { emitAudit } from "@/lib/audit";
import { actionFail, formFail } from "@/lib/forms/fail";
import { actionErrorMessage } from "@/lib/errors";

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
  if (!isManagerPlus(session)) return { error: actionErrorMessage("auth.manager-plus.record-received-lines", "Only manager+ can record received lines") };
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();

  const received = Number(parsed.data.qty_received);
  const rejected = parsed.data.qty_rejected ? Number(parsed.data.qty_rejected) : 0;
  if (!Number.isFinite(received) || received < 0) return { error: actionErrorMessage("bad-received-quantity", "Bad received quantity") };
  if (!Number.isFinite(rejected) || rejected < 0) return { error: actionErrorMessage("bad-rejected-quantity", "Bad rejected quantity") };

  // Confirm the receipt is org-scoped + resolve its PO so we can verify the
  // chosen line item actually belongs to the same PO (no cross-PO lines).
  const { data: receipt } = await supabase
    .from("goods_receipts")
    .select("id, po_id")
    .eq("id", receiptId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!receipt) return { error: actionErrorMessage("not-found.receipt", "Receipt not found") };

  const { data: line } = await supabase
    .from("po_line_items")
    .select("id")
    .eq("id", parsed.data.po_line_item_id)
    .eq("purchase_order_id", receipt.po_id)
    .maybeSingle();
  if (!line) return { error: actionErrorMessage("that-line-item-does-not-belong-to-this-receipt", "That line item does not belong to this receipt's purchase order") };

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

const MatchSchema = z.object({
  invoice_id: z.string().uuid(),
});

/**
 * v7.8 record action — "3-way match", invoice leg completed by the Phase A
 * sub_invoices merge (kit 20 REPO_LANDING §2). Delegates to the
 * `match_receipt_three_way` RPC, which — in ONE transaction — records the
 * match verdict (full / over / partial / qty_variance) in
 * `po_invoice_matches`, advances the PO to matched/fulfilled on a full
 * match, and back-links + approves the AP invoice (approve-to-pay; the
 * lien-waiver gate still guards paid). Re-running the match on the same
 * (receipt, invoice) pair refreshes the verdict — idempotent on retry.
 * Supersedes the Phase B PO-only marker patch that deliberately left the
 * invoice leg open.
 */
export async function matchReceiptToPoAction(receiptId: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: actionErrorMessage("auth.manager-plus.record-a-3-way-match", "Only manager+ can record a 3-way match") };
  const parsed = MatchSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("match_receipt_three_way", {
    p_receipt_id: receiptId,
    p_invoice_id: parsed.data.invoice_id,
  });
  if (error) return actionFail(error.message, fd);
  const result = data as { match_id: string; match_state: string; variance_minor: number } | null;

  await emitAudit({
    actorId: session.userId,
    orgId: session.orgId,
    actorEmail: session.email,
    action: "goods_receipt.matched_to_po",
    targetTable: "po_invoice_matches",
    targetId: result?.match_id ?? null,
    metadata: {
      receiptId,
      invoiceId: parsed.data.invoice_id,
      matchStatus: result?.match_state,
      varianceMinor: result?.variance_minor,
    },
  });

  revalidatePath(`/studio/procurement/receiving/${receiptId}`);
  revalidatePath("/studio/procurement/receiving");
  revalidatePath("/studio/procurement/purchase-orders");
  revalidatePath("/studio/finance/invoices");
  revalidatePath("/studio/finance/sub-invoices");
  return { ok: true };
}
