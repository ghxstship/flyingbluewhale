"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { transitionPunch, type PunchState } from "@/lib/db/punch-transition";

/**
 * Advance a punch item from the field.
 *
 * This surface worked before by importing the CONSOLE route's action
 * (`@/app/(platform)/studio/punch/[id]/actions`) straight into the mobile
 * shell — functional, but a layering violation: a shell reaching into another
 * shell's route means either can break the other by editing a page. The FSM,
 * its legal moves, the closed_at stamping and the concurrency re-assert now
 * live in `@/lib/db/punch-transition`, shared by both, and each shell keeps
 * its own thin action for its own revalidation paths.
 *
 * Throws on refusal to match the console's contract, because the caller is a
 * `<form action={...}>` in a server component.
 */
export async function advancePunchItem(id: string, to: PunchState): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();

  const result = await transitionPunch(supabase, session, id, to);
  if (!result.ok) throw new Error(result.error);

  revalidatePath(`/m/punch/${id}`);
  revalidatePath("/m/punch");
  revalidatePath("/m/snags");
}
