"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type State = { error?: string; fieldErrors?: Record<string, string> } | null;

const Input = z.object({
  origin: z.string().min(1, "Where did you start?").max(160),
  destination: z.string().min(1, "Where did you end up?").max(160),
  miles: z.string().min(1, "How far?"),
  logged_on: z.string().min(1),
  notes: z.string().max(1000).optional(),
});

/**
 * Log a drive from the vehicle.
 *
 * The GPS is in the crew member's pocket; the ability to record the trip
 * was on a laptop. RLS excluded the crew persona from `mileage_logs`
 * outright until `20260715160000` — this is the surface that block was
 * hiding.
 *
 * `rate_cents` is deliberately NOT sent. The column defaults to 67 (the
 * mileage rate), and the reimbursement rate is not the driver's to set —
 * a form field for it would be an invitation to a dispute at best and
 * expense fraud at worst. Same reasoning as the console's action, which
 * also omits it.
 *
 * `user_id` comes from the session, never the form: the RLS grant is
 * `user_id = auth.uid()`, so setting it server-side is what makes the
 * policy true rather than merely satisfied.
 */
/** Shared distance parse/sanity — the same rules on create and edit, so a
 *  trip can't be corrected INTO a four-figure typo the create path refuses. */
function parseMiles(raw: string): { miles: number } | { error: State } {
  const miles = Number(raw.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(miles) || miles <= 0) {
    return { error: { error: "Enter the distance as a number.", fieldErrors: { miles: "e.g. 12.4" } } };
  }
  // A trip longer than a continent is a typo, not a drive. Catch it here
  // rather than let it reach an approver as a four-figure claim.
  if (miles > 2000) {
    return { error: { error: "That looks like a typo — check the distance.", fieldErrors: { miles: "Over 2000 miles?" } } };
  }
  return { miles };
}

export async function logFieldMileage(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Input.safeParse(Object.fromEntries(fd));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) if (i.path[0]) fieldErrors[String(i.path[0])] = i.message;
    return { error: "Please fix the errors below.", fieldErrors };
  }
  const v = parsed.data;

  const m = parseMiles(v.miles);
  if ("error" in m) return m.error;
  const miles = m.miles;

  const supabase = await createClient();
  const { error } = await supabase.from("mileage_logs").insert({
    org_id: session.orgId,
    user_id: session.userId,
    origin: v.origin,
    destination: v.destination,
    miles,
    logged_on: v.logged_on,
    notes: v.notes || null,
  });
  if (error) return { error: error.message };

  revalidatePath("/m/mileage");
  redirect("/m/mileage");
}

const EditInput = Input.extend({ id: z.string().uuid() });
const IdInput = z.object({ id: z.string().uuid() });

/**
 * Correct one of MY OWN logged drives. A mileage entry had no edit path at
 * all — a mistyped distance or destination was permanent, and the only
 * "fix" was to file a second entry, which double-counts the claim.
 *
 * `user_id` is pinned to the session in the WHERE clause (belt-and-braces
 * with the `user_id = auth.uid()` RLS grant) and the row is read back: an
 * RLS-refused write returns zero rows rather than an error, so an empty
 * result is "not yours", surfaced honestly instead of as a silent success.
 * `rate_cents` stays unsettable here for the same reason as on create.
 */
export async function updateMileage(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = EditInput.safeParse(Object.fromEntries(fd));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) if (i.path[0]) fieldErrors[String(i.path[0])] = i.message;
    return { error: "Please fix the errors below.", fieldErrors };
  }
  const v = parsed.data;

  const m = parseMiles(v.miles);
  if ("error" in m) return m.error;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mileage_logs")
    .update({
      origin: v.origin,
      destination: v.destination,
      miles: m.miles,
      logged_on: v.logged_on,
      notes: v.notes || null,
    })
    .eq("id", v.id)
    .eq("user_id", session.userId)
    .select("id");
  if (error) return { error: error.message };
  if (!data || data.length === 0) return { error: "You can only edit your own mileage." };

  revalidatePath("/m/mileage");
  return null;
}

/** Remove one of MY OWN logged drives (a trip filed twice, or in error).
 *  Same ownership pin + read-back as the edit. `mileage_logs` carries no
 *  soft-delete column, so this is a real delete — scoped to the owner. */
export async function deleteMileage(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = IdInput.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Invalid request." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mileage_logs")
    .delete()
    .eq("id", parsed.data.id)
    .eq("user_id", session.userId)
    .select("id");
  if (error) return { error: error.message };
  if (!data || data.length === 0) return { error: "You can only remove your own mileage." };

  revalidatePath("/m/mileage");
  return null;
}
