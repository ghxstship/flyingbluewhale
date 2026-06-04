import { type NextRequest } from "next/server";
import { apiError, apiOk } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/** GET /api/v1/time-entries/[id]/audit — returns the audit trail for a single time entry. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withAuth(async (session) => {
    const supabase = await createClient();

    // Cross-tenant guard: verify the entry belongs to this org.
    const { data: entry } = await supabase
      .from("time_entries")
      .select("id")
      .eq("id", id)
      .eq("org_id", session.orgId)
      .maybeSingle();
    if (!entry) return apiError("not_found", "Time entry not found");

    const { data, error } = await supabase.rpc("time_entry_audit", {
      p_entry_id: id,
      p_org_id: session.orgId,
    });
    if (error) return apiError("internal", error.message);

    return apiOk({ audit: data ?? [] });
  });
}
