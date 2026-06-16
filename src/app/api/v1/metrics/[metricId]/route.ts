import { apiOk, apiError } from "@/lib/api";
import { withAuth, assertScope } from "@/lib/auth";
import { getMetric } from "@/lib/reports/registry";
import { resolveMetrics } from "@/lib/reports/resolvers";

/**
 * GET /api/v1/metrics/{metricId} — one metric definition + its value computed
 * live from the caller's org data (null if the source data is absent). Scope:
 * reports:read.
 */
export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ metricId: string }> }) {
  const { metricId } = await ctx.params;
  const def = getMetric(metricId);
  if (!def) return apiError("not_found", `Unknown metric "${metricId}"`);
  return withAuth(async (session) => {
    const denied = assertScope(session, "reports:read");
    if (denied) return denied;
    const values = await resolveMetrics(session.orgId, [metricId]);
    return apiOk({ id: metricId, ...def, ...values[metricId] });
  });
}
