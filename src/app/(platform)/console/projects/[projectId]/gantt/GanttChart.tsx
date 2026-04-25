"use client";

import * as React from "react";
import { ChartShell } from "@/components/charts/ChartShell";

export type GanttRow = {
  id: string;
  label: string;
  lane: "Tasks" | "Events";
  start: string;
  end: string;
  status: string;
};

const ROW_HEIGHT = 22;
const HEADER_HEIGHT = 28;
const LABEL_COL = 220;

/**
 * Gantt — SVG bars + dependency-friendly swim-lane layout. Renders bars
 * scaled to a derived window (project range, padded by 7d on each side
 * to keep edge bars visible). Rows are grouped into "Tasks" and "Events"
 * swim lanes; today's date is overlaid as a vertical guide.
 */
export function GanttChart({
  rows,
  projectStart,
  projectEnd,
}: {
  rows: GanttRow[];
  projectStart: string | null;
  projectEnd: string | null;
}) {
  const [now] = React.useState(() => new Date());

  // Compute window: extend project bounds (or row bounds) by ±7 days.
  const allDates = rows.flatMap((r) => [new Date(r.start), new Date(r.end)]);
  if (projectStart) allDates.push(new Date(projectStart));
  if (projectEnd) allDates.push(new Date(projectEnd));
  const minMs = Math.min(...allDates.map((d) => d.getTime()));
  const maxMs = Math.max(...allDates.map((d) => d.getTime()));
  const pad = 7 * 86400000;
  const windowStart = minMs - pad;
  const windowEnd = maxMs + pad;
  const totalMs = Math.max(windowEnd - windowStart, 86400000);

  // Group into lanes for swim-lane styling.
  const lanes: Array<"Tasks" | "Events"> = ["Tasks", "Events"];
  const grouped: Record<"Tasks" | "Events", GanttRow[]> = {
    Tasks: rows.filter((r) => r.lane === "Tasks"),
    Events: rows.filter((r) => r.lane === "Events"),
  };

  // Linear list with a small header per lane.
  type Line =
    | { kind: "header"; lane: "Tasks" | "Events" }
    | { kind: "row"; row: GanttRow };
  const lines: Line[] = [];
  for (const l of lanes) {
    if (grouped[l].length === 0) continue;
    lines.push({ kind: "header", lane: l });
    for (const r of grouped[l]) lines.push({ kind: "row", row: r });
  }

  const width = 1100; // logical SVG width — scales via viewBox
  const innerWidth = width - LABEL_COL;
  const height = HEADER_HEIGHT + lines.length * ROW_HEIGHT + 8;

  const xFor = (ms: number) =>
    LABEL_COL + ((ms - windowStart) / totalMs) * innerWidth;

  // Month gridlines at first of each month within window.
  const monthTicks: { x: number; label: string }[] = [];
  {
    const cursor = new Date(windowStart);
    cursor.setDate(1);
    cursor.setHours(0, 0, 0, 0);
    while (cursor.getTime() <= windowEnd) {
      monthTicks.push({
        x: xFor(cursor.getTime()),
        label: cursor.toLocaleDateString(undefined, { month: "short", year: "2-digit" }),
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }
  }

  return (
    <ChartShell
      title="Gantt"
      description={`${rows.length} bar${rows.length === 1 ? "" : "s"} across Tasks + Events`}
      empty={rows.length === 0}
      height={height + 32}
    >
      <div className="overflow-x-auto">
        <svg
          width="100%"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="xMinYMin meet"
          className="font-sans"
          role="img"
          aria-label="Gantt chart"
        >
          {/* Header band */}
          <rect x={0} y={0} width={width} height={HEADER_HEIGHT} fill="var(--surface-inset)" />
          <line x1={LABEL_COL} y1={HEADER_HEIGHT} x2={width} y2={HEADER_HEIGHT} stroke="var(--border-color)" />

          {/* Month tick labels + verticals */}
          {monthTicks.map((t, i) => (
            <g key={i}>
              <line
                x1={t.x}
                y1={HEADER_HEIGHT}
                x2={t.x}
                y2={height}
                stroke="var(--border-color)"
                strokeDasharray="2 4"
                opacity={0.6}
              />
              <text x={t.x + 4} y={HEADER_HEIGHT - 8} fontSize={10} fill="var(--text-muted)">
                {t.label}
              </text>
            </g>
          ))}

          {/* Today line */}
          {now.getTime() >= windowStart && now.getTime() <= windowEnd && (
            <g>
              <line
                x1={xFor(now.getTime())}
                y1={HEADER_HEIGHT - 4}
                x2={xFor(now.getTime())}
                y2={height}
                stroke="var(--org-primary)"
                strokeWidth={1}
              />
              <text
                x={xFor(now.getTime()) + 4}
                y={HEADER_HEIGHT - 12}
                fontSize={9}
                fill="var(--org-primary)"
              >
                Today
              </text>
            </g>
          )}

          {/* Bars */}
          {lines.map((line, idx) => {
            const y = HEADER_HEIGHT + idx * ROW_HEIGHT;
            if (line.kind === "header") {
              return (
                <g key={`h-${idx}`}>
                  <rect x={0} y={y} width={width} height={ROW_HEIGHT} fill="var(--surface-inset)" />
                  <text
                    x={12}
                    y={y + ROW_HEIGHT / 2 + 4}
                    fontSize={10}
                    fill="var(--text-muted)"
                    style={{
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                      fontWeight: 600,
                    }}
                  >
                    {line.lane}
                  </text>
                </g>
              );
            }
            const r = line.row;
            const startMs = new Date(r.start).getTime();
            const endMs = Math.max(new Date(r.end).getTime(), startMs + 12 * 3600000);
            const x = xFor(startMs);
            const w = Math.max(xFor(endMs) - x, 4);
            const tone = barTone(r.lane, r.status);
            return (
              <g key={r.id}>
                <text
                  x={12}
                  y={y + ROW_HEIGHT / 2 + 4}
                  fontSize={10}
                  fill="var(--text-secondary)"
                  style={{ pointerEvents: "none" }}
                >
                  {trim(r.label, 32)}
                </text>
                <rect
                  x={x}
                  y={y + 4}
                  width={w}
                  height={ROW_HEIGHT - 8}
                  rx={3}
                  fill={tone}
                  fillOpacity={0.85}
                >
                  <title>
                    {r.label} · {fmtRange(r.start, r.end)} · {r.status}
                  </title>
                </rect>
              </g>
            );
          })}
        </svg>
      </div>
    </ChartShell>
  );
}

function barTone(lane: "Tasks" | "Events", status: string): string {
  if (lane === "Events") {
    if (status === "live") return "#22c55e";
    if (status === "completed") return "#94a3b8";
    if (status === "cancelled") return "#ef4444";
    return "var(--org-primary)";
  }
  if (status === "done") return "#22c55e";
  if (status === "blocked") return "#ef4444";
  if (status === "in_progress") return "var(--org-primary)";
  if (status === "review") return "#f59e0b";
  return "#94a3b8";
}

function fmtRange(start: string, end: string): string {
  const fmt = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });
  return `${fmt.format(new Date(start))} – ${fmt.format(new Date(end))}`;
}

function trim(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
