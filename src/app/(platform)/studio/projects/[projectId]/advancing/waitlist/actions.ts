"use server";

import { revalidatePath } from "next/cache";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { log } from "@/lib/log";

export type State = { error?: string; ok?: boolean } | null;

export async function notifyWaitlistEntry(fd: FormData): Promise<void> {
  const entryId = (fd.get("entry_id") as string | null)?.trim();
  const projectId = (fd.get("project_id") as string | null)?.trim();
  if (!entryId || !projectId) return;

  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const supabase = await createClient();

  const { error } = await supabase
    .from("catalog_waitlist")
    .update({ notified_at: new Date().toISOString() })
    .eq("id", entryId)
    .eq("org_id", session.orgId);
  if (error) log.error("advancing.waitlist.notify_failed", { err: error.message });

  revalidatePath(`/studio/projects/${projectId}/advancing/waitlist`);
}
