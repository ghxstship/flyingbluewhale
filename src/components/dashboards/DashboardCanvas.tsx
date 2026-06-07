"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  KeyboardSensor,
  useDroppable,
  useDraggable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import {
  DEFAULT_WIDGET_SIZE,
  computeGridBounds,
  findOpenSlot,
  isDashboardLayout,
  snapToGrid,
  snapWidget,
  type DashboardLayout,
  type DashboardWidget,
  type DashboardWidgetType,
} from "@/lib/dashboards/types";

import { KpiWidget } from "./widgets/KpiWidget";
import { MarkdownWidget } from "./widgets/MarkdownWidget";
import { SavedViewWidget, type SavedViewWidgetData } from "./widgets/SavedViewWidget";
import { WidgetPalette } from "./WidgetPalette";

// ChartWidget owns recharts, which is the largest dep in this surface
// (~120kb gzipped). Most users land on a dashboard view first; we keep the
// initial paint lean by code-splitting the chart module out of the canvas
// chunk. SSR off because recharts touches `window` during hydration and
// the canvas is editor-only anyway (no SEO need).
const ChartWidget = dynamic(() => import("./widgets/ChartWidget").then((m) => ({ default: m.ChartWidget })), {
  ssr: false,
  loading: () => <div className="surface ps-skel h-full w-full" aria-busy="true" />,
});

/**
 * Pre-resolved data per widget — provided by the dashboard's server page
 * because chart-row queries and saved-view embeds need DB access. The
 * canvas hands the right slice to each widget renderer.
 */
export type DashboardWidgetData = {
  /** Chart widgets: pre-fetched rows for `widget.dataQuery`. */
  charts?: Record<string, Array<Record<string, unknown>>>;
  /** Saved-view widgets: resolved view-config row + sample rows. */
  savedViews?: Record<string, SavedViewWidgetData>;
};

export type DashboardCanvasProps = {
  layout: DashboardLayout;
  data: DashboardWidgetData;
  /** When true, surface the widget palette + drag handles + delete buttons.
   *  Default false (read-only render). */
  editable?: boolean;
  /**
   * Called whenever the layout changes (drag/drop, resize, palette add,
   * delete). Caller is expected to debounce + persist via the
   * `saveLayoutAction` server action.
   */
  onLayoutChange?: (next: DashboardLayout) => void | Promise<void>;
  className?: string;
};

const ROW_HEIGHT_PX = 80; // Each grid row is 80px tall — keeps a 2-row KPI
//                                comfortable and matches the metric-grid card height.

/**
 * <DashboardCanvas> — the main client component for rendering and editing
 * a dashboard's CSS-grid layout. In view mode it just renders widgets in
 * grid cells; in edit mode it adds drag handles, a delete button per
 * widget, and the WidgetPalette in a sidebar.
 *
 * Drag-and-drop uses `@dnd-kit/core` directly (no react-grid-layout). We
 * snap deltas to integer cells before persisting; the canvas's grid stays
 * an integer-only system so server-rendered + client-rendered layouts
 * agree pixel-for-pixel.
 */
