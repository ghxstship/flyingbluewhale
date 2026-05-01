"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  venue_id: z.string().uuid().optional().or(z.literal("")),
  cadence_minutes: z.coerce.number().int().min(0).max(10_080).optional(),
});

export type State = { error?: string } | null;

export async function createGuardTour(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const cadence = parsed.data.cadence_minutes && parsed.data.cadence_minutes > 0 ? parsed.data.cadence_minutes : null;
  const nextRunAt = cadence ? new Date(Date.now() + cadence * 60 * 1000).toISOString() : null;

  const supabase = await createClient();
  const { error } = await supabase.from("guard_tours").insert({
    org_id: session.orgId,
    name: parsed.data.name,
    description: parsed.data.description || null,
    venue_id: parsed.data.venue_id || null,
    route: [],
    cadence_minutes: cadence,
    next_run_at: nextRunAt,
    status: cadence ? "scheduled" : "scheduled",
  });
  if (error) return { error: error.message };
  revalidatePath("/console/safety/guard-tours");
  redirect("/console/safety/guard-tours");
}
