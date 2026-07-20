"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertCapability, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getRequestLocaleSettings, getRequestFormatters } from "@/lib/i18n/request";
import { sendPushBulk } from "@/lib/push/send";
import { log } from "@/lib/log";
import { listAreaOptions } from "./areas";
import { zonedTimeToUtc } from "./tz";

/**
 * Kit 32 v2.9 · Shift Scheduler (/m/scheduler) server actions.
 *
 * The kit's "shift" (role × area × time × crew-needed) maps onto the repo's
 * one-row-per-person `shifts` model as a SLOT GROUP: "Crew Needed = 4"
 * inserts 4 rows sharing role/area/times, each row one seat. Open seat =
 * `crew_member_id IS NULL`; assigning fills a seat; the Draft/Published
 * badge is the `publish_state` facet (migration 20260718022624). This keeps
 * the time clock / attendance / payroll chain — which all key on the
 * per-person row — untouched.
 *
 * Every action is `schedule:write` (the rostering capability the console
 * uses) and org-scoped; the shifts RLS manager band agrees (probed
 * insert/update/delete with read-back, 2026-07-18).
 */

export type State = { error?: string; fieldErrors?: Record<string, string> } | null;

const MAX_SEATS = 30;

function fail(error: string, fieldErrors?: Record<string, string>): State {
  return { error, fieldErrors };
}

const CreateInput = z.object({
  role: z.string().min(1, "Name the role.").max(120),
  area: z.string().min(1, "Pick an area."),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date."),
  start: z.string().regex(/^\d{2}:\d{2}$/, "Set a start time."),
  end: z.string().regex(/^\d{2}:\d{2}$/, "Set an end time."),
  need: z.coerce.number().int().min(1, "At least one seat.").max(MAX_SEATS, `At most ${MAX_SEATS} seats.`),
  rate: z.string().max(40).optional(),
  notes: z.string().max(2000).optional(),
});

/** "$28/hr", "28", "28.50" → cents; null when blank or unparseable. */
function parseRateCents(raw: string | undefined): number | null {
  if (!raw) return null;
  const m = raw.replace(/,/g, "").match(/\d+(?:\.\d{1,2})?/);
  if (!m) return null;
  return Math.round(parseFloat(m[0]) * 100);
}

/** FORMS.shift → N draft seat rows on the picked day. */
export async function createShift(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const denial = assertCapability(session, "schedule:write");
  if (denial) return fail("Building shifts requires the schedule:write capability.");

  const scalars = Object.fromEntries(Array.from(fd.entries()).filter(([, v]) => typeof v === "string"));
  const parsed = CreateInput.safeParse(scalars);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) if (i.path[0]) fieldErrors[String(i.path[0])] = i.message;
    return fail("Please fix the errors below.", fieldErrors);
  }
  const v = parsed.data;

  // Wall-clock times are read in the REQUEST timezone — the same zone the
  // scheduler page renders in (getRequestFormatters), so 14:00 in stays
  // 14:00 on screen regardless of where the server runs.
  const { timezone } = await getRequestLocaleSettings();
  const starts = zonedTimeToUtc(v.date, v.start, timezone);
  if (Number.isNaN(starts.getTime())) return fail("Those times are not valid.");
  let ends = zonedTimeToUtc(v.date, v.end, timezone);
  // Time-only fields make the overnight intent unambiguous: an end at or
  // before the start means "tomorrow" (18:00–02:00 changeover), not a typo.
  if (ends <= starts) ends = new Date(ends.getTime() + 24 * 3600000);

  const supabase = await createClient();

  // The submitted area is a display label; resolve it through the SAME
  // helper that built the select so a stale/forged label can only miss.
  const areas = await listAreaOptions(supabase, session.orgId);
  const area = areas.find((a) => a.label === v.area);
  if (!area) return fail("Please fix the errors below.", { area: "Pick an area from the list." });

  const rateCents = parseRateCents(v.rate);
  const rows = Array.from({ length: v.need }, () => ({
    org_id: session.orgId,
    role: v.role,
    venue_id: area.venueId,
    zone_id: area.zoneId,
    starts_at: starts.toISOString(),
    ends_at: ends.toISOString(),
    publish_state: "draft" as const,
    hourly_rate_cents: rateCents,
    notes: v.notes || null,
  }));

  const { error } = await supabase.from("shifts").insert(rows);
  if (error) {
    log.error("m.scheduler.create_failed", { err: error.message });
    return fail(error.message);
  }

  revalidatePath("/m/scheduler");
  return null;
}

