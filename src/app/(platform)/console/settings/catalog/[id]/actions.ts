"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const ToggleSchema = z.object({
  id: z.string().uuid(),
  next: z.enum(["true", "false"]),
});

export async function toggleActive(fd: FormData): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const parsed = ToggleSchema.parse(Object.fromEntries(fd));
  const supabase = await createClient();
  await supabase
    .from("master_catalog_items")
    .update({ active: parsed.next === "true" })
    .eq("id", parsed.id)
    .eq("org_id", session.orgId);
  revalidatePath(`/console/settings/catalog/${parsed.id}`);
  revalidatePath("/console/settings/catalog");
}

export async function deleteItem(id: string): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const supabase = await createClient();
  await supabase
    .from("master_catalog_items")
    .update({ deleted_at: new Date().toISOString(), active: false })
    .eq("id", id)
    .eq("org_id", session.orgId);
  revalidatePath("/console/settings/catalog");
  redirect("/console/settings/catalog");
}
