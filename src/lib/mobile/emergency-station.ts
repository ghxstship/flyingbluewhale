import "server-only";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { listMyAssignments } from "@/lib/db/assignments";
import type { GuideConfig } from "@/lib/guides/types";

/**
 * The viewer's emergency station — shared by the `/m` home Emergency Card and
 * the full `/m/emergency` surface (kit 28 renders the same station in both, and
 * two copies of this resolution would drift).
 *
 * Real deployment only: the holder's active `assignments` row supplies the
 * manning id and position; the project's crew `event_guides` evacuation section
 * supplies the assembly point and muster route. Nothing is fabricated — an
 * unassigned crew member gets "—", because a made-up assembly point is worse
 * than an obviously empty one.
 */
export const EMERGENCY_NA = "—";

export type EmergencyStation = {
  manningId: string;
  position: string;
  team: string;
  assembly: string;
  reportTo: string;
  /** True when a real assignment backs this card. */
  assigned: boolean;
};

export async function resolveEmergencyStation(
  orgId: string,
  userId: string,
  labels: { unassigned: string; musterTo: (to: string) => string },
): Promise<EmergencyStation> {
  const station: EmergencyStation = {
    manningId: EMERGENCY_NA,
    position: labels.unassigned,
    team: EMERGENCY_NA,
    assembly: EMERGENCY_NA,
    reportTo: EMERGENCY_NA,
    assigned: false,
  };
  if (!hasSupabase) return station;

  const supabase = await createClient();
  const assignments = await listMyAssignments(orgId, userId);
  const dead = new Set(["voided", "expired", "returned", "rejected"]);
  const active = assignments.find((a) => !dead.has(a.fulfillment_state)) ?? assignments[0];
  if (!active) return station;

  station.assigned = true;
  station.manningId = active.id.slice(0, 5).toUpperCase();
  station.position = active.title ?? station.position;

  const [{ data: proj }, { data: guides }] = await Promise.all([
    supabase.from("projects").select("name").eq("id", active.project_id).is("deleted_at", null).maybeSingle(),
    supabase.from("event_guides").select("config").eq("project_id", active.project_id).is("deleted_at", null).limit(4),
  ]);
  station.team = (proj as { name: string } | null)?.name ?? EMERGENCY_NA;

  for (const g of (guides ?? []) as Array<{ config: unknown }>) {
    const cfg = g.config as GuideConfig | null;
    const evac = cfg?.sections?.find((s) => s.type === "evacuation");
    if (evac && evac.type === "evacuation") {
      if (evac.assemblyPoint) station.assembly = evac.assemblyPoint;
      const primary = evac.routes?.[0];
      if (primary && station.reportTo === EMERGENCY_NA) station.reportTo = labels.musterTo(primary.to);
      break;
    }
  }
  return station;
}
