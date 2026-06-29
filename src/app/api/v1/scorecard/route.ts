import { apiOk, apiError } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/** GET /api/v1/scorecard — vendor performance composite rollup for the org. */
export async function GET() {
  return withAuth(async (session) => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("vendor_scores")
      .select("vendor_id, on_time_pct, quality_avg, disputes, jobs_completed, composite")
      .eq("org_id", session.orgId)
      .order("composite", { ascending: false, nullsFirst: false })
      .limit(200);
    if (error) return apiError("internal", error.message);
    return apiOk({ scores: data ?? [] });
  });
}
