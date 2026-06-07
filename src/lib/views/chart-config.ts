/**
 * SmartSuite-parity Chart View — config types.
 *
 * One typed config + a row array drives every chart shape we need across
 * the platform (Reports, Carbon, Dashboards, future Saved Views). Pairs
 * with `chart-aggregate.ts` (pure data transforms) and `<ChartView>`
 * (the recharts renderer). See `docs/research/smartsuite-parity/02-views-
 * and-dashboards.md` recommendation #6 for the parity rationale.
 */

export type ChartType =
  | "bar"
  | "column"
  | "line"
  | "area"
  | "pie"
  | "donut"
  | "scatter"
  | "bubble"
  | "composed"
  | "heatmap";

export type Aggregation = "sum" | "avg" | "min" | "max" | "count" | "count_distinct";

/**
 * Tone — semantic color slot. Maps to existing canonical CSS tokens
 * (`--p-info`, `--p-warning`, `--p-danger`, `--p-success`,
 * `--p-accent`, `--p-text-2`) inside `<ChartView>`. Keeps chart
 * colors theme-aware and brand-overlay-aware (ATLVS red, GVTEWAY blue,
 * COMPVSS yellow rotate `accent` automatically).
 */
export type Tone = "info" | "warn" | "error" | "success" | "neutral" | "accent";

export type ChartAxis = {
  /** Field key in the data row. */
  field: string;
  /** Display label. Default = field. */
  label?: string;
  /** Format hint. Default 'auto'. */
  format?: "number" | "currency" | "percent" | "date" | "auto";
  /** Currency code when format='currency'. Default 'USD'. */
  currency?: string;
};

export type ChartSeries = {
  /** Field key for the value. */
  field: string;
  /** Aggregation on the value field, when groupBy is set. Default 'sum'. */
  agg?: Aggregation;
  /** Display label. Default = field. */
  label?: string;
  /** Tone for color (default rotates through palette). */
  tone?: Tone;
  /** Series chart-type override for composed charts. */
  type?: "bar" | "line";
  /** Optional Z-axis field for bubble charts. */
  zField?: string;
};

export type ChartViewConfig = {
  type: ChartType;
  /** X axis (or category for pie). */
  x: ChartAxis;
  /** Y axis (optional, used for value formatting + label). */
  y?: ChartAxis;
  /** Y axes (data series). Multiple series for stacked/composed. */
  series: ChartSeries[];
  /** Group rows by this field before aggregating. Optional. */
  groupBy?: string;
  /** Show legend. Default true. */
  legend?: boolean;
  /** Show grid. Default true. */
  grid?: boolean;
  /** Show tooltip. Default true. */
  tooltip?: boolean;
  /** Stacked layout (for bar/column/area). */
  stacked?: boolean;
  /** Title. */
  title?: string;
  /** Description (sub-title). */
  description?: string;
  /** Sort the X-axis values. Default 'natural' (data order). */
  sortX?: "natural" | "asc" | "desc" | "value-asc" | "value-desc";
  /** Limit to top-N. */
  topN?: number;
  /** Heatmap-only: y-axis field (paired with x for the 2D grid). */
  yField?: string;
  /** Heatmap-only: color scale. Default 'sequential'. */
  colorScale?: "sequential" | "diverging";
};

/**
 * Default tone rotation. `accent` is the org-primary (ATLVS red,
 * GVTEWAY blue, COMPVSS yellow) so unconfigured charts adopt the
 * active brand. Order chosen to maximize hue separation between
 * adjacent series — accent / info / success / warn / error / neutral.
 */
export const DEFAULT_TONE_ROTATION: ReadonlyArray<Tone> = [
  "accent",
  "info",
  "success",
  "warn",
  "error",
  "neutral",
] as const;
