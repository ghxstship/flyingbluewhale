"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * /m/notifications (bell feed) write actions. acknowledgeAlert marks an org broadcast/alert
 * notification as read for the caller by stamping `notifications.read_at`.
 * Org-pinned so a member can't acknowledge another tenant's row.
 */

export type State = { error?: string } | null;

const Schema = z.object({ alertId: z.string().uuid() });

export async function acknowledgeAlert(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", parsed.data.alertId)
    .eq("org_id", session.orgId)
    .is("read_at", null);
  if (error) return { error: error.message };

  revalidatePath("/m/notifications");
  return null;
}
