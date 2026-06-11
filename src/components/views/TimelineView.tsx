"use client";

import * as React from "react";
import { DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { Plus } from "lucide-react";

import { EmptyState } from "@/components/ui/EmptyState";
import { useAnnounce } from "@/components/ui/LiveRegion";
import { useT } from "@/lib/i18n/LocaleProvider";
import {
  addDaysUTC,
  barGeometry,
  dateFromPx,
  dateRange,
  monthMarkers,
  pxFromDate,
  startOfDayUTC,
  type TimelineZoom,
} from "@/lib/views/timeline";
import { TimelineBar, type TimelineBarTone } from "./TimelineBar";

export type TimelineLane = {
  id: string;
  title: string;
  /** Optional avatar or icon URL for the lane label. */
  icon?: string;
};

export type TimelineItem = {
  id: string;
  laneId: string;
  title: string;
  start: string; // ISO
  end: string; // ISO
  tone?: TimelineBarTone;
  href?: string;
  /** Optional metadata for caller callbacks. */
  data?: Record<string, unknown>;
};

export type { TimelineZoom };

export type TimelineViewProps = {
  lanes: TimelineLane[];
  items: TimelineItem[];
  /** Initial zoom. Default 'week'. */
  initialZoom?: TimelineZoom;
  /** Width per day in pixels (varies by zoom). */
  pxPerDay?: { day: number; week: number; month: number; quarter: number };
  /** Drag callback — return resolves the move (for optimistic patterns). Optional. */
  onMove?: (itemId: string, newStartISO: string, newEndISO: string) => Promise<void> | void;
  /** Resize callback — caller persists. Optional. */
  onResize?: (itemId: string, edge: "start" | "end", newDateISO: string) => Promise<void> | void;
  /** Click on empty space in a lane — caller can open create modal. */
  onCreate?: (laneId: string, dateISO: string) => void;
  className?: string;
};

const DEFAULT_PX_PER_DAY: TimelineViewProps["pxPerDay"] = {
  day: 60,
  week: 18,
  month: 6,
  quarter: 2,
};

const ZOOMS: TimelineZoom[] = ["day", "week", "month", "quarter"];

const LANE_HEIGHT = 36; // px — the bar lives at top:1, height:7 (28px) inside this row.
const LANE_RAIL_WIDTH = 168; // px — left rail for lane titles.
const HEADER_HEIGHT = 32; // px — top markers rail.

/**
 * <TimelineView> — generic zoomable swimlane chart. SmartSuite Timeline
 * View parity (recommendation #9 in `docs/research/smartsuite-parity/
 * 02-views-and-dashboards.md`). No dependency math — that's Gantt
 * territory and a later phase.
 */
export function TimelineView({
  lanes,
  items,
  initialZoom = "week",
  pxPerDay = DEFAULT_PX_PER_DAY,
  onMove,
  onResize,
  onCreate,
  className,
}: TimelineViewProps): React.ReactElement {
  const [zoom, setZoom] = React.useState<TimelineZoom>(initialZoom);
  const [localItems, setLocalItems] = React.useState<TimelineItem[]>(items);
  React.useEffect(() => setLocalItems(items), [items]);

  const announce = useAnnounce();
  const t = useT();

  const zoomLabel = (z: TimelineZoom): string => {
    const fallbacks: Record<TimelineZoom, string> = {
      day: "Day",
      week: "Week",
      month: "Month",
      quarter: "Quarter",
    };
    return t(`components.timelineView.zoom.${z}`, undefined, fallbacks[z]);
  };

  const { start: anchor, end: rangeEnd } = React.useMemo(() => dateRange(localItems), [localItems]);
  const ppd = pxPerDay?.[zoom] ?? DEFAULT_PX_PER_DAY![zoom];

  const totalDays = Math.max(1, Math.round((rangeEnd.getTime() - anchor.getTime()) / 86_400_000));
  const canvasWidth = totalDays * ppd;

  const markers = React.useMemo(() => monthMarkers(anchor, rangeEnd, zoom, ppd), [anchor, rangeEnd, zoom, ppd]);

  // Today vertical line.
  const today = React.useMemo(() => startOfDayUTC(new Date()), []);
  const todayPx =
    today.getTime() >= anchor.getTime() && today.getTime() <= rangeEnd.getTime()
      ? pxFromDate(today, anchor, ppd)
      : null;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor),
  );

  const scrollerRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to today on mount + when zoom changes (keep today centered-ish).
  React.useEffect(() => {
    if (todayPx == null || !scrollerRef.current) return;
    const el = scrollerRef.current;
    const visible = el.clientWidth - LANE_RAIL_WIDTH;
    el.scrollLeft = Math.max(0, todayPx - visible / 3);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom]);

  // Group items by lane id for fast render.
  const itemsByLane = React.useMemo(() => {
    const out = new Map<string, TimelineItem[]>();
    for (const lane of lanes) out.set(lane.id, []);
    for (const it of localItems) {
      const arr = out.get(it.laneId);
      if (arr) arr.push(it);
    }
    return out;
  }, [localItems, lanes]);

  const onDragEnd = React.useCallback(
    async (e: DragEndEvent) => {
      if (!onMove) return;
      const id = String(e.active.id);
      const dx = e.delta.x;
      if (!dx) return;

      const item = localItems.find((x) => x.id === id);
      if (!item) return;

      const startDate = new Date(item.start);
      const endDate = new Date(item.end);

      // Convert pixel delta back to whole days using current pxPerDay.
      const dayDelta = Math.round(dx / ppd);
      if (!dayDelta) return;

      const newStart = addDaysUTC(startOfDayUTC(startDate), dayDelta).toISOString();
      const newEnd = addDaysUTC(startOfDayUTC(endDate), dayDelta).toISOString();

      const prev = localItems;
      setLocalItems(prev.map((x) => (x.id === id ? { ...x, start: newStart, end: newEnd } : x)));

      try {
        await onMove(id, newStart, newEnd);
        announce(
          Math.abs(dayDelta) === 1
            ? t(
                "components.timelineView.movedOne",
                { title: item.title, count: dayDelta },
                "Moved {title} by {count} day",
              )
            : t(
                "components.timelineView.movedMany",
                { title: item.title, count: dayDelta },
                "Moved {title} by {count} days",
              ),
        );
      } catch (err) {
        setLocalItems(prev);
        announce(
          t("components.timelineView.moveFailed", { title: item.title }, "Move failed for {title}"),
          "assertive",
        );
        if (process.env.NODE_ENV !== "production") {
          console.error("[TimelineView] onMove rejected:", err);
        }
      }
    },
    [onMove, localItems, ppd, announce, t],
  );

  // Resize: pointer-driven on the bar's edge handles. We listen on the
  // window for move/up after the bar dispatches the start.
  const resizeStateRef = React.useRef<{
    id: string;
    edge: "start" | "end";
    originX: number;
    originStart: Date;
    originEnd: Date;
  } | null>(null);

  const handleResizeStart = React.useCallback(
    (id: string, edge: "start" | "end", clientX: number) => {
      const item = localItems.find((x) => x.id === id);
      if (!item) return;
      resizeStateRef.current = {
        id,
        edge,
        originX: clientX,
        originStart: new Date(item.start),
        originEnd: new Date(item.end),
      };

      const onMoveWindow = (ev: PointerEvent) => {
        const st = resizeStateRef.current;
        if (!st) return;
        const dx = ev.clientX - st.originX;
        const dayDelta = Math.round(dx / ppd);
        setLocalItems((prev) =>
          prev.map((x) => {
            if (x.id !== st.id) return x;
            if (st.edge === "start") {
              const next = addDaysUTC(startOfDayUTC(st.originStart), dayDelta);
              if (next.getTime() >= startOfDayUTC(st.originEnd).getTime()) return x;
              return { ...x, start: next.toISOString() };
            }
            const next = addDaysUTC(startOfDayUTC(st.originEnd), dayDelta);
            if (next.getTime() <= startOfDayUTC(st.originStart).getTime()) return x;
            return { ...x, end: next.toISOString() };
          }),
        );
      };

      const onUpWindow = () => {
        window.removeEventListener("pointermove", onMoveWindow);
        window.removeEventListener("pointerup", onUpWindow);
        const st = resizeStateRef.current;
        resizeStateRef.current = null;
        if (!st || !onResize) return;
        // Read latest local state via a setState callback so we get the
        // post-drag dates (since the moves above only mutate via
        // setLocalItems and we can't rely on the closed-over `localItems`).
        setLocalItems((curr) => {
          const found = curr.find((x) => x.id === st.id);
          if (!found) return curr;
          const newDateISO =
            st.edge === "start" ? new Date(found.start).toISOString() : new Date(found.end).toISOString();
          // Fire-and-forget; on rejection, revert to the original.
          Promise.resolve(onResize(st.id, st.edge, newDateISO)).catch((err) => {
            if (process.env.NODE_ENV !== "production") {
              console.error("[TimelineView] onResize rejected:", err);
            }
            setLocalItems((p) =>
              p.map((x) =>
                x.id === st.id
                  ? {
                      ...x,
                      start: st.originStart.toISOString(),
                      end: st.originEnd.toISOString(),
                    }
                  : x,
              ),
            );
            announce(
              t("components.timelineView.resizeFailed", { title: found.title }, "Resize failed for {title}"),
              "assertive",
            );
          });
          announce(t("components.timelineView.resized", { title: found.title }, "Resized {title}"));
          return curr;
        });
      };

      window.addEventListener("pointermove", onMoveWindow);
      window.addEventListener("pointerup", onUpWindow);
    },
    [localItems, ppd, onResize, announce, t],
  );

  const isEmpty = lanes.length === 0;
  if (isEmpty) {
    return (
      <div className={className}>
        <EmptyState
          title={t("components.timelineView.noLanes", undefined, "No Lanes")}
          description={t(
            "components.timelineView.noLanesDesc",
            undefined,
            "Provide at least one lane to render the timeline.",
          )}
        />
      </div>
    );
  }

  // Empty-space click handler — converts pixel offset to a date via the
  // helper, then fires `onCreate(laneId, dateISO)`.
  function handleLaneClick(laneId: string, e: React.MouseEvent<HTMLDivElement>) {
    if (!onCreate) return;
    // Only react to clicks that actually land on the lane background, not
    // a child bar bubble.
    if (e.target !== e.currentTarget) return;
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const px = e.clientX - rect.left;
    const dateISO = dateFromPx(px, anchor, ppd).toISOString();
    onCreate(laneId, dateISO);
  }

  // AX-5 — keyboard-reachable counterpart to the lane click-to-create.
  // The pointer path encodes a date from the click offset; the keyboard
  // path defaults to today when in range, else the range anchor.
  function handleLaneCreateKeyboard(laneId: string) {
    if (!onCreate) return;
    const date = todayPx != null ? today : anchor;
    onCreate(laneId, date.toISOString());
  }

  return (
    <div className={["surface flex flex-col", className ?? ""].join(" ")} data-zoom={zoom}>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 border-b border-[var(--p-border)] px-3 py-2">
        <div className="text-xs font-semibold tracking-wide text-[var(--p-text-2)] uppercase">
          {t("components.timelineView.timeline", undefined, "Timeline")}
        </div>
        <div
          role="tablist"
          aria-label={t("components.timelineView.timelineZoom", undefined, "Timeline zoom")}
          className="inline-flex overflow-hidden rounded-md border border-[var(--p-border)]"
        >
          {ZOOMS.map((z) => (
            <button
              key={z}
              type="button"
              role="tab"
              aria-selected={zoom === z}
              onClick={() => setZoom(z)}
              className={`px-2 py-1 text-xs ${
                zoom === z
                  ? "bg-[var(--p-surface-2)] text-[var(--p-text-1)]"
                  : "text-[var(--p-text-2)] hover:text-[var(--p-text-1)]"
              }`}
            >
              {zoomLabel(z)}
            </button>
          ))}
        </div>
      </div>

      {/* Scroller */}
      <div
        ref={scrollerRef}
        className="relative overflow-x-auto overflow-y-hidden"
        style={{ maxHeight: HEADER_HEIGHT + LANE_HEIGHT * Math.max(1, lanes.length) + 4 }}
      >
        <DndContext sensors={sensors} onDragEnd={onDragEnd}>
          <div className="relative" style={{ width: LANE_RAIL_WIDTH + canvasWidth, minWidth: "100%" }}>
            {/* Sticky top-axis rail */}
            <div
              className="sticky top-0 z-20 flex border-b border-[var(--p-border)] bg-[var(--p-surface)]"
              style={{ height: HEADER_HEIGHT }}
            >
              <div
                className="sticky start-0 z-30 flex shrink-0 items-center border-e border-[var(--p-border)] bg-[var(--p-surface)] px-3 text-[10px] font-semibold tracking-wider text-[var(--p-text-2)] uppercase"
                style={{ width: LANE_RAIL_WIDTH }}
              >
                {t("components.timelineView.lane", undefined, "Lane")}
              </div>
              <div className="relative" style={{ width: canvasWidth }}>
                {markers.map((m, i) => (
                  <div
                    key={`${m.date.toISOString()}-${i}`}
                    className="absolute top-0 flex h-full items-center border-s border-[var(--p-border)] ps-1 font-mono text-[10px] text-[var(--p-text-2)]"
                    style={{ left: m.offset }}
                  >
                    {m.label}
                  </div>
                ))}
                {todayPx != null && (
                  <div
                    aria-hidden="true"
                    className="absolute top-0 h-full"
                    style={{
                      left: todayPx,
                      width: 2,
                      background: "var(--p-danger)",
                    }}
                  />
                )}
              </div>
            </div>

            {/* Lanes */}
            {lanes.map((lane) => {
              const laneItems = itemsByLane.get(lane.id) ?? [];
              return (
                <div
                  key={lane.id}
                  className="group flex border-b border-[var(--p-border)]"
                  style={{ height: LANE_HEIGHT }}
                >
                  {/* Sticky lane label */}
                  <div
                    className="sticky start-0 z-10 flex shrink-0 items-center gap-2 border-e border-[var(--p-border)] bg-[var(--p-surface)] px-3 text-xs font-medium text-[var(--p-text-1)]"
                    style={{ width: LANE_RAIL_WIDTH }}
                  >
                    {lane.icon && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={lane.icon} alt="" aria-hidden="true" className="h-4 w-4 rounded-sm object-cover" />
                    )}
                    <span className="truncate">{lane.title}</span>
                    {onCreate && (
                      <button
                        type="button"
                        onClick={() => handleLaneCreateKeyboard(lane.id)}
                        aria-label={t(
                          "components.timelineView.addToLane",
                          { lane: lane.title },
                          `Add item to ${lane.title}`,
                        )}
                        className="focus-ring ms-auto shrink-0 rounded p-0.5 text-[var(--p-text-2)] opacity-0 transition-opacity group-hover:opacity-100 hover:text-[var(--p-text-1)] focus-visible:opacity-100"
                      >
                        <Plus size={12} aria-hidden="true" />
                      </button>
                    )}
                  </div>

                  {/* Bars region */}
                  <div
                    className="relative cursor-pointer"
                    style={{ width: canvasWidth }}
                    onClick={(e) => handleLaneClick(lane.id, e)}
                    role="presentation"
                  >
                    {/* Today line in body too */}
                    {todayPx != null && (
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute top-0 h-full"
                        style={{
                          left: todayPx,
                          width: 2,
                          background: "var(--p-danger)",
                          opacity: 0.5,
                        }}
                      />
                    )}
                    {laneItems.map((it) => {
                      const start = new Date(it.start);
                      const end = new Date(it.end);
                      const { left, width } = barGeometry(start, end, anchor, ppd);
                      const rangeLabel = formatRange(start, end);
                      return (
                        <TimelineBar
                          key={it.id}
                          id={it.id}
                          laneId={it.laneId}
                          title={it.title}
                          rangeLabel={rangeLabel}
                          left={left}
                          width={width}
                          tone={it.tone}
                          href={it.href}
                          onResizeStart={(edge, clientX) => handleResizeStart(it.id, edge, clientX)}
                          data={it.data}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Items-but-no-lane fallback / empty body */}
            {localItems.length === 0 && (
              <div className="px-3 py-6">
                <EmptyState
                  size="compact"
                  title={t("components.timelineView.noItems", undefined, "No Items in Range")}
                  description={t(
                    "components.timelineView.noItemsDesc",
                    undefined,
                    "Add a record with a start and end date to populate the timeline.",
                  )}
                />
              </div>
            )}
          </div>
        </DndContext>
      </div>
    </div>
  );
}

const RANGE_FMT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

function formatRange(start: Date, end: Date): string {
  const a = RANGE_FMT.format(start);
  const b = RANGE_FMT.format(end);
  if (a === b) return a;
  return `${a} – ${b}`;
}
