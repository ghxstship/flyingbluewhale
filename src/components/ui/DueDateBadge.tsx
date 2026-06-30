/**
 * Due Date indicator — SmartSuite-parity smiley/orange/red/green-dot
 * lifecycle badge. Reads `due_at`, `closed_at`, and `status` from a work
 * item and renders a single-line status: closed, overdue, today,
 * upcoming, or unscheduled.
 *
 * Spec: https://help.smartsuite.com/en/articles/4612563-due-date-field
 *
 * Indicator semantics:
 *   closed_at → success (green)
 *   due in past, not closed → error (red, "Overdue (n days)")
 *   due today → warning (orange, "Today")
 *   due within 3 days → warning (amber, formatted date)
 *   due > 3 days → info (blue, formatted date)
 *   no due_at, not closed → muted (grey, "—")
 *   status === "blocked" → warning override regardless
 */

import * as React from "react";
import { Badge, type BadgeVariant } from "./Badge";
import { formatDate } from "@/lib/i18n/format";

export type DueDateStatus = "open" | "in_progress" | "blocked" | "closed" | string;

export type DueDateBadgeProps = {
  dueAt?: string | Date | null;
  closedAt?: string | Date | null;
  status?: DueDateStatus;
  size?: "sm" | "md";
  /** When true, hides the date itself and only renders the dot indicator. */
  iconOnly?: boolean;
  className?: string;
};

type Resolved = {
  variant: BadgeVariant;
  label: string;
  ariaLabel: string;
};

const MS_PER_DAY = 86_400_000;

function toDate(input: string | Date | null | undefined): Date | null {
  if (input == null) return null;
  const d = typeof input === "string" || typeof input === "number" ? new Date(input) : input;
  return Number.isNaN(d.getTime()) ? null : d;
}

function startOfDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

function dayDiff(a: Date, b: Date): number {
  return Math.round((startOfDay(a).getTime() - startOfDay(b).getTime()) / MS_PER_DAY);
}

function resolve(props: DueDateBadgeProps): Resolved | null {
  const due = toDate(props.dueAt ?? null);
  const closed = toDate(props.closedAt ?? null);
  const status = props.status;

  if (closed) {
    const label = formatDate(closed, "medium");
    return {
      variant: "success",
      label: "Closed",
      ariaLabel: `Closed on ${label}`,
    };
  }

  if (status === "blocked") {
    const label = due ? formatDate(due, "medium") : "Blocked";
    return {
      variant: "warning",
      label: due ? label : "Blocked",
      ariaLabel: due ? `Blocked, due ${label}` : "Blocked",
    };
  }

  if (!due) {
    return {
      variant: "muted",
      label: "—",
      ariaLabel: "No due date",
    };
  }

  const today = new Date();
  const diff = dayDiff(due, today);
  const label = formatDate(due, "medium");

  if (diff < 0) {
    const days = Math.abs(diff);
    const text = `Overdue (${days} ${days === 1 ? "day" : "days"})`;
    return {
      variant: "error",
      label: text,
      ariaLabel: `${text}, was due ${label}`,
    };
  }

  if (diff === 0) {
    return {
      variant: "warning",
      label: "Today",
      ariaLabel: `Due today, ${label}`,
    };
  }

  if (diff <= 3) {
    return {
      variant: "warning",
      label,
      ariaLabel: `Due in ${diff} ${diff === 1 ? "day" : "days"}, ${label}`,
    };
  }

  return {
    variant: "info",
    label,
    ariaLabel: `Due ${label}`,
  };
}

export function DueDateBadge(props: DueDateBadgeProps): React.ReactElement | null {
  const { iconOnly = false, size = "md", className = "" } = props;
  const resolved = resolve(props);

  if (!resolved) return null;
  // Hide entirely when iconOnly + nothing meaningful to convey.
  if (iconOnly && resolved.variant === "muted" && !props.dueAt && !props.closedAt) return null;

  const sizeClass = size === "sm" ? "text-[10px]" : "text-xs";

  return (
    // resolve() reads `new Date()`, so the variant + relative label ("Overdue
    // (N days)", "Today", "Due soon") are computed against the SSR server's clock
    // and again against the browser's at hydration. Near a day boundary / across
    // timezones those differ → React #418. The badge is a relative-time display,
    // so suppress the per-element hydration check (the repo pattern, see
    // AuditLogViewer / ActivityView).
    <span role="status" aria-label={resolved.ariaLabel} className={`inline-flex ${className}`.trim()}>
      <Badge variant={resolved.variant} shape="dot" className={sizeClass}>
        {/* suppress on the element directly wrapping the relative label — #418 is
            a text-content mismatch and only suppresses one level deep. */}
        {iconOnly ? "" : <span suppressHydrationWarning>{resolved.label}</span>}
      </Badge>
    </span>
  );
}
