"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type State = { error?: string; ok?: true } | null;

const INBOX_PATH = "/me/notifications/inbox";

/** Mark a single notification (owned by the current user) as read. */
export async function markReadAction(_: State, fd: FormData): Promise<State> {
  const id = fd.get("id");
  if (typeof id !== "string" || !id) return { error: "Missing notification id" };
  const session = await requireSession();
  const supabase = await createClient();
  const now = new Date().toISOString();
  // .is("deleted_at", null) — don't re-stamp read_at on an archived
  // (soft-deleted) notification.
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: now })
    .eq("id", id)
    .eq("user_id", session.userId)
    .is("read_at", null)
    .is("deleted_at", null);
  if (error) return { error: error.message };
  revalidatePath(INBOX_PATH);
  return { ok: true };
}

/** Mark every unread notification for the current user as read. */
export async function markAllReadAction(_: State, _fd: FormData): Promise<State> {
  const session = await requireSession();
  const supabase = await createClient();
  const now = new Date().toISOString();
  // .is("deleted_at", null) — don't pull archived notifications back
  // into the visible-but-read state via this bulk action.
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: now })
    .eq("user_id", session.userId)
    .is("read_at", null)
    .is("deleted_at", null);
  if (error) return { error: error.message };
  revalidatePath(INBOX_PATH);
  return { ok: true };
}

/** Soft-delete (archive) a notification owned by the current user.
 *  The `notifications` table doesn't have a dedicated `archived_at`
 *  column — `deleted_at` is the soft-delete tombstone the index
 *  partial-on `notifications_user_unread_idx` already filters on,
 *  and the bell-icon API already excludes rows where it's set. */
export async function archiveAction(_: State, fd: FormData): Promise<State> {
  const id = fd.get("id");
  if (typeof id !== "string" || !id) return { error: "Missing notification id" };
  const session = await requireSession();
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("notifications")
    .update({ deleted_at: now, read_at: now })
    .eq("id", id)
    .eq("user_id", session.userId);
  if (error) return { error: error.message };
  revalidatePath(INBOX_PATH);
  return { ok: true };
}
