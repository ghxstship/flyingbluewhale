/**
 * Day Sheets (Tour Management, kit 26) — the one genuinely new road artifact.
 *
 * A day sheet is one composed page per date: crew call · doors · headline set ·
 * curfew, plus schedule/travel/venue/personnel pulled by `tour_id` + `project_id`
 * at read time. Only its own header fields are stored — it references the
 * canonical stores, it never copies them (SSOT). It renders to PDF (reusing the
 * Guides renderer) and pushes to the COMPVSS Field crew PWA on publish.
 *
 * Lifecycle (LDP `sheet_state`, cyclical operational — never `status`):
 *   not_started → draft → published ↔ updated
 * `updated` is the re-publish state (a published sheet edited then re-pushed).
 */

import type { Database } from "@/lib/supabase/database.types";

export type DaySheetState = Database["public"]["Enums"]["day_sheet_state"];

export const DAY_SHEET_STATES = ["not_started", "draft", "published", "updated"] as const satisfies readonly DaySheetState[];

export const DAY_SHEET_STATE_LABELS: Record<DaySheetState, string> = {
  not_started: "Not Started",
  draft: "Draft",
  published: "Published",
  updated: "Updated",
};

/** Badge tone per state (maps to the ui/Badge variant vocabulary). */
export const DAY_SHEET_STATE_TONE: Record<DaySheetState, "muted" | "warning" | "success" | "info"> = {
  not_started: "muted",
  draft: "warning",
  published: "success",
  updated: "info",
};

/**
 * Allowed forward transitions, enforced server-side so a stale tab can't write an
 * illegal jump. A published sheet re-published lands on `updated`; an `updated`
 * sheet re-published stays `published`.
 */
export const NEXT_DAY_SHEET_STATES: Record<DaySheetState, readonly DaySheetState[]> = {
  not_started: ["draft"],
  draft: ["published"],
  published: ["updated"],
  updated: ["published"],
};

export function canTransitionDaySheet(from: DaySheetState, to: DaySheetState): boolean {
  return NEXT_DAY_SHEET_STATES[from]?.includes(to) ?? false;
}

export function daySheetStateLabel(state: string): string {
  return DAY_SHEET_STATE_LABELS[state as DaySheetState] ?? state;
}
