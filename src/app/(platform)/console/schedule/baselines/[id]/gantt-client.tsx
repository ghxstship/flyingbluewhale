"use client";

import { useCallback, useMemo, useState } from "react";

/**
 * Lightweight SVG Gantt chart (gap D20 client / G-001 runtime UX).
 *
 * Pure SVG so it scales cleanly + prints + needs no commercial license
 * and no extra deps. Renders the baseline's activities sorted by
 * start_planned, with CPM-derived critical-path highlighting + FS
 * dependency arrows.
 *
 * Lookahead modes: full / 3-week / 6-week, gated by the activity's
 * start window vs now.
 */

type Activity = {
  id: string;
  code: string;
  name: string;
  start_planned: string;
  finish_planned: string;
  duration_days: number;
  total_float_days: number | null;
  is_critical: boolean;
  percent_complete: number;
};

type Dependency = {
  predecessor_id: string;
  successor_id: string;
  dep_type: "fs" | "ss" | "ff" | "sf";
  lag_days: number;
};

type Props = {
  activities: Activity[];
  dependencies: Dependency[];
};

type Lookahead = "all" | "3w" | "6w";

const ROW_H = 22;
const HEADER_H = 36;
const LABEL_W = 280;
const DAY_W = 18; // px per day
const PADDING = 16;
const CRITICAL_COLOR = "#DC2626";
const NORMAL_COLOR = "#1F2937";
const ARROW_COLOR = "#94A3B8";
const GRID_LINE_COLOR = "var(--border-color)";
const LABEL_MUTED_COLOR = "var(--text-muted)";
const TODAY_MARK_COLOR = "var(--color-info)";
const LABEL_BODY_COLOR = "var(--foreground)";

function dayDiff(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / 86_400_000);
}

