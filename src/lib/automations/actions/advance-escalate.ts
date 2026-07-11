import { z } from "zod";
import { registerAction } from "../registry";
import { notify } from "@/lib/notify";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * advance.escalate — the lapse rung of the advance chase ladder (kit 27).
 * Flips the recipient's late flag and alerts the packet owner so the
 * LPS-style non-submission surfaces without anyone re-reading threads.
 */

const Schema = z.object({
  recipientId: z.string().uuid(),
  reason: z.string().max(300).optional(),
});

registerAction({
  type: "advance.escalate",
  schema: Schema,
  label: "Escalate Lapsed Advance",
  description: "Flags the advance recipient as late and notifies the packet owner.",
  async run(input, ctx) {
    const svc = createServiceClient() as unknown as import("@/lib/supabase/loose").LooseSupabase;

    // Org-scoped read: never escalate across tenants.
    const { data: recipient } = (await svc
      .from("advance_send_recipients")
      .select("id, org_id, batch_id, contact, late_flagged_at")
      .eq("id", input.recipientId)
      .eq("org_id", ctx.orgId)
      .is("deleted_at", null)
      .maybeSingle()) as {
      data: {
        id: string;
        org_id: string;
        batch_id: string;
        contact: { name?: string; email?: string } | null;
        late_flagged_at: string | null;
      } | null;
    };
    if (!recipient) {
      throw new Error(`advance.escalate: recipient ${input.recipientId} not found in this organization`);
    }

    if (!recipient.late_flagged_at) {
      await svc
        .from("advance_send_recipients")
        .update({ late_flagged_at: new Date().toISOString() })
        .eq("id", recipient.id)
        .eq("org_id", ctx.orgId);
    }

    // Alert the packet owner (batch creator falls back to packet creator).
    const { data: batch } = (await svc
      .from("advance_send_batches")
      .select("id, created_by, packet_id, advance_packets(created_by)")
      .eq("id", recipient.batch_id)
      .eq("org_id", ctx.orgId)
      .is("deleted_at", null)
      .maybeSingle()) as {
      data: { id: string; created_by: string | null; packet_id: string; advance_packets: { created_by: string | null } | null } | null;
    };
    const ownerId = batch?.created_by ?? batch?.advance_packets?.created_by ?? null;
    let notificationId: string | null = null;
    if (ownerId) {
      notificationId = await notify({
        orgId: ctx.orgId,
        userId: ownerId,
        eventType: "advance.lapsed" as never,
        title: "Advance lapsed",
        body: `${recipient.contact?.name ?? recipient.contact?.email ?? "A recipient"} missed the advance deadline${input.reason ? `: ${input.reason}` : ""}.`,
        href: `/studio/comms/advances/${recipient.batch_id}`,
        data: { recipientId: recipient.id, batchId: recipient.batch_id },
      });
    }

    return { output: { escalated: true, lateFlagged: true, ownerNotified: Boolean(ownerId), notificationId } };
  },
});

export {};
