"use client";

import nextDynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type { ReportsCharts as ReportsChartsType } from "./ReportsCharts";

/**
 * Client wrapper around the recharts-bundled ReportsCharts component.
 *
 * Why a wrapper? Next 16 disallows `next/dynamic({ ssr: false })` from
 * server components — the option only makes sense in a client tree.
 * The parent page is a server component (it loads org-scoped invoice +
 * expense rows under RLS), so we put the dynamic import here, in a
 * "use client" wrapper, and the server just imports this wrapper.
 *
 * Why dynamic at all? recharts is ~100 KB gzipped. The dynamic + skeleton
 * keeps it out of the parent route's initial JS payload — it loads only
 * when this widget enters the React tree.
 */
const ReportsCharts = nextDynamic(() => import("./ReportsCharts").then((m) => m.ReportsCharts), {
  ssr: false,
  loading: () => <div className="surface skeleton h-64" aria-busy="true" />,
});

export function ReportsChartsClient(props: ComponentProps<typeof ReportsChartsType>) {
  return <ReportsCharts {...props} />;
}
