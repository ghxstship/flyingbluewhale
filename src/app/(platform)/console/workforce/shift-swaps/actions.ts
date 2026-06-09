"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  id: z.string().uuid(),
  decision: z.enum(["approved", "declined"]),
});

export async function decideSwap(fd: FormData): Promise<void> {
  const session = await requireSession();
  // Roster decisions are scheduler-level — manager+ only.
  if (!isManagerPlus(session)) return;
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
  const supabase = await createClient();

  // Conditional update — without it, a concurrent approve+decline would
  // last-write-wins and lose the audit attribution.
  const { error } = await supabase
    .from("shift_swaps")
    .update({
      swap_state: parsed.data.decision,
      decided_by: session.userId,
      decided_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.id)
    .eq("org_id", session.orgId)
    .in("swap_state", ["requested", "accepted"]);
  if (error) throw new Error(`Could not update shift swap: ${error.message}`);

  revalidatePath("/console/workforce/shift-swaps");
}
