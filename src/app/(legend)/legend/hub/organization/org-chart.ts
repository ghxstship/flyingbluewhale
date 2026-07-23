/**
 * L-P1 org-chart helpers — pure, no I/O.
 *
 * The reporting edge lives on positions.reports_to_position_id. The DB-side
 * trigger (private.positions_no_reporting_cycle) is the backstop; these
 * helpers are the app-side half — the same discipline as the kit-30 roster
 * walker (studio/projects/[projectId]/roster/reporting/cycle.ts): actions
 * check BEFORE writing so the user gets a form error, not a 500, and the
 * renderer can never hang on pre-existing bad data.
 */

/** position id → its reports-to position id (or null). */
export type PositionEdges = ReadonlyMap<string, string | null>;

export type ChartPosition = {
  id: string;
  title: string;
  department_code: string | null;
  seat_count: number;
  reports_to_position_id: string | null;
};

export type PositionNode<P extends ChartPosition = ChartPosition> = {
  position: P;
  children: PositionNode<P>[];
};

export type PositionForest<P extends ChartPosition = ChartPosition> = {
  /** Roots in render order: real roots first (input order), then any
   *  cycle-stranded nodes promoted to roots so nothing is silently dropped. */
  roots: PositionNode<P>[];
  /** Count of edges that resolved to an in-set parent. 0 = flat org. */
  edgeCount: number;
};

/**
 * Would setting `positionId` to report to `parentId` create a cycle?
 *
 * Walks UP from the proposed parent through `edges`; if the chain reaches
 * `positionId`, the edge would close a loop. Self-reporting is a cycle of
 * length one. A `visited` set caps the walk so pre-existing bad data (a
 * cycle already in the store) can never hang the action.
 */
export function wouldCreatePositionCycle(edges: PositionEdges, positionId: string, parentId: string): boolean {
  if (positionId === parentId) return true;
  const visited = new Set<string>();
  let cursor: string | null | undefined = parentId;
  while (cursor) {
    if (cursor === positionId) return true;
    if (visited.has(cursor)) return false; // pre-existing loop that never reaches positionId
    visited.add(cursor);
    cursor = edges.get(cursor) ?? null;
  }
  return false;
}

/**
 * Every position in `positionId`'s subtree, including itself — the set the
 * reports-to select must EXCLUDE (choosing a descendant as parent is a
 * cycle). Cycle-safe: a visited set bounds traversal over bad data.
 */
export function selfAndDescendants(
  positions: ReadonlyArray<Pick<ChartPosition, "id" | "reports_to_position_id">>,
  positionId: string,
): Set<string> {
  const childrenOf = new Map<string, string[]>();
  for (const p of positions) {
    if (!p.reports_to_position_id) continue;
    const bucket = childrenOf.get(p.reports_to_position_id) ?? [];
    bucket.push(p.id);
    childrenOf.set(p.reports_to_position_id, bucket);
  }
  const out = new Set<string>([positionId]);
  const stack = [positionId];
  while (stack.length > 0) {
    const current = stack.pop() as string;
    for (const child of childrenOf.get(current) ?? []) {
      if (out.has(child)) continue; // cycle in the data — already collected
      out.add(child);
      stack.push(child);
    }
  }
  return out;
}

/**
 * Build the reporting forest.
 *
 * Rules:
 *  - A node whose parent is null or NOT in the input set is a root (orphan
 *    edges — e.g. parent archived out of the working set — degrade to roots,
 *    never disappear).
 *  - Children render sorted by title (then id, for a stable tie-break).
 *  - Cycle-safe: nodes trapped in a cycle never reach a root by parent-walk;
 *    after the root DFS, each still-unvisited node (input order) is promoted
 *    to a root and its chain re-walked — the back-edge is skipped by the
 *    visited set, so every node appears exactly once and the walk always
 *    terminates.
 */
export function buildPositionForest<P extends ChartPosition>(positions: ReadonlyArray<P>): PositionForest<P> {
  const byId = new Map(positions.map((p) => [p.id, p]));
  const childrenOf = new Map<string, P[]>();
  let edgeCount = 0;
  for (const p of positions) {
    if (p.reports_to_position_id && byId.has(p.reports_to_position_id) && p.reports_to_position_id !== p.id) {
      const bucket = childrenOf.get(p.reports_to_position_id) ?? [];
      bucket.push(p);
      childrenOf.set(p.reports_to_position_id, bucket);
      edgeCount += 1;
    }
  }

  const byTitle = (a: P, b: P) => a.title.localeCompare(b.title) || a.id.localeCompare(b.id);

  const visited = new Set<string>();
  const attach = (p: P): PositionNode<P> => {
    visited.add(p.id);
    const children = (childrenOf.get(p.id) ?? [])
      .filter((c) => !visited.has(c.id))
      .sort(byTitle)
      .map(attach);
    return { position: p, children };
  };

  const roots: PositionNode<P>[] = [];
  for (const p of positions) {
    const parent = p.reports_to_position_id;
    const isRoot = !parent || parent === p.id || !byId.has(parent);
    if (isRoot && !visited.has(p.id)) roots.push(attach(p));
  }
  // Cycle members: unreachable from any root — promote in input order.
  for (const p of positions) {
    if (!visited.has(p.id)) roots.push(attach(p));
  }
  return { roots, edgeCount };
}
