/**
 * COMPVSS · Tasks — shared kit↔DB lifecycle mapping.
 *
 * The kit speaks Open / In progress / In review / Blocked / Done; the DB
 * `tasks.task_state` enum (`task_status`) is `todo / in_progress / blocked /
 * review / done`. These maps are the single source of truth used by the list,
 * the detail view, and the server action so the three never drift.
 */

/** The DB enum values, in lifecycle order. */
export const TASK_STATES = ["todo", "in_progress", "blocked", "review", "done"] as const;
export type TaskState = (typeof TASK_STATES)[number];

/** Human kit label per DB state. */
export const STATE_LABEL: Record<TaskState, string> = {
  todo: "Open",
  in_progress: "In progress",
  blocked: "Blocked",
  review: "In review",
  done: "Done",
};

/** Kit badge tone per DB state (mirrors prototype `statusTone`). */
export function stateTone(s: TaskState): "ok" | "warn" | "info" | "neutral" {
  if (s === "done") return "ok";
  if (s === "blocked") return "warn";
  if (s === "in_progress" || s === "review") return "info";
  return "neutral";
}

/**
 * Allowed forward/back transitions — enforced server-side so a stale tab can't
 * write an illegal jump. Any state may be parked back to `todo`; `done` is
 * reachable from `in_progress`/`review`/`blocked`.
 */
export const NEXT_TASK_STATES: Record<TaskState, TaskState[]> = {
  todo: ["in_progress", "blocked"],
  in_progress: ["review", "blocked", "done", "todo"],
  blocked: ["in_progress", "todo"],
  review: ["done", "in_progress", "blocked"],
  done: ["in_progress", "todo"],
};

export function isTaskState(v: string): v is TaskState {
  return (TASK_STATES as readonly string[]).includes(v);
}

/** Map the integer `tasks.priority` (1 Urgent … 4 Low) → kit High/Medium/Low. */
export function priorityLabel(p: number | null): "High" | "Medium" | "Low" {
  if (p == null) return "Medium";
  if (p <= 2) return "High";
  if (p === 3) return "Medium";
  return "Low";
}

export const PRI_COLOR: Record<"High" | "Medium" | "Low", string> = {
  High: "var(--p-danger)",
  Medium: "var(--p-warning)",
  Low: "var(--p-text-3)",
};

/** Plain shape the client list/detail consume. */
export type KitTask = {
  id: string;
  title: string;
  sub: string;
  state: TaskState;
  priority: "High" | "Medium" | "Low";
  due: string;
  assignee: string;
};
