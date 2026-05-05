"use client";

import * as React from "react";
import { useDraggable } from "@dnd-kit/core";
import type { DashboardWidgetType } from "@/lib/dashboards/types";

/**
 * WidgetPalette — sidebar in dashboard edit mode. Each item is a dnd-kit
 * draggable that the canvas accepts as a "create" intent: dropping the
 * item registers a new widget at the drop position with the type's default
 * footprint.
 */
export function WidgetPalette({
  onAdd,
}: {
  /** Fallback when drag-and-drop isn't available (e.g. screen reader or
   *  test envs). Click invokes the same code path the canvas drop runs. */
  onAdd: (type: DashboardWidgetType) => void;
}): React.ReactElement {
  return (
    <aside className="surface flex w-56 shrink-0 flex-col gap-2 p-3">
      <div className="text-[10px] font-semibold tracking-wider text-[var(--text-muted)] uppercase">Widgets</div>
      {PALETTE.map((item) => (
        <PaletteItem
          key={item.type}
          type={item.type}
          label={item.label}
          description={item.description}
          glyph={item.glyph}
          onClick={() => onAdd(item.type)}
        />
      ))}
      <p className="mt-2 text-[10px] leading-relaxed text-[var(--text-muted)]">
        Drag a widget onto the canvas, or click to drop into the next open slot.
      </p>
    </aside>
  );
}

const PALETTE: Array<{
  type: DashboardWidgetType;
  label: string;
  description: string;
  glyph: React.ReactNode;
}> = [
  {
    type: "kpi",
    label: "KPI",
    description: "A single metric with optional sparkline.",
    glyph: <SparklineIcon />,
  },
  {
    type: "chart",
    label: "Chart",
    description: "Bar, line, area, pie or heatmap.",
    glyph: <BarIcon />,
  },
  {
    type: "saved_view",
    label: "Saved View",
    description: "Embed a saved table view as a preview.",
    glyph: <GridIcon />,
  },
  {
    type: "markdown",
    label: "Markdown",
    description: "Rich text, links, and code blocks.",
    glyph: <TextIcon />,
  },
];

function PaletteItem({
  type,
  label,
  description,
  glyph,
  onClick,
}: {
  type: DashboardWidgetType;
  label: string;
  description: string;
  glyph: React.ReactNode;
  onClick: () => void;
}): React.ReactElement {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette:${type}`,
    data: { source: "palette", widgetType: type },
  });
  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={onClick}
      aria-label={`Add ${label} widget`}
      className={`hover-lift flex items-start gap-2 rounded-md border border-[var(--border-color)] bg-[var(--surface-raised)] p-2 text-left transition-shadow ${
        isDragging ? "opacity-60" : ""
      }`}
      {...attributes}
      {...listeners}
    >
      <span className="mt-0.5 text-[var(--org-primary)]" aria-hidden>
        {glyph}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-semibold tracking-tight text-[var(--foreground)]">{label}</span>
        <span className="block text-[10px] leading-snug text-[var(--text-muted)]">{description}</span>
      </span>
    </button>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Inline icons — kept inline (no new deps) and tone-aware via currentColor.
// ──────────────────────────────────────────────────────────────────────

function SparklineIcon(): React.ReactElement {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M1 10 L4 6 L7 8 L10 3 L13 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BarIcon(): React.ReactElement {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <rect x="2" y="6" width="2" height="6" fill="currentColor" />
      <rect x="6" y="3" width="2" height="9" fill="currentColor" />
      <rect x="10" y="8" width="2" height="4" fill="currentColor" />
    </svg>
  );
}

function GridIcon(): React.ReactElement {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <rect x="2" y="2" width="4" height="4" stroke="currentColor" strokeWidth="1.2" />
      <rect x="8" y="2" width="4" height="4" stroke="currentColor" strokeWidth="1.2" />
      <rect x="2" y="8" width="4" height="4" stroke="currentColor" strokeWidth="1.2" />
      <rect x="8" y="8" width="4" height="4" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function TextIcon(): React.ReactElement {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M2 4 H12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M2 7 H10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M2 10 H8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
