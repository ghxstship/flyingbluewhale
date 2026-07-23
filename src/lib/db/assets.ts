/**
 * Unified physical-asset store (kit v7.8/20 Phase A · C-06).
 *
 * One noun, one store: `public.assets` is the single registry for every
 * tracked physical thing — gear, heavy fleet, and warehouse lots are the
 * `asset_class` facet, not separate tables. The old `equipment` table folded
 * in via migration `20260703120000_unified_inventory_assets` (rows migrated
 * as `asset_class='fleet'`, ids preserved). Lifecycle is the UAL machine
 * (`assets.state ual_state`); every transition appends an immutable
 * `asset_movements` row.
 */

import type { AssetClass, AssetDisposition, UalState } from "@/lib/supabase/types";

export const ASSET_CLASSES = ["gear", "fleet", "lot"] as const satisfies readonly AssetClass[];

export const ASSET_CLASS_LABELS: Record<AssetClass, string> = {
  gear: "Gear",
  fleet: "Fleet",
  lot: "Lot",
};

export const ASSET_DISPOSITIONS = [
  "ship_to_site",
  "return_to_vendor",
  "hold",
] as const satisfies readonly AssetDisposition[];

export const ASSET_DISPOSITION_LABELS: Record<AssetDisposition, string> = {
  ship_to_site: "Ship To Site",
  return_to_vendor: "Return To Vendor",
  hold: "Hold",
};

export const UAL_STATES = [
  "acquired",
  "available",
  "reserved",
  "in_transit",
  "in_use",
  "returned",
  "in_maintenance",
  "retired",
  "lost",
] as const satisfies readonly UalState[];

/**
 * UAL transition map — enforced server-side (a stale tab can't write an
 * illegal jump), mirroring the `NEXT_FULFILLMENT_STATES` pattern in
 * `assignments.ts`. `retired` is terminal; `lost` can be found again.
 */
export const NEXT_UAL_STATES: Record<UalState, readonly UalState[]> = {
  acquired: ["available", "in_transit", "retired"],
  available: ["reserved", "in_use", "in_transit", "in_maintenance", "retired", "lost"],
  reserved: ["in_use", "available", "in_transit", "lost"],
  in_transit: ["available", "in_use", "returned", "lost"],
  in_use: ["returned", "available", "in_maintenance", "lost"],
  returned: ["available", "in_maintenance", "retired"],
  in_maintenance: ["available", "retired", "lost"],
  retired: [],
  lost: ["available", "retired"],
};

/**
 * Which `asset_movements.movement_kind` a state transition records —
 * constrained by the ledger's CHECK (acquire · reserve · checkout ·
 * transfer · return · maintain · depreciate · retire · lost · found).
 */
export function movementKindFor(from: UalState, to: UalState): string {
  if (to === "in_use") return "checkout";
  if (to === "reserved") return "reserve";
  if (to === "returned") return "return";
  if (to === "in_maintenance") return "maintain";
  if (to === "retired") return "retire";
  if (to === "lost") return "lost";
  if (from === "lost") return "found";
  if (from === "in_use" && to === "available") return "return";
  return "transfer";
}

/**
 * Which custodian column a custody move stamps on its `asset_movements` row —
 * the F1 fix (MOBILE_BEST_PRACTICES_2026-07): a custody ledger that never
 * names the custodian cannot answer "who has the radio". Checkout takes
 * possession (`to_custodian_id`); a check-in from the field releases it
 * (`from_custodian_id`). Non-custody transitions (maintain, retire, found,
 * reserve …) stamp nothing — the mover is `recorded_by`, not a custodian.
 *
 * Pure so the binding is unit-testable; the RLS field-custody INSERT arm
 * (migration 20260723120000) enforces the same shape DB-side.
 */
export function custodianPatchFor(
  from: UalState,
  to: UalState,
  partyId: string | null,
): { to_custodian_id?: string; from_custodian_id?: string } {
  if (!partyId) return {};
  if (to === "in_use") return { to_custodian_id: partyId };
  if (to === "available" && (from === "in_use" || from === "in_transit")) {
    return { from_custodian_id: partyId };
  }
  return {};
}

/** The check-out / check-in record-action pair (kit §record-actions). */
export const CHECK_OUT: { from: readonly UalState[]; to: UalState } = {
  from: ["available", "reserved", "acquired"],
  to: "in_use",
};
export const CHECK_IN: { from: readonly UalState[]; to: UalState } = {
  from: ["in_use", "in_transit"],
  to: "available",
};
