"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { actionFail, formFail } from "@/lib/forms/fail";
import { DECISION_KINDS, instanceStateForDecision } from "@/lib/approvals/queries";

const Schema = z.object({
  instance_id: z.string().uuid(),
  step_id: z.string().uuid(),
  decision: z.enum(DECISION_KINDS),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function recordDecision(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can record approval decisions" };
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();

  // Confirm the instance is org-scoped (approval_decisions has no org_id —
  // scope via its parent instance).
  const { data: instance } = await supabase
    .from("approval_instances")
    .select("id")
    .eq("id", parsed.data.instance_id)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!instance) return { error: "Approval instance not found" };

  // party_id columns have no FK → map to the current user.
  const { error } = await supabase.from("approval_decisions").insert({
    instance_id: parsed.data.instance_id,
    step_id: parsed.data.step_id,
    decider_party_id: session.userId,
    decision: parsed.data.decision,
    notes: parsed.data.notes || null,
    // decided_at defaults now()
  });
  if (error) return actionFail(error.message, fd);

  // Best-effort instance-state advance from the decision.
  const nextState = instanceStateForDecision(parsed.data.decision);
  if (nextState) {
    const isClosing = nextState === "approved" || nextState === "rejected";
    await supabase
      .from("approval_instances")
      .update({
        state: nextState,
        ...(isClosing ? { closed_at: new Date().toISOString() } : {}),
      })
      .eq("id", parsed.data.instance_id)
      .eq("org_id", session.orgId);
  }

  revalidatePath(`/studio/governance/approvals/${parsed.data.instance_id}`);
  revalidatePath("/studio/governance/approvals");
  return { ok: true };
}