export default function GanttClient({ activities, dependencies }: Props) {
  const [lookahead, setLookahead] = useState<Lookahead>("all");
  const [showFloat, setShowFloat] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // ── Filter by lookahead window ─────────────────────────────────────────
  const filteredActivities = useMemo(() => {
    if (lookahead === "all") return activities;
    const now = new Date();
    const days = lookahead === "3w" ? 21 : 42;
    const horizon = new Date(now.getTime() + days * 86_400_000);
    return activities.filter((a) => {
      const start = new Date(a.start_planned);
      const finish = new Date(a.finish_planned);
      return finish >= now && start <= horizon;
    });
  }, [activities, lookahead]);

  // ── Resolve chart bounds ───────────────────────────────────────────────
  const { earliest, latest, spanDays, byId } = useMemo(() => {
    if (filteredActivities.length === 0) {
      return { earliest: new Date(), latest: new Date(), spanDays: 30, byId: new Map() };
    }
    const dates = filteredActivities.flatMap((a) => [new Date(a.start_planned), new Date(a.finish_planned)]);
    const e = new Date(Math.min(...dates.map((d) => d.getTime())));
    const l = new Date(Math.max(...dates.map((d) => d.getTime())));
    const m = new Map<string, Activity>();
    for (const a of filteredActivities) m.set(a.id, a);
    return { earliest: e, latest: l, spanDays: Math.max(1, dayDiff(l, e) + 1), byId: m };
  }, [filteredActivities]);

  const chartW = spanDays * DAY_W;
  const chartH = filteredActivities.length * ROW_H;
  const totalW = LABEL_W + chartW + PADDING * 2;
  const totalH = HEADER_H + chartH + PADDING * 2;

  // ── Week / month grid ──────────────────────────────────────────────────
  const monthMarks = useMemo(() => {
    const marks: Array<{ x: number; label: string }> = [];
    const start = new Date(earliest);
    start.setUTCDate(1);
    for (let d = new Date(start); d <= latest; d.setUTCMonth(d.getUTCMonth() + 1)) {
      const x = LABEL_W + dayDiff(d, earliest) * DAY_W;
      if (x >= LABEL_W) {
        marks.push({ x, label: d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }) });
      }
    }
    return marks;
  }, [earliest, latest]);

  const xForDate = useCallback((s: string): number => {
    return LABEL_W + dayDiff(new Date(s), earliest) * DAY_W;
  }, [earliest]);

  const rendered = filteredActivities.map((a, i) => {
    const x = xForDate(a.start_planned);
    const w = Math.max(2, xForDate(a.finish_planned) - x);
    const y = HEADER_H + i * ROW_H + 4;
    const color = a.is_critical ? CRITICAL_COLOR : NORMAL_COLOR;
    const fillW = (w * Number(a.percent_complete)) / 100;
    return { a, x, w, y, color, fillW };
  });

  // ── Dependency arrows (FS shown; SS/FF/SF would clutter at this density) ─
  const arrowPaths = useMemo(() => {
    const paths: Array<{ d: string; key: string }> = [];
    for (const dep of dependencies) {
      if (dep.dep_type !== "fs") continue;
      const p = byId.get(dep.predecessor_id);
      const s = byId.get(dep.successor_id);
      if (!p || !s) continue;
      const x1 = xForDate(p.finish_planned);
      const i1 = filteredActivities.indexOf(p);
      const i2 = filteredActivities.indexOf(s);
      if (i1 < 0 || i2 < 0) continue;
      const y1 = HEADER_H + i1 * ROW_H + ROW_H / 2;
      const x2 = xForDate(s.start_planned);
      const y2 = HEADER_H + i2 * ROW_H + ROW_H / 2;
      const midX = x1 + 8;
      paths.push({
        key: `${dep.predecessor_id}-${dep.successor_id}`,
        d: `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`,
      });
    }
    return paths;
  }, [dependencies, byId, filteredActivities, xForDate]);

  // Today marker.
  const todayX = LABEL_W + dayDiff(new Date(), earliest) * DAY_W;

  return (
    <div className="space-y-3">
      <div className="surface flex flex-wrap items-center gap-3 p-2 text-xs">
        <span className="font-mono text-[var(--text-muted)] uppercase">Lookahead</span>
        {(["all", "3w", "6w"] as const).map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => setLookahead(opt)}
            className={`rounded border border-[var(--border-color)] px-2 py-1 ${
              lookahead === opt ? "bg-[var(--surface-raised)] text-[var(--text-primary)]" : "text-[var(--text-muted)]"
            }`}
          >
            {opt === "all" ? "Full" : opt === "3w" ? "3-week" : "6-week"}
          </button>
        ))}
        <label className="flex items-center gap-1">
          <input type="checkbox" checked={showFloat} onChange={(e) => setShowFloat(e.target.checked)} />
          Show float
        </label>
        <span className="ms-auto font-mono text-[var(--text-muted)]">
          {filteredActivities.length} of {activities.length} activities
        </span>
      </div>

      <div className="surface overflow-auto p-2" style={{ maxHeight: "75vh" }}>
        <svg width={totalW} height={totalH} role="img" aria-label="Gantt chart">
          {/* Month grid */}
          <g>
            {monthMarks.map((m) => (
              <g key={m.x}>
                <line x1={m.x} y1={HEADER_H - 12} x2={m.x} y2={HEADER_H + chartH} stroke={GRID_LINE_COLOR} strokeWidth={1} />
                <text x={m.x + 4} y={HEADER_H - 16} fontSize="10" fill={LABEL_MUTED_COLOR}>
                  {m.label}
                </text>
              </g>
            ))}
          </g>

          {/* Today line */}
          {todayX >= LABEL_W && todayX <= LABEL_W + chartW && (
            <g>
              <line
                x1={todayX}
                y1={HEADER_H - 12}
                x2={todayX}
                y2={HEADER_H + chartH}
                stroke={TODAY_MARK_COLOR}
                strokeWidth={1.5}
                strokeDasharray="3 3"
              />
              <text x={todayX + 4} y={HEADER_H - 2} fontSize="10" fill={TODAY_MARK_COLOR}>
                today
              </text>
            </g>
          )}

          {/* Row labels */}
          {rendered.map(({ a, y }) => (
            <text key={`label-${a.id}`} x={4} y={y + ROW_H / 2 + 4} fontSize="11" fill={LABEL_BODY_COLOR}>
              <tspan fontFamily="ui-monospace, monospace" fill={LABEL_MUTED_COLOR}>
                {a.code}
              </tspan>
              <tspan dx="6">{a.name.length > 30 ? a.name.slice(0, 30) + "…" : a.name}</tspan>
            </text>
          ))}

          {/* Bars */}
          {rendered.map(({ a, x, w, y, color, fillW }) => (
            <g
              key={a.id}
              onMouseEnter={() => setHoveredId(a.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{ cursor: "pointer" }}
            >
              {/* Float bar (only if non-critical) */}
              {showFloat && !a.is_critical && a.total_float_days != null && Number(a.total_float_days) > 0 && (
                <rect
                  x={x + w}
                  y={y + ROW_H / 2 - 2}
                  width={Number(a.total_float_days) * DAY_W}
                  height={4}
                  fill={color}
                  fillOpacity={0.2}
                />
              )}
              <rect
                x={x}
                y={y}
                width={w}
                height={ROW_H - 6}
                rx={2}
                fill={color}
                fillOpacity={0.18}
                stroke={color}
                strokeWidth={hoveredId === a.id ? 2 : 1}
              />
              <rect x={x} y={y} width={fillW} height={ROW_H - 6} rx={2} fill={color} fillOpacity={0.7} />
            </g>
          ))}

          {/* Dependency arrows */}
          <g stroke={ARROW_COLOR} fill="none" strokeWidth={1}>
            {arrowPaths.map((p) => (
              <path key={p.key} d={p.d} markerEnd="url(#arrowHead)" />
            ))}
          </g>

          <defs>
            <marker id="arrowHead" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M0,0 L10,5 L0,10 z" fill={ARROW_COLOR} />
            </marker>
          </defs>
        </svg>
      </div>

      <div className="text-[10px] text-[var(--text-muted)]">
        Red bars are on the critical path (total float ≤ 0). Light bars to the right of non-critical activities show
        available float. FS dependencies render as elbow arrows.
      </div>
    </div>
  );
}
