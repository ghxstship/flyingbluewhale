/**
 * SITEPLAN validators — protocol §8.3 (acceptance) + §9 (placement laws).
 *
 * Acceptance criteria gate the `issue` transition (the DB RPC also enforces
 * these — this module is the duplicate front-line check that runs before
 * we even attempt the round-trip, so authors get instant feedback).
 *
 * Placement laws are higher-level relational rules that catch authoring
 * mistakes before they reach a fire marshal.
 */

import type {
  AcceptanceSnapshot,
  SitePlanAdjacency,
  SitePlanBand,
  SitePlanBandType,
  SitePlanPlacement,
  SitePlanSheet,
  SitePlanStation,
  SitePlanUtility,
} from "./types";

/** §8.3 acceptance check items. Order = display order. */
export const ACCEPTANCE_ITEMS = [
  { key: "has_atom_id", label: "Atom ID is well-formed and unique" },
  { key: "has_sheet_type", label: "Sheet type is set" },
  { key: "has_primary_class", label: "Primary XPMS class is set" },
  { key: "has_tier_primary", label: "Primary tier is set" },
  { key: "has_shell", label: "Shell type + dimensions present" },
  { key: "has_region", label: "At least one zone region defined" },
  { key: "has_band", label: "At least one band on a known edge" },
  { key: "has_placement", label: "Placements present" },
  { key: "has_utility", label: "Utility drops present" },
  { key: "has_all_four_edges", label: "All four adjacency edges declared" },
  { key: "has_approval_signoff", label: "Reviewer signoff captured" },
] as const;

export type AcceptanceItem = (typeof ACCEPTANCE_ITEMS)[number]["key"];

export type AcceptanceFailure = {
  item: AcceptanceItem;
  label: string;
};

/** Return the list of failing acceptance items for a sheet. Empty = ready to issue. */
export function failingAcceptance(snap: AcceptanceSnapshot): AcceptanceFailure[] {
  return ACCEPTANCE_ITEMS.filter((it) => !snap[it.key]).map((it) => ({ item: it.key, label: it.label }));
}

/**
 * §9 placement-law validator. Returns an array of violation messages.
 * Pure function — caller decides whether violations block submission or
 * just warn.
 */
export function validatePlacementLaws(args: {
  sheet: Pick<SitePlanSheet, "id">;
  bands: SitePlanBand[];
  stations: SitePlanStation[];
  placements: SitePlanPlacement[];
  utilities: SitePlanUtility[];
}): string[] {
  const { bands, placements, utilities } = args;
  const violations: string[] = [];

  const bandById = new Map(bands.map((b) => [b.id, b]));
  const placementByTag = new Map(placements.map((p) => [p.tag, p]));

  // Law 1: powered equipment must sit on an `appliance` band, never on `service` or floating.
  for (const p of placements) {
    if (!p.band_id) continue;
    const band = bandById.get(p.band_id);
    if (!band) continue;
    const drivesPower = utilities.some((u) => (u.loads ?? []).includes(p.tag) && u.service_type.startsWith("power_"));
    if (drivesPower && band.band_type !== "appliance") {
      violations.push(
        `Placement ${p.tag} draws power but sits on a ${band.band_type} band — powered equipment must sit on an appliance band (§9.1).`,
      );
    }
  }

  // Law 2 (looser): worker-facing surfaces should be on `service` bands.
  //   We surface this only as a hint when a placement tagged like a worker
  //   role (PREP-, PLATE-, EXPO-, DISH-) sits on a non-service band.
  const SERVICE_PREFIXES = ["PREP-", "PLATE-", "EXPO-", "DISH-", "STN-"];
  for (const p of placements) {
    if (!p.band_id) continue;
    const band = bandById.get(p.band_id);
    if (!band) continue;
    const looksServicey = SERVICE_PREFIXES.some((pfx) => p.tag.toUpperCase().startsWith(pfx));
    if (looksServicey && band.band_type !== "service") {
      violations.push(
        `Placement ${p.tag} looks like a worker-facing station but sits on a ${band.band_type} band — consider a service band (§9.2).`,
      );
    }
  }

  // Law 5: refrigeration ≥ 8 ft from heat sources.
  //   We can't compute geometry without footprint coords, so we encode the
  //   weaker check: refrigerated bands (cold_rail) and hot bands (hot_rail)
  //   must not share the same edge.
  const coldEdges = new Set(bands.filter((b) => b.band_type === "cold_rail").map((b) => b.edge));
  const hotEdges = new Set(bands.filter((b) => b.band_type === "hot_rail").map((b) => b.edge));
  for (const e of coldEdges) {
    if (hotEdges.has(e)) {
      violations.push(
        `Cold rail and hot rail share edge ${e} — refrigeration must be ≥ 8 ft from heat sources (§9.5).`,
      );
    }
  }

  // Law 8: a placement with tag PASS-* should be on an L-return service band.
  const passPlacements = placements.filter((p) => p.tag.toUpperCase().startsWith("PASS"));
  for (const p of passPlacements) {
    if (!p.band_id) continue;
    const band = bandById.get(p.band_id);
    if (!band) continue;
    if (band.band_type !== "service" || !band.edge.startsWith("L_")) {
      violations.push(`PASS placement ${p.tag} should sit on an L-return service band (§9.8).`);
    }
  }

  // Power-drop integrity: every load on a power utility must reference a real placement tag.
  for (const u of utilities) {
    for (const tag of u.loads ?? []) {
      if (!placementByTag.has(tag)) {
        violations.push(`Utility drop ${u.drop_code} references unknown placement tag "${tag}".`);
      }
    }
  }

  return violations;
}

/**
 * Adjacency declaration coverage. Returns the cardinal edges that are
 * missing — useful for the sheet detail page to surface a checklist.
 */
export function missingAdjacencyEdges(adjacencies: SitePlanAdjacency[]): Array<"N" | "S" | "E" | "W"> {
  const declared = new Set(adjacencies.map((a) => a.edge));
  return (["N", "S", "E", "W"] as const).filter((e) => !declared.has(e));
}

/**
 * Band-type validity guard — used by form schemas. Closed enum check.
 */
export function isBandType(s: string): s is SitePlanBandType {
  return [
    "appliance",
    "service",
    "bar",
    "display",
    "cold_rail",
    "hot_rail",
    "queue",
    "bench",
    "tech",
    "barricade",
  ].includes(s as SitePlanBandType);
}
