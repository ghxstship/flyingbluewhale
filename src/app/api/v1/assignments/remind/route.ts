import { z } from "zod";
import { apiOk, apiError, parseJson } from "@/lib/api";
import { isManagerPlus, withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { sendPushTo } from "@/lib/push/send";

// Crew assignment invitation reminders (Competitive Edge Drop v1 — Rentman
// 2025 "send reminder to crew who haven't responded" parity). Sends a push
// notification to the assigned party reminding them to acknowledge their
// assignment. Gated to manager+ to prevent flooding.
//
// Rate-limit: the DB enforces a minimum gap of 4 hours via the
// last_reminder_sent_at column check — if the last reminder was sent within
// the cooldown window we return 409 Conflict to the client.

const REMINDER_COOLDOWN_HOURS = 4;

const Schema = z.object({
  assignmentId: z.string().uuid(),
});

export async function POST(req: Request) {
  const input = await parseJson(req, Schema);
  if (input instanceof Response) return input;

  const guard = await withAuth(async (session) => ({ session }));
  if (guard instanceof Response) return guard;
  const { session } = guard;

  if (!isManagerPlus(session)) {
    return apiError("forbidden", "Manager access required to send reminders");
  }

  const supabase = await createClient();

  const { data: assignment } = await supabase
    .from("assignments")
    .select(
      "id, org_id, title, catalog_kind, party_kind, party_user_id, fulfillment_state, last_reminder_sent_at",
    )
    .eq("id", input.assignmentId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!assignment) return apiError("not_found", "Assignment not found");

  // Only remind on unresponded states — no point reminding if issued/redeemed.
  const remindableStates = ["briefed", "draft", "submitted", "in_review"];
  if (!remindableStates.includes(String(assignment.fulfillment_state))) {
    return apiError("conflict", "Assignment is not in a state that requires a reminder");
  }

  // Enforce cooldown — prevent managers from spamming crew members.
  if (assignment.last_reminder_sent_at) {
    const lastSent = new Date(assignment.last_reminder_sent_at as string).getTime();
    const elapsed = (Date.now() - lastSent) / 3_600_000;
    if (elapsed < REMINDER_COOLDOWN_HOURS) {
      return apiError(
        "conflict",
        `Reminder already sent ${elapsed.toFixed(1)}h ago. Wait ${(REMINDER_COOLDOWN_HOURS - elapsed).toFixed(1)}h before resending.`,
      );
    }
  }

  // Resolve the party's user_id (only user-linked parties receive push now;
  // crew_member and external_holder notifications are out of scope until their
  // auth accounts are created).
  const targetUserId = (assignment.party_user_id as string | null) ?? null;
  if (!targetUserId) {
    return apiError("conflict", "This party does not have a linked user account — push not available");
  }

  const title = (assignment.title as string | null) ?? String(assignment.catalog_kind);

  // Stamp last_reminder_sent_at before firing push so a race doesn't result
  // in two simultaneous reminders.
  const now = new Date().toISOString();
  const { error: stampError } = await supabase
    .from("assignments")
    .update({ last_reminder_sent_at: now })
    .eq("id", input.assignmentId)
    .eq("org_id", session.orgId);
  if (stampError) return apiError("internal", stampError.message);

  // Log the reminder for audit trail.
  await supabase.from("assignment_reminder_log").insert({
    org_id: session.orgId,
    assignment_id: input.assignmentId,
    sent_by: session.userId,
    sent_at: now,
    channel: "push",
  });

  void sendPushTo(targetUserId, {
    title: "Action needed on your assignment",
    body: `You have a pending ${String(assignment.catalog_kind)} assignment: "${title}". Please review and acknowledge.`,
    url: `/m/advances`,
    kind: "assignment",
    scope: "mobile",
    data: { assignmentId: input.assignmentId },
  });

  return apiOk({ sent: true, remindedAt: now });
}
