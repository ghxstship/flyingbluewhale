"use client";

import nextDynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type { CarbonCharts as CarbonChartsType } from "./CarbonCharts";

/**
 * Client wrapper around the recharts-bundled CarbonCharts component.
 *
 * Why a wrapper? Next 16 disallows `next/dynamic({ ssr: false })` from
 * server components — the option only makes sense in a client tree.
 * The parent page is a server component, so the dynamic import lives
 * here in a "use client" wrapper.
 *
 * Why dynamic at all? recharts is ~100 KB gzipped. The dynamic + ps-skel
 * keeps it out of the parent route's initial JS payload.
 */
const CarbonCharts = nextDynamic(() => import("./CarbonCharts").then((m) => m.CarbonCharts), {
  ssr: false,
  loading: () => <div className="surface ps-skel h-64" aria-busy="true" />,
});

export function CarbonChartsClient(props: ComponentProps<typeof CarbonChartsType>) {
  return <CarbonCharts {...props} />;
}
