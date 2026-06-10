import { type NextRequest } from "next/server";
import { z } from "zod";
import { apiCreated, apiError, apiOk, parseJson } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/** /api/v1/privacy/dsar — DSAR intake (WF-232). */

const PostSchema = z.object({
  orgId: z.string().uuid().optional(),
  requesterEmail: z.string().email(),
  kind: z.enum(["access", "deletion", "correction", "portability", "objection"]).default("access"),
  notes: z.string().max(4000).optional(),
});

export async function GET() {
  return withAuth(async (session) => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("dsar_requests")
      .select("id, requester_email, kind, request_state, due_by, fulfilled_at, created_at")
      .eq("org_id", session.orgId)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) return apiError("internal", error.message);
    return apiOk({ requests: data ?? [] });
  });
}

export async function POST(req: NextRequest) {
  const input = await parseJson(req, PostSchema);
  if (input instanceof Response) return input;
  return withAuth(async (session) => {
    const orgId = input.orgId ?? session.orgId;
    if (!orgId) return apiError("bad_request", "orgId required");
    const supabase = await createClient();

    // Cross-tenant guard: confirm the caller is an active member of orgId.
    // Without this, any authed user could file a DSAR against any org.id
    // they happened to know — RLS would refuse the insert silently and
    // we'd surface a confusing 500 instead of a clean 403.
    if (orgId !== session.orgId) {
      const { data: member } = await supabase
        .from("memberships")
        .select("org_id")
        .eq("user_id", session.userId)
        .eq("org_id", orgId)
        .is("deleted_at", null)
        .maybeSingle();
      if (!member) return apiError("forbidden", "You are not a member of that organization");
    }

    const due = new Date();
    due.setDate(due.getDate() + 30);
    const { data, error } = await supabase
      .from("dsar_requests")
      .insert({
        org_id: orgId,
        requester_user_id: session.userId ?? null,
        requester_email: input.requesterEmail,
        kind: input.kind,
        due_by: due.toISOString().slice(0, 10),
        notes: input.notes ?? null,
      })
      .select("id, kind, request_state, due_by")
      .single();
    if (error) return apiError("internal", error.message);
    return apiCreated({ request: data });
  });
}
