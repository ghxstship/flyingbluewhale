import { apiOk, apiError } from "@/lib/api";
import { withAuth, assertScope } from "@/lib/auth";
import { getReport } from "@/lib/reports/registry";
import { resolveMetrics } from "@/lib/reports/resolvers";

/**
 * GET /api/v1/reports/{reportId} — a report definition + its metric values
 * computed live from the caller's org data. Scope: reports:read.
 */
export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await ctx.params;
  const report = getReport(reportId);
  if (!report) return apiError("not_found", `Unknown report "${reportId}"`);
  return withAuth(async (session) => {
    const denied = assertScope(session, "reports:read");
    if (denied) return denied;
    const metrics = await resolveMetrics(session.orgId, report.metrics);
    return apiOk({ report, metrics });
  });
}
