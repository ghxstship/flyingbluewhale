"use client";

import * as React from "react";
import { useDroppable } from "@dnd-kit/core";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";

export type KanbanLaneTone = "info" | "warn" | "error" | "success" | "neutral";

const TONE_TO_VARIANT: Record<KanbanLaneTone, BadgeVariant> = {
  info: "info",
  warn: "warning",
  error: "error",
  success: "success",
  neutral: "muted",
};

export type KanbanLaneProps = {
  id: string;
  title: string;
  count: number;
  tone?: KanbanLaneTone;
  /** When set, drops on this lane are blocked (e.g. terminal "closed" lane). */
  locked?: boolean;
  /** WIP limit; render an "over" badge when count exceeds this. */
  wipLimit?: number;
  density?: "comfortable" | "compact";
  children: React.ReactNode;
};

/**
 * KanbanLane — single column in the board. Owns the droppable target and
 * the sticky lane header (chip + count + WIP badge). Empty lanes get a
 * dashed-border placeholder so the drop target reads visually.
 */
export function KanbanLane({
  id,
  title,
  count,
  tone = "neutral",
  locked = false,
  wipLimit,
  density = "comfortable",
  children,
}: KanbanLaneProps): React.ReactElement {
  const { setNodeRef, isOver } = useDroppable({ id, disabled: locked, data: { lane: id } });

  const overLimit = typeof wipLimit === "number" && count > wipLimit;
  const variant = TONE_TO_VARIANT[tone];
  const padding = density === "compact" ? "p-2" : "p-3";
  const isEmpty = count === 0;

  const dropHighlight = isOver && !locked ? "ring-2 ring-[var(--p-accent)]" : "";
  const lockedClass = locked ? "opacity-70" : "";

  return (
    <section
      aria-label={`${title} lane, ${count} ${count === 1 ? "card" : "cards"}${locked ? ", locked" : ""}`}
      className={`flex w-72 shrink-0 flex-col rounded-md border border-[var(--p-border)] bg-[var(--p-surface-2)] ${lockedClass}`}
    >
      <header className="sticky top-0 z-10 flex items-center justify-between gap-2 rounded-t-md border-b border-[var(--p-border)] bg-[var(--p-surface-2)] px-3 py-2 backdrop-blur">
        <div className="flex min-w-0 items-center gap-2">
          <Badge variant={variant} className="text-[10px] tracking-wide uppercase">
            {title}
          </Badge>
          <span className="font-mono text-xs text-[var(--p-text-2)] tabular-nums">{count}</span>
        </div>
        {typeof wipLimit === "number" && (
          <Badge
            variant={overLimit ? "error" : "muted"}
            aria-label={`WIP limit ${wipLimit}${overLimit ? ", over limit" : ""}`}
            className="text-[10px]"
          >
            {overLimit ? `Over WIP ${wipLimit}` : `WIP ${wipLimit}`}
          </Badge>
        )}
      </header>
      <div
        ref={setNodeRef}
        className={`flex flex-1 flex-col gap-2 overflow-y-auto ${padding} transition-shadow ${dropHighlight}`}
        aria-dropeffect={locked ? "none" : "move"}
      >
        {isEmpty ? (
          <div className="flex min-h-[6rem] items-center justify-center rounded-md border-2 border-dashed border-[var(--p-border)] p-4 text-center text-xs text-[var(--p-text-2)]">
            {locked ? "Locked" : "Drop here"}
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  );
}
