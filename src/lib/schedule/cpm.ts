/**
 * Critical Path Method (CPM) — forward + backward pass.
 *
 * Pure functions, no I/O. Server code calls compute() with an in-memory
 * representation of activities + dependencies; the result is the same shape
 * with early_*, late_*, *_float_days, and is_critical populated.
 *
 * Float (slack) semantics:
 *   total_float = LS - ES  (= LF - EF)
 *   free_float  = min(successor ES) - EF
 * Critical path = activities with total_float ≤ 0 (ties counted as critical).
 *
 * Calendar handling is intentionally simplified at this scaffold stage:
 * durations are interpreted as calendar days. A future revision should
 * walk schedule_calendars to skip non-working days, but the storage
 * already supports it (schedule_activities.calendar_id).
 */

const DAY_MS = 24 * 60 * 60 * 1000;

export type DepType = "fs" | "ss" | "ff" | "sf";

export type ActivityInput = {
  id: string;
  duration_days: number;
  constraint_type?:
    | "none"
    | "start_no_earlier_than"
    | "start_no_later_than"
    | "finish_no_earlier_than"
    | "finish_no_later_than"
    | "must_start_on"
    | "must_finish_on"
    | "as_soon_as_possible"
    | "as_late_as_possible";
  constraint_date?: string | null;
};

export type DependencyInput = {
  predecessor_id: string;
  successor_id: string;
  dep_type: DepType;
  lag_days: number;
};

export type ComputedActivity = {
  id: string;
  early_start: string;
  early_finish: string;
  late_start: string;
  late_finish: string;
  total_float_days: number;
  free_float_days: number;
  is_critical: boolean;
};

export type CpmInput = {
  /** Project anchor — the earliest possible date for any activity. */
  data_date: string;
  activities: ActivityInput[];
  dependencies: DependencyInput[];
};

export type CpmResult = {
  activities: ComputedActivity[];
  /** Activities that participate in the critical path. */
  critical_ids: string[];
  /** Project finish (max EF across all activities). */
  project_finish: string;
};

function toMs(d: string): number {
  return new Date(d).getTime();
}

function fromMs(ms: number): string {
  return new Date(ms).toISOString();
}

/**
 * Topological sort by predecessor → successor edges. Detects cycles.
 * Returns null if the graph has a cycle (caller surfaces an error to the user).
 */
function topoSort(activities: ActivityInput[], deps: DependencyInput[]): string[] | null {
  const inDegree = new Map<string, number>();
  const successors = new Map<string, string[]>();
  for (const a of activities) {
    inDegree.set(a.id, 0);
    successors.set(a.id, []);
  }
  for (const d of deps) {
    inDegree.set(d.successor_id, (inDegree.get(d.successor_id) ?? 0) + 1);
    successors.get(d.predecessor_id)!.push(d.successor_id);
  }

  const ready: string[] = [];
  for (const [id, deg] of inDegree) if (deg === 0) ready.push(id);

  const ordered: string[] = [];
  while (ready.length > 0) {
    const id = ready.shift()!;
    ordered.push(id);
    for (const succ of successors.get(id) ?? []) {
      const d = (inDegree.get(succ) ?? 0) - 1;
      inDegree.set(succ, d);
      if (d === 0) ready.push(succ);
    }
  }

  return ordered.length === activities.length ? ordered : null;
}

/**
 * Forward pass — compute earliest start/finish for each activity, respecting
 * dependencies + constraints.
 */
function forwardPass(
  input: CpmInput,
  order: string[],
  predsByActivity: Map<string, DependencyInput[]>,
): Map<string, { es: number; ef: number }> {
  const dataDate = toMs(input.data_date);
  const out = new Map<string, { es: number; ef: number }>();

  for (const id of order) {
    const a = input.activities.find((x) => x.id === id)!;
    const preds = predsByActivity.get(id) ?? [];
    const durMs = a.duration_days * DAY_MS;

    let es = dataDate;
    for (const p of preds) {
      const prev = out.get(p.predecessor_id);
      if (!prev) continue;
      const lagMs = p.lag_days * DAY_MS;
      let candidate: number;
      switch (p.dep_type) {
        case "fs":
          candidate = prev.ef + lagMs;
          break;
        case "ss":
          candidate = prev.ef - a.duration_days * DAY_MS + lagMs; // start aligns w/ start
          candidate = prev.ef - durMs + lagMs;
          break;
        case "ff":
          candidate = prev.ef - durMs + lagMs;
          break;
        case "sf":
          candidate = prev.ef + lagMs - durMs;
          break;
      }
      if (candidate > es) es = candidate;
    }

    // Constraint handling — minimum-viable subset.
    if (a.constraint_type === "start_no_earlier_than" && a.constraint_date) {
      const c = toMs(a.constraint_date);
      if (c > es) es = c;
    }
    if (a.constraint_type === "must_start_on" && a.constraint_date) {
      es = toMs(a.constraint_date);
    }

    const ef = es + durMs;
    out.set(id, { es, ef });
  }

  return out;
}

