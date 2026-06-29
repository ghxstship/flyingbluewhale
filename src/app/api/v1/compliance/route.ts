import { type NextRequest } from "next/server";
import { apiOk, apiError } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/v1/compliance — subcontractor eligibility verdicts (derived) for the
 * org, optionally filtered by `?trade=`. The verdict is computed by the
 * `v_sub_eligibility` view (blocked / expiring / eligible) — never stored.
 * Subcontractor-operations layer (v7.5).
 */
export async function GET(req: NextRequest) {
  const trade = new URL(req.url).searchParams.get("trade");
  return withAuth(async (session) => {
    const supabase = await createClient();
    let q = supabase.from("v_sub_eligibility").select("vendor_id, trade, verdict").eq("org_id", session.orgId);
    if (trade) q = q.eq("trade", trade);
    const { data, error } = await q;
    if (error) return apiError("internal", error.message);
    return apiOk({ eligibility: data ?? [] });
  });
}
