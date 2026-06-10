/**
 * Dashboard canvas types — Phase 3.6c of the SmartSuite parity roadmap.
 *
 * A dashboard owns a CSS-grid `layout` whose `widgets[]` array holds
 * heterogeneous widget configs. Each widget type carries its own payload
 * (KPI value, ChartViewConfig, SavedView id, markdown body) plus shared
 * grid coords (x/y/w/h).
 *
 * Per https://help.smartsuite.com/en/articles/5047123-how-to-create-a-dashboard
 */

import type { ChartViewConfig } from "@/lib/views/chart-config";
import type { ViewScope } from "@/lib/views/types";

/** Widget type discriminator. */
export type DashboardWidgetType = "kpi" | "chart" | "saved_view" | "markdown";

/** Shared coords + chrome for every widget. Sizes are in grid cells; (x,y)
 *  is the upper-left, (w,h) is the span. */
export type WidgetBase = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  title?: string;
};

/** KPI widget — wraps `<MetricCard>`. Value is pre-computed at save time;
 *  for live counts use a chart widget with a count aggregation instead. */
export type KpiWidget = WidgetBase & {
  type: "kpi";
  label: string;
  value: number | string;
  /** Trailing sparkline points (renderer normalizes the scale). */
  sparkline?: number[];
  /** Optional accent flag — picks up `--p-accent` (matches MetricCard.accent). */
  accent?: boolean;
  /** Delta indicator — value already pre-formatted. */
  delta?: { value: string; positive?: boolean };
};

/** Chart widget — wraps `<ChartView>`. The renderer pulls rows for
 *  `chartConfig` from the table referenced by `dataQuery`. */
export type ChartWidget = WidgetBase & {
  type: "chart";
  chartConfig: ChartViewConfig;
  dataQuery: {
    table: string;
    /** Column → value(s) filter. Multiple values become an `in` filter. */
    filter?: Record<string, unknown>;
    /** Cap the row count. Default 1000 server-side. */
    limit?: number;
  };
};

/** Saved-view embed — references a `view_configs` row. The renderer loads
 *  the saved view's `tableId` + `config`, then renders a read-only DataTable
 *  preview limited to the first N rows. */
export type SavedViewWidget = WidgetBase & {
  type: "saved_view";
  viewConfigId: string;
  /** How many rows to preview. Default 10. */
  rowLimit?: number;
};

/** Markdown widget — renders via the in-house `<Markdown>` renderer. No
 *  HTML pass-through, no remote includes. */
export type MarkdownWidget = WidgetBase & {
  type: "markdown";
  content: string;
};

export type DashboardWidget = KpiWidget | ChartWidget | SavedViewWidget | MarkdownWidget;

/** The persisted shape of a dashboard's layout JSON. */
export type DashboardLayout = {
  /** Grid column count. Default 12. */
  cols: number;
  /** Grid gap in pixels. Default 16. */
  gap: number;
  widgets: DashboardWidget[];
};

/** Camel-cased shape of the `dashboards` row, normalized for client use. */
export type DashboardRow = {
  id: string;
  orgId: string;
  name: string;
  description?: string | null;
  layout: DashboardLayout;
  scope: ViewScope;
  isDefault: boolean;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Default size hints when a palette item is dropped onto the canvas. Each
 *  type picks a sensible default footprint that fits the brand chrome. */
export const DEFAULT_WIDGET_SIZE: Record<DashboardWidgetType, { w: number; h: number }> = {
  kpi: { w: 3, h: 2 },
  chart: { w: 6, h: 4 },
  saved_view: { w: 8, h: 5 },
  markdown: { w: 6, h: 3 },
};

/** Minimum grid dimensions per widget type — keeps a 1×1 KPI from collapsing
 *  to invisible, and a chart widget from squashing below recharts' minimum. */
export const MIN_WIDGET_SIZE: Record<DashboardWidgetType, { w: number; h: number }> = {
  kpi: { w: 2, h: 2 },
  chart: { w: 3, h: 3 },
  saved_view: { w: 4, h: 3 },
  markdown: { w: 2, h: 2 },
};

/**
 * Snap a fractional grid coordinate to an integer cell. Negatives become 0
 * (no widget can drift off the left/top edge); width/height clamps to a
 * type-specific minimum.
 */
export function snapToGrid(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value));
}

/**
 * Snap a widget's full footprint (x/y/w/h) to the grid, clamping size to
 * the type-specific minimum and the dashboard's column count.
 */
export function snapWidget<T extends DashboardWidget>(widget: T, cols = 12): T {
  const min = MIN_WIDGET_SIZE[widget.type];
  const w = Math.max(min.w, Math.min(cols, snapToGrid(widget.w)));
  const h = Math.max(min.h, snapToGrid(widget.h));
  const x = Math.min(cols - w, snapToGrid(widget.x));
  const y = snapToGrid(widget.y);
  return { ...widget, x, y, w, h };
}

/**
 * Compute the bounding box of a layout's widgets. Returns `{ rows, cols }`
 * — the smallest rectangle that contains every widget. Used by the canvas
 * to size the grid so empty space below the last widget is still droppable.
 */
export function computeGridBounds(widgets: DashboardWidget[]): { rows: number; cols: number } {
  let rows = 0;
  let cols = 0;
  for (const w of widgets) {
    rows = Math.max(rows, w.y + w.h);
    cols = Math.max(cols, w.x + w.w);
  }
  return { rows, cols };
}

/**
 * Detect overlap between any two widgets in a layout. Returns the first
 * overlapping pair as `[a, b]`, or `null` if the layout is valid. Drag-and-
 * drop callers can reject a drop when this is non-null.
 */
export function findOverlap(widgets: DashboardWidget[]): [DashboardWidget, DashboardWidget] | null {
  for (let i = 0; i < widgets.length; i++) {
    for (let j = i + 1; j < widgets.length; j++) {
      const a = widgets[i];
      const b = widgets[j];
      if (!a || !b) continue;
      if (rectanglesOverlap(a, b)) return [a, b];
    }
  }
  return null;
}

function rectanglesOverlap(a: DashboardWidget, b: DashboardWidget): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/**
 * Find the first empty (x,y) on the grid where a widget of the given size
 * fits without overlap. Scans top-left to bottom-right, row by row.
 */
export function findOpenSlot(
  widgets: DashboardWidget[],
  size: { w: number; h: number },
  cols = 12,
): { x: number; y: number } {
  const { rows: maxRows } = computeGridBounds(widgets);
  // Scan a reasonable window past the current bounds; default a few extra
  // rows so a fresh canvas doesn't hit the trivial (0,0) every time.
  const limit = Math.max(maxRows + size.h, 12);
  for (let y = 0; y <= limit; y++) {
    for (let x = 0; x <= cols - size.w; x++) {
      const probe = { id: "__probe__", type: "markdown" as const, x, y, w: size.w, h: size.h, content: "" };
      const hit = widgets.find((w) => rectanglesOverlap(probe, w));
      if (!hit) return { x, y };
    }
  }
  // Fallback: drop below the last row.
  return { x: 0, y: maxRows };
}

/** Type guard for a `DashboardLayout` blob loaded from JSONB. */
export function isDashboardLayout(v: unknown): v is DashboardLayout {
  if (!v || typeof v !== "object") return false;
  const o = v as Partial<DashboardLayout>;
  return typeof o.cols === "number" && typeof o.gap === "number" && Array.isArray(o.widgets);
}
