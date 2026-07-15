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
export async function logFieldMileage(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Input.safeParse(Object.fromEntries(fd));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) if (i.path[0]) fieldErrors[String(i.path[0])] = i.message;
    return { error: "Please fix the errors below.", fieldErrors };
  }
  const v = parsed.data;

  const miles = Number(v.miles.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(miles) || miles <= 0) {
    return { error: "Enter the distance as a number.", fieldErrors: { miles: "e.g. 12.4" } };
  }
  // A trip longer than a continent is a typo, not a drive. Catch it here
  // rather than let it reach an approver as a four-figure claim.
  if (miles > 2000) {
    return { error: "That looks like a typo — check the distance.", fieldErrors: { miles: "Over 2000 miles?" } };
  }

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
