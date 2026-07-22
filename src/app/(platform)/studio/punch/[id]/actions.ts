"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { transitionPunch, type PunchState } from "@/lib/db/punch-transition";

/**
 * Console punch transition — a thin wrapper over the shared FSM
 * (`@/lib/db/punch-transition`), which COMPVSS `/m/punch/[itemId]` also calls.
 * The states, the legal moves, the closed_at stamping and the concurrency
 * re-assert all live there so the two shells can't drift; this keeps the
 * console's throw-on-failure contract and its revalidation paths.
 */
export async function transitionPunchItem(id: string, to: PunchState): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();

  const result = await transitionPunch(supabase, session, id, to);
  if (!result.ok) throw new Error(result.error);

  revalidatePath(`/studio/punch/${id}`);
  revalidatePath("/studio/punch");
}
