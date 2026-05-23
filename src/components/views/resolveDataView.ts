// Server-safe view resolver — pure helper, no client deps. Pair with the
// `<DataViewSwitcher>` client component for the chip strip.
//
// Server component:
//   const view = resolveDataView(searchParams, SCHEDULE_VIEWS, "timeline");
// Client toggle:
//   <DataViewSwitcher current={view} allowed={SCHEDULE_VIEWS} defaultView="timeline" />

import type { DataViewKind } from "./DataViewKind";

export function resolveDataView<T extends DataViewKind>(
  searchParams: Record<string, string | string[] | undefined> | URLSearchParams | undefined,
  allowed: readonly T[],
  defaultView: T,
  paramKey: string = "view",
): T {
  const v =
    searchParams instanceof URLSearchParams
      ? (searchParams.get(paramKey) ?? undefined)
      : (() => {
          const raw = searchParams?.[paramKey];
          return Array.isArray(raw) ? raw[0] : raw;
        })();
  if (!v) return defaultView;
  return (allowed as readonly string[]).includes(v) ? (v as T) : defaultView;
}
