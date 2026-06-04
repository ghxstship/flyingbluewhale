"use client";

import * as React from "react";
import Link from "next/link";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export type KanbanCardProps = {
  /** Stable id of the underlying row. */
  id: string;
  /** Lane id this card currently belongs to (passed through dnd-kit data). */
  laneId: string;
  /** Optional href — when present the card body is a <Link>. */
  href?: string;
  /** Card body content — caller-supplied. */
  children: React.ReactNode;
  density?: "comfortable" | "compact";
  className?: string;
};

/**
 * KanbanCard — single sortable card. Provides the standard Bermuda Triangle
 * card chrome (3px ink border, no shadow) and wires `useSortable` so the
 * card is keyboard- and pointer-draggable.
 *
 * The drag handle is the entire card body. Clicks (where `href` is set)
 * still navigate — dnd-kit's `PointerSensor` activation distance prevents
 * accidental drags from quick clicks.
 */
export function KanbanCard({
  id,
  laneId,
  href,
  children,
  density = "comfortable",
  className = "",
}: KanbanCardProps): React.ReactElement {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    data: { lane: laneId },
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
    touchAction: "pan-y",
  };

  const padding = density === "compact" ? "p-2" : "p-3";
  const base =
    "block w-full text-start bg-[var(--surface)] border-[3px] border-[var(--ink, var(--foreground))] rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--org-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]";
  const interactive = href ? "hover:-translate-y-0.5 transition-transform" : "";
  const cls = `${base} ${padding} ${interactive} ${className}`.trim();

  // The body. When href is set, render the inner content inside a Link
  // (so click-to-navigate still works); the outer element remains the
  // dnd-kit ref/listener target so drags work everywhere on the card.
  const body = href ? (
    <Link href={href} className="block focus-visible:outline-none">
      {children}
    </Link>
  ) : (
    children
  );

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={cls}>
      {body}
    </div>
  );
}
