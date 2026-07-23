"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { writeInbox } from "@/lib/inbox";
import { toTitle } from "@/lib/format";
import { log } from "@/lib/log";
import { sendExternalAssignmentEmail } from "@/lib/email";
import {
  CATALOG_KIND_LABEL_SINGULAR,
  FULFILLMENT_STATES,
  NEXT_FULFILLMENT_STATES,
  type CatalogKind,
  type FulfillmentState,
} from "@/lib/db/assignments";
import { actionErrorMessage } from "@/lib/errors";

/** E-06 — externally-meaningful states; email is an external holder's only channel. */
const EXTERNAL_HOLDER_EMAIL_STATES: readonly FulfillmentState[] = ["issued", "transferred", "voided"] as const;

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
    return { error: actionErrorMessage("auth.manager.transition-assignments", "You Need Manager Access To Transition Assignments") };
  }
  const parsed = BulkSchema.safeParse({ projectId, nextState, ids });
  if (!parsed.success) return { error: actionErrorMessage("invalid.bulk-transition-request", "Invalid Bulk Transition Request") };

  const supabase = await createClient();
  const { data: rows, error: readErr } = await supabase
    .from("assignments")
    .select("id, title, party_kind, party_user_id, party_external_id, catalog_kind, fulfillment_state")
    .in("id", parsed.data.ids)
    .eq("project_id", parsed.data.projectId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null);
  if (readErr) return { error: `Could Not Load Assignments: ${readErr.message}` };

  const found = (rows ?? []) as Array<{
    id: string;
    title: string | null;
    party_kind: "user" | "crew_member" | "external_holder";
    party_user_id: string | null;
    party_external_id: string | null;
    catalog_kind: CatalogKind;
    fulfillment_state: FulfillmentState;
  }>;

  const total = parsed.data.ids.length;
  let transitioned = 0;
  // Missing / cross-project / deleted ids count as failures too.
  let failed = total - found.length;
  // External holders whose transition landed — emailed in one pass below.
  const externalToEmail: Array<{ holderId: string; title: string | null; catalogKind: CatalogKind }> = [];

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

    // Notify the assignee. Platform users get inbox + push + (opt-in)
    // email; external holders are collected for the email pass below —
    // email is their only channel. Fire-and-forget, same as the single path.
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
    } else if (
      a.party_kind === "external_holder" &&
      a.party_external_id &&
      EXTERNAL_HOLDER_EMAIL_STATES.includes(parsed.data.nextState)
    ) {
      externalToEmail.push({ holderId: a.party_external_id, title: a.title, catalogKind: a.catalog_kind });
    }
    transitioned++;
  }

  // E-06 — one holder/context read, one kit email per external holder whose
  // transition landed. Fire-and-forget; a send failure never fails the batch.
  if (externalToEmail.length > 0) {
    void (async () => {
      try {
        const holderIds = [...new Set(externalToEmail.map((e) => e.holderId))];
        const [{ data: holders }, { data: project }, { data: org }] = await Promise.all([
          supabase
            .from("assignment_external_holders")
            .select("id, holder_email, holder_name")
            .in("id", holderIds)
            .eq("org_id", session.orgId),
          supabase.from("projects").select("name").eq("id", parsed.data.projectId).maybeSingle(),
          supabase.from("orgs").select("name").eq("id", session.orgId).maybeSingle(),
        ]);
        const byId = new Map((holders ?? []).map((h) => [h.id, h]));
        await Promise.allSettled(
          externalToEmail.map((e) => {
            const holder = byId.get(e.holderId);
            if (!holder?.holder_email) return Promise.resolve();
            const kindLabel = CATALOG_KIND_LABEL_SINGULAR[e.catalogKind] ?? "Assignment";
            return sendExternalAssignmentEmail({
              to: holder.holder_email,
              holderName: holder.holder_name,
              assignmentTitle: e.title ?? kindLabel,
              kindLabel,
              stateLabel: toTitle(parsed.data.nextState),
              projectName: project?.name ?? null,
              orgName: org?.name ?? null,
            });
          }),
        );
      } catch (err) {
        log.warn("assignments.bulk_external_holder_email_failed", { err: (err as Error).message });
      }
    })();
  }

  revalidatePath(`/studio/projects/${parsed.data.projectId}/advancing/assignments`);

  const stateLabel = toTitle(parsed.data.nextState);
  if (failed > 0) {
    return {
      error: `${failed} Of ${total} Could Not Transition To ${stateLabel} · ${transitioned} Updated`,
    };
  }
  return { message: `${transitioned} ${transitioned === 1 ? "Assignment" : "Assignments"} Now ${stateLabel}` };
}
