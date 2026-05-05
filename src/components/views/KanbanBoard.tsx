"use client";

import * as React from "react";
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";

import { EmptyState } from "@/components/ui/EmptyState";
import { useAnnounce } from "@/components/ui/LiveRegion";
import { KanbanCard } from "./KanbanCard";
import { KanbanLane, type KanbanLaneTone } from "./KanbanLane";
import { groupByLane } from "./groupByLane";

export type KanbanLane<T> = {
  /** Lane key (status enum value). */
  id: string;
  /** Human label. */
  title: string;
  /** Header chip color. */
  tone?: KanbanLaneTone;
  /** Lock lane from drops (e.g. terminal "closed" lane sometimes). */
  locked?: boolean;
  /** Phantom — keeps the type variable referenced for caller-side narrowing. */
  _row?: T;
};

export type KanbanBoardProps<T extends { id: string }> = {
  rows: T[];
  lanes: KanbanLane<T>[];
  /** Maps a row to its lane id. Returns null/undefined to drop the row from the board. */
  laneOf: (row: T) => string | null | undefined;
  /** Renders the card content. Card chrome (border) is provided. */
  renderCard: (row: T) => React.ReactNode;
  /**
   * Drop target — caller persists the change. Receives the moved row's id and the
   * destination lane id. The component updates its local state optimistically and
   * reverts if the promise rejects.
   */
  onMove: (rowId: string, toLaneId: string) => Promise<void> | void;
  /** Optional: when provided, click takes user to detail. */
  hrefOf?: (row: T) => string | undefined;
  /** Optional: WIP limit per lane. Render badge when over. */
  wipLimit?: Record<string, number>;
  /** Density. Default 'comfortable'. */
  density?: "comfortable" | "compact";
  /** Optional: lane drag-reorder. Default false. (Reserved for a follow-up.) */
  reorderableLanes?: boolean;
  /** Empty-board copy. */
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
};

/**
 * KanbanBoard — generic drag-and-drop board for any status-bearing table.
 *
 * The component owns local optimistic state so drops are instant; the
 * caller's `onMove` is awaited and any rejection rolls the move back.
 *
 * Accessibility:
 *  - Each lane is a `role="region"` with an aria-label.
 *  - dnd-kit's `KeyboardSensor` provides Space-to-pick-up / arrow-to-move /
 *    Enter-to-drop semantics out of the box.
 *  - On every successful move we emit a polite live-region announcement
 *    ("Moved <row> from <A> to <B>") via the existing `useAnnounce` helper.
 */
export function KanbanBoard<T extends { id: string }>({
  rows,
  lanes,
  laneOf,
  renderCard,
  onMove,
  hrefOf,
  wipLimit,
  density = "comfortable",
  emptyTitle = "Nothing to show",
  emptyDescription = "Add a record to start populating this board.",
  className = "",
}: KanbanBoardProps<T>): React.ReactElement {
  // Local optimistic copy of the rows. Reset whenever the upstream `rows`
  // identity changes — server pages re-render with fresh data after the
  // server action completes, and we trust that as the source of truth.
  const [localRows, setLocalRows] = React.useState<T[]>(rows);
  React.useEffect(() => {
    setLocalRows(rows);
  }, [rows]);

  const announce = useAnnounce();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const grouped = React.useMemo(() => groupByLane(localRows, laneOf), [localRows, laneOf]);
  const laneIds = React.useMemo(() => lanes.map((l) => l.id), [lanes]);
  const lanesById = React.useMemo(() => {
    const m = new Map<string, KanbanLane<T>>();
    for (const lane of lanes) m.set(lane.id, lane);
    return m;
  }, [lanes]);

  const isEmpty = localRows.length === 0;

  const handleDragEnd = React.useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over) return;
      const rowId = String(active.id);
      const sourceLane =
        (active.data.current?.lane as string | undefined) ??
        (() => {
          const r = localRows.find((x) => x.id === rowId);
          return r ? (laneOf(r) ?? undefined) : undefined;
        })();

      // `over.id` is either a lane id (when dropping on the lane container)
      // or another card's id (when dropping on a sortable item). Resolve
      // both cases to a lane id.
      let destLane: string | undefined;
      if (laneIds.includes(String(over.id))) {
        destLane = String(over.id);
      } else {
        destLane = (over.data.current?.lane as string | undefined) ?? undefined;
        if (!destLane) {
          // Try to look the row up in our local state.
          const overRow = localRows.find((x) => x.id === String(over.id));
          if (overRow) destLane = laneOf(overRow) ?? undefined;
        }
      }
      if (!destLane || !sourceLane) return;
      if (destLane === sourceLane) return;

      const destLaneCfg = lanesById.get(destLane);
      if (destLaneCfg?.locked) return;

      // Optimistic update. Replace the row's lane projection by patching
      // its `status`-shaped field — but since we only know it through the
      // `laneOf` projector, we re-route by stashing an override map.
      const prev = localRows;
      const moved = prev.find((x) => x.id === rowId);
      if (!moved) return;

      const next = prev.map((r) =>
        r.id === rowId ? ({ ...(r as object), [findStatusKey(r, sourceLane)]: destLane } as T) : r,
      );
      setLocalRows(next);

      const sourceTitle = lanesById.get(sourceLane)?.title ?? sourceLane;
      const destTitle = destLaneCfg?.title ?? destLane;

      try {
        await onMove(rowId, destLane);
        announce(`Moved card from ${sourceTitle} to ${destTitle}`);
      } catch (err) {
        // Roll back on failure.
        setLocalRows(prev);
        announce(`Move failed: could not move card to ${destTitle}`, "assertive");
        // Surface to console so devs can diagnose; the user already sees a revert.
        if (process.env.NODE_ENV !== "production") {
          console.error("[KanbanBoard] onMove rejected:", err);
        }
      }
    },
    [localRows, laneIds, laneOf, lanesById, onMove, announce],
  );

  if (isEmpty) {
    return (
      <div className={className}>
        <EmptyState title={emptyTitle} description={emptyDescription} />
      </div>
    );
  }

  return (
    <div className={className}>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="flex w-full snap-x gap-3 overflow-x-auto pb-2">
          {lanes.map((lane) => {
            const items = grouped[lane.id] ?? [];
            const itemIds = items.map((r) => r.id);
            return (
              <KanbanLane
                key={lane.id}
                id={lane.id}
                title={lane.title}
                count={items.length}
                tone={lane.tone}
                locked={lane.locked}
                wipLimit={wipLimit?.[lane.id]}
                density={density}
              >
                <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
                  {items.map((row) => (
                    <KanbanCard key={row.id} id={row.id} laneId={lane.id} href={hrefOf?.(row)} density={density}>
                      {renderCard(row)}
                    </KanbanCard>
                  ))}
                </SortableContext>
              </KanbanLane>
            );
          })}
        </div>
      </DndContext>
    </div>
  );
}

/**
 * Best-effort heuristic to find the status key on the row so we can
 * optimistically update local state by mutating that field. We pick the
 * first key whose value matches the current source lane id. Falls back
 * to "status" — every table in the schema we wire uses that name.
 */
function findStatusKey(row: unknown, sourceLane: string): string {
  if (row && typeof row === "object") {
    for (const [k, v] of Object.entries(row as Record<string, unknown>)) {
      if (v === sourceLane) return k;
    }
  }
  return "status";
}
