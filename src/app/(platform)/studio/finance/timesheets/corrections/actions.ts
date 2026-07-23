"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { can, isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { notify } from "@/lib/notify";
import { CORRECTION_DECISIONS } from "@/lib/time/corrections";
import { actionErrorMessage } from "@/lib/errors";

export type State = { error?: string; ok?: string } | null;

const Schema = z.object({
  correctionId: z.string().uuid(),
  decision: z.enum(CORRECTION_DECISIONS),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

/**
 * Decide a worker's time-correction request.
 *
 * Everything that matters happens inside `apply_time_correction`: the
 * decision, the entry mutation, the audit reason, and re-opening an
 * already-approved timesheet whose hours just moved, all in one
 * transaction. This action is the console's door to it, not a second
 * implementation of it — splitting the logic is what leaves a phantom
 * decision behind when the second write fails.
 *
 * Separation of duties is enforced at three layers below this one (route,
 * RLS, and the `tec_no_self_approval` CHECK). The gate here is the
 * friendliest, not the authoritative one.
 */
export async function decideCorrection(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session) || !can(session, "time:approve")) {
    return { error: actionErrorMessage("auth.manager.decide-a-time-correction", "Only managers can decide a time correction.") };
  }

  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: actionErrorMessage("pick-a-valid-decision", "Pick a valid decision.") };
  const { correctionId, decision } = parsed.data;
  const notes = parsed.data.notes || null;

  const supabase = await createClient();

  // Read the requester before deciding, so we can tell them afterwards.
  const { data: before } = await supabase
    .from("time_entry_corrections")
    .select("requester_id, correction_kind")
    .eq("id", correctionId)
    .eq("org_id", session.orgId)
    .maybeSingle();

  const db = supabase as unknown as LooseSupabase;
  const { data, error } = await db.rpc("apply_time_correction", {
    p_correction_id: correctionId,
    p_decision: decision,
    p_notes: notes,
  });

  if (error) {
    // 42501 covers both "not a manager" and the separation-of-duties
    // refusal; the RPC's message names which.
    if (error.code === "42501") return { error: error.message };
    if (error.code === "55000") return { error: actionErrorMessage("someone-else-already-decided-this-one-refresh", "Someone else already decided this one. Refresh.") };
    if (error.code === "P0002") return { error: actionErrorMessage("that-request-no-longer-exists", "That request no longer exists.") };
    return { error: `Could not apply the decision: ${error.message}` };
  }

  const result = data as { state: string; reopened_timesheet?: boolean } | null;

  if (before?.requester_id) {
    await notify({
      orgId: session.orgId,
      userId: before.requester_id,
      eventType: "time.correction_decided",
      title: decision === "approved" ? "Your time fix was approved" : "Your time fix was denied",
      body: notes,
      href: "/m/clock",
      data: { targetTable: "time_entry_corrections", targetId: correctionId, decision },
    });
  }

  revalidatePath("/studio/finance/timesheets/corrections");
  revalidatePath("/studio/finance/timesheets");
  return {
    ok:
      result?.reopened_timesheet === true
        ? "Applied. Its hours changed, so the timesheet went back to open and needs approving again."
        : decision === "approved"
          ? "Applied."
          : "Denied.",
  };
}
