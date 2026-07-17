"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertCapability, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formFail } from "@/lib/forms/fail";

/**
 * Rostering — put a person on a shift.
 *
 * WHY THIS EXISTS: nothing in the product created a shift. `shifts` had 16
 * seeded rows and no writer anywhere in `src/`; ten-plus surfaces read the
 * table and none could produce a row. So `/m/schedule` was empty for everyone,
 * and shift-derived capability grants (ADR-0015) had nothing to derive from —
 * not for want of a column, but for want of a way to fill it.
 *
 * The shift is keyed on `crew_members` (`crew_member_id`), the person SSOT —
 * NOT `workforce_members`, whose `user_id` was never populated on any row and
 * which is being retired (ADR-0015 Addendum 2). That is what makes a rostered
 * shift actually reach the person's phone: crew_members.user_id is real.
 */

const Schema = z.object({
  crew_member_id: z.string().uuid("Pick who is working this shift"),
  starts_at: z.string().min(1, "Start time is required"),
  ends_at: z.string().min(1, "End time is required"),
  role: z.string().max(120).optional().or(z.literal("")),
});

export type State = {
  error?: string;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function addShift(rosterId: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  // Rostering decides who works — and, once shift-derived grants are live, what
  // they can do. It is a scheduling authority, not a field action.
  const denial = assertCapability(session, "schedule:write");
  if (denial) return { error: "You do not have permission to roster shifts." };

  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);

  const starts = new Date(parsed.data.starts_at);
  const ends = new Date(parsed.data.ends_at);
  if (Number.isNaN(starts.getTime()) || Number.isNaN(ends.getTime())) {
    return { error: "Those times are not valid." };
  }
  // A shift that ends before it starts is a typo, not a night shift — the
  // operator meant tomorrow's date. Catching it here beats a negative-length
  // shift silently reaching payroll.
  if (ends <= starts) {
    return { error: "The shift has to end after it starts. For an overnight shift, set the end date to the next day." };
  }

  const supabase = await createClient();

  // The roster is the scope: it carries the org, the venue and the day. Reading
  // it back (rather than trusting the URL) is what org-scopes the write.
  const { data: roster } = await supabase
    .from("rosters")
    .select("id, org_id, venue_id")
    .eq("id", rosterId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!roster) return { error: "That roster no longer exists." };

  // The person must be in THIS org. Without this check a crafted form could
  // roster someone from another tenant — RLS would allow the insert, since the
  // shift's own org_id is ours.
  const { data: crew } = await supabase
    .from("crew_members")
    .select("id, engagement_state")
    .eq("id", parsed.data.crew_member_id)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!crew) return { error: "That person is not in this organization." };
  if (crew.engagement_state === "separated") {
    return { error: "That person has been separated. Reinstate them before rostering." };
  }

  const { error } = await supabase.from("shifts").insert({
    org_id: session.orgId,
    roster_id: roster.id,
    crew_member_id: crew.id,
    venue_id: roster.venue_id,
    starts_at: starts.toISOString(),
    ends_at: ends.toISOString(),
    role: parsed.data.role || null,
  });
  if (error) return { error: error.message };

  revalidatePath(`/studio/workforce/rosters/${rosterId}`);
  return null;
}

export async function removeShift(rosterId: string, shiftId: string): Promise<void> {
  const session = await requireSession();
  const denial = assertCapability(session, "schedule:write");
  if (denial) throw new Error("You do not have permission to roster shifts.");

  const supabase = await createClient();
  // A shift is a plan, not a record of work — until someone clocks in against
  // it. Once it has attendance, removing it would erase that; the roster is
  // then edited by cancelling, not deleting. Guarded here rather than assumed.
  const { data: shift } = await supabase
    .from("shifts")
    .select("id, checked_in_at")
    .eq("id", shiftId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!shift) throw new Error("That shift no longer exists.");
  if (shift.checked_in_at) {
    throw new Error("Someone already clocked in on this shift. It is a record of work now, so it cannot be removed.");
  }

  const { error } = await supabase.from("shifts").delete().eq("id", shiftId).eq("org_id", session.orgId);
  if (error) throw new Error(`Could not remove the shift: ${error.message}`);
  revalidatePath(`/studio/workforce/rosters/${rosterId}`);
}
