"use client";

import * as React from "react";
import { MetricCard } from "@/components/ui/MetricCard";
import type { KpiWidget as KpiWidgetConfig } from "@/lib/dashboards/types";

/**
 * KpiWidget — wraps `<MetricCard>` for a dashboard cell. Pre-computed value
 * comes from the widget config; live counts should use a chart widget with
 * a count aggregation instead.
 */
export function KpiWidget({ widget }: { widget: KpiWidgetConfig }): React.ReactElement {
  return (
    <MetricCard
      label={widget.label ?? widget.title ?? "Metric"}
      value={widget.value}
      accent={widget.accent}
      sparkline={widget.sparkline}
      delta={widget.delta}
    />
  );
}
