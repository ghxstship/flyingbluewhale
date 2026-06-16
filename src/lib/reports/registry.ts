/**
 * Reports & Analytics registry (kit v6.3). The vendored `metrics.json` is the
 * SSOT — the same file the kit's report templates, dashboards, and OpenAPI
 * /metrics + /reports endpoints bind against. A metric definition IS the
 * contract: report templates bind `<span class="mf" data-path="metric.<id>.value">`
 * and dashboards read the same ids. Mirrors the documents registry shape.
 */
import raw from "./metrics.json";

export type MetricFormat = "currency" | "days" | "float" | "int" | "pct" | "ratio" | "score";
export type MetricApp = "ATLVS" | "COMPVSS" | "GVTEWAY" | "LEG3ND" | "ALL";

export type MetricDef = {
  app: MetricApp;
  label: string;
  unit: string;
  format: MetricFormat;
  grain: string;
  direction: "up" | "down";
  target?: number;
  confidence: string;
  formula: string;
  sources: string[];
};

/**
 * A resolved metric: the computed `value` (null = no data → renders "—"), an
 * optional recent `series` (sparkline/trend, normalized later), and a period
 * `delta` (signed % change vs the prior period; null = no comparison).
 */
export type MetricValue = {
  value: number | null;
  series?: number[];
  delta?: number | null;
};
export type MetricValues = Record<string, MetricValue>;

export type ReportKind =
  | "scorecard"
  | "performance"
  | "financial"
  | "utilization"
  | "operations"
  | "revenue"
  | "funnel"
  | "workforce"
  | "compliance";

export type ReportDef = {
  id: string;
  app: MetricApp;
  title: string;
  doc: string;
  cadence: string;
  print: "Wide" | "Letter";
  kind: ReportKind;
  metrics: string[];
  status: "template" | "preconfigured";
};

const data = raw as unknown as {
  version: string;
  metrics: Record<string, Omit<MetricDef, never>>;
  reports: Record<string, Omit<ReportDef, "id">>;
};

export const METRICS: Record<string, MetricDef> = data.metrics as Record<string, MetricDef>;

export const REPORTS: Record<string, ReportDef> = Object.fromEntries(
  Object.entries(data.reports).map(([id, r]) => [id, { id, ...r } as ReportDef]),
);

export const REPORTS_LIST: ReportDef[] = Object.values(REPORTS);
export const METRIC_IDS: string[] = Object.keys(METRICS);

export function getReport(id: string): ReportDef | undefined {
  return REPORTS[id];
}
export function getMetric(id: string): MetricDef | undefined {
  return METRICS[id];
}

const APP_ORDER: MetricApp[] = ["ALL", "ATLVS", "COMPVSS", "GVTEWAY", "LEG3ND"];
export const REPORTS_BY_APP: Record<string, ReportDef[]> = REPORTS_LIST.reduce(
  (acc, r) => {
    (acc[r.app] ??= []).push(r);
    return acc;
  },
  {} as Record<string, ReportDef[]>,
);
export const REPORT_APP_ORDER = APP_ORDER.filter((a) => REPORTS_BY_APP[a]?.length);

/**
 * Format a raw numeric metric value for display per its format/unit. Returns
 * "—" for null/undefined so an unresolved metric renders cleanly (never a
 * crash or a bare 0 masquerading as data).
 */
export function formatMetricValue(value: number | null | undefined, def: Pick<MetricDef, "format" | "unit">): string {
  if (value == null || Number.isNaN(value)) return "—";
  switch (def.format) {
    case "currency": {
      const abs = Math.abs(value);
      if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
      if (abs >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
      return `$${value.toLocaleString("en-US")}`;
    }
    case "pct":
      return `${value.toFixed(value % 1 === 0 ? 0 : 1)}%`;
    case "days":
      return `${value.toFixed(1)}d`;
    case "ratio":
      return `${value.toFixed(2)}×`;
    case "score":
      return value.toFixed(0);
    case "int":
      return Math.round(value).toLocaleString("en-US");
    case "float":
    default:
      return value.toLocaleString("en-US", { maximumFractionDigits: 1 });
  }
}
