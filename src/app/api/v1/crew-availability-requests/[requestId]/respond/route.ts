import { z } from "zod";
import { apiError, apiOk, parseJson } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";

/**
 * PATCH /api/v1/crew-availability-requests/[requestId]/respond
 *
 * Crew member submits their availability response. Only the assignee
 * may respond; only pending + non-expired requests are mutable.
 */

const Schema = z.object({
  status: z.enum(["available", "unavailable"]),
  response_note: z.string().max(500).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ requestId: string }> }) {
  if (!hasSupabase) return apiError("service_unavailable", "Supabase not configured");

  const { requestId } = await params;
  const input = await parseJson(req, Schema);
  if (input instanceof Response) return input;

  const guard = await withAuth(async (session) => ({ session }));
  if (guard instanceof Response) return guard;
  const { session } = guard;

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("crew_availability_requests")
    .select("id, assignee_id, status, expires_at")
    .eq("id", requestId)
    .maybeSingle();

  if (!existing) return apiError("not_found", "Availability request not found");
  if (existing.assignee_id !== session.userId) return apiError("forbidden", "Only the assignee may respond");
  if (existing.status !== "pending") return apiError("conflict", "Request already responded to");
  if (new Date(existing.expires_at) < new Date()) return apiError("conflict", "Request has expired");

  const { data, error } = await supabase
    .from("crew_availability_requests")
    .update({
      status: input.status,
      response_note: input.response_note ?? null,
      responded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", requestId)
    .select()
    .single();

  if (error) return apiError("internal", error.message);
  return apiOk({ request: data });
}
