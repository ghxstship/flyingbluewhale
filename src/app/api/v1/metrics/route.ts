import { apiOk, apiError } from "@/lib/api";
import { withAuth, assertScope } from "@/lib/auth";
import { METRICS } from "@/lib/reports/registry";
import { supportedMetricIds } from "@/lib/reports/resolvers";

/**
 * GET /api/v1/metrics — the canonical metric catalog (kit v6.3). Returns every
 * metric definition (the contract) + whether the platform computes it live
 * (`computed`). Values are fetched per-metric at /metrics/{metricId} or in bulk
 * via a report. Read-only; `reports:read` PAT scope.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  return withAuth(async (session) => {
    const denied = assertScope(session, "reports:read");
    if (denied) return denied;
    const computed = new Set(supportedMetricIds());
    const metrics = Object.entries(METRICS).map(([id, def]) => ({ id, ...def, computed: computed.has(id) }));
    return apiOk({ metrics });
  }).catch(() => apiError("internal", "Failed to list metrics"));
}
