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
//
// `id` is the stable wire identity (the action's z.enum + the client payload);
// `label` is display-only English, translated at render via
// t("m.settings.notif.row.<id>"). Never key persistence or the action on the
// label — labels are locale-variable.
export type NotifRow = { id: string; label: string; kinds: PushKind[] };

export const NOTIF_ROWS: readonly NotifRow[] = [
  { id: "announcements", label: "Announcements", kinds: ["announcement"] },
  { id: "messages", label: "Messages", kinds: ["chat"] },
  { id: "shifts", label: "Shifts", kinds: ["shift", "shift_swap"] },
  { id: "assignments", label: "Assignments", kinds: ["assignment", "assignment_state", "assignment_scan"] },
  { id: "time-off", label: "Time Off", kinds: ["time_off"] },
  { id: "time-pay", label: "Time & Pay", kinds: ["timesheet", "payroll", "time_correction"] },
  { id: "recognition", label: "Recognition", kinds: ["kudos", "badge"] },
  { id: "learning", label: "Learning", kinds: ["course"] },
  { id: "incidents", label: "Incidents", kinds: ["incident"] },
] as const;

export const NOTIF_ROW_IDS = NOTIF_ROWS.map((r) => r.id) as [string, ...string[]];
export const CHANNELS = ["push", "email", "text"] as const;
