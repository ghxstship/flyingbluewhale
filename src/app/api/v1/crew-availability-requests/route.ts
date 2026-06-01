import { z } from "zod";
import { apiCreated, apiError, parseJson } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { sendPushTo } from "@/lib/push/send";

/**
 * POST /api/v1/crew-availability-requests
 *
 * Create one or more crew availability check requests and push-notify each
 * assignee. Operator-only — requires org membership.
 */

const Schema = z.object({
  project_id: z.string().uuid().optional(),
  assignee_ids: z.array(z.string().uuid()).min(1).max(100),
  shift_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "shift_date must be YYYY-MM-DD"),
  shift_start: z.string().optional(),
  shift_end: z.string().optional(),
  role_note: z.string().max(300).optional(),
  expires_hours: z.number().int().min(1).max(168).default(48),
});

export async function POST(req: Request) {
  if (!hasSupabase) return apiError("service_unavailable", "Supabase not configured");

  const input = await parseJson(req, Schema);
  if (input instanceof Response) return input;

  const guard = await withAuth(async (session) => ({ session }));
  if (guard instanceof Response) return guard;
  const { session } = guard;

  const supabase = await createClient();
  const expiresAt = new Date(Date.now() + input.expires_hours * 3600 * 1000).toISOString();

  const rows = input.assignee_ids.map((assignee_id) => ({
    org_id: session.orgId,
    project_id: input.project_id ?? null,
    requested_by: session.userId,
    assignee_id,
    shift_date: input.shift_date,
    shift_start: input.shift_start ?? null,
    shift_end: input.shift_end ?? null,
    role_note: input.role_note ?? null,
    expires_at: expiresAt,
  }));

  const { data, error } = await supabase
    .from("crew_availability_requests")
    .insert(rows)
    .select("id, assignee_id");

  if (error) return apiError("internal", error.message);

  // Fire push notifications — non-blocking, best-effort
  const shiftLabel = input.shift_start
    ? `${input.shift_date} ${input.shift_start}–${input.shift_end ?? "TBD"}`
    : input.shift_date;

  await Promise.allSettled(
    (data ?? []).map(({ id, assignee_id }) =>
      sendPushTo(assignee_id, {
        title: "Availability check",
        body: `Are you available for ${input.role_note ?? "a shift"} on ${shiftLabel}?`,
        url: `/m/availability/${id}`,
        tag: `avail-${id}`,
        kind: "assignment",
      }),
    ),
  );

  return apiCreated({ requests: data });
}
