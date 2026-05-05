"use client";

import * as React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import type { ActivityItem as ActivityItemType } from "@/lib/db/activity";

/**
 * Map an audit `action` to a human verb phrase.
 *
 * The trigger writes `"<table>.<op>"` (e.g. `"deliverables.update"`),
 * but bespoke writers can emit anything — `"ticket.scanned"`,
 * `"deliverable.approved"`. We try the bespoke verbs first and
 * fall back to a generic verb derived from the operation suffix.
 */
export function formatActivity(item: ActivityItemType): string {
  switch (item.action) {
    case "ticket.scanned":
      return "scanned ticket";
    case "deliverable.approved":
      return "approved deliverable";
    case "deliverable.rejected":
      return "rejected deliverable";
    case "annotation.created":
      return "added a comment";
    case "annotation.resolved":
      return "resolved a comment";
    case "annotation.flagged":
      return "flagged this record";
  }

  if (item.action.endsWith(".insert")) return "created";
  if (item.action.endsWith(".update")) return "updated";
  if (item.action.endsWith(".delete")) return "deleted";
  return item.action;
}

const RTF = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

const RELATIVE_THRESHOLDS: Array<{ unit: Intl.RelativeTimeFormatUnit; ms: number }> = [
  { unit: "year", ms: 365 * 24 * 60 * 60 * 1000 },
  { unit: "month", ms: 30 * 24 * 60 * 60 * 1000 },
  { unit: "week", ms: 7 * 24 * 60 * 60 * 1000 },
  { unit: "day", ms: 24 * 60 * 60 * 1000 },
  { unit: "hour", ms: 60 * 60 * 1000 },
  { unit: "minute", ms: 60 * 1000 },
];

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const delta = then - now;
  const abs = Math.abs(delta);
  if (abs < 30_000) return "just now";
  for (const { unit, ms } of RELATIVE_THRESHOLDS) {
    if (abs >= ms) {
      return RTF.format(Math.round(delta / ms), unit);
    }
  }
  return RTF.format(Math.round(delta / 1000), "second");
}

function formatAbsolute(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fieldsTouched(item: ActivityItemType): string[] {
  if (!item.diff) return [];
  return Object.keys(item.diff);
}

function renderValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value.length > 80 ? `${value.slice(0, 80)}…` : value;
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/**
 * Single timeline row — avatar dot on the left rail, "actor verb-ed object"
 * sentence on the right with optional collapsible diff payload.
 */
export function ActivityItem({ item }: { item: ActivityItemType }) {
  const [open, setOpen] = React.useState(false);
  const verb = formatActivity(item);
  const actorName = item.actorName ?? item.actorEmail ?? "Someone";
  const fields = fieldsTouched(item);
  const hasDiff = fields.length > 0;

  return (
    <li className="relative flex gap-3 ps-8">
      {/* Timeline rail dot */}
      <span
        aria-hidden="true"
        className="absolute start-2 top-2 h-2 w-2 -translate-x-1/2 rounded-full bg-[var(--org-primary)] ring-2 ring-[var(--background)]"
      />
      <Avatar name={actorName} src={item.actorAvatarUrl ?? null} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-snug">
          <span className="font-medium text-[var(--foreground)]">{actorName}</span>{" "}
          <span className="text-[var(--text-secondary)]">{verb}</span>
          {hasDiff && (
            <>
              {" "}
              <span className="text-[var(--text-muted)]">
                ({fields.length} {fields.length === 1 ? "field" : "fields"})
              </span>
            </>
          )}
        </p>
        <p className="mt-0.5 font-mono text-[10px] text-[var(--text-muted)]" title={formatAbsolute(item.occurredAt)}>
          {formatRelative(item.occurredAt)}
        </p>
        {hasDiff && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="mt-1 inline-flex items-center gap-1 text-[11px] text-[var(--text-muted)] hover:text-[var(--foreground)]"
            aria-expanded={open}
          >
            {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            {open ? "Hide changes" : "Show changes"}
          </button>
        )}
        {open && hasDiff && item.diff && (
          <dl className="mt-2 space-y-1 text-[11px]">
            {fields.map((field) => {
              const entry = item.diff![field];
              return (
                <div key={field} className="surface-inset px-2 py-1">
                  <dt className="font-mono text-[10px] tracking-wide text-[var(--text-muted)] uppercase">{field}</dt>
                  <dd className="mt-0.5 flex flex-wrap items-center gap-1 font-mono text-[11px]">
                    <span className="text-[var(--text-muted)] line-through">{renderValue(entry.before)}</span>
                    <span aria-hidden="true">→</span>
                    <span className="text-[var(--foreground)]">{renderValue(entry.after)}</span>
                  </dd>
                </div>
              );
            })}
          </dl>
        )}
      </div>
    </li>
  );
}
