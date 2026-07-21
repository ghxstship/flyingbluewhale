"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ActionBar } from "./ActionBar";
import { EmptySkeleton } from "./EmptySkeleton";
import { DataView, GroupedTree, applyModel, groupTree, dataPills, advBar, emptyViewCtl, type ViewCtl } from "./viewengine";
import type { FieldDef } from "./DataTable";
import type { ViewMode } from "./ViewToggle";

/**
 * The standard normalized record-list surface — kit 34 v3.4. One field schema
 * (`fields`) drives search + the ActionBar drawer (View Options / Share &
 * Export) + every view (list/table/board/calendar/gallery) + multi-level
 * grouping. Every normalized surface renders through this so screens are
 * interchangeable to the user.
 *
 * Order: quick-filter pills + ActionBar → grouped or flat DataView → empty
 * skeleton when nothing matches. Callers supply the schema, a `renderRow`, and
 * (optionally) a status field for the board view and a pill accessor.
 */
export type NormalizedListProps<T> = {
  /** Stable key prefix for control/menu/collapse state. */
  k: string;
  items: T[];
  fields: FieldDef<T>[];
  /** Free-text search haystack per item. */
  search: (x: T) => string;
  searchPlaceholder: string;
  renderRow: (x: T, compact?: boolean) => ReactNode;
  onRow?: (x: T) => void;
  views?: ViewMode[];
  initialView?: ViewMode;
  /** Board column (kanban) + optional column order + per-column dot tone. */
  statusField?: string;
  statusOrder?: string[];
  boardTone?: Record<string, string>;
  /** Calendar agenda date field id (its `iso` accessor is used). */
  dateField?: string;
  gallery?: (x: T) => ReactNode;
  /** Context-aware quick-filter pills derived from a field's present values. */
  pill?: { get: (x: T) => string; order?: string[] };
  empty: { cols: string[]; title: string; hint?: string };
  /** Full-width primary CTA rendered below the list. */
  footer?: ReactNode;
  /** Optional wrapper class for the flat list view (e.g. `"tl"` timeline rail). */
  listWrapClassName?: string;
};

export function NormalizedList<T>({
  k,
  items,
  fields,
  search,
  searchPlaceholder,
  renderRow,
  onRow,
  views = ["list", "table", "board", "calendar"],
  initialView = "list",
  statusField,
  statusOrder,
  boardTone,
  dateField,
  gallery,
  pill,
  empty,
  footer,
  listWrapClassName,
}: NormalizedListProps<T>) {
  const [ctl, setCtl] = useState<ViewCtl>(() => emptyViewCtl(initialView));
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const patch = (p: Partial<ViewCtl>) => setCtl((c) => ({ ...c, ...p }));

  const filtered = useMemo(() => {
    const q = ctl.q.trim().toLowerCase();
    let out = items;
    if (q) out = out.filter((x) => search(x).toLowerCase().includes(q));
    if (pill && ctl.filters.size) out = out.filter((x) => ctl.filters.has(pill.get(x)));
    return applyModel(out, fields, ctl.filterModel, ctl.sortRules);
  }, [items, ctl.q, ctl.filters, ctl.filterModel, ctl.sortRules, fields, search, pill]);

  const tree = useMemo(() => groupTree(filtered, fields, ctl.groupLevels), [filtered, fields, ctl.groupLevels]);

  const pills = pill
    ? dataPills(
        items,
        pill.get,
        ctl.filters,
        (v) => {
          const next = new Set(ctl.filters);
          if (next.has(v)) next.delete(v);
          else next.add(v);
          patch({ filters: next });
        },
        pill.order,
      )
    : undefined;

  return (
    <>
      <ActionBar
        {...advBar(ctl, patch, fields, views)}
        k={k}
        query={ctl.q}
        setQuery={(q) => patch({ q })}
        placeholder={searchPlaceholder}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        pills={pills}
        onPillsClear={() => patch({ filters: new Set() })}
        exportRows={filtered}
      />
      {filtered.length === 0 ? (
        <EmptySkeleton cols={empty.cols} title={empty.title} hint={empty.hint ?? "No items match these filters."} />
      ) : tree ? (
        <GroupedTree skey={k} tree={tree} collapsed={collapsed} setCollapsed={setCollapsed} renderRow={(x) => renderRow(x as T)} />
      ) : (
        <DataView
          view={ctl.view}
          items={filtered}
          fields={fields}
          renderRow={renderRow}
          onRow={onRow}
          statusField={statusField}
          statusOrder={statusOrder}
          boardTone={boardTone}
          dateField={dateField}
          gallery={gallery}
          listWrapClassName={listWrapClassName}
        />
      )}
      {footer}
    </>
  );
}
