import { type NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiOk, parseJson } from "@/lib/api";
import { isManagerPlus, withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * /api/v1/notifications/actions (P2.a) — endpoint behind actionable push
 * notifications. The service worker `fetch`es this (cookies included) when a
 * user taps an action button on a notification, so a deliverable can be
 * approved / a time-off request decided without opening the app.
 *
 * The action descriptor (kind/id/action) is set server-side when the push is
 * created and carried in the notification's data, but this handler STILL
 * authorizes from scratch — session + manager-band + org scope — because the
 * notification payload is not a trust boundary.
 */
const ActionSchema = z.object({
  kind: z.enum(["time_off", "deliverable"]),
  id: z.string().uuid(),
  action: z.enum(["approve", "decline"]),
  note: z.string().max(2000).optional(),
});

export async function POST(req: NextRequest) {
  const input = await parseJson(req, ActionSchema);
  if (input instanceof Response) return input;

  return withAuth(async (session) => {
    if (!isManagerPlus(session)) return apiError("forbidden", "Manager access required");
    const supabase = await createClient();

    if (input.kind === "time_off") {
      if (input.action === "approve") {
        const { error } = await (
          supabase.rpc as unknown as (
            name: string,
            params: Record<string, unknown>,
          ) => Promise<{ error: { message: string } | null }>
        )("approve_time_off_request", {
          p_request_id: input.id,
          p_decider_id: session.userId,
          p_decision_note: input.note ?? null,
        });
        if (error) return apiError("internal", error.message);
        return apiOk({ kind: "time_off", id: input.id, decided: "approved" });
      }
      // decline — guarded state flip, only from pending.
      const { data, error } = await supabase
        .from("time_off_requests")
        .update({ request_state: "denied", decided_by: session.userId, decided_at: new Date().toISOString() })
        .eq("id", input.id)
        .eq("org_id", session.orgId)
        .eq("request_state", "pending")
        .select("id");
      if (error) return apiError("internal", error.message);
      if (!data || data.length === 0) return apiError("conflict", "Request is no longer pending");
      return apiOk({ kind: "time_off", id: input.id, decided: "denied" });
    }

    // deliverable — approve only (decline routes through the in-app review).
    if (input.action !== "approve") return apiError("bad_request", "Deliverables support approve only here");
    const { data, error } = await supabase
      .from("deliverables")
      .update({ fulfillment_state: "approved" })
      .eq("id", input.id)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .in("fulfillment_state", ["submitted", "in_review"])
      .select("id");
    if (error) return apiError("internal", error.message);
    if (!data || data.length === 0) return apiError("conflict", "Deliverable is not awaiting approval");
    return apiOk({ kind: "deliverable", id: input.id, decided: "approved" });
  });
}
