/**
 * Console product tour — shared constants + trigger.
 *
 * The tour itself is driven by `<ConsoleTour>` (a client island in the platform
 * shell) over the DS `Tour` primitive. Completion is persisted per-browser in
 * localStorage (same lightweight pattern as What's New + the SetupChecklist),
 * versioned so a materially-changed tour can re-introduce itself. Any surface
 * (e.g. the Help menu "Take the tour") calls `startConsoleTour()` to replay it.
 */

/** Bump when the tour's steps change enough to warrant re-showing it. */
export const CONSOLE_TOUR_VERSION = "v1";
export const CONSOLE_TOUR_STORAGE_KEY = `atlvs.tour.console.${CONSOLE_TOUR_VERSION}`;
/** Window event the island listens for to (re)open the tour on demand. */
export const CONSOLE_TOUR_EVENT = "atlvs:startTour";

/** Fire from anywhere in the client to (re)start the console tour. */
export function startConsoleTour(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CONSOLE_TOUR_EVENT));
}

/** True once the operator has finished or skipped the current tour version. */
export function hasSeenConsoleTour(): boolean {
  try {
    return Boolean(window.localStorage.getItem(CONSOLE_TOUR_STORAGE_KEY));
  } catch {
    return false;
  }
}

/** Record that the tour was finished (`completed`) or skipped. */
export function markConsoleTourSeen(completed: boolean): void {
  try {
    window.localStorage.setItem(CONSOLE_TOUR_STORAGE_KEY, completed ? "done" : "skipped");
  } catch {
    /* private mode / storage disabled — the tour just re-shows next time */
  }
}