const Id = z.string().uuid();
const Ids = z.array(Id).min(1).max(MAX_SEATS * 2);

/** Fill one open seat with a crew member (the assign drawer's tap). */
export async function assignShift(shiftId: string, crewMemberId: string): Promise<{ error?: string }> {
  const session = await requireSession();
  const denial = assertCapability(session, "schedule:write");
  if (denial) return { error: "Assigning crew requires the schedule:write capability." };
  const pid = Id.safeParse(shiftId);
  const cid = Id.safeParse(crewMemberId);
  if (!pid.success || !cid.success) return { error: "Bad id." };

  const supabase = await createClient();

  // The person must be in THIS org (RLS allows any insert under OUR org_id,
  // so a crafted call could otherwise seat a foreign tenant's crew row).
  const { data: crew } = await supabase
    .from("crew_members")
    .select("id, name, user_id, engagement_state")
    .eq("id", cid.data)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!crew) return { error: "That person is not in this organization." };
  if (crew.engagement_state === "separated") return { error: "That person has been separated." };

  const { data: shift } = await supabase
    .from("shifts")
    .select("id, role, starts_at, crew_member_id, publish_state")
    .eq("id", pid.data)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!shift) return { error: "That shift no longer exists." };
  if (shift.crew_member_id) return { error: "That seat was just filled. Pick another open seat." };

  const { error } = await supabase
    .from("shifts")
    .update({ crew_member_id: crew.id })
    .eq("id", pid.data)
    .eq("org_id", session.orgId)
    .is("crew_member_id", null);
  if (error) return { error: error.message };
  // RLS no-op returns no error — read the seat back before claiming success.
  const { data: after } = await supabase.from("shifts").select("crew_member_id").eq("id", pid.data).single();
  if (after?.crew_member_id !== crew.id) return { error: "Could not assign that seat." };

  // Assigning onto an ALREADY published shift notifies the person now;
  // draft seats notify on publish instead (one ping, not two).
  if (shift.publish_state === "published" && crew.user_id) {
    await notifyCrewUsers([crew.user_id], shift.role, shift.starts_at);
  }

  revalidatePath("/m/scheduler");
  return {};
}

/** Publish draft seats (one shift group, or the whole day). */
export async function publishShifts(shiftIds: string[]): Promise<{ error?: string; published?: number }> {
  const session = await requireSession();
  const denial = assertCapability(session, "schedule:write");
  if (denial) return { error: "Publishing shifts requires the schedule:write capability." };
  const ids = Ids.safeParse(shiftIds);
  if (!ids.success) return { error: "Bad shift ids." };

  const supabase = await createClient();
  const { data: updated, error } = await supabase
    .from("shifts")
    .update({ publish_state: "published" })
    .in("id", ids.data)
    .eq("org_id", session.orgId)
    .eq("publish_state", "draft")
    .select("id, role, starts_at, crew_member_id");
  if (error) return { error: error.message };
  const rows = updated ?? [];
  if (rows.length === 0) return { error: "Nothing left to publish." };

  // Push-notify the assigned crew (kind `shift`; open seats have nobody to tell).
  const crewIds = [...new Set(rows.map((r) => r.crew_member_id).filter((x): x is string => !!x))];
  if (crewIds.length > 0) {
    const { data: crew } = await supabase
      .from("crew_members")
      .select("user_id")
      .in("id", crewIds)
      .eq("org_id", session.orgId)
      .not("user_id", "is", null);
    const userIds = [...new Set((crew ?? []).map((c) => c.user_id).filter((u): u is string => !!u))];
    const first = rows[0];
    if (userIds.length > 0 && first) await notifyCrewUsers(userIds, first.role, first.starts_at);
  }

  revalidatePath("/m/scheduler");
  return { published: rows.length };
}

