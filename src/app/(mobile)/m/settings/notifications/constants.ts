import type { PushKind } from "@/lib/push/send";

// Display rows for the /m/settings/notifications preference matrix. Each row
// controls one or more canonical `PushKind` opt-out keys — the SAME keys the
// enforcement path reads at `src/lib/push/send.ts` (`matrix[kind][channel]`).
// Toggling a row writes EVERY kind it owns, so a "Shifts" toggle actually gates
// shift + shift_swap push/email. Previously the matrix persisted title-case
// bucket names ("Shifts"/"Announcements"/…) that the send path never reads, so
// every toggle was cosmetic; keying by PushKind fixes that.
//
// `crisis` is safety-critical and unsilenceable, so it has no row.
export type NotifRow = { label: string; kinds: PushKind[] };

export const NOTIF_ROWS: readonly NotifRow[] = [
  { label: "Announcements", kinds: ["announcement"] },
  { label: "Messages", kinds: ["chat"] },
  { label: "Shifts", kinds: ["shift", "shift_swap"] },
  { label: "Assignments", kinds: ["assignment", "assignment_state", "assignment_scan"] },
  { label: "Time Off", kinds: ["time_off"] },
  { label: "Time & Pay", kinds: ["timesheet", "payroll", "time_correction"] },
  { label: "Recognition", kinds: ["kudos", "badge"] },
  { label: "Learning", kinds: ["course"] },
  { label: "Incidents", kinds: ["incident"] },
] as const;

export const NOTIF_ROW_LABELS = NOTIF_ROWS.map((r) => r.label) as [string, ...string[]];
export const CHANNELS = ["push", "email", "text"] as const;
