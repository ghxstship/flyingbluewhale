"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * /m/notifications (bell feed) write actions.
 *
 * acknowledgeAlert marks an org broadcast/alert notification as read for the
 * caller by stamping `notifications.read_at`. Org-pinned so a member can't
 * acknowledge another tenant's row.
 *
 * Kit 31 (v2.7 swipe canon) adds the row-level swipe writes — Flag (danger) ·
 * Read/Unread (info) · Dismiss (danger, soft-delete + 5s undo). All three are
 * additionally pinned to `user_id = me`: notifications RLS only allows own-row
 * updates, and a silent RLS no-op on a broadcast row (user_id NULL) would lie
 * to the swipe UI, so the server refuses what RLS would swallow.
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
    // Pin to my own row, matching notifications_update RLS and the swipe
    // actions below. The system fans notifications out per-user (0 broadcast
    // user_id-NULL rows exist), so this can never no-op a real row; it just
    // keeps the app-level filter honest with what RLS enforces.
    .eq("user_id", session.userId)
    .is("read_at", null);
  if (error) return { error: error.message };

  revalidatePath("/m/notifications");
  return null;
}

const ToggleSchema = z.object({
  alertId: z.string().uuid(),
  on: z.enum(["1", ""]),
});

/** Swipe Read/Unread — toggles `read_at` on my own notification row. */
export async function setAlertRead(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = ToggleSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Invalid request." };
  const supabase = await createClient();

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: parsed.data.on === "1" ? new Date().toISOString() : null })
    .eq("id", parsed.data.alertId)
    .eq("org_id", session.orgId)
    .eq("user_id", session.userId);
  if (error) return { error: error.message };

  revalidatePath("/m/notifications");
  return null;
}

/** Swipe Flag — toggles `flagged_at` (20260718013348) on my own row. */
export async function setAlertFlag(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = ToggleSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Invalid request." };
  const supabase = await createClient();

  const { error } = await supabase
    .from("notifications")
    .update({ flagged_at: parsed.data.on === "1" ? new Date().toISOString() : null })
    .eq("id", parsed.data.alertId)
    .eq("org_id", session.orgId)
    .eq("user_id", session.userId);
  if (error) return { error: error.message };

  revalidatePath("/m/notifications");
  return null;
}

/**
 * Swipe Dismiss — soft-deletes (`deleted_at`) my own row; the 5s undo bar
 * calls back with `on=""` to restore it. Never a hard delete.
 */
export async function setAlertDismissed(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = ToggleSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Invalid request." };
  const supabase = await createClient();

  const { error } = await supabase
    .from("notifications")
    .update({ deleted_at: parsed.data.on === "1" ? new Date().toISOString() : null })
    .eq("id", parsed.data.alertId)
    .eq("org_id", session.orgId)
    .eq("user_id", session.userId);
  if (error) return { error: error.message };

  revalidatePath("/m/notifications");
  return null;
}
