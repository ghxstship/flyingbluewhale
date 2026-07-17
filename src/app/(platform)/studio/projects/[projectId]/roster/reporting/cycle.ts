/**
 * Kit 30 reporting-tree cycle guard — pure, no I/O.
 *
 * The reporting edge lives on offer_letters.reports_to_crew_member_id with
 * no DB-side cycle protection (per the kit spec: "cycle guard in the action,
 * not the DB"). These helpers are the one shared walker both the Assign
 * drawer and the Edit Reports action call before writing an edge.
 */

/** person (crew_member_id) → their manager's crew_member_id (or null). */
export type ReportingEdges = ReadonlyMap<string, string | null>;

/**
 * Would setting `personId` to report to `managerId` create a cycle?
 *
 * Walks UP from the proposed manager through `edges`; if the chain reaches
 * `personId`, the assignment would close a loop. Self-reporting is a cycle
 * of length one. A `visited` set caps the walk so pre-existing bad data
 * (a cycle already in the store) can never hang the action.
 */
export function wouldCreateReportingCycle(edges: ReportingEdges, personId: string, managerId: string): boolean {
  if (personId === managerId) return true;
  const visited = new Set<string>();
  let cursor: string | null | undefined = managerId;
  while (cursor) {
    if (cursor === personId) return true;
    if (visited.has(cursor)) return false; // pre-existing loop that never reaches personId
    visited.add(cursor);
    cursor = edges.get(cursor) ?? null;
  }
  return false;
}

/**
 * Validate a batch of simultaneous edge assignments (the Edit Reports
 * drawer sets several people under one manager in a single save).
 *
 * The proposed edges are applied to a copy FIRST, then each person is
 * checked — so "A under B" and "B under A" in the same batch is caught
 * even though neither edge exists yet.
 *
 * Returns the first offending person id, or null when the batch is safe.
 */
export function findReportingCycle(
  edges: ReportingEdges,
  assignments: ReadonlyArray<{ personId: string; managerId: string }>,
): string | null {
  const proposed = new Map(edges);
  for (const a of assignments) proposed.set(a.personId, a.managerId);
  for (const a of assignments) {
    // The walker stops the moment it reaches personId (before following
    // personId's own outgoing edge), so checking against the fully-applied
    // proposed map is safe — no need to strip the edge being replaced.
    if (wouldCreateReportingCycle(proposed, a.personId, a.managerId)) return a.personId;
  }
  return null;
}
