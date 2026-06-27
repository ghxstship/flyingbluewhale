/**
 * Reservations & tables — shared helpers for the COMPVSS Site & Venue Ops
 * floor-plan seating module. Schema-anchored to migration
 * `PENDING_reservations_tables.sql` (venue_tables + reservations).
 *
 * Pattern matches `src/lib/marketplace.ts` / `src/lib/workforce.ts`:
 * enum tuples `as const` → derived union types → label maps + small helpers
 * that the list / floor-plan / form pages all share.
 */

// ============================================================
// Venue tables — floor-plan lifecycle
// ============================================================
export const VENUE_TABLE_STATES = ["available", "reserved", "occupied", "out_of_service"] as const;
export type VenueTableState = (typeof VENUE_TABLE_STATES)[number];

export const VENUE_TABLE_STATE_LABELS: Record<VenueTableState, string> = {
  available: "Available",
  reserved: "Reserved",
  occupied: "Occupied",
  out_of_service: "Out of service",
};

// ============================================================
// Reservations — booking lifecycle
// ============================================================
export const RESERVATION_STATES = ["booked", "seated", "completed", "no_show", "cancelled"] as const;
export type ReservationState = (typeof RESERVATION_STATES)[number];

export const RESERVATION_STATE_LABELS: Record<ReservationState, string> = {
  booked: "Booked",
  seated: "Seated",
  completed: "Completed",
  no_show: "No show",
  cancelled: "Cancelled",
};

/**
 * Allowed forward transitions for the reservation lifecycle. Enforced
 * server-side in the transition action so a stale tab can't write an illegal
 * jump (e.g. completed → booked). Terminal states (completed, cancelled) have
 * no successors.
 */
export const NEXT_RESERVATION_STATES: Record<ReservationState, readonly ReservationState[]> = {
  booked: ["seated", "no_show", "cancelled"],
  seated: ["completed", "cancelled"],
  completed: [],
  no_show: [],
  cancelled: [],
};

/** Whether a reservation can move from one state to another. */
export function canTransitionReservation(from: ReservationState, to: ReservationState): boolean {
  return NEXT_RESERVATION_STATES[from]?.includes(to) ?? false;
}

/** Active = still occupies a table on the floor plan (booked or seated). */
export function isActiveReservation(state: ReservationState): boolean {
  return state === "booked" || state === "seated";
}

/**
 * Map a reservation state onto the table state its presence implies. Used by
 * the floor-plan view to tint a table from its active reservation when the
 * table itself is still marked `available`.
 */
export function tableStateForReservation(state: ReservationState): VenueTableState | null {
  if (state === "seated") return "occupied";
  if (state === "booked") return "reserved";
  return null;
}
