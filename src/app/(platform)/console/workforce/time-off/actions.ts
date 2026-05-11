"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  id: z.string().uuid(),
  decision: z.enum(["approved", "denied"]),
});

export async function decideTimeOff(fd: FormData): Promise<void> {
  const session = await requireSession();
  // Time-off approvals are HR-level — manager+ only.
  if (!isManagerPlus(session)) return;
  const parsed = Schema.parse(Object.fromEntries(fd));
  const supabase = await createClient();

  // Conditional update on the pending state — without it, a concurrent
  // approval could overwrite a deny (or vice-versa) and lose the audit.
  await supabase
    .from("time_off_requests")
    .update({
      request_state: parsed.decision,
      decided_by: session.userId,
      decided_at: new Date().toISOString(),
    })
    .eq("id", parsed.id)
    .eq("org_id", session.orgId)
    .eq("request_state", "pending");

  revalidatePath("/console/workforce/time-off");
}
