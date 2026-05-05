/**
 * Pure data transforms for `<ChartView>`. No I/O, no React, no recharts.
 *
 * Two stages:
 *  1. `aggregateByGroup` — collapse N rows into one row per groupBy value,
 *     applying each series' aggregation (sum / avg / min / max / count /
 *     count_distinct). Skips nulls per the spec (avg denominator excludes
 *     nulls; count_distinct excludes nulls).
 *  2. `pivotForChart` — composes aggregateByGroup with the config's
 *     sortX + topN trim, returning the array recharts consumes directly.
 */

import type { Aggregation, ChartViewConfig } from "./chart-config";

export type AggSeriesSpec = { field: string; agg?: Aggregation };

type AnyRow = Record<string, unknown>;

/**
 * Tracks accumulator state for each (group × series) combination. We
 * keep min/max/sum/count/distinct in one bucket so a single pass covers
 * every aggregation type without redundant scans.
 */
type Accumulator = {
  sum: number;
  count: number;
  nonNullCount: number;
  min: number;
  max: number;
  distinct: Set<unknown>;
  sawNumber: boolean;
};

const newAcc = (): Accumulator => ({
  sum: 0,
  count: 0,
  nonNullCount: 0,
  min: Number.POSITIVE_INFINITY,
  max: Number.NEGATIVE_INFINITY,
  distinct: new Set<unknown>(),
  sawNumber: false,
});

function isNullish(v: unknown): boolean {
  return v === null || v === undefined;
}

function toNumber(v: unknown): number | null {
  if (isNullish(v)) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  if (typeof v === "boolean") return v ? 1 : 0;
  return null;
}

function reduce(acc: Accumulator, raw: unknown): void {
  // count = total rows (incl. nullish — SmartSuite count semantics)
  acc.count += 1;
  if (isNullish(raw)) return;
  acc.distinct.add(raw);
  const n = toNumber(raw);
  if (n === null) return;
  acc.sawNumber = true;
  acc.sum += n;
  acc.nonNullCount += 1;
  if (n < acc.min) acc.min = n;
  if (n > acc.max) acc.max = n;
}

function finalize(acc: Accumulator, agg: Aggregation): number {
  switch (agg) {
    case "sum":
      return acc.sum;
    case "avg":
      return acc.nonNullCount === 0 ? 0 : acc.sum / acc.nonNullCount;
    case "min":
      return acc.sawNumber ? acc.min : 0;
    case "max":
      return acc.sawNumber ? acc.max : 0;
    case "count":
      return acc.count;
    case "count_distinct":
      return acc.distinct.size;
  }
}

/**
 * Aggregate rows by a group field. Returns one output row per distinct
 * groupBy value, with each series field replaced by its aggregated
 * scalar. When `groupBy` is omitted, returns the rows as-is (pass-through
 * for ungrouped charts like single-series time series).
 */
export function aggregateByGroup<T extends AnyRow>(
  rows: T[],
  opts: { groupBy?: string; series: AggSeriesSpec[] },
): Array<AnyRow> {
  if (!opts.groupBy) {
    // Pass-through with a shallow copy so callers can sort/trim without
    // mutating their source data.
    return rows.map((r) => ({ ...r }));
  }

  const groupKey = opts.groupBy;
  // Insertion-ordered Map preserves first-seen order — matches "natural"
  // sort default downstream.
  const buckets = new Map<unknown, { groupValue: unknown; accs: Accumulator[] }>();

  for (const row of rows) {
    const groupValue = row[groupKey];
    let bucket = buckets.get(groupValue);
    if (!bucket) {
      bucket = {
        groupValue,
        accs: opts.series.map(() => newAcc()),
      };
      buckets.set(groupValue, bucket);
    }
    opts.series.forEach((s, i) => {
      reduce(bucket!.accs[i], row[s.field]);
    });
  }

  const out: AnyRow[] = [];
  for (const bucket of buckets.values()) {
    const row: AnyRow = { [groupKey]: bucket.groupValue };
    opts.series.forEach((s, i) => {
      row[s.field] = finalize(bucket.accs[i], s.agg ?? "sum");
    });
    out.push(row);
  }
  return out;
}

/**
 * Compose aggregation + sortX + topN per the config. The output is the
 * array recharts components iterate over. `pivotForChart` is the single
 * call site `<ChartView>` makes.
 */
export function pivotForChart<T extends AnyRow>(rows: T[], config: ChartViewConfig): Array<AnyRow> {
  const aggregated = aggregateByGroup(rows, {
    groupBy: config.groupBy,
    series: config.series.map((s) => ({ field: s.field, agg: s.agg })),
  });

  const xKey = config.x.field;
  const primaryValueKey = config.series[0]?.field;
  const sortX = config.sortX ?? "natural";

  const sorted = [...aggregated];
  if (sortX !== "natural") {
    sorted.sort((a, b) => {
      if (sortX === "asc" || sortX === "desc") {
        const av = a[xKey];
        const bv = b[xKey];
        const cmp = compareValues(av, bv);
        return sortX === "asc" ? cmp : -cmp;
      }
      // value-asc / value-desc → sort by the first series' value
      if (!primaryValueKey) return 0;
      const av = toNumber(a[primaryValueKey]) ?? 0;
      const bv = toNumber(b[primaryValueKey]) ?? 0;
      return sortX === "value-asc" ? av - bv : bv - av;
    });
  }

  if (config.topN && config.topN > 0 && sorted.length > config.topN) {
    return sorted.slice(0, config.topN);
  }
  return sorted;
}

function compareValues(a: unknown, b: unknown): number {
  if (isNullish(a) && isNullish(b)) return 0;
  if (isNullish(a)) return -1;
  if (isNullish(b)) return 1;
  const an = toNumber(a);
  const bn = toNumber(b);
  if (an !== null && bn !== null) return an - bn;
  const as = String(a);
  const bs = String(b);
  return as < bs ? -1 : as > bs ? 1 : 0;
}