export function DashboardCanvas({
  layout,
  data,
  editable = false,
  onLayoutChange,
  className = "",
}: DashboardCanvasProps): React.ReactElement {
  // Local optimistic state — drag/drop edits feel instant. Sync from upstream
  // when the layout identity changes (e.g. server-side mutation completes).
  const [localLayout, setLocalLayout] = React.useState<DashboardLayout>(layout);
  React.useEffect(() => {
    setLocalLayout(layout);
  }, [layout]);

  const cols = localLayout.cols || 12;
  const gap = localLayout.gap || 16;
  const bounds = computeGridBounds(localLayout.widgets);
  // Reserve at least 6 rows so an empty canvas still has a drop zone.
  const minRows = editable ? 6 : 1;
  const rows = Math.max(minRows, bounds.rows);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor),
  );

  const persist = React.useCallback(
    (next: DashboardLayout) => {
      setLocalLayout(next);
      void onLayoutChange?.(next);
    },
    [onLayoutChange],
  );

  const addWidget = React.useCallback(
    (type: DashboardWidgetType, hint?: { x: number; y: number }) => {
      const size = DEFAULT_WIDGET_SIZE[type];
      const slot = hint ?? findOpenSlot(localLayout.widgets, size, cols);
      const id = generateWidgetId();
      const draft = buildDraftWidget(type, id, snapToGrid(slot.x), snapToGrid(slot.y));
      const next: DashboardLayout = {
        ...localLayout,
        widgets: [...localLayout.widgets, snapWidget(draft, cols)],
      };
      persist(next);
    },
    [cols, localLayout, persist],
  );

  const removeWidget = React.useCallback(
    (widgetId: string) => {
      const next: DashboardLayout = {
        ...localLayout,
        widgets: localLayout.widgets.filter((w) => w.id !== widgetId),
      };
      persist(next);
    },
    [localLayout, persist],
  );

  const handleDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      const { active, delta, over } = event;
      const activeData = active.data.current as
        | { source?: "widget" | "palette"; widgetType?: DashboardWidgetType }
        | undefined;

      // Palette drop → create a new widget at the drop position.
      if (activeData?.source === "palette" && activeData.widgetType) {
        if (!over) return;
        const drop = (over.data.current as { x?: number; y?: number } | undefined) ?? {};
        const dropX = typeof drop.x === "number" ? drop.x : 0;
        const dropY = typeof drop.y === "number" ? drop.y : bounds.rows;
        addWidget(activeData.widgetType, { x: dropX, y: dropY });
        return;
      }

      // Existing-widget move → translate the widget by the snapped delta.
      const widgetId = String(active.id);
      const widget = localLayout.widgets.find((w) => w.id === widgetId);
      if (!widget) return;

      // Read pixel deltas + the canvas width snapshot from the over zone
      // so we can convert to cells. dnd-kit hands us pixel deltas; we
      // divide by the per-cell pixel size (derived from the measured
      // canvas width) to land on integer grid cells.
      const overData = (over?.data.current as { canvasWidthPx?: number; canvasHeightPx?: number } | undefined) ?? {};
      const widthPx = overData.canvasWidthPx ?? 0;
      const cellPxX = widthPx > 0 ? (widthPx + gap) / cols : 0;
      const cellPxY = ROW_HEIGHT_PX + gap;

      const dxCells = cellPxX > 0 ? Math.round(delta.x / cellPxX) : 0;
      const dyCells = cellPxY > 0 ? Math.round(delta.y / cellPxY) : 0;

      const moved = snapWidget(
        {
          ...widget,
          x: snapToGrid(widget.x + dxCells),
          y: snapToGrid(widget.y + dyCells),
        },
        cols,
      );

      const next: DashboardLayout = {
        ...localLayout,
        widgets: localLayout.widgets.map((w) => (w.id === widgetId ? moved : w)),
      };
      persist(next);
    },
    [addWidget, bounds.rows, cols, gap, localLayout, persist],
  );

  const grid = (
    <CanvasDropZone cols={cols} rows={rows} gap={gap}>
      {localLayout.widgets.map((widget) => (
        <WidgetCell key={widget.id} widget={widget} editable={editable} onRemove={() => removeWidget(widget.id)}>
          <WidgetRenderer widget={widget} data={data} />
        </WidgetCell>
      ))}
    </CanvasDropZone>
  );

  if (!editable) {
    // No DnD context needed in view mode — saves the keyboard sensor
    // mounting on every dashboard render.
    return (
      <div className={`dashboard-canvas ${className}`} data-mode="view">
        {grid}
      </div>
    );
  }

  return (
    <div className={`dashboard-canvas flex gap-4 ${className}`} data-mode="edit">
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <WidgetPalette onAdd={(t) => addWidget(t)} />
        <div className="min-w-0 flex-1">{grid}</div>
      </DndContext>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Drop zone — hosts the CSS grid + relays its measured width to drag end.
// ──────────────────────────────────────────────────────────────────────

function CanvasDropZone({
  cols,
  rows,
  gap,
  children,
}: {
  cols: number;
  rows: number;
  gap: number;
  children: React.ReactNode;
}): React.ReactElement {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [size, setSize] = React.useState<{ w: number; h: number }>({ w: 0, h: 0 });

  React.useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => {
      const e = entries[0];
      if (!e) return;
      setSize({ w: e.contentRect.width, h: e.contentRect.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { setNodeRef, isOver } = useDroppable({
    id: "dashboard-canvas",
    data: {
      x: 0,
      y: 0,
      canvasWidthPx: size.w,
      canvasHeightPx: size.h,
    },
  });

  return (
    <div
      ref={(node) => {
        ref.current = node;
        setNodeRef(node);
      }}
      className={`relative w-full rounded-md border border-dashed border-transparent p-1 transition-colors ${
        isOver ? "border-[var(--p-accent)] bg-[var(--p-surface-2)]" : ""
      }`}
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        gridAutoRows: `${ROW_HEIGHT_PX}px`,
        gap: `${gap}px`,
        minHeight: `${rows * ROW_HEIGHT_PX + (rows - 1) * gap}px`,
      }}
    >
      {children}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Widget cell — wraps each widget with grid placement + drag chrome.
// ──────────────────────────────────────────────────────────────────────

function WidgetCell({
  widget,
  editable,
  onRemove,
  children,
}: {
  widget: DashboardWidget;
  editable: boolean;
  onRemove: () => void;
  children: React.ReactNode;
}): React.ReactElement {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: widget.id,
    data: { source: "widget" as const, widgetId: widget.id },
    disabled: !editable,
  });

  return (
    <div
      ref={setNodeRef}
      data-widget-id={widget.id}
      data-widget-type={widget.type}
      style={{
        gridColumn: `${widget.x + 1} / span ${widget.w}`,
        gridRow: `${widget.y + 1} / span ${widget.h}`,
        opacity: isDragging ? 0.6 : 1,
      }}
      className="relative"
    >
      {editable && (
        <div className="pointer-events-none absolute inset-0 z-10 rounded-md ring-1 ring-[var(--p-border)]/40" />
      )}
      <div className="h-full w-full">{children}</div>
      {editable && (
        <div className="absolute end-1 top-1 z-20 flex gap-1">
          <button
            type="button"
            aria-label={`Move ${widget.title ?? widget.type}`}
            className="surface-raised flex h-6 w-6 cursor-grab items-center justify-center rounded text-[var(--p-text-2)] hover:text-[var(--p-text-1)]"
            {...attributes}
            {...listeners}
          >
            <GripIcon />
          </button>
          <button
            type="button"
            aria-label={`Remove ${widget.title ?? widget.type}`}
            onClick={onRemove}
            className="surface-raised flex h-6 w-6 items-center justify-center rounded text-[var(--p-text-2)] hover:text-[var(--p-danger)]"
          >
            <XIcon />
          </button>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Renderer router — picks the right widget component for the type.
// ──────────────────────────────────────────────────────────────────────

function WidgetRenderer({ widget, data }: { widget: DashboardWidget; data: DashboardWidgetData }): React.ReactElement {
  switch (widget.type) {
    case "kpi":
      return <KpiWidget widget={widget} />;
    case "chart": {
      const rows = data.charts?.[widget.id] ?? [];
      return <ChartWidget widget={widget} rows={rows} />;
    }
    case "saved_view": {
      const slice = data.savedViews?.[widget.id] ?? { view: null, rows: [] };
      return <SavedViewWidget widget={widget} data={slice} />;
    }
    case "markdown":
      return <MarkdownWidget widget={widget} />;
  }
}

// ──────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────

function generateWidgetId(): string {
  // crypto.randomUUID is available in modern browsers + Node >= 19. Fallback
  // generates a 12-char base36 id; collisions inside one canvas are negligible.
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `w_${crypto.randomUUID().slice(0, 8)}`;
  }
  return `w_${Math.random().toString(36).slice(2, 12)}`;
}

function buildDraftWidget(type: DashboardWidgetType, id: string, x: number, y: number): DashboardWidget {
  const size = DEFAULT_WIDGET_SIZE[type];
  const base = { id, x, y, w: size.w, h: size.h };
  switch (type) {
    case "kpi":
      return { ...base, type: "kpi", label: "New KPI", value: 0 };
    case "chart":
      return {
        ...base,
        type: "chart",
        chartConfig: {
          type: "bar",
          x: { field: "label" },
          series: [{ field: "value", agg: "sum" }],
        },
        dataQuery: { table: "" },
      };
    case "saved_view":
      return { ...base, type: "saved_view", viewConfigId: "" };
    case "markdown":
      return {
        ...base,
        type: "markdown",
        content: "## New widget\n\nWrite some markdown here.",
      };
  }
}

// Re-export the predicate for callers that want to validate JSON loaded
// from somewhere other than `dashboards`.
export { isDashboardLayout };

// ──────────────────────────────────────────────────────────────────────
// Inline icons
// ──────────────────────────────────────────────────────────────────────

function GripIcon(): React.ReactElement {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <circle cx="3" cy="3" r="1" fill="currentColor" />
      <circle cx="9" cy="3" r="1" fill="currentColor" />
      <circle cx="3" cy="6" r="1" fill="currentColor" />
      <circle cx="9" cy="6" r="1" fill="currentColor" />
      <circle cx="3" cy="9" r="1" fill="currentColor" />
      <circle cx="9" cy="9" r="1" fill="currentColor" />
    </svg>
  );
}

function XIcon(): React.ReactElement {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path d="M3 3 L9 9 M9 3 L3 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
