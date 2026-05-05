"use client";

import * as React from "react";
import { DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useAnnounce } from "@/components/ui/LiveRegion";
import {
  eventsByDay as bucketEventsByDay,
  isoDateUTC,
  reanchorStartISO,
  startOfDayUTC,
  startOfWeekUTC,
  type CalendarEvent,
  type CalendarMode,
} from "@/lib/views/calendar";
import { CalendarMonthGrid } from "./CalendarMonthGrid";
import { CalendarWeekGrid } from "./CalendarWeekGrid";
import { CalendarAgenda } from "./CalendarAgenda";

export type { CalendarEvent, CalendarMode } from "@/lib/views/calendar";

export type CalendarViewProps = {
  events: CalendarEvent[];
  /** Initial mode. Default 'month'. */
  initialMode?: CalendarMode;
  /** Initial date. Default today. */
  initialDate?: Date;
  /** Week start. Default 1 (Monday). */
  weekStart?: 0 | 1;
  /** Drag-to-reschedule callback. Receives event id and new start ISO. */
  onReschedule?: (eventId: string, newStartISO: string) => Promise<void> | void;
  /** Click on a date with no events — caller can open a "create" modal. */
  onCreate?: (dateISO: string) => void;
  /** Custom render for an event chip. Defaults to title + tone-colored chip. */
  renderEvent?: (event: CalendarEvent) => React.ReactNode;
  /** Optional className on the wrapper. */
  className?: string;
};

const MODES: CalendarMode[] = ["month", "week", "day", "agenda"];

const MONTH_LABEL_OPTIONS: Intl.DateTimeFormatOptions = {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
};

const RANGE_LABEL_OPTIONS: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
};

export function CalendarView(props: CalendarViewProps): React.ReactElement {
  const {
    events,
    initialMode = "month",
    initialDate,
    weekStart = 1,
    onReschedule,
    onCreate,
    renderEvent,
    className,
  } = props;

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const announce = useAnnounce();

  const today = React.useMemo(() => startOfDayUTC(new Date()), []);

  // Hydrate state from URL on mount; fall back to props.
  const initialFromUrl = React.useMemo(() => {
    const urlMode = searchParams.get("mode");
    const urlDate = searchParams.get("date");
    const mode = urlMode && (MODES as string[]).includes(urlMode) ? (urlMode as CalendarMode) : initialMode;
    let cursor: Date;
    if (urlDate && /^\d{4}-\d{2}-\d{2}$/.test(urlDate)) {
      cursor = new Date(`${urlDate}T00:00:00Z`);
    } else if (initialDate) {
      cursor = startOfDayUTC(initialDate);
    } else {
      cursor = today;
    }
    return { mode, cursor };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [mode, setMode] = React.useState<CalendarMode>(initialFromUrl.mode);
  const [cursor, setCursor] = React.useState<Date>(initialFromUrl.cursor);

  // Sync URL when state changes — replace history.
  React.useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("mode", mode);
    params.set("date", isoDateUTC(cursor));
    const next = params.toString();
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, cursor]);

  const eventsByKey = React.useMemo(() => bucketEventsByDay(events), [events]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor),
  );

  const onDragEnd = React.useCallback(
    async (e: DragEndEvent) => {
      if (!onReschedule) return;
      const overId = e.over?.id;
      const activeId = e.active?.id;
      if (typeof overId !== "string" || typeof activeId !== "string") return;
      if (!overId.startsWith("day:") || !activeId.startsWith("event:")) return;
      const newDayISO = overId.slice(4);
      const eventId = activeId.slice(6);
      const original = (e.active.data.current as { originalStart?: string } | undefined)?.originalStart;
      if (!original) return;
      const newStartISO = reanchorStartISO(original, newDayISO);
      try {
        await onReschedule(eventId, newStartISO);
        announce(`Rescheduled to ${newDayISO}`);
      } catch {
        announce("Reschedule failed", "assertive");
      }
    },
    [onReschedule, announce],
  );

  function shift(direction: -1 | 1) {
    if (mode === "month") {
      const next = new Date(cursor);
      next.setUTCMonth(next.getUTCMonth() + direction);
      setCursor(startOfDayUTC(next));
      return;
    }
    if (mode === "week" || mode === "agenda") {
      const next = new Date(cursor.getTime() + direction * 7 * 86_400_000);
      setCursor(startOfDayUTC(next));
      return;
    }
    // day
    const next = new Date(cursor.getTime() + direction * 86_400_000);
    setCursor(startOfDayUTC(next));
  }

  function jumpToday() {
    setCursor(today);
  }

  const headerLabel = React.useMemo(() => {
    if (mode === "month") {
      return new Intl.DateTimeFormat(undefined, MONTH_LABEL_OPTIONS).format(cursor);
    }
    if (mode === "week") {
      const start = startOfWeekUTC(cursor, weekStart);
      const end = new Date(start.getTime() + 6 * 86_400_000);
      const fmt = new Intl.DateTimeFormat(undefined, RANGE_LABEL_OPTIONS);
      return `${fmt.format(start)} – ${fmt.format(end)}`;
    }
    if (mode === "day") {
      return new Intl.DateTimeFormat(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      }).format(cursor);
    }
    return "Upcoming";
  }, [mode, cursor, weekStart]);

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div className={`flex flex-col gap-3 ${className ?? ""}`} data-calendar-mode={mode}>
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={jumpToday}>
              Today
            </Button>
            <button
              type="button"
              onClick={() => shift(-1)}
              aria-label="Previous"
              className="rounded p-1 hover:bg-[var(--surface-inset)]"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              type="button"
              onClick={() => shift(1)}
              aria-label="Next"
              className="rounded p-1 hover:bg-[var(--surface-inset)]"
            >
              <ChevronRight size={14} />
            </button>
            <h2 className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">{headerLabel}</h2>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={isoDateUTC(cursor)}
              onChange={(ev) => {
                const v = ev.target.value;
                if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
                  setCursor(new Date(`${v}T00:00:00Z`));
                }
              }}
              aria-label="Jump to date"
              className="rounded border border-[var(--border-color)] bg-[var(--bg-primary)] px-2 py-1 text-xs"
            />
            <div
              role="tablist"
              aria-label="Calendar mode"
              className="inline-flex overflow-hidden rounded-md border border-[var(--border-color)]"
            >
              {MODES.map((m) => (
                <button
                  key={m}
                  type="button"
                  role="tab"
                  aria-selected={mode === m}
                  onClick={() => setMode(m)}
                  className={`px-2 py-1 text-xs capitalize ${
                    mode === m ? "bg-[var(--surface-inset)] text-[var(--text-primary)]" : "text-[var(--text-muted)]"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Body */}
        {mode === "month" && (
          <CalendarMonthGrid
            cursor={cursor}
            weekStart={weekStart}
            eventsByKey={eventsByKey}
            today={today}
            onCreate={onCreate}
            renderEvent={renderEvent}
          />
        )}
        {mode === "week" && (
          <CalendarWeekGrid
            cursor={cursor}
            weekStart={weekStart}
            eventsByKey={eventsByKey}
            today={today}
            onCreate={onCreate}
            renderEvent={renderEvent}
          />
        )}
        {mode === "day" && (
          <CalendarWeekGrid
            cursor={cursor}
            weekStart={weekStart}
            eventsByKey={eventsByKey}
            today={today}
            singleDay
            onCreate={onCreate}
            renderEvent={renderEvent}
          />
        )}
        {mode === "agenda" && <CalendarAgenda cursor={cursor} eventsByKey={eventsByKey} today={today} />}
      </div>
    </DndContext>
  );
}
