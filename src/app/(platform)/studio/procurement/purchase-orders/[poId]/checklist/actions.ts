"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const AddSchema = z.object({
  prompt: z.string().min(1).max(500),
  requires_photo: z.string().optional(),
});

export async function addChecklistItem(poId: string, fd: FormData): Promise<void> {
  const session = await requireSession();
  const parsed = AddSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
  const supabase = await createClient();

  // Read the current max position so concurrent adders don't both
  // insert at the same index. The .order().limit(1).maybeSingle() is
  // smaller than a count(*) and avoids the loose-cast wrapper.
  const { data: last } = await supabase
    .from("po_checklist_items")
    .select("position")
    .eq("org_id", session.orgId)
    .eq("purchase_order_id", poId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextPosition = ((last?.position as number | null | undefined) ?? -1) + 1;

  const { error } = await supabase.from("po_checklist_items").insert({
    org_id: session.orgId,
    purchase_order_id: poId,
    position: nextPosition,
    prompt: parsed.data.prompt,
    requires_photo: parsed.data.requires_photo === "1",
  } as never);
  if (error) throw new Error(error.message);
  revalidatePath(`/studio/procurement/purchase-orders/${poId}/checklist`);
}

export async function completeChecklistItem(poId: string, itemId: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  // Only mark complete if currently pending. Without the .neq guard,
  // calling complete twice re-stamps completed_at + completed_by,
  // corrupting the audit trail.
  const { data, error } = await supabase
    .from("po_checklist_items")
    .update({
      item_state: "complete",
      completed_at: new Date().toISOString(),
      completed_by: session.userId,
    } as never)
    .eq("org_id", session.orgId)
    .eq("id", itemId)
    .neq("item_state", "complete")
    .select("id");
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) throw new Error("Checklist item is already complete");
  revalidatePath(`/studio/procurement/purchase-orders/${poId}/checklist`);
}

export async function skipChecklistItem(poId: string, itemId: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  // Only skip if currently pending — skipping a completed item
  // would lose the completion record.
  const { data, error } = await supabase
    .from("po_checklist_items")
    .update({ item_state: "skipped" } as never)
    .eq("org_id", session.orgId)
    .eq("id", itemId)
    .eq("item_state", "pending")
    .select("id");
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) throw new Error("Only a pending checklist item can be skipped");
  revalidatePath(`/studio/procurement/purchase-orders/${poId}/checklist`);
}
