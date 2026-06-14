/**
 * Box office / door scan / guest list — GVTEWAY host & commerce console.
 *
 * Shared between the console box-office dashboard, the guest-list detail
 * surface, and the door-scan affordance. Schema-anchored to migration
 * PENDING_box_office_guest_list.sql.
 *
 * Pattern mirrors `src/lib/marketplace.ts` + `src/lib/connecteam.ts`:
 * enum tuples `as const` -> derived types -> small helpers + label / tone
 * maps. Mirrors DICE/TIXR box office + door.
 */

import type { BadgeVariant } from "@/components/ui/Badge";

// ============================================================
// Door lifecycle — guest_list_entries.entry_state
// ============================================================
// Cyclical operational lifecycle (LDP `*_state`): a guest arrives at the
// door pending, gets checked in (arrived) or turned away (denied), and can
// be reset to pending for a re-scan. Backed by the `guest_entry_state`
// postgres enum.
export const GUEST_ENTRY_STATES = ["pending", "arrived", "denied"] as const;
export type GuestEntryState = (typeof GUEST_ENTRY_STATES)[number];

export const GUEST_ENTRY_STATE_LABELS: Record<GuestEntryState, string> = {
  pending: "Pending",
  arrived: "Arrived",
  denied: "Denied",
};

/** Badge tone per door state — paints via the kit's semantic tokens only. */
export const GUEST_ENTRY_STATE_TONE: Record<GuestEntryState, BadgeVariant> = {
  pending: "muted",
  arrived: "success",
  denied: "error",
};

// ============================================================
// Door-scan result — the outcome of resolving a scan code
// ============================================================
// Mirrors `assignment_scan_result` (accepted / duplicate / not_found / …)
// from the advancing scan domain, narrowed to the guest-list surface.
export const GUEST_SCAN_RESULTS = ["accepted", "duplicate", "denied", "not_found"] as const;
export type GuestScanResult = (typeof GUEST_SCAN_RESULTS)[number];

export const GUEST_SCAN_RESULT_LABELS: Record<GuestScanResult, string> = {
  accepted: "Checked in",
  duplicate: "Already arrived",
  denied: "Entry denied",
  not_found: "Code not found",
};

export const GUEST_SCAN_RESULT_TONE: Record<GuestScanResult, BadgeVariant> = {
  accepted: "success",
  duplicate: "warning",
  denied: "error",
  not_found: "muted",
};

// ============================================================
// Helpers
// ============================================================

/** Total heads an entry represents at the door (the guest + their plus-ones). */
export function headCount(entry: { plus_ones: number | null }): number {
  return 1 + Math.max(0, entry.plus_ones ?? 0);
}

/** Roll up arrived vs expected head counts across a set of entries. */
export function rollupAttendance(
  entries: Array<{ plus_ones: number | null; entry_state: GuestEntryState }>,
): { arrivedHeads: number; expectedHeads: number; arrivedEntries: number; totalEntries: number } {
  let arrivedHeads = 0;
  let expectedHeads = 0;
  let arrivedEntries = 0;
  for (const e of entries) {
    const heads = headCount(e);
    expectedHeads += heads;
    if (e.entry_state === "arrived") {
      arrivedHeads += heads;
      arrivedEntries += 1;
    }
  }
  return { arrivedHeads, expectedHeads, arrivedEntries, totalEntries: entries.length };
}

/**
 * Resolve a scanned code against the current state of a guest-list entry and
 * decide the door outcome. Pure — the caller performs the actual write when
 * the result is `accepted`. Mirrors `scanAssignment`'s resolve-then-classify
 * shape for the advancing domain.
 */
export function classifyScan(entry: { entry_state: GuestEntryState } | null): GuestScanResult {
  if (!entry) return "not_found";
  if (entry.entry_state === "arrived") return "duplicate";
  if (entry.entry_state === "denied") return "denied";
  return "accepted";
}

/** Generate an opaque, URL-safe door token for a new entry (reprint-safe). */
export function generateScanCode(): string {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  const tail = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `GL-${rand}-${tail}`;
}
