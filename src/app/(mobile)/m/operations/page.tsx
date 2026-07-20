import { requireSession, isManagerPlus } from "@/lib/auth";
import { HubChrome } from "@/components/mobile/HubChrome";
import { hubLandingMetrics } from "@/lib/mobile/hub-metrics";

export const dynamic = "force-dynamic";

/**
 * COMPVSS · Operations hub — kit 34 v3.1/v3.2. One screen: back · title ·
 * (MetricBar) · a launcher of its members (Daily Report · Reports ·
 * Inspections · Permits · Travel). Members route individually and carry the
 * hub viewseg (kit 34 v3.4 normalization). SSOT: `mobileHubs` in nav.ts.
 */
export default async function OperationsHubPage() {
  const session = await requireSession();
  const metrics = await hubLandingMetrics("operations", session);
  return (
    <div className="screen screen-anim">
      <HubChrome hubKey="operations" canManage={isManagerPlus(session)} metrics={metrics} />
    </div>
  );
}
