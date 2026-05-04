"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateOrgScopedWithCheck, STALE_ROW_MESSAGE } from "@/lib/db/concurrency";

const Schema = z.object({
  title: z.string().min(1).max(200),
  number: z.string().min(1).max(80),
  amount_cents: z.string().optional(),
  currency: z.string().min(1).max(3),
});

export type State = { error?: string } | null;

export async function updatePurchaseOrder(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  // Sea Trial FINDING-022: optimistic concurrency.
  const expectedUpdatedAt = String(fd.get("_updated_at") ?? "");
  const result = await updateOrgScopedWithCheck("purchase_orders", session.orgId, id, expectedUpdatedAt, {
    title: parsed.data.title,
    number: parsed.data.number,
    amount_cents: parsed.data.amount_cents ? Number(parsed.data.amount_cents) : 0,
    currency: parsed.data.currency,
  });
  if (!result.ok) {
    return { error: result.reason === "stale" ? STALE_ROW_MESSAGE : "Purchase Order not found." };
  }
  revalidatePath(`/console/procurement/purchase-orders/${id}`);
  revalidatePath("/console/procurement/purchase-orders");
  redirect(`/console/procurement/purchase-orders/${id}`);
}

export async function deletePurchaseOrder(id: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  await supabase.from("purchase_orders").delete().eq("id", id).eq("org_id", session.orgId);
  revalidatePath("/console/procurement/purchase-orders");
  redirect("/console/procurement/purchase-orders");
}
