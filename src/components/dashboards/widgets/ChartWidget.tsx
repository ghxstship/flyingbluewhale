"use client";

import * as React from "react";
import { ChartView } from "@/components/views/ChartView";
import type { ChartWidget as ChartWidgetConfig } from "@/lib/dashboards/types";

/**
 * ChartWidget — wraps `<ChartView>` for a dashboard cell. The page-level
 * server component is responsible for resolving `widget.dataQuery` to an
 * array of rows; the rows are passed in via the `rows` prop. We keep this
 * component pure-client so the recharts surface owns its own ResizeObserver
 * lifecycle and we can reuse it inside the editor's drag preview.
 */
export function ChartWidget({
  widget,
  rows,
}: {
  widget: ChartWidgetConfig;
  rows: Array<Record<string, unknown>>;
}): React.ReactElement {
  // Inherit the widget title into the chart title when the chartConfig
  // didn't set one explicitly.
  const config = React.useMemo(
    () => (widget.chartConfig.title ? widget.chartConfig : { ...widget.chartConfig, title: widget.title }),
    [widget.chartConfig, widget.title],
  );

  return (
    <div className="surface flex h-full flex-col overflow-hidden p-3">
      <ChartView config={config} rows={rows} height={240} />
    </div>
  );
}
