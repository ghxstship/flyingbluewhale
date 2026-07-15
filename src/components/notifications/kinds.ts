import type { PushKind, UnsilenceableKind } from "@/lib/push/send";

/**
 * Client-safe mirror of the `PushKind` union (src/lib/push/send.ts) — the
 * canonical event-kind taxonomy from migration 0051's
 * `notification_kind_catalog` view. `notification_preferences.matrix` is
 * keyed by these kinds; `sendPushTo`/`sendPushBulk` read
 * `matrix[kind].push === false` as the ONLY opt-out signal, so any prefs
 * surface that offers different keys is a placebo (AUDIT C-22 / F-02).
 *
 * The `satisfies` check below keeps this tuple in lockstep with the union:
 * add a kind to one without the other and the build fails.
 *
 * NOT every PushKind belongs here. This tuple is the kinds a user MAY
 * TOGGLE, and `UnsilenceableKind` (currently `crisis`) is deliberately
 * absent: those ignore the matrix entirely, so listing them would render a
 * switch that does nothing — a placebo, which is exactly what the note
 * above warns against. The assertion below encodes that rule rather than
 * quietly widening to accommodate it.
 */
export const NOTIF_KINDS = [
  "announcement",
  "chat",
  "kudos",
  "badge",
  "assignment",
  "assignment_state",
  "assignment_scan",
  "shift_swap",
  "time_off",
  "course",
  "incident",
  "timesheet",
  "payroll",
  "time_correction",
] as const satisfies readonly PushKind[];

export type NotifKind = (typeof NOTIF_KINDS)[number];

// Exhaustiveness in the other direction: every PushKind is either
// toggleable (in the tuple) or deliberately unsilenceable. A new kind that
// is neither fails the build — which is how `crisis` was caught.
type AssertAllKinds = Exclude<PushKind, NotifKind | UnsilenceableKind> extends never ? true : never;
const _allKindsCovered: AssertAllKinds = true;
void _allKindsCovered;

/** One row of the `notification_kind_catalog` view. */
export type NotifKindRow = {
  kind: NotifKind;
  label: string;
  description: string | null;
};

/** English fallbacks mirroring the catalog view, used when the view read
 *  fails (network blip) so the matrix never renders empty. */
export const NOTIF_KIND_FALLBACKS: NotifKindRow[] = [
  { kind: "announcement", label: "Updates", description: "Org-wide announcements" },
  { kind: "chat", label: "Chat", description: "Direct messages and channels" },
  { kind: "kudos", label: "Kudos", description: "Recognition posts" },
  { kind: "badge", label: "Badges", description: "Awards from your org" },
  {
    kind: "assignment",
    label: "Assignments",
    description: "New tickets, credentials, and advancing items assigned to you",
  },
  { kind: "assignment_state", label: "Assignment state", description: "State changes on assignments you own" },
  { kind: "assignment_scan", label: "Scans", description: "Your ticket or credential was scanned" },
  { kind: "shift_swap", label: "Shift Swap", description: "Swap request decisions" },
  { kind: "time_off", label: "Time Off", description: "Time-off request decisions" },
  { kind: "course", label: "Courses", description: "Course assignments + pass results" },
  { kind: "incident", label: "Incidents", description: "Field incident updates (manager+ only)" },
  { kind: "timesheet", label: "Timesheets", description: "Your timesheet was submitted, approved, rejected, or posted" },
  { kind: "payroll", label: "Payroll", description: "A payroll run covering your time was posted" },
  { kind: "time_correction", label: "Time Corrections", description: "Decisions on time corrections you requested" },
];
