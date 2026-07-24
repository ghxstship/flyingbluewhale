"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * Master-catalog toggle + soft-delete (canonical home, decision 6 rider).
 * Moved verbatim from /studio/settings/catalog/[id]/actions.ts.
 */

const ToggleSchema = z.object({
  id: z.string().uuid(),
  next: z.enum(["true", "false"]),
});

export async function toggleActive(fd: FormData): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const parsed = ToggleSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
  const supabase = await createClient();
  const { error } = await supabase
    .from("master_catalog_items")
    .update({ active: parsed.data.next === "true" })
    .eq("id", parsed.data.id)
    .eq("org_id", session.orgId);
  if (error) throw new Error(`Could not update master catalog item: ${error.message}`);
  revalidatePath(`/legend/hub/catalogs/${parsed.data.id}`);
  revalidatePath("/legend/hub/catalogs");
}

export async function deleteItem(id: string): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const supabase = await createClient();
  const { error } = await supabase
    .from("master_catalog_items")
    .update({ deleted_at: new Date().toISOString(), active: false })
    .eq("id", id)
    .eq("org_id", session.orgId);
  if (error) throw new Error(`Could not update master catalog item: ${error.message}`);
  revalidatePath("/legend/hub/catalogs");
  // No redirect — DeleteForm's undo flow navigates client-side after
  // showing the "Deleted" toast with its Undo action (REC-14).
}
