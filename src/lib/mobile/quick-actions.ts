/**
 * COMPVSS Home Quick Actions — the registry + the customizable set.
 *
 * The Home grid renders the caller's chosen, ordered subset; the Customize
 * sheet reorders / adds / removes against this registry and persists the result
 * to `user_preferences.ui_state.quick_actions` (the same seam as `nav_lens` /
 * `saved_jobs`, so it syncs across the crew member's devices — "saved to your
 * dashboard"). Every action resolves to a REAL `/m` route; the AVAILABLE pool
 * is simply the registry minus the current set. Kit ref: `app.jsx` `QA_ALL` /
 * `QA_DEFAULT` (the prototype persists to localStorage; the repo persists
 * server-side to match the rest of the mobile preference surface).
 */
export type QuickActionId =
  | "report"
  | "scan"
  | "clock"
  | "advance"
  | "approve"
  | "swap"
  | "expense"
  | "lost-found"
  | "invite"
  | "inspect"
  | "timeoff"
  | "po";

export type QuickActionTint = "danger" | "accent" | "info" | "warning" | "success";

export type QuickActionDef = {
  id: QuickActionId;
  /** i18n key + the English fallback (client resolves via the Home label map). */
  labelKey: string;
  labelDefault: string;
  /** KIcon registry name. */
  icon: string;
  tint: QuickActionTint;
  /** The real destination route. `approve` is overridden to the inline decision
   *  drawer in HomeShell when the caller can decide; the href is the fallback. */
  href: string;
};

export const QUICK_ACTIONS: Record<QuickActionId, QuickActionDef> = {
  report: { id: "report", labelKey: "m.home.qa.report", labelDefault: "Report", icon: "TriangleAlert", tint: "danger", href: "/m/incidents/new" },
  scan: { id: "scan", labelKey: "m.home.qa.scan", labelDefault: "Scan", icon: "ScanLine", tint: "accent", href: "/m/check-in" },
  clock: { id: "clock", labelKey: "m.home.qa.clock", labelDefault: "Time Clock", icon: "Timer", tint: "info", href: "/m/clock" },
  advance: { id: "advance", labelKey: "m.home.qa.advance", labelDefault: "Advance", icon: "ClipboardList", tint: "warning", href: "/m/advances" },
  approve: { id: "approve", labelKey: "m.home.qa.approve", labelDefault: "Approve", icon: "CheckCheck", tint: "success", href: "/m/requests" },
  swap: { id: "swap", labelKey: "m.home.qa.swap", labelDefault: "Swap", icon: "ArrowLeftRight", tint: "info", href: "/m/requests" },
  expense: { id: "expense", labelKey: "m.home.qa.expense", labelDefault: "Expense", icon: "Receipt", tint: "info", href: "/m/expenses/new" },
  "lost-found": { id: "lost-found", labelKey: "m.home.qa.lostFound", labelDefault: "Lost & Found", icon: "Search", tint: "warning", href: "/m/lost-found" },
  invite: { id: "invite", labelKey: "m.home.qa.invite", labelDefault: "Invite", icon: "UserPlus", tint: "accent", href: "/m/connections" },
  inspect: { id: "inspect", labelKey: "m.home.qa.inspect", labelDefault: "Inspect", icon: "ClipboardCheck", tint: "info", href: "/m/inspections" },
  timeoff: { id: "timeoff", labelKey: "m.home.qa.timeoff", labelDefault: "Time Off", icon: "CalendarOff", tint: "success", href: "/m/time-off/new" },
  po: { id: "po", labelKey: "m.home.qa.po", labelDefault: "PO Request", icon: "FileStack", tint: "info", href: "/m/advances/new" },
};

export const QUICK_ACTION_IDS = Object.keys(QUICK_ACTIONS) as QuickActionId[];

/** Default set + order — the current Home grid, preserved exactly. */
export const DEFAULT_QUICK_ACTIONS: QuickActionId[] = [
  "report",
  "scan",
  "clock",
  "advance",
  "approve",
  "swap",
  "expense",
  "lost-found",
  "invite",
];

export function isQuickActionId(x: unknown): x is QuickActionId {
  return typeof x === "string" && Object.prototype.hasOwnProperty.call(QUICK_ACTIONS, x);
}

/**
 * Sanitize a persisted list → known ids, order-preserving and de-duped.
 * An absent, non-array, or fully-invalid/empty value falls back to the default
 * set (the Home grid must never be empty).
 */
export function resolveQuickActions(saved: unknown): QuickActionId[] {
  if (!Array.isArray(saved)) return [...DEFAULT_QUICK_ACTIONS];
  const seen = new Set<QuickActionId>();
  for (const x of saved) if (isQuickActionId(x)) seen.add(x);
  return seen.size ? [...seen] : [...DEFAULT_QUICK_ACTIONS];
}
