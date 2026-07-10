"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { log } from "@/lib/log";

export type State = { error?: string; ok?: boolean } | null;

// Clock in / out moved to the queueable POST /api/v1/time/clock endpoint
// (see src/components/mobile/useClockPunch.ts) so offline punches are
// buffered by the service worker and replayed on reconnect — a server
// action fetch can't be intercepted and simply throws when offline.

/**
 * Attach a shift note to a time entry. Persisted to the dedicated 3NF
 * `shift_notes` table (org_id, time_entry_id, author_id, body, as_manager).
 * RLS enforces `author_id = auth.uid()`, so we set it to the session user.
 * Both the worker and managers may log a note for the record.
 */
export async function addShiftNote(
  entryId: string,
  note: string,
  asManager = false,
): Promise<State> {
  const session = await requireSession();
  const body = note.trim();
  if (!body) return { error: "Note is required." };
  const supabase = await createClient();

  // Re-scope: the time entry must be in the caller's org.
  const { data: entry } = await supabase
    .from("time_entries")
    .select("id")
    .eq("id", entryId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!entry) return { error: "Time entry not found." };

  const { error } = await supabase.from("shift_notes").insert({
    org_id: session.orgId,
    time_entry_id: entryId,
    author_id: session.userId,
    body,
    as_manager: asManager,
  });
  if (error) {
    log.error("m.clock.shift_note_failed", { err: error.message });
    return { error: error.message };
  }
  revalidatePath("/m/clock");
  return { ok: true };
}
