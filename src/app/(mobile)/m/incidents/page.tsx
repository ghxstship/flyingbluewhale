import { IncidentSurface } from "./IncidentSurface";

export const dynamic = "force-dynamic";

/**
 * /m/incidents — the CANONICAL route of the shared COMPVSS Incident Report
 * surface (kit 29 §C: `/m/incident` is an alias preset to the "My Reports"
 * filter). See `IncidentSurface` for the surface itself.
 */
export default async function IncidentsPage() {
  return <IncidentSurface />;
}
