"use server";

import { revalidatePath } from "next/cache";
import { isManagerPlus, requireSession } from "@/lib/auth";
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
 *
 * Two authority rules the caller does NOT get to assert:
 *
 *  1. `as_manager` renders as a manager-badged annotation on the entry.
 *     It arrived as a client-supplied boolean and was written through
 *     unverified, so any member could post a note that displays as
 *     supervisory. It is now derived from the session, and the client's
 *     value is only a request to use it.
 *  2. The entry re-scope was org-wide, so any member could annotate any
 *     colleague's time entry. Workers may annotate their own entries;
 *     annotating someone else's is a manager act.
 */
export async function addShiftNote(entryId: string, note: string, asManager = false): Promise<State> {
  const session = await requireSession();
  const body = note.trim();
  if (!body) return { error: "Note is required." };
  const supabase = await createClient();
  const manager = isManagerPlus(session);

  // Re-scope: the entry must be in the caller's org, and must be the
  // caller's own unless they hold the manager band.
  const { data: entry } = await supabase
    .from("time_entries")
    .select("id, user_id")
    .eq("id", entryId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!entry) return { error: "Time entry not found." };
  if (entry.user_id !== session.userId && !manager) {
    return { error: "You can only add notes to your own time entries." };
  }

  const { error } = await supabase.from("shift_notes").insert({
    org_id: session.orgId,
    time_entry_id: entryId,
    author_id: session.userId,
    body,
    // Never trust the client for this: a member asking to post "as
    // manager" gets a plain note, not a 403 — the note is still worth
    // recording, it just isn't badged with authority they don't have.
    as_manager: asManager && manager,
  });
  if (error) {
    log.error("m.clock.shift_note_failed", { err: error.message });
    return { error: error.message };
  }
  revalidatePath("/m/clock");
  return { ok: true };
}
