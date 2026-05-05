"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * Reschedule a single event by re-anchoring its `starts_at` to a new
 * day while preserving the original time-of-day. Duration (ends_at -
 * starts_at) is preserved by shifting both timestamps by the same delta.
 *
 * Wired into the generic <CalendarView>'s `onReschedule` callback on
 * /console/schedule. RLS does the org-scoping (events.org_id check on
 * the update). Returns `{ ok }` so the caller can toast on failure.
 */
const Schema = z.object({
  id: z.string().uuid(),
  newStartISO: z.string().datetime(),
});

export async function rescheduleEvent(eventId: string, newStartISO: string): Promise<{ ok: boolean; error?: string }> {
  const parsed = Schema.safeParse({ id: eventId, newStartISO });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const session = await requireSession();
  const supabase = await createClient();
  // Read the existing row to preserve duration.
  const { data: existing, error: readErr } = await supabase
    .from("events")
    .select("id, starts_at, ends_at")
    .eq("id", parsed.data.id)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (readErr || !existing) {
    return { ok: false, error: "Event not found" };
  }
  const oldStart = new Date(existing.starts_at).getTime();
  const oldEnd = new Date(existing.ends_at).getTime();
  if (Number.isNaN(oldStart) || Number.isNaN(oldEnd)) {
    return { ok: false, error: "Existing event has invalid timestamps" };
  }
  const duration = Math.max(0, oldEnd - oldStart);
  const newStart = new Date(parsed.data.newStartISO).toISOString();
  const newEnd = new Date(new Date(parsed.data.newStartISO).getTime() + duration).toISOString();
  const { error } = await supabase
    .from("events")
    .update({ starts_at: newStart, ends_at: newEnd })
    .eq("id", parsed.data.id)
    .eq("org_id", session.orgId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/console/schedule");
  revalidatePath("/console/events");
  return { ok: true };
}
