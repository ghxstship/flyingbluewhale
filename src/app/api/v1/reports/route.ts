import { apiOk, apiError } from "@/lib/api";
import { withAuth, assertScope } from "@/lib/auth";
import { REPORTS_LIST } from "@/lib/reports/registry";

/**
 * GET /api/v1/reports — the 43-report library (definitions). Each report's
 * live data is at /reports/{reportId}; an immutable point-in-time copy at
 * /reports/{reportId}/snapshot. Scope: reports:read.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  return withAuth(async (session) => {
    const denied = assertScope(session, "reports:read");
    if (denied) return denied;
    return apiOk({ reports: REPORTS_LIST });
  }).catch(() => apiError("internal", "Failed to list reports"));
}
