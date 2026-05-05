import { apiError, apiOk } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { toZapierProject } from "@/lib/integrations/zapier/payloads";
import { createClient } from "@/lib/supabase/server";

/**
 * Polling trigger — Zapier hits this every 5–15 min and dedupes by `id`.
 * Returns the 50 most recently created projects in the caller's org,
 * desc by created_at. Org scope comes from the PAT-bound session.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  return withAuth(async (session) => {
    if (!session.orgId) return apiError("forbidden", "User is not in an organization");
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("projects")
      .select("id, name, slug, status, description, start_date, end_date, created_at, updated_at")
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) return apiError("internal", error.message);
    return apiOk((data ?? []).map(toZapierProject));
  });
}
