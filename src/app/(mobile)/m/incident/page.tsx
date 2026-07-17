import { IncidentSurface } from "../incidents/IncidentSurface";

export const dynamic = "force-dynamic";

/**
 * /m/incident — ALIAS of /m/incidents (kit 29 §C route policy, directive
 * 2026-07-17: no live surface is deleted; alias pairs render ONE shared
 * surface). Renders the same shared Incident Report surface, preset to the
 * "My Reports" filter so the former My Incidents view survives as a scope
 * of the shared queue rather than a divergent duplicate. Express quick-file
 * stays live at `/m/incident/new`.
 */
export default async function MyIncidentPage() {
  return <IncidentSurface initialMine />;
}
