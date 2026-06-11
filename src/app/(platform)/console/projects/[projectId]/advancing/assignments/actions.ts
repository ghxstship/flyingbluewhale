"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { writeInbox } from "@/lib/inbox";
import { toTitle } from "@/lib/format";
import { log } from "@/lib/log";
import { FULFILLMENT_STATES, NEXT_FULFILLMENT_STATES, type FulfillmentState } from "@/lib/db/assignments";

/**
 * Bulk fulfillment transitions (FE-2) — the list-page counterpart to the
 * single-row `advanceState` in `[assignmentId]/actions.ts`. Mirrors that
 * action exactly per row: NEXT_FULFILLMENT_STATES validation, conditional
 * UPDATE guarded on the read state (stale tabs can't write an illegal
 * jump), an `assignment_events` state_change row per transition, and an
 * inbox notification for user-kind parties.
 *
 * Rows whose current state can't legally reach the target are skipped and
 * counted; the caller gets an honest partial-failure summary instead of a
 * silent no-op.
 */

const BulkSchema = z.object({
  projectId: z.string().uuid(),
  nextState: z.enum(FULFILLMENT_STATES),
  ids: z.array(z.string().uuid()).min(1).max(200),
});

export type BulkTransitionResult = { message?: string; error?: string };

export async function bulkAdvanceAssignments(
  projectId: string,
  nextState: FulfillmentState,
  ids: string[],
): Promise<BulkTransitionResult> {
  const session = await requireSession();
  if (!isManagerPlus(session)) {
    return { error: "You Need Manager Access To Transition Assignments" };
  }
  const parsed = BulkSchema.safeParse({ projectId, nextState, ids });
  if (!parsed.success) return { error: "Invalid Bulk Transition Request" };

  const supabase = await createClient();
  const { data: rows, error: readErr } = await supabase
    .from("assignments")
    .select("id, title, party_kind, party_user_id, fulfillment_state")
    .in("id", parsed.data.ids)
    .eq("project_id", parsed.data.projectId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null);
  if (readErr) return { error: `Could Not Load Assignments — ${readErr.message}` };

  const found = (rows ?? []) as Array<{
    id: string;
    title: string | null;
    party_kind: "user" | "crew_member" | "external_holder";
    party_user_id: string | null;
    fulfillment_state: FulfillmentState;
  }>;

  const total = parsed.data.ids.length;
  let transitioned = 0;
  // Missing / cross-project / deleted ids count as failures too.
  let failed = total - found.length;

  for (const a of found) {
    // Validate EVERY row's transition server-side against the canon.
    if (!NEXT_FULFILLMENT_STATES[a.fulfillment_state]?.includes(parsed.data.nextState)) {
      failed++;
      continue;
    }

    // Conditional claim — only flips if the row is still in the state we
    // read, so concurrent edits lose gracefully instead of double-writing.
    const { data: updated, error: updateErr } = await supabase
      .from("assignments")
      .update({ fulfillment_state: parsed.data.nextState })
      .eq("id", a.id)
      .eq("org_id", session.orgId)
      .eq("fulfillment_state", a.fulfillment_state)
      .select("id")
      .maybeSingle();
    if (updateErr || !updated) {
      failed++;
      continue;
    }

    // Append to the universal event journal — every transition writes one.
    const { error: eventErr } = await supabase.from("assignment_events").insert({
      assignment_id: a.id,
      org_id: session.orgId,
      event_kind: "state_change",
      actor_user_id: session.userId,
      from_state: a.fulfillment_state,
      to_state: parsed.data.nextState,
    });
    if (eventErr) {
      // The state DID change — the row counts as transitioned. The journal
      // gap is loud (logged with full context, same pattern as
      // scanAssignment's logScanEvent) but doesn't fail the batch.
      log.error("assignments.bulk_transition_journal_failed", {
        assignment_id: a.id,
        from_state: a.fulfillment_state,
        to_state: parsed.data.nextState,
        err: eventErr.message,
      });
    }

    // Notify the assignee (user kind only — external holders aren't on
    // the platform). Fire-and-forget, same as the single path.
    if (a.party_kind === "user" && a.party_user_id) {
      void writeInbox({
        userId: a.party_user_id,
        orgId: session.orgId,
        kind: "assignment_state",
        sourceType: "assignments",
        sourceId: crypto.randomUUID(),
        actorId: session.userId,
        title: `Assignment ${toTitle(parsed.data.nextState)}`,
        body: a.title ?? "",
        href: "/m/advances",
      });
    }
    transitioned++;
  }

  revalidatePath(`/console/projects/${parsed.data.projectId}/advancing/assignments`);

  const stateLabel = toTitle(parsed.data.nextState);
  if (failed > 0) {
    return {
      error: `${failed} Of ${total} Could Not Transition To ${stateLabel} · ${transitioned} Updated`,
    };
  }
  return { message: `${transitioned} ${transitioned === 1 ? "Assignment" : "Assignments"} Now ${stateLabel}` };
}
