"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession, isManagerPlus } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getRequestFormatters } from "@/lib/i18n/request";

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

  // Scope the bust to the two surfaces this insert actually changes: the
  // field calendar, and the /m home (which lists upcoming events —
  // src/app/(mobile)/m/page.tsx reads `events` with starts_at >= now). Both
  // are `page`-type revalidations, so neither cascades to the rest of the tree.
  revalidatePath("/m/schedule");
  revalidatePath("/m");
  return null;
}

const RemindInput = z.object({ eventId: z.string().uuid() });

/**
 * Event quick-look · Remind — kit 32 Drawer System (v2.8) candidate
 * ("Remind schedules a notification row").
 *
 * Honest scope: there is no deferred-delivery reminder infrastructure on /m
 * (local shift reminders are a separate native path, and only cover the
 * viewer's own shifts). So Remind writes a REAL `notifications` row for the
 * caller — the event pins itself to their bell feed with a deep link back to
 * the schedule — rather than pretending a timer exists. Never toast-only.
 */
export async function remindEvent(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = RemindInput.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Invalid request." };

  const supabase = await createClient();
  const { data: ev } = await supabase
    .from("events")
    .select("id, name, starts_at")
    .eq("id", parsed.data.eventId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!ev) return { error: "Event not found." };

  const fmt = await getRequestFormatters();
  const { error } = await supabase.from("notifications").insert({
    org_id: session.orgId,
    user_id: session.userId,
    kind: "system",
    title: `Reminder · ${ev.name}`,
    body: fmt.dateParts(new Date(ev.starts_at as string), {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
    href: "/m/schedule",
  });
  if (error) return { error: error.message };

  revalidatePath("/m/notifications");
  revalidatePath("/m/alerts");
  return null;
}
