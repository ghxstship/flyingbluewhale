"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { actionFail, formFail } from "@/lib/forms/fail";
import { DECISION_KINDS } from "@/lib/approvals/queries";
import { actionErrorMessage } from "@/lib/errors";

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
  if (!isManagerPlus(session)) return { error: actionErrorMessage("auth.manager-plus.record-approval-decisions", "Only manager+ can record approval decisions") };
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();

  // ONE call, ONE transaction. The decision row and the instance state advance
  // must commit together — as two PostgREST statements they couldn't, so a
  // failure between them left a decision on record against a still-open
  // instance. record_approval_decision (20260715140000) does both inside a
  // plpgsql function; it re-checks manager-band authority on the instance's org
  // itself (SECURITY DEFINER bypasses RLS), rejects an already-terminal
  // instance, and verifies the step belongs to this instance's policy — so the
  // org/authority pre-read this action used to do is now redundant.
  const { error } = await supabase.rpc("record_approval_decision", {
    p_instance_id: parsed.data.instance_id,
    p_step_id: parsed.data.step_id,
    p_decision: parsed.data.decision,
    p_notes: parsed.data.notes || undefined,
  });
  if (error) return actionFail(error.message, fd);

  revalidatePath(`/studio/governance/approvals/${parsed.data.instance_id}`);
  revalidatePath("/studio/governance/approvals");
  return { ok: true };
}
