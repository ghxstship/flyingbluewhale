"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { MANAGER_BAND_ROLES, requireSession } from "@/lib/auth";
import { createClient, createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";
import { sendPushBulk } from "@/lib/push/send";
import { log } from "@/lib/log";

/**
 * /m/assets swipe writes — kit 31 (v2.7) canon:
 *
 *  · Check In (ok, only when Out): the party returns their own issued gear.
 *    `assignments_update` RLS is manager-band only, so this rides the
 *    `checkin_my_assignment` SECURITY DEFINER RPC (20260718013348) which
 *    verifies the caller IS the party, flips `fulfillment_state → returned`,
 *    and writes the `assignment_events` state_change in one transaction.
 *
 *  · Lost (danger): appends a `Reported lost` comment to the assignment's
 *    append-only journal and pushes an ops alert to the manager band.
 *    `assignment_events` insert RLS does not cover the member band, so after
 *    an explicit "this assignment is yours" check the journal row is written
 *    with the service client — the same seam the push fan-out already uses.
 */

export type State = { error?: string } | null;

const Schema = z.object({ assignmentId: z.string().uuid() });

export async function checkinMyAssignment(_prev: State, fd: FormData): Promise<State> {
  await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Invalid request." };
  const supabase = await createClient();

  const { error } = await supabase.rpc("checkin_my_assignment", {
    p_assignment_id: parsed.data.assignmentId,
  });
  if (error) {
    log.error("m.assets.checkin_failed", { err: error.message });
    return { error: error.message };
  }

  revalidatePath("/m/assets");
  revalidatePath("/m/advances");
  return null;
}

export async function reportAssignmentLost(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Invalid request." };
  const supabase = await createClient();

  // The row must be the caller's own assignment in their org.
  const { data: assignment } = await supabase
    .from("assignments")
    .select("id, org_id, title, catalog_kind")
    .eq("id", parsed.data.assignmentId)
    .eq("org_id", session.orgId)
    .eq("party_kind", "user")
    .eq("party_user_id", session.userId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!assignment) return { error: "Assignment not found." };

  if (!isServiceClientAvailable()) return { error: "Not configured." };
  const service = createServiceClient();
  const { error: evErr } = await service.from("assignment_events").insert({
    org_id: session.orgId,
    assignment_id: assignment.id,
    event_kind: "comment",
    body: "Reported lost",
    actor_user_id: session.userId,
  });
  if (evErr) {
    log.error("m.assets.lost_event_failed", { err: evErr.message });
    return { error: evErr.message };
  }

  // Ops alert → the manager band (kit: "lost pushes ops alert").
  const { data: managers } = await supabase
    .from("memberships")
    .select("user_id")
    .eq("org_id", session.orgId)
    .in("role", [...MANAGER_BAND_ROLES])
    .is("deleted_at", null);
  const managerIds = (managers ?? [])
    .map((m) => m.user_id as string)
    .filter((u) => u && u !== session.userId);
  if (managerIds.length > 0) {
    await sendPushBulk(managerIds, {
      title: "Asset reported lost",
      body: assignment.title ?? "Assigned asset",
      url: "/m/assets",
      kind: "assignment_state",
      scope: "mobile",
      orgId: session.orgId,
    });
  }

  revalidatePath("/m/assets");
  return null;
}
