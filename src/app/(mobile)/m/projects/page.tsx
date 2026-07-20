import { requireSession, isManagerPlus } from "@/lib/auth";
import { HubChrome } from "@/components/mobile/HubChrome";
import { hubLandingMetrics } from "@/lib/mobile/hub-metrics";

export const dynamic = "force-dynamic";

/**
 * COMPVSS · Projects hub — kit 34 v3.2/v3.6. The field expression of the ATLVS
 * Coordinate Matrix + unified schedule. Members: Timeline · Milestones ·
 * Calendar · Tasks (all XPMS-compliant, all-crew). SSOT: `mobileHubs` in nav.ts.
 */
export default async function ProjectsHubPage() {
  const session = await requireSession();
  const metrics = await hubLandingMetrics("projects", session);
  return (
    <div className="screen screen-anim">
      <HubChrome hubKey="projects" canManage={isManagerPlus(session)} metrics={metrics} />
    </div>
  );
}
