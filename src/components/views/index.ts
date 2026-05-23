// Barrel for src/components/views/* — Phase 3.x of the SmartSuite parity
// roadmap. Append your exports here; do not rewrite. (Phase 3.1 / 3.3 /
// 3.4 also write to this file.)

// Phase 3.2 — KanbanBoard
export { KanbanBoard } from "./KanbanBoard";
export type { KanbanBoardProps, KanbanLane } from "./KanbanBoard";
export { KanbanLane as KanbanLaneView } from "./KanbanLane";
export type { KanbanLaneProps, KanbanLaneTone } from "./KanbanLane";
export { KanbanCard } from "./KanbanCard";
export type { KanbanCardProps } from "./KanbanCard";
export { groupByLane } from "./groupByLane";

// Phase 3.3 — CalendarView
export { CalendarView } from "./CalendarView";
export type { CalendarViewProps, CalendarEvent, CalendarMode } from "./CalendarView";

// Phase 3.4 — ChartView (+ heatmap primitive)
export { ChartView, formatValue } from "./ChartView";
export type { ChartViewProps } from "./ChartView";
export { HeatmapGrid } from "./HeatmapGrid";
export type { HeatmapGridProps, HeatmapCell } from "./HeatmapGrid";

// Phase 3.6a — TimelineView
export { TimelineView } from "./TimelineView";
export type { TimelineViewProps, TimelineLane, TimelineItem, TimelineZoom } from "./TimelineView";
export { TimelineBar } from "./TimelineBar";
export type { TimelineBarProps, TimelineBarTone } from "./TimelineBar";

// Phase 3.6b — MapView
export { MapView } from "./MapView";
export type { MapViewProps, MapMarker, MapMarkerTone } from "./MapView";
export { MapMarker as MapMarkerChip } from "./MapMarker";
export type { MapMarkerProps } from "./MapMarker";

// Phase 3.6c — DashboardCanvas (composable dashboard layout)
export { DashboardCanvas } from "../dashboards/DashboardCanvas";
export type { DashboardCanvasProps, DashboardWidgetData } from "../dashboards/DashboardCanvas";

// Phase 3.7 — DataViewSwitcher (canonical collection-page view toggle).
// Owns the `?view=` URL state and renders only the chips the dataset
// supports. Use `resolveDataView()` in the server component to read the
// current view; use `<DataViewSwitcher>` in the ModuleHeader `action`
// slot to render the chip strip. The resolver is split into its own
// file so server components can import it without pulling in the
// "use client" boundary.
export { DataViewSwitcher } from "./DataViewSwitcher";
export { resolveDataView } from "./resolveDataView";
export type { DataViewKind } from "./DataViewKind";
