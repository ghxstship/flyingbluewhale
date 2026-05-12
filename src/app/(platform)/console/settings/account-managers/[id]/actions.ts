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
    .from("account_manager_assignments")
    .update({ active: parsed.next === "true" })
    .eq("id", parsed.id)
    .eq("org_id", session.orgId);
  revalidatePath(`/console/settings/account-managers/${parsed.id}`);
  revalidatePath("/console/settings/account-managers");
}

export async function deleteAssignment(id: string): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const supabase = await createClient();
  // Hard delete — assignments are pure routing; the underlying chat_room
  // survives because of ON DELETE SET NULL on chat_room_id.
  await supabase.from("account_manager_assignments").delete().eq("id", id).eq("org_id", session.orgId);
  revalidatePath("/console/settings/account-managers");
  redirect("/console/settings/account-managers");
}
