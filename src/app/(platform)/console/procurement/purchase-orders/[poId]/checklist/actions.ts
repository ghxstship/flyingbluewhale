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
  const parsed = AddSchema.parse(Object.fromEntries(fd));
  const supabase = await createClient();

  const { count } = await (
    supabase as unknown as {
      from: (t: string) => {
        select: (
          cols: string,
          opts: { count: "exact"; head: true },
        ) => {
          eq: (col: string, val: string) => Promise<{ count: number | null }>;
        };
      };
    }
  )
    .from("po_checklist_items")
    .select("*", { count: "exact", head: true })
    .eq("purchase_order_id", poId);

  await supabase.from("po_checklist_items").insert({
    org_id: session.orgId,
    purchase_order_id: poId,
    position: count ?? 0,
    prompt: parsed.prompt,
    requires_photo: parsed.requires_photo === "1",
  } as never);
  revalidatePath(`/console/procurement/purchase-orders/${poId}/checklist`);
}

export async function completeChecklistItem(poId: string, itemId: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  await supabase
    .from("po_checklist_items")
    .update({
      status: "complete",
      completed_at: new Date().toISOString(),
      completed_by: session.userId,
    } as never)
    .eq("org_id", session.orgId)
    .eq("id", itemId);
  revalidatePath(`/console/procurement/purchase-orders/${poId}/checklist`);
}

export async function skipChecklistItem(poId: string, itemId: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  await supabase
    .from("po_checklist_items")
    .update({ status: "skipped" } as never)
    .eq("org_id", session.orgId)
    .eq("id", itemId);
  revalidatePath(`/console/procurement/purchase-orders/${poId}/checklist`);
}
