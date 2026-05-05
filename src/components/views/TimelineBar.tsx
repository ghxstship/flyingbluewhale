"use client";

import * as React from "react";
import Link from "next/link";
import { useDraggable, type DraggableSyntheticListeners } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

export type TimelineBarTone = "info" | "warn" | "error" | "success" | "neutral" | "accent";

export type TimelineBarProps = {
  /** Stable id (shared with the underlying TimelineItem). */
  id: string;
  laneId: string;
  title: string;
  /** Display string for the bar's date span (caller pre-formats). */
  rangeLabel: string;
  /** Pixel offset from the timeline's anchor. */
  left: number;
  /** Pixel width of the bar. */
  width: number;
  tone?: TimelineBarTone;
  href?: string;
  /** Drag enabled? Default true. */
  draggable?: boolean;
  /** Resize callback — caller persists. */
  onResizeStart?: (edge: "start" | "end", clientX: number) => void;
  /** Optional metadata to forward to dnd-kit. */
  data?: Record<string, unknown>;
  className?: string;
};

/**
 * Tone → CSS variable, identical mapping to <ChartView>. Drives the
 * fill via `color-mix` for tasteful translucency over the canvas grid.
 */
const TONE_VAR: Record<TimelineBarTone, string> = {
  accent: "var(--org-primary)",
  info: "var(--color-info)",
  success: "var(--color-success)",
  warn: "var(--color-warning)",
  error: "var(--color-error)",
  neutral: "var(--text-muted)",
};

/**
 * TimelineBar — single absolutely-positioned bar on the timeline canvas.
 *
 * Wraps `useDraggable` from dnd-kit so the whole bar can be dragged. Edge
 * resize handles are visual-only here; the parent <TimelineView> wires
 * pointer events on the handles to its own `onResize` flow.
 *
 * Aesthetic: 3px ink border (no shadow) per the Bermuda Triangle canon.
 */
export function TimelineBar({
  id,
  laneId,
  title,
  rangeLabel,
  left,
  width,
  tone = "accent",
  href,
  draggable = true,
  onResizeStart,
  data,
  className = "",
}: TimelineBarProps): React.ReactElement {
  const fill = TONE_VAR[tone];

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    data: { type: "bar", laneId, ...(data ?? {}) },
    disabled: !draggable,
  });

  const style: React.CSSProperties = {
    left,
    width,
    transform: CSS.Translate.toString(transform),
    background: `color-mix(in srgb, ${fill} 22%, var(--surface))`,
    borderColor: fill,
    opacity: isDragging ? 0.55 : undefined,
    touchAction: "none",
  };

  const dragListeners: DraggableSyntheticListeners = draggable ? listeners : {};
  // dnd-kit's `attributes` already injects `role="button"` + `tabIndex={0}`,
  // so we don't repeat those props on the wrapper — TS rightly flags
  // duplicates. We rely on `attributes` for both.

  // Inner content — title + range. Reused inside Link wrapper if href set.
  const content = (
    <span className="flex h-full items-center gap-2 truncate px-2 text-[11px] font-medium text-[var(--text-primary)]">
      <span className="truncate">{title}</span>
      <span className="ml-auto truncate font-mono text-[10px] text-[var(--text-muted)]" aria-hidden="true">
        {rangeLabel}
      </span>
    </span>
  );

  const ariaLabel = `${title} from ${rangeLabel}`;

  return (
    <div
      ref={setNodeRef}
      aria-label={ariaLabel}
      style={style}
      className={[
        "absolute top-1 h-7 rounded-md border-[3px] select-none",
        "focus-visible:ring-2 focus-visible:ring-[var(--org-primary)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--background)] focus-visible:outline-none",
        "hover:[--bar-shadow:inset_0_0_0_1px_var(--surface)]",
        className,
      ].join(" ")}
      {...attributes}
      {...dragListeners}
    >
      {/* Left resize handle */}
      <button
        type="button"
        aria-label={`Resize start of ${title}`}
        onPointerDown={(e) => {
          e.stopPropagation();
          onResizeStart?.("start", e.clientX);
        }}
        className="absolute top-0 left-0 z-10 h-full w-2 cursor-ew-resize rounded-l-md hover:bg-[var(--surface-inset)]"
      />
      {/* Bar body */}
      {href ? (
        <Link
          href={href}
          className="block h-full w-full focus-visible:outline-none"
          onPointerDown={(e) => {
            // Allow dnd-kit to capture the drag without preventing
            // click-through navigation when the user releases without
            // moving past the activation distance.
            e.stopPropagation();
          }}
          onClick={(e) => {
            // Only fire if not dragging.
            if (isDragging) e.preventDefault();
          }}
        >
          {content}
        </Link>
      ) : (
        content
      )}
      {/* Right resize handle */}
      <button
        type="button"
        aria-label={`Resize end of ${title}`}
        onPointerDown={(e) => {
          e.stopPropagation();
          onResizeStart?.("end", e.clientX);
        }}
        className="absolute top-0 right-0 z-10 h-full w-2 cursor-ew-resize rounded-r-md hover:bg-[var(--surface-inset)]"
      />
    </div>
  );
}
