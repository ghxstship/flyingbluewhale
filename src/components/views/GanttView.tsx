"use client";

/**
 * <GanttView> — alias of <TimelineView>.
 *
 * The `ViewType` union (`src/lib/views/types.ts`) lists both `"timeline"`
 * and `"gantt"`. In this codebase they render the same swimlane bar chart:
 * `<TimelineView>` is the zoomable (day/week/month/quarter) bar renderer
 * over date-bearing rows. The only conceptual difference SmartSuite/
 * ClickUp draw between "timeline" and "gantt" is dependency arrows
 * (finish-to-start links) — which `<TimelineView>` deliberately does NOT
 * draw yet (see its header note: "No dependency math — that's Gantt
 * territory and a later phase").
 *
 * Until dependency rendering lands, `gantt` and `timeline` are
 * equivalent, so `GanttView` re-exports the timeline implementation
 * rather than forking it. A future phase can swap this alias for a real
 * dependency-aware component without touching any caller that imported
 * `GanttView`.
 */

export { TimelineView as GanttView } from "./TimelineView";
export type {
  TimelineViewProps as GanttViewProps,
  TimelineLane as GanttLane,
  TimelineItem as GanttItem,
  TimelineZoom as GanttZoom,
} from "./TimelineView";
