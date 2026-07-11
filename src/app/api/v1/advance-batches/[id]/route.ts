import { z } from "zod";
import { apiOk, apiError } from "@/lib/api";
import { withAuth, assertScope } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { NextRequest } from "next/server";

/**
 * GET /api/v1/advance-batches/{id} (kit 27)
 *
 * One merge run's tracking board: the batch header plus per-recipient
 * delivery funnel state (queued → delivered → opened → started →
 * submitted → complete, or bounced). Portal tokens are NOT exposed —
 * they are the recipient's credential. `advancing:read`.
 */

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!z.string().uuid().safeParse(id).success) return apiError("bad_request", "Invalid batch id");
  return withAuth(async (session) => {
    const denied = assertScope(session, "advancing:read");
    if (denied) return denied;
    const supabase = await createClient();
    const { data: batch } = await supabase
      .from("advance_send_batches")
      .select("id, packet_id, subject, batch_state, scheduled_at, sent_at, created_at")
      .eq("id", id)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .maybeSingle();
    if (!batch) return apiError("not_found", "Batch not found");

    const { data: recipients } = await supabase
      .from("advance_send_recipients")
      .select("id, audience_id, contact, delivery_state, late_flagged_at, created_at, updated_at")
      .eq("batch_id", batch.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: true })
      .limit(1000);
    return apiOk({ batch, recipients: recipients ?? [] });
  }).catch(() => apiError("internal", "Failed to load advance batch"));
}
