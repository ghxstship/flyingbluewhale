"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession, isManagerPlus } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type State = { error?: string; fieldErrors?: Record<string, string> } | null;

/** Kit `event` form Type options → schedule_event_kind enum values. */
const KIND_MAP: Record<string, "shift" | "meeting" | "training" | "run_of_show"> = {
  Shift: "shift",
  Meeting: "meeting",
  Training: "training",
  "Run of show": "run_of_show",
};

const Input = z.object({
  title: z.string().trim().min(1, "Name the event."),
  type: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date."),
  start: z.string().regex(/^\d{2}:\d{2}/, "Pick a start time."),
  location: z.string().optional(),
  crew: z.string().optional(),
  notes: z.string().optional(),
});

/**
 * Create a schedule event — the kit's Schedule Event FAB (CREATE map:
 * `schedule`), backed by the real `events` store.
 *
 * Manager-gated to match the store, not just the kit: the events INSERT
 * policy's role array names six roles, but three of them (`controller`,
 * `collaborator`, `crew`) can never match — `memberships.role` only holds
 * owner/admin/manager/member — so the EFFECTIVE band is manager+. Gating
 * lower would ship a form whose submit is refused by RLS.
 *
 * Two capture compromises, stated rather than hidden:
 *  - The kit form has no end time; `ends_at` is NOT NULL. Default: one hour.
 *    The console's schedule surfaces are where durations get corrected.
 *  - `events` has no free-text location column (only location_id → locations)
 *    and no crew field. Location, crew and notes travel in `description` as
 *    labelled lines — capture beats silent discard, and inventing junk
 *    `locations` rows from free text would be worse.
 */
export async function createScheduleEvent(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "You need manager access to schedule events." };
  const parsed = Input.safeParse(Object.fromEntries(fd));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) if (i.path[0]) fieldErrors[String(i.path[0])] = i.message;
    return { error: "Please fix the errors below.", fieldErrors };
  }
  const v = parsed.data;

  const startsAt = new Date(`${v.date}T${v.start.slice(0, 5)}:00`);
  if (Number.isNaN(startsAt.getTime())) return { error: "That date and time don't parse." };
  const endsAt = new Date(startsAt.getTime() + 60 * 60 * 1000);

  const description =
    [
      v.location ? `Location: ${v.location}` : null,
      v.crew ? `Crew: ${v.crew}` : null,
      v.notes || null,
    ]
      .filter(Boolean)
      .join("\n") || null;

  const supabase = await createClient();
  const { error } = await supabase.from("events").insert({
    org_id: session.orgId,
    name: v.title,
    event_kind: KIND_MAP[v.type ?? "Shift"] ?? "shift",
    // `scheduled`, not the column default `draft`: an event created from the
    // field IS the schedule — a draft nobody can see defeats the point.
    event_state: "scheduled",
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
    description,
    created_by: session.userId,
  });
  if (error) return { error: error.message };

  revalidatePath("/m/schedule");
  revalidatePath("/m");
  return null;
}
