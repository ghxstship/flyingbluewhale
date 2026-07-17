/**
 * Kit 30 — reporting-structure helpers (pure, client-safe).
 *
 * One reporting edge per engagement: `offer_letters.reports_to_crew_member_id`
 * points at another crew member on the same project. The DB deliberately does
 * NOT guard cycles (SPEC §1 — "cycle guard in the action, not the DB"), so
 * every write that sets a reports-to edge MUST call
 * {@link wouldCreateReportingCycle} first.
 *
 * Both helpers are pure over an in-memory edge list so they can be unit-tested
 * without a database and shared verbatim by the console and the field PWA.
 */

export type ReportingEdge = {
  /** The person (crew_member_id — the node key, NOT the letter id). */
  id: string;
  /** Their manager's crew_member_id, or null for a root. */
  reportsTo: string | null;
};

/**
 * Would pointing `personId` at `newManagerId` close a loop?
 *
 * Walks the manager chain upward from `newManagerId` using the CURRENT edges
 * (the candidate edge is implied, not required to be present). Self-reports
 * are cycles by definition. A `visited` set bounds the walk so a pre-existing
 * corrupt cycle in the data can't hang the action.
 */
export function wouldCreateReportingCycle(
  edges: ReportingEdge[],
  personId: string,
  newManagerId: string | null,
): boolean {
  if (!newManagerId) return false;
  if (newManagerId === personId) return true;
  const managerOf = new Map(edges.map((e) => [e.id, e.reportsTo]));
  const visited = new Set<string>();
  let cursor: string | null = newManagerId;
  while (cursor) {
    if (cursor === personId) return true;
    if (visited.has(cursor)) return false; // pre-existing loop elsewhere — not ours
    visited.add(cursor);
    cursor = managerOf.get(cursor) ?? null;
  }
  return false;
}

export type ReportingBranch<T> = {
  node: T;
  /** Direct-report count (children only, not the whole subtree). */
  reportCount: number;
  children: ReportingBranch<T>[];
};

/**
 * Build the indented branch forest for the reporting screen.
 *
 * Roots are nodes whose manager is null OR points outside the node set (a
 * manager engaged on another project still renders their reports as a root
 * branch rather than dropping them). Nodes trapped in a corrupt cycle are
 * emitted as roots too — the screen must render every person exactly once.
 * Sibling order preserves the caller's input order.
 */
export function buildReportingBranches<T extends { id: string; reportsTo: string | null }>(
  nodes: T[],
): ReportingBranch<T>[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const childrenOf = new Map<string, T[]>();
  const roots: T[] = [];
  for (const n of nodes) {
    if (n.reportsTo && byId.has(n.reportsTo) && n.reportsTo !== n.id) {
      const bucket = childrenOf.get(n.reportsTo) ?? [];
      bucket.push(n);
      childrenOf.set(n.reportsTo, bucket);
    } else {
      roots.push(n);
    }
  }

  const emitted = new Set<string>();
  const build = (n: T): ReportingBranch<T> => {
    emitted.add(n.id);
    const kids = (childrenOf.get(n.id) ?? []).filter((k) => !emitted.has(k.id));
    return { node: n, reportCount: kids.length, children: kids.map(build) };
  };

  const forest = roots.map(build);
  // Anything still unemitted sits inside a cycle no root reaches — surface
  // each remaining node as its own root branch (defensive; the action-side
  // cycle guard should make this unreachable).
  for (const n of nodes) {
    if (!emitted.has(n.id)) forest.push(build(n));
  }
  return forest;
}
