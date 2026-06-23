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
  const parsed = ToggleSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
  const supabase = await createClient();
  const { error } = await supabase
    .from("account_manager_assignments")
    .update({ active: parsed.data.next === "true" })
    .eq("id", parsed.data.id)
    .eq("org_id", session.orgId);
  if (error) throw new Error(`Could not update account manager assignment: ${error.message}`);
  revalidatePath(`/studio/settings/account-managers/${parsed.data.id}`);
  revalidatePath("/studio/settings/account-managers");
}

export async function deleteAssignment(id: string): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const supabase = await createClient();
  // Hard delete — assignments are pure routing; the underlying chat_room
  // survives because of ON DELETE SET NULL on chat_room_id.
  const { error } = await supabase
    .from("account_manager_assignments")
    .delete()
    .eq("id", id)
    .eq("org_id", session.orgId);
  if (error) throw new Error(`Could not delete account manager assignment: ${error.message}`);
  revalidatePath("/studio/settings/account-managers");
  redirect("/studio/settings/account-managers");
}
