import { apiOk, apiError } from "@/lib/api";
import { withAuth, assertScope } from "@/lib/auth";
import { getReport } from "@/lib/reports/registry";
import { resolveMetrics } from "@/lib/reports/resolvers";

/**
 * GET /api/v1/reports/{reportId}/snapshot — an immutable point-in-time capture
 * of a report: its definition + the metric values resolved now, stamped with
 * `capturedAt`. A 3rd-party integration persists/renders this against the
 * published kit-reports.css. Read-only (no mutation). Scope: reports:read.
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
    return apiOk({ report, metrics, capturedAt: new Date().toISOString(), orgId: session.orgId });
  });
}
