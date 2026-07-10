"use client";

import * as React from "react";
import nextDynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/Skeleton";
import type { ChartViewProps } from "./ChartView";

/**
 * Lazy `<ChartView>` (F-19). The real ChartView statically imports recharts
 * (~100KB gz); this wrapper defers that chunk until a chart actually renders,
 * with a Skeleton fallback sized to the requested height. The views barrel
 * exports THIS component — import `./ChartView` directly only from code that
 * is itself already behind `next/dynamic` (e.g. dashboard ChartWidget).
 */
const LazyChartView = nextDynamic(
  () => import("./ChartView").then((m) => m.ChartView as React.ComponentType<ChartViewProps>),
  {
    ssr: false,
    loading: () => <Skeleton variant="block" height={320} width="100%" />,
  },
);

export function ChartView<T extends Record<string, unknown> = Record<string, unknown>>(
  props: ChartViewProps<T>,
): React.ReactElement {
  return <LazyChartView {...(props as ChartViewProps)} />;
}
