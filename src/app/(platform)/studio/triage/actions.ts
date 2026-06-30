"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type InboxActionState = { error?: string } | null;

/**
 * Mark a notification read (the "dismiss"/triage action for notification-source
 * inbox items). Scoped to the calling user so one user can't clear another's
 * queue; RLS is the backstop.
 */
export async function markNotificationReadAction(id: string): Promise<InboxActionState> {
  const session = await requireSession();
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", session.userId);
  if (error) return { error: error.message };
  revalidatePath("/studio/inbox");
  return null;
}
