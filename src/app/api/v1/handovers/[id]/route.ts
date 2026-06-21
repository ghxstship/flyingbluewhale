import { type NextRequest } from "next/server";
import { apiError, apiOk } from "@/lib/api";
import { assertScope, withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/** /api/v1/handovers/[id] — single handover, org-scoped. */

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return withAuth(async (session) => {
    if (!session.orgId) return apiError("forbidden", "User is not in an organization");
    const denied = assertScope(session, "handovers:read");
    if (denied) return denied;
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("handovers")
      .select(
        "id, org_id, project_id, from_user_id, to_user_id, relief_label, post_state, summary, open_items, assets_passed, created_at, updated_at",
      )
      .eq("id", id)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .maybeSingle();
    if (error) return apiError("internal", error.message);
    if (!data) return apiError("not_found", "Handover not found");
    return apiOk({ handover: data });
  });
}
