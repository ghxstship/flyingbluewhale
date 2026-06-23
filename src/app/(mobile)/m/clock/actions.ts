"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { log } from "@/lib/log";

export type State = { error?: string; ok?: boolean; entryId?: string } | null;

/**
 * Open a time entry for the signed-in user. No-op if one is already open
 * (server-enforced so a stale tab can't double-punch).
 */
export async function clockIn(): Promise<State> {
  const session = await requireSession();
  const supabase = await createClient();

  const { data: open } = await supabase
    .from("time_entries")
    .select("id")
    .eq("org_id", session.orgId)
    .eq("user_id", session.userId)
    .is("ended_at", null)
    .maybeSingle();
  if (open) return { error: "You're already clocked in." };

  const { error } = await supabase.from("time_entries").insert({
    org_id: session.orgId,
    user_id: session.userId,
    started_at: new Date().toISOString(),
    activity_category: "shift",
  });
  if (error) {
    log.error("m.clock.clock_in_failed", { err: error.message });
    return { error: error.message };
  }
  revalidatePath("/m/clock");
  return { ok: true };
}

/**
 * Close the user's currently-open time entry, computing duration_minutes.
 */
export async function clockOut(): Promise<State> {
  const session = await requireSession();
  const supabase = await createClient();

  const { data: open } = await supabase
    .from("time_entries")
    .select("id, started_at")
    .eq("org_id", session.orgId)
    .eq("user_id", session.userId)
    .is("ended_at", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!open) return { error: "You're not clocked in." };

  const endedAt = new Date();
  const startedAt = new Date(open.started_at as string);
  const durationMinutes = Math.max(0, Math.round((endedAt.getTime() - startedAt.getTime()) / 60000));

  const { error } = await supabase
    .from("time_entries")
    .update({ ended_at: endedAt.toISOString(), duration_minutes: durationMinutes })
    .eq("id", open.id as string)
    .eq("org_id", session.orgId)
    .eq("user_id", session.userId);
  if (error) {
    log.error("m.clock.clock_out_failed", { err: error.message });
    return { error: error.message };
  }
  revalidatePath("/m/clock");
  return { ok: true, entryId: open.id as string };
}

/**
 * Submit end-of-shift feedback (Shift Pulse). One row per time entry;
 * duplicate submissions are rejected by the UNIQUE constraint on time_entry_id.
 * Mood 1–5 (1 = rough, 5 = great); highlights and blockers are optional text.
 */
export async function submitShiftPulse(
  entryId: string,
  mood: number,
  highlights: string,
  blockers: string,
): Promise<State> {
  const session = await requireSession();
  if (mood < 1 || mood > 5 || !Number.isInteger(mood)) return { error: "Invalid mood value." };

  const supabase = await createClient();

  const { data: entry } = await supabase
    .from("time_entries")
    .select("id")
    .eq("id", entryId)
    .eq("org_id", session.orgId)
    .eq("user_id", session.userId)
    .maybeSingle();
  if (!entry) return { error: "Time entry not found." };

  const { error } = await supabase.from("shift_feedback").insert({
    org_id: session.orgId,
    time_entry_id: entryId,
    created_by: session.userId,
    mood,
    highlights: highlights.trim() || null,
    blockers: blockers.trim() || null,
  });
  if (error) {
    if (error.code === "23505") return { error: "You've already submitted feedback for this shift." };
    log.error("m.clock.shift_pulse_failed", { err: error.message });
    return { error: error.message };
  }
  return { ok: true };
}

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
