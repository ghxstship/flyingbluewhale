import "server-only";

import { listOrgScoped } from "@/lib/db/resource";
import type { Database } from "@/lib/supabase/types";

type Tables = Database["public"]["Tables"];
export type KitZone = Tables["kit_zones"]["Row"];
export type KitLine = Tables["kit_lines"]["Row"];
export type KitTouchpoint = Tables["kit_touchpoints"]["Row"];
export type KitPhaseGate = Tables["kit_phase_gates"]["Row"];
export type KitPackage = Tables["kit_packages"]["Row"];

/**
 * A "kit" is the set of seeded design rows that share a `kit_id` uuid. There
 * is NOT necessarily a `kit_packages` row for every `kit_id` — the seeded
 * zones/lines/touchpoints/phase-gates are the source of truth for which kits
 * exist, so we derive the kit list by collecting distinct `kit_id`s across
 * those tables (org-scoped).
 */
export type KitGroup = {
  kitId: string;
  zoneCount: number;
  lineCount: number;
  touchpointCount: number;
  phaseGateCount: number;
  totalEstimateCents: number;
  /** The kit_packages row, if one happens to exist for this kit_id. */
  pkg: KitPackage | null;
};

/**
 * Bulk-load every seeded kit row for the org. We pull the full set (limit:0 =
 * no cap) because the seeded volume is small (hundreds of rows) and grouping
 * happens in-process.
 */
async function loadAll(orgId: string) {
  const [zones, lines, touchpoints, gates, packages] = await Promise.all([
    listOrgScoped("kit_zones", orgId, { limit: 0, orderBy: "sort_order", ascending: true }),
    listOrgScoped("kit_lines", orgId, { limit: 0, orderBy: "sort_order", ascending: true }),
    listOrgScoped("kit_touchpoints", orgId, { limit: 0, orderBy: "sort_order", ascending: true }),
    listOrgScoped("kit_phase_gates", orgId, { limit: 0, orderBy: "sort_order", ascending: true }),
    listOrgScoped("kit_packages", orgId, { limit: 0, orderBy: "name", ascending: true }),
  ]);
  return { zones, lines, touchpoints, gates, packages };
}

export async function listKitGroups(orgId: string): Promise<KitGroup[]> {
  if (!orgId) return [];
  const { zones, lines, touchpoints, gates, packages } = await loadAll(orgId);

  const pkgByKitId = new Map<string, KitPackage>();
  // kit_packages has no kit_id; it is keyed by its own id. A package is
  // matched to a kit group only when its own id is itself used as a kit_id by
  // the seeded rows. Build the lookup by package id so we can attach it.
  for (const p of packages) pkgByKitId.set(p.id, p);

  const groups = new Map<string, KitGroup>();
  const ensure = (kitId: string): KitGroup => {
    let g = groups.get(kitId);
    if (!g) {
      g = {
        kitId,
        zoneCount: 0,
        lineCount: 0,
        touchpointCount: 0,
        phaseGateCount: 0,
        totalEstimateCents: 0,
        pkg: pkgByKitId.get(kitId) ?? null,
      };
      groups.set(kitId, g);
    }
    return g;
  };

  for (const z of zones) ensure(z.kit_id).zoneCount += 1;
  for (const tp of touchpoints) ensure(tp.kit_id).touchpointCount += 1;
  for (const gate of gates) ensure(gate.kit_id).phaseGateCount += 1;
  for (const l of lines) {
    const g = ensure(l.kit_id);
    g.lineCount += 1;
    g.totalEstimateCents += l.estimate_cents ?? 0;
  }

  // Surface any kit_packages whose id is not referenced by seeded rows as
  // their own (otherwise-empty) group so they remain discoverable.
  for (const p of packages) if (!groups.has(p.id)) ensure(p.id);

  return Array.from(groups.values()).sort((a, b) => b.lineCount - a.lineCount);
}

export type KitDetail = {
  kitId: string;
  pkg: KitPackage | null;
  zones: KitZone[];
  lines: KitLine[];
  touchpoints: KitTouchpoint[];
  phaseGates: KitPhaseGate[];
  totalEstimateCents: number;
};

export async function getKit(orgId: string, kitId: string): Promise<KitDetail | null> {
  if (!orgId || !kitId) return null;
  const [zones, lines, touchpoints, gates, packages] = await Promise.all([
    listOrgScoped("kit_zones", orgId, {
      limit: 0,
      orderBy: "sort_order",
      ascending: true,
      filters: [{ column: "kit_id", op: "eq", value: kitId }],
    }),
    listOrgScoped("kit_lines", orgId, {
      limit: 0,
      orderBy: "sort_order",
      ascending: true,
      filters: [{ column: "kit_id", op: "eq", value: kitId }],
    }),
    listOrgScoped("kit_touchpoints", orgId, {
      limit: 0,
      orderBy: "sort_order",
      ascending: true,
      filters: [{ column: "kit_id", op: "eq", value: kitId }],
    }),
    listOrgScoped("kit_phase_gates", orgId, {
      limit: 0,
      orderBy: "sort_order",
      ascending: true,
      filters: [{ column: "kit_id", op: "eq", value: kitId }],
    }),
    listOrgScoped("kit_packages", orgId, {
      limit: 1,
      filters: [{ column: "id", op: "eq", value: kitId }],
    }),
  ]);

  // A kit "exists" if anything (seeded rows or a package row) carries the id.
  if (
    zones.length === 0 &&
    lines.length === 0 &&
    touchpoints.length === 0 &&
    gates.length === 0 &&
    packages.length === 0
  ) {
    return null;
  }

  const totalEstimateCents = lines.reduce((sum, l) => sum + (l.estimate_cents ?? 0), 0);
  return {
    kitId,
    pkg: packages[0] ?? null,
    zones,
    lines,
    touchpoints,
    phaseGates: gates,
    totalEstimateCents,
  };
}

/** cents → USD currency string. */
export function formatCents(cents: number | null | undefined): string {
  if (cents == null) return "—";
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}
