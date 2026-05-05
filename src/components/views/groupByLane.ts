/**
 * groupByLane — pure helper for KanbanBoard.
 *
 * Given a flat row set and a `laneOf(row)` projection, returns a Record of
 * lane id → rows in input order. Rows whose lane id is null/undefined are
 * dropped from the result (kanban "off-board" semantics).
 *
 * Testable in isolation from the React rendering surface — callers in
 * `KanbanBoard.tsx` consume this output to assemble the per-lane sortable
 * lists.
 */
export function groupByLane<T>(rows: readonly T[], laneOf: (row: T) => string | null | undefined): Record<string, T[]> {
  const out: Record<string, T[]> = {};
  for (const row of rows) {
    const lane = laneOf(row);
    if (lane == null) continue;
    if (!out[lane]) out[lane] = [];
    out[lane].push(row);
  }
  return out;
}
