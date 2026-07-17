"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { INCIDENT_STATES, transitionIncident } from "@/lib/db/incident-fsm";

export type State = { error?: string; ok?: boolean } | null;

const Input = z.object({
  id: z.string().uuid(),
  to: z.enum(INCIDENT_STATES),
});

/**
 * Move an incident along its lifecycle, from the field.
 *
 * Mobile was file-and-forget: `fileIncident` inserted a row and that was
 * the entire relationship. The list rows weren't even links, so the person
 * who actually witnessed the thing handed it to a queue and lost sight of
 * it — and whoever picked it up had to go and find them to ask what
 * happened.
 *
 * Delegates to the shared FSM so the console and the field can't drift.
 */
export async function moveIncident(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Input.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Invalid transition." };

  const supabase = await createClient();
  const result = await transitionIncident(supabase, session, parsed.data.id, parsed.data.to);
  if (!result.ok) return { error: result.error };

  revalidatePath("/m/incidents");
  revalidatePath(`/m/incidents/${parsed.data.id}`);
  return { ok: true };
}
