/**
 * Function Diary — room/space booking calendar (ATLVS Sales & CRM).
 *
 * A function diary crosses bookable venue spaces with date/time windows,
 * each window carrying a hold→confirmed→cancelled lifecycle. Mirrors the
 * SevenRooms / TripleSeat function-diary model.
 *
 * Lib shape matches `src/lib/marketplace.ts` / `src/lib/workforce.ts`:
 * enum tuples `as const` → derived union types → small pure helpers +
 * label maps. No DB access here — read helpers live with the route via
 * `listOrgScoped`; this file is the SSOT for the enums + display labels.
 */

// ============================================================
// Space catalog lifecycle (cyclical operational → `space_state`)
// ============================================================
export const SPACE_STATES = ["active", "inactive", "archived"] as const;
export type SpaceState = (typeof SPACE_STATES)[number];

export const SPACE_STATE_LABELS: Record<SpaceState, string> = {
  active: "Active",
  inactive: "Inactive",
  archived: "Archived",
};

// ============================================================
// Booking lifecycle (cyclical operational → `booking_state`)
// ============================================================
export const BOOKING_STATES = ["hold", "tentative", "confirmed", "cancelled"] as const;
export type BookingState = (typeof BOOKING_STATES)[number];

export const BOOKING_STATE_LABELS: Record<BookingState, string> = {
  hold: "Hold",
  tentative: "Tentative",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
};

/**
 * Allowed forward transitions for a booking. A hold can firm up to
 * tentative or confirmed; a confirmed booking can still be cancelled; a
 * cancelled booking is terminal. Mirrors the `NEXT_FULFILLMENT_STATES`
 * pattern in `src/lib/db/assignments.ts` so a stale tab can't write an
 * illegal jump.
 */
export const NEXT_BOOKING_STATES: Record<BookingState, readonly BookingState[]> = {
  hold: ["tentative", "confirmed", "cancelled"],
  tentative: ["hold", "confirmed", "cancelled"],
  confirmed: ["tentative", "cancelled"],
  cancelled: [],
};

/** True when `to` is a legal next state from `from` (idempotent self-OK). */
export function canTransitionBooking(from: BookingState, to: BookingState): boolean {
  if (from === to) return true;
  return NEXT_BOOKING_STATES[from].includes(to);
}

/** Whether a booking state occupies the space (holds/tentative/confirmed do; cancelled doesn't). */
export function isBlockingBooking(state: BookingState): boolean {
  return state !== "cancelled";
}

// ============================================================
// Overlap detection (diary conflict checks)
// ============================================================
export type TimeWindow = { starts_at: string; ends_at: string };

/** True when two [starts_at, ends_at) windows overlap (half-open intervals). */
export function windowsOverlap(a: TimeWindow, b: TimeWindow): boolean {
  return new Date(a.starts_at) < new Date(b.ends_at) && new Date(b.starts_at) < new Date(a.ends_at);
}

/**
 * Given a candidate window and the existing (blocking) bookings for the
 * same space, return the conflicting ones. Cancelled bookings should be
 * filtered out by the caller (or pass only blocking rows).
 */
export function findConflicts<T extends TimeWindow>(candidate: TimeWindow, existing: readonly T[]): T[] {
  return existing.filter((b) => windowsOverlap(candidate, b));
}

// ============================================================
// Diary grid helpers
// ============================================================
/** Local YYYY-MM-DD day key for an ISO timestamp — the diary column key. */
export function dayKey(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Inclusive list of YYYY-MM-DD day keys spanning [start, days). */
export function dayRange(start: Date, days: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < Math.max(1, days); i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    out.push(dayKey(d.toISOString()));
  }
  return out;
}

/** HH:MM 24h time label for an ISO timestamp (diary cell display). */
export function timeLabel(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
