"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * /m/notifications/[id] record actions (kit 31, live-test resolution #2).
 * Own-row writes only (notifications RLS: user_id = me); org-pinned anyway.
 * Dismiss is a soft delete — never a hard delete.
 */

export type DetailState = { error?: string } | null;

const Id = z.string().uuid();

export async function markNotificationRead(id: string): Promise<DetailState> {
  const session = await requireSession();
  const parsed = Id.safeParse(id);
  if (!parsed.success) return { error: "Bad notification id." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", parsed.data)
    .eq("user_id", session.userId)
    .is("read_at", null);
  if (error) return { error: error.message };
  revalidatePath("/m/notifications");
  revalidatePath(`/m/notifications/${parsed.data}`);
  return null;
}

export async function dismissNotification(id: string): Promise<DetailState> {
  const session = await requireSession();
  const parsed = Id.safeParse(id);
  if (!parsed.success) return { error: "Bad notification id." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", parsed.data)
    .eq("user_id", session.userId);
  if (error) return { error: error.message };
  revalidatePath("/m/notifications");
  return null;
}
