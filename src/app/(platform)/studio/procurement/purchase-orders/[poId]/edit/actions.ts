"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateOrgScopedWithCheck, STALE_ROW_MESSAGE } from "@/lib/db/concurrency";
import { formFail } from "@/lib/forms/fail";
import { actionErrorMessage } from "@/lib/errors";

const Schema = z.object({
  title: z.string().min(1).max(200),
  number: z.string().min(1).max(80),
  amount_cents: z.string().optional(),
  currency: z.string().min(1).max(3),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function updatePurchaseOrder(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  // Sea Trial FINDING-022: optimistic concurrency.
  const expectedUpdatedAt = String(fd.get("_updated_at") ?? "");
  const result = await updateOrgScopedWithCheck("purchase_orders", session.orgId, id, expectedUpdatedAt, {
    title: parsed.data.title,
    number: parsed.data.number,
    amount_cents: parsed.data.amount_cents ? Number(parsed.data.amount_cents) : 0,
    currency: parsed.data.currency,
  });
  if (!result.ok) {
    return { error: result.reason === "stale" ? STALE_ROW_MESSAGE : actionErrorMessage("not-found.purchase-order-2", "Purchase Order not found.") };
  }
  revalidatePath(`/studio/procurement/purchase-orders/${id}`);
  revalidatePath("/studio/procurement/purchase-orders");
  redirect(`/studio/procurement/purchase-orders/${id}`);
}

export async function deletePurchaseOrder(id: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  // SOFT delete — purchase_orders has a deleted_at tombstone column.
  // Hard-deleting cascaded onto FK references in po_line_items,
  // checklist, and change-orders, breaking financial reporting.
  // .is(deleted_at, null) makes the action idempotent.
  const { error } = await supabase
    .from("purchase_orders")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null);
  if (error) throw new Error(`Could not archive purchase order: ${error.message}`);
  revalidatePath("/studio/procurement/purchase-orders");
  // No redirect — DeleteForm's undo flow navigates client-side after
  // showing the "Deleted" toast with its Undo action (REC-14).
}
