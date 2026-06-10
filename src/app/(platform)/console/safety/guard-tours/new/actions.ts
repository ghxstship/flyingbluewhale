"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { actionFail, formFail } from "@/lib/forms/fail";

const Schema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  venue_id: z.string().uuid().optional().or(z.literal("")),
  cadence_minutes: z.coerce.number().int().min(0).max(10_080).optional(),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createGuardTour(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);

  const cadence = parsed.data.cadence_minutes && parsed.data.cadence_minutes > 0 ? parsed.data.cadence_minutes : null;
  const nextRunAt = cadence ? new Date(Date.now() + cadence * 60 * 1000).toISOString() : null;

  const supabase = await createClient();

  // Cross-tenant FK guard on optional venue_id.
  const venueId = parsed.data.venue_id || null;
  if (venueId) {
    const { data: venue } = await supabase
      .from("venues")
      .select("id")
      .eq("id", venueId)
      .eq("org_id", session.orgId)
      .maybeSingle();
    if (!venue) return { error: "Venue not found in your organization" };
  }

  const { error } = await supabase.from("guard_tours").insert({
    org_id: session.orgId,
    name: parsed.data.name,
    description: parsed.data.description || null,
    venue_id: venueId,
    route: [],
    cadence_minutes: cadence,
    next_run_at: nextRunAt,
    tour_state: cadence ? "scheduled" : "scheduled",
  });
  if (error) return actionFail(error.message, fd);
  revalidatePath("/console/safety/guard-tours");
  redirect("/console/safety/guard-tours");
}
