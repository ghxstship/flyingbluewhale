import { z } from "zod";
import { apiOk, apiError, parseJson } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  persona: z.string().max(80).optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ proposalId: string }> }) {
  const { proposalId } = await params;

  const input = await parseJson(req, Schema);
  if (input instanceof Response) return input;

  const guard = await withAuth(async (session) => ({ session }));
  if (guard instanceof Response) return guard;
  const { session } = guard;

  const supabase = await createClient();

  // Verify the proposal belongs to this org (cross-tenant guard)
  const { data: proposal } = await supabase
    .from("proposals")
    .select("id, org_id")
    .eq("id", proposalId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!proposal) return apiError("not_found", "Proposal not found");

  // Deduplicate: skip insert if this viewer already logged a view in the
  // past 15 minutes to avoid multiple page-load noise from the same session.
  const windowStart = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("proposal_views")
    .select("id", { count: "exact", head: true })
    .eq("proposal_id", proposalId)
    .eq("viewer_user_id", session.userId)
    .gte("viewed_at", windowStart);

  if ((count ?? 0) > 0) {
    return apiOk({ tracked: false, reason: "deduped" });
  }

  const { error } = await supabase.from("proposal_views").insert({
    org_id: session.orgId,
    proposal_id: proposalId,
    viewer_user_id: session.userId,
    viewer_persona: input.persona ?? null,
  });

  if (error) return apiError("internal", error.message);

  return apiOk({ tracked: true });
}
