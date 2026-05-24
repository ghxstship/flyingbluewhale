import { apiError, apiOk } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { toZapierDeliverable } from "@/lib/integrations/zapier/payloads";
import { createClient } from "@/lib/supabase/server";

/**
 * Polling trigger — fires on the `deliverable.submitted` lifecycle. We
 * order by `submitted_at` desc and fall back to `created_at` so a Zap
 * mapped to "new submission" sees the most-recently-submitted rows
 * regardless of when the placeholder was first created.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  return withAuth(async (session) => {
    if (!session.orgId) return apiError("forbidden", "User is not in an organization");
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("deliverables")
      .select(
        "id, project_id, type, title, deliverable_state, version, submitted_by, submitted_at, reviewed_at, deadline, created_at, updated_at",
      )
      .eq("org_id", session.orgId)
      .not("submitted_at", "is", null)
      .order("submitted_at", { ascending: false })
      .limit(50);
    if (error) return apiError("internal", error.message);
    return apiOk((data ?? []).map(toZapierDeliverable));
  });
}
