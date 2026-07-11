import { z } from "zod";
import { registerAction } from "../registry";
import { createServiceClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { NEXT_FULFILLMENT_STATES, type FulfillmentState } from "@/lib/db/assignments";

/**
 * credential.batch_issue — the kit 26 Phase E agent verb: "batch-advance these
 * credentials to issued". Bulk-flips a project's credential assignments to
 * 'issued', validating EVERY row's transition server-side against the
 * fulfillment canon (NEXT_FULFILLMENT_STATES) — the verb is gated on the
 * transition it respects, so rows whose current state can't legally reach
 * 'issued' are counted out, never forced. Each landed transition writes the
 * universal assignment_events journal row, exactly like the console's bulk
 * action (advancing/assignments/actions.ts#bulkAdvanceAssignments).
 */

const Schema = z.object({
  projectId: z.string().uuid(),
  /** Restrict to specific assignment ids; omit for every eligible credential. */
  assignmentIds: z.array(z.string().uuid()).max(200).optional(),
});

registerAction({
  type: "credential.batch_issue",
  schema: Schema,
  label: "Batch-Issue Credentials",
  description: "Advances a project's eligible credential assignments to issued, one journal row per transition.",
  async run(input, ctx) {
    const svc = createServiceClient() as unknown as LooseSupabase;

    let q = svc
      .from("assignments")
      .select("id, fulfillment_state")
      .eq("org_id", ctx.orgId)
      .eq("project_id", input.projectId)
      .eq("catalog_kind", "credential")
      .is("deleted_at", null);
    if (input.assignmentIds?.length) q = q.in("id", input.assignmentIds);
    const { data, error: readErr } = (await q.limit(500)) as {
      data: Array<{ id: string; fulfillment_state: FulfillmentState }> | null;
      error: { message: string } | null;
    };
    if (readErr) throw new Error(`credential.batch_issue: could not load assignments: ${readErr.message}`);
    const rows = data ?? [];

    let issued = 0;
    let skipped = 0;
    for (const a of rows) {
      // Canon check: only a state whose forward edges include 'issued' moves.
      if (!NEXT_FULFILLMENT_STATES[a.fulfillment_state]?.includes("issued")) {
        skipped++;
        continue;
      }
      // Conditional claim — concurrent edits lose gracefully.
      // soft-delete-exempt: state-guarded transition update returning id, not a read
      const { data: updated, error: updateErr } = (await svc
        .from("assignments")
        .update({ fulfillment_state: "issued" })
        .eq("id", a.id)
        .eq("org_id", ctx.orgId)
        .eq("fulfillment_state", a.fulfillment_state)
        .select("id")
        .maybeSingle()) as { data: { id: string } | null; error: { message: string } | null };
      if (updateErr || !updated) {
        skipped++;
        continue;
      }
      await svc.from("assignment_events").insert({
        assignment_id: a.id,
        org_id: ctx.orgId,
        event_kind: "state_change",
        actor_user_id: ctx.actorId ?? null,
        from_state: a.fulfillment_state,
        to_state: "issued",
      });
      issued++;
    }

    return { output: { matched: rows.length, issued, skipped } };
  },
});

export {};
