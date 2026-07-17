"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Table as TableIcon,
  List as ListIcon,
  Kanban,
  GanttChart,
  CalendarDays,
  MapPin,
  LayoutGrid,
  ListTree,
} from "lucide-react";
import type { DataViewKind } from "./DataViewKind";

export type { DataViewKind };

type Meta = { label: string; Icon: React.ComponentType<{ size?: number }> };

const REGISTRY: Record<DataViewKind, Meta> = {
  table: { label: "Table", Icon: TableIcon },
  list: { label: "List", Icon: ListIcon },
  board: { label: "Board", Icon: Kanban },
  timeline: { label: "Timeline", Icon: GanttChart },
  calendar: { label: "Calendar", Icon: CalendarDays },
  map: { label: "Map", Icon: MapPin },
  gallery: { label: "Gallery", Icon: LayoutGrid },
  tree: { label: "Tree", Icon: ListTree },
};

/**
 * Canonical view-toggle chip strip. URL-state owner — sets `?view=` so
 * deep links survive a refresh. Renders only the chips you declare in
 * `allowed`; never expose a view the data can't power.
 *
 *   <DataViewSwitcher
 *     current={view}
 *     allowed={["table","timeline","calendar","board"]}
 *     defaultView="table"
 *   />
 */
export function DataViewSwitcher<T extends DataViewKind>({
  current,
  allowed,
  defaultView,
  paramKey = "view",
  ariaLabel = "View",
}: {
  current: T;
  allowed: readonly T[];
  defaultView: T;
  paramKey?: string;
  ariaLabel?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();

  function go(next: T) {
    const sp = new URLSearchParams(params?.toString());
    if (next === defaultView) sp.delete(paramKey);
    else sp.set(paramKey, next);
    const q = sp.toString();
    router.replace(q ? `?${q}` : "?", { scroll: false });
  }

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="inline-flex items-center gap-0.5 rounded-md border border-[var(--p-border)] bg-[var(--p-surface-2)] p-0.5"
    >
      {allowed.map((v) => {
        const meta = REGISTRY[v];
        const active = v === current;
        const { label, Icon } = meta;
        return (
          <button
            key={v}
            role="tab"
            aria-selected={active}
            type="button"
            onClick={() => go(v)}
            className={`inline-flex items-center gap-1.5 rounded-sm px-2 py-1 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--p-focus)] ${
              active
                ? "bg-[var(--p-surface)] text-[var(--p-text-1)] shadow-sm"
                : "text-[var(--p-text-2)] hover:text-[var(--p-text-1)]"
            }`}
            title={label}
          >
            <Icon size={12} aria-hidden />
            <span className="hidden sm:inline">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
