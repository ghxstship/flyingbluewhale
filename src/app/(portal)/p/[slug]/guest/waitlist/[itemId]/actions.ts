"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { log } from "@/lib/log";

export type State = { error?: string; ok?: boolean } | null;

export async function joinWaitlist(_: State, fd: FormData): Promise<State> {
  const catalogItemId = (fd.get("catalog_item_id") as string | null)?.trim();
  const slug = (fd.get("slug") as string | null)?.trim();
  if (!catalogItemId || !slug) return { error: "Missing parameters." };

  const session = await requireSession();
  const supabase = await createClient();

  const { error } = await supabase.from("catalog_waitlist").insert({
    org_id: session.orgId,
    catalog_item_id: catalogItemId,
    party_user_id: session.userId,
    position: 0,
  });
  if (error) {
    if (error.code === "23505") return { error: "You are already on the waitlist." };
    log.error("p.guest.waitlist.join_failed", { err: error.message });
    return { error: error.message };
  }

  revalidatePath(`/p/${slug}/guest/waitlist/${catalogItemId}`);
  return { ok: true };
}

export async function leaveWaitlist(_: State, fd: FormData): Promise<State> {
  const entryId = (fd.get("entry_id") as string | null)?.trim();
  const slug = (fd.get("slug") as string | null)?.trim();
  const catalogItemId = (fd.get("catalog_item_id") as string | null)?.trim();
  if (!entryId || !slug || !catalogItemId) return { error: "Missing parameters." };

  const session = await requireSession();
  const supabase = await createClient();

  const { error } = await supabase
    .from("catalog_waitlist")
    .delete()
    .eq("id", entryId)
    .eq("org_id", session.orgId)
    .eq("party_user_id", session.userId);
  if (error) {
    log.error("p.guest.waitlist.leave_failed", { err: error.message });
    return { error: error.message };
  }

  revalidatePath(`/p/${slug}/guest/waitlist/${catalogItemId}`);
  return { ok: true };
}
