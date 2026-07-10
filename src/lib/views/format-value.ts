/**
 * Axis/tick value formatting shared by `<ChartView>` and its consumers.
 *
 * Lives outside `ChartView.tsx` so the views barrel can export it WITHOUT
 * statically importing the recharts-backed chart module (F-19: recharts is
 * ~100KB gz and must only load through the `ChartViewLazy` dynamic wrapper).
 */
import type { ChartAxis } from "./chart-config";
import { formatDate } from "@/lib/i18n/format";

export function formatValue(v: unknown, format: ChartAxis["format"] = "auto", currency = "USD"): string {
  if (v === null || v === undefined || v === "") return "";
  if (typeof v !== "number") {
    if (format === "date" && typeof v === "string") {
      const d = new Date(v);
      if (!Number.isNaN(d.getTime())) return formatDate(d);
    }
    return String(v);
  }
  switch (format) {
    case "currency":
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        maximumFractionDigits: Math.abs(v) >= 1000 ? 0 : 2,
      }).format(v);
    case "percent":
      return new Intl.NumberFormat("en-US", {
        style: "percent",
        maximumFractionDigits: 1,
      }).format(Math.abs(v) > 1 ? v / 100 : v);
    case "date":
      return formatDate(v);
    case "number":
      return new Intl.NumberFormat("en-US").format(v);
    case "auto":
    default:
      if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
      if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(1)}k`;
      return Number.isInteger(v) ? String(v) : v.toFixed(2);
  }
}
