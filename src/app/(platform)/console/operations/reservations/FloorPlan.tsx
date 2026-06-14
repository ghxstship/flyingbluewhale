"use client";

import { useRouter } from "next/navigation";
import {
  RESERVATION_STATE_LABELS,
  tableStateForReservation,
  VENUE_TABLE_STATE_LABELS,
  type ReservationState,
  type VenueTableState,
} from "@/lib/reservations";

export type FloorPlanTable = {
  id: string;
  table_no: string;
  seats: number;
  zone: string | null;
  x: number;
  y: number;
  /** Active reservation occupying this table, if any. */
  reservation_state: ReservationState | null;
};

/** Fill color (a CSS var) for a table given its effective state. */
function fillVar(effective: VenueTableState): string {
  switch (effective) {
    case "occupied":
      return "var(--p-danger)";
    case "reserved":
      return "var(--p-warning)";
    case "out_of_service":
      return "var(--p-text-3)";
    case "available":
    default:
      return "var(--p-success)";
  }
}

/**
 * Read-only floor-plan canvas. Renders each venue table at its stored (x, y)
 * grid position on an SVG board, tinted by the state of any active
 * reservation. Clicking a table with a live reservation deep-links to it;
 * otherwise it opens the new-reservation form pre-seeded with the table.
 *
 * Positions are normalized to a 0–100 grid; the SVG viewBox scales them to
 * the container. All color comes from `--p-*` vars — no raw hex.
 */
export function FloorPlan({ tables, emptyLabel }: { tables: FloorPlanTable[]; emptyLabel: string }) {
  const router = useRouter();

  if (tables.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-md text-sm text-[var(--p-text-2)]"
        style={{ minHeight: "12rem", border: "1px dashed var(--p-border)" }}
      >
        {emptyLabel}
      </div>
    );
  }

  const W = 100;
  const H = 60;
  const R = 4.5;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Venue floor plan"
      className="w-full"
      style={{
        background: "var(--p-surface-2)",
        border: "1px solid var(--p-border)",
        borderRadius: "0.5rem",
        aspectRatio: `${W} / ${H}`,
      }}
    >
      {tables.map((tbl) => {
        const effective: VenueTableState =
          (tbl.reservation_state && tableStateForReservation(tbl.reservation_state)) || "available";
        const cx = Math.max(R, Math.min(W - R, tbl.x));
        const cy = Math.max(R, Math.min(H - R, tbl.y));
        const stateLabel = tbl.reservation_state
          ? RESERVATION_STATE_LABELS[tbl.reservation_state]
          : VENUE_TABLE_STATE_LABELS.available;
        const goto = `/console/operations/reservations/new?tableId=${tbl.id}`;
        return (
          <g
            key={tbl.id}
            style={{ cursor: "pointer" }}
            onClick={() => router.push(goto)}
            role="button"
            aria-label={`Table ${tbl.table_no}, ${tbl.seats} seats, ${stateLabel}`}
          >
            <circle
              cx={cx}
              cy={cy}
              r={R}
              style={{ fill: fillVar(effective), stroke: "var(--p-border)", strokeWidth: 0.3 }}
            />
            <text
              x={cx}
              y={cy + 1}
              textAnchor="middle"
              style={{ fill: "var(--p-text-1)", fontSize: "2.4px", fontWeight: 600 }}
            >
              {tbl.table_no}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