/**
 * Backward pass — compute latest start/finish working from project finish
 * back through the dependency graph.
 */
function backwardPass(
  input: CpmInput,
  order: string[],
  succsByActivity: Map<string, DependencyInput[]>,
  forward: Map<string, { es: number; ef: number }>,
  projectFinish: number,
): Map<string, { ls: number; lf: number }> {
  const out = new Map<string, { ls: number; lf: number }>();

  for (let i = order.length - 1; i >= 0; i--) {
    const id = order[i]!;
    const a = input.activities.find((x) => x.id === id)!;
    const durMs = a.duration_days * DAY_MS;
    const succs = succsByActivity.get(id) ?? [];

    let lf = projectFinish;
    if (succs.length > 0) {
      lf = Infinity;
      for (const s of succs) {
        const succLs = out.get(s.successor_id);
        if (!succLs) continue;
        const lagMs = s.lag_days * DAY_MS;
        let candidate: number;
        switch (s.dep_type) {
          case "fs":
            candidate = succLs.ls - lagMs;
            break;
          case "ss":
            candidate = succLs.ls - lagMs + durMs;
            break;
          case "ff":
            candidate = succLs.lf - lagMs;
            break;
          case "sf":
            candidate = succLs.lf - lagMs + durMs;
            break;
        }
        if (candidate < lf) lf = candidate;
      }
      if (lf === Infinity) lf = projectFinish;
    }

    const ls = lf - durMs;
    out.set(id, { ls, lf });
  }

  return out;
}

export function compute(input: CpmInput): CpmResult | { error: string } {
  const order = topoSort(input.activities, input.dependencies);
  if (!order) return { error: "Cycle detected in schedule dependencies" };

  const predsByActivity = new Map<string, DependencyInput[]>();
  const succsByActivity = new Map<string, DependencyInput[]>();
  for (const a of input.activities) {
    predsByActivity.set(a.id, []);
    succsByActivity.set(a.id, []);
  }
  for (const d of input.dependencies) {
    predsByActivity.get(d.successor_id)!.push(d);
    succsByActivity.get(d.predecessor_id)!.push(d);
  }

  const forward = forwardPass(input, order, predsByActivity);

  let projectFinish = 0;
  for (const { ef } of forward.values()) if (ef > projectFinish) projectFinish = ef;

  const backward = backwardPass(input, order, succsByActivity, forward, projectFinish);

  // Build the result, computing floats per activity.
  const activities: ComputedActivity[] = [];
  const criticalIds: string[] = [];
  for (const a of input.activities) {
    const fwd = forward.get(a.id)!;
    const bwd = backward.get(a.id)!;
    const totalFloatMs = bwd.ls - fwd.es;
    const totalFloatDays = totalFloatMs / DAY_MS;

    // Free float: min(successor ES) - this EF.
    let freeFloatDays = totalFloatDays;
    const succs = succsByActivity.get(a.id) ?? [];
    if (succs.length > 0) {
      let earliestSuccStart = Infinity;
      for (const s of succs) {
        const succFwd = forward.get(s.successor_id);
        if (!succFwd) continue;
        if (succFwd.es < earliestSuccStart) earliestSuccStart = succFwd.es;
      }
      if (earliestSuccStart !== Infinity) {
        freeFloatDays = (earliestSuccStart - fwd.ef) / DAY_MS;
      }
    }

    const isCritical = totalFloatDays <= 0.0001;
    if (isCritical) criticalIds.push(a.id);

    activities.push({
      id: a.id,
      early_start: fromMs(fwd.es),
      early_finish: fromMs(fwd.ef),
      late_start: fromMs(bwd.ls),
      late_finish: fromMs(bwd.lf),
      total_float_days: Math.round(totalFloatDays * 100) / 100,
      free_float_days: Math.round(freeFloatDays * 100) / 100,
      is_critical: isCritical,
    });
  }

  return { activities, critical_ids: criticalIds, project_finish: fromMs(projectFinish) };
}
