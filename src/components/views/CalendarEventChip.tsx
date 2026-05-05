"use client";

import * as React from "react";
import Link from "next/link";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import type { CalendarEvent } from "@/lib/views/calendar";

type Props = {
  event: CalendarEvent;
  renderEvent?: (event: CalendarEvent) => React.ReactNode;
};

/** Map the abstract `tone` to a small Tailwind chip palette. */
export function eventToneClass(tone: CalendarEvent["tone"]): string {
  switch (tone) {
    case "success":
      return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25";
    case "warn":
      return "bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25";
    case "error":
      return "bg-[color:var(--color-error)]/10 text-[color:var(--color-error)] hover:bg-[color:var(--color-error)]/20";
    case "info":
      return "bg-[var(--org-primary)]/15 text-[var(--org-primary)] hover:bg-[var(--org-primary)]/25";
    case "neutral":
    default:
      return "bg-[var(--surface-inset)] text-[var(--text-primary)] hover:bg-[var(--surface-raised)]";
  }
}

/**
 * Draggable event chip for month/week/day views. Wraps the visible body in
 * an optional `<Link>` so clicks still navigate when there's no drag.
 */
export function CalendarEventChip({ event, renderEvent }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `event:${event.id}`,
    data: { eventId: event.id, originalStart: event.start },
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    touchAction: "none",
  };

  if (renderEvent) {
    return (
      <div ref={setNodeRef} style={style} className="flex items-center gap-1">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Drag to reschedule ${event.title}`}
          className="shrink-0 cursor-grab text-[var(--text-muted)] hover:text-[var(--text-primary)] active:cursor-grabbing"
        >
          <GripVertical size={10} />
        </button>
        <div className="min-w-0 flex-1">{renderEvent(event)}</div>
      </div>
    );
  }

  const tone = eventToneClass(event.tone);
  const body = <span className={`block truncate rounded px-1 py-0.5 text-[10px] ${tone}`}>{event.title}</span>;

  return (
    <div ref={setNodeRef} style={style} className="group/chip flex min-w-0 items-center gap-1">
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Drag to reschedule ${event.title}`}
        className="shrink-0 cursor-grab text-[var(--text-muted)] opacity-0 transition-opacity group-hover/chip:opacity-100 hover:text-[var(--text-primary)] active:cursor-grabbing"
        tabIndex={-1}
      >
        <GripVertical size={10} />
      </button>
      {event.href ? (
        <Link href={event.href} className="min-w-0 flex-1" title={event.title}>
          {body}
        </Link>
      ) : (
        <div className="min-w-0 flex-1" title={event.title}>
          {body}
        </div>
      )}
    </div>
  );
}
