import { apiError, apiOk } from "@/lib/api";
import { assertCapability, withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * DELETE /api/v1/me/api-keys/{id} — revoke a programmatic access token.
 *
 * Soft-revoke (sets `revoked_at`) so audit trails remain intact. The
 * verifier short-circuits on any non-null `revoked_at`, so subsequent
 * requests with this token return 401. Owner/admin-only via RLS + the
 * capability gate below; cookie-auth only.
 */

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return withAuth(async (session) => {
    const denial = assertCapability(session, "billing:write");
    if (denial) return denial;
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("api_keys")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", id)
      .eq("org_id", session.orgId)
      .is("revoked_at", null)
      .select("id")
      .maybeSingle();
    if (error) return apiError("internal", error.message);
    if (!data) return apiError("not_found", "Token not found or already revoked");
    return apiOk({ id: data.id, revoked: true });
  });
}
