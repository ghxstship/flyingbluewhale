"use client";

import * as React from "react";
import { GanttChart, type GanttRow, type GanttZoom } from "@/components/ui/GanttChart";

/**
 * Client wrapper around the kit <GanttChart> (kit v7 §4) — holds the day/week/
 * month zoom state for the project Timeline route. Rows + today are computed
 * server-side from real tasks/events; this only owns the zoom lever.
 */
export function TimelineGantt({ rows, today }: { rows: GanttRow[]; today: number }): React.ReactElement {
  const [zoom, setZoom] = React.useState<GanttZoom>("week");
  return <GanttChart rows={rows} zoom={zoom} onChangeZoom={setZoom} today={today} />;
}