async function notifyCrewUsers(userIds: string[], role: string | null, startsAt: string): Promise<void> {
  // Push copy renders in the publisher's request timezone + locale — the same
  // wall clock the scheduler showed when they hit Publish.
  const { dateParts } = await getRequestFormatters();
  const label = dateParts(startsAt, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  try {
    await sendPushBulk(userIds, {
      title: "Shift Published",
      body: role ? `${role} · ${label}` : `Shift · ${label}`,
      url: "/m/schedule",
      kind: "shift",
      scope: "mobile",
    });
  } catch (e) {
    // Notification failure must not fail the publish itself.
    log.error("m.scheduler.push_failed", { err: e instanceof Error ? e.message : String(e) });
  }
}

/** A seat snapshot the client holds for the 5s undo of Remove. */
export type SeatSnapshot = {
  role: string | null;
  startsAt: string;
  endsAt: string;
  venueId: string | null;
  zoneId: string | null;
  crewMemberId: string | null;
  published: boolean;
  hourlyRateCents: number | null;
  notes: string | null;
};

/** Remove a shift group (all its seat rows). Refused once anyone clocked in. */
export async function removeShifts(shiftIds: string[]): Promise<{ error?: string }> {
  const session = await requireSession();
  const denial = assertCapability(session, "schedule:write");
  if (denial) return { error: "Removing shifts requires the schedule:write capability." };
  const ids = Ids.safeParse(shiftIds);
  if (!ids.success) return { error: "Bad shift ids." };

  const supabase = await createClient();
  const { data: seats } = await supabase
    .from("shifts")
    .select("id, checked_in_at")
    .in("id", ids.data)
    .eq("org_id", session.orgId);
  if (!seats || seats.length === 0) return { error: "That shift no longer exists." };
  if (seats.some((s) => s.checked_in_at)) {
    return { error: "Someone already clocked in on this shift. It is a record of work now, so it cannot be removed." };
  }

  const { error } = await supabase.from("shifts").delete().in("id", ids.data).eq("org_id", session.orgId);
  if (error) return { error: error.message };
  // Read back — an RLS-blocked delete is a silent no-op, not an error.
  const { data: left } = await supabase.from("shifts").select("id").in("id", ids.data).limit(1);
  if (left && left.length > 0) return { error: "Could not remove the shift." };

  revalidatePath("/m/scheduler");
  return {};
}

const Snapshot = z.object({
  role: z.string().max(120).nullable(),
  startsAt: z.string().datetime({ offset: true }),
  endsAt: z.string().datetime({ offset: true }),
  venueId: Id.nullable(),
  zoneId: Id.nullable(),
  crewMemberId: Id.nullable(),
  published: z.boolean(),
  hourlyRateCents: z.number().int().nullable(),
  notes: z.string().max(2000).nullable(),
});

/** Undo for a just-removed group — re-inserts the seats from the snapshot. */
export async function restoreShifts(seats: SeatSnapshot[]): Promise<{ error?: string }> {
  const session = await requireSession();
  const denial = assertCapability(session, "schedule:write");
  if (denial) return { error: "Restoring shifts requires the schedule:write capability." };
  const parsed = z.array(Snapshot).min(1).max(MAX_SEATS).safeParse(seats);
  if (!parsed.success) return { error: "Bad snapshot." };

  const supabase = await createClient();

  // Crew ids in the snapshot came from the client — re-scope them to this
  // org before re-seating anyone (same rule as assignShift).
  const crewIds = [...new Set(parsed.data.map((s) => s.crewMemberId).filter((x): x is string => !!x))];
  let validCrew = new Set<string>();
  if (crewIds.length > 0) {
    const { data: crew } = await supabase.from("crew_members").select("id").in("id", crewIds).eq("org_id", session.orgId);
    validCrew = new Set((crew ?? []).map((c) => c.id));
  }

  const { error } = await supabase.from("shifts").insert(
    parsed.data.map((s) => ({
      org_id: session.orgId,
      role: s.role,
      starts_at: s.startsAt,
      ends_at: s.endsAt,
      venue_id: s.venueId,
      zone_id: s.zoneId,
      crew_member_id: s.crewMemberId && validCrew.has(s.crewMemberId) ? s.crewMemberId : null,
      publish_state: s.published ? ("published" as const) : ("draft" as const),
      hourly_rate_cents: s.hourlyRateCents,
      notes: s.notes,
    })),
  );
  if (error) return { error: error.message };

  revalidatePath("/m/scheduler");
  return {};
}
