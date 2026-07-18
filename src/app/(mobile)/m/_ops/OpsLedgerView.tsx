"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ActionBar,
  Crumbs,
  DataTable,
  EmptySkeleton,
  GroupedList,
  KIcon,
  TogRow,
  type FieldDef,
} from "@/components/mobile/kit";
import type { ViewMode } from "@/components/mobile/kit";
import { OPS_TONE } from "@/lib/mobile/ops-seed";

/**
 * OpsLedgerView — the one shared list surface for the kit 33 v3.0 Operations
 * ledgers (Reports · Inspections · Logistics · Permits · Travel).
 *
 * Governance: "each ledger is a first-class list surface built from the shared
 * list primitives — no bespoke layouts." So the five surfaces are pure config
 * over this component: `ActionBar` (search + icon-only view/group/sort/filter),
 * list + table views, `GroupedList` grouping, `TogRow` status filters,
 * `DataTable`, and `EmptySkeleton`. Row shape mirrors the kit exactly (icon ·
 * title · sub · status badge, with an optional trailing price tag).
 */

export type OpsLedgerConfig<T extends { id: string }> = {
  /** Stable ActionBar/GroupedList namespace key. */
  k: string;
  /** Surface title (Crumbs leaf + `.scr-h`). */
  title: string;
  searchPlaceholder: string;
  /** Free-text haystack for the search box. */
  search: (x: T) => string;
  icon: (x: T) => string;
  /** Optional CSS color for the row icon (kit tints Open/Flagged/Delayed…). */
  iconColor?: (x: T) => string | undefined;
  /** Row title accessor. */
  titleOf: (x: T) => string;
  sub: (x: T) => string;
  status: (x: T) => string;
  /** Optional trailing price tag (Expenses-style). */
  price?: (x: T) => string;
  groupOpts: ReadonlyArray<readonly [string, string]>;
  /** Group-key accessor given the active group id. */
  groupKey: (groupId: string, x: T) => string;
  sortOpts: ReadonlyArray<readonly [string, string]>;
  sortCmp: (sortId: string, a: T, b: T) => number;
  /** Status values offered as filter toggles. */
  filterStates: readonly string[];
  tableFields: FieldDef<T>[];
  emptyCols: string[];
  emptyTitle: string;
  /** Optional bottom CTA wired to a real repo route (no toast-only stubs). */
  cta?: { label: string; href: string };
};

function toggleSet(set: Set<string>, v: string): Set<string> {
  const n = new Set(set);
  if (n.has(v)) n.delete(v);
  else n.add(v);
  return n;
}

export function OpsLedgerView<T extends { id: string }>({
  items,
  config,
}: {
  items: T[];
  config: OpsLedgerConfig<T>;
}) {
  const [query, setQuery] = useState("");
  const [view, setView] = useState<ViewMode>("list");
  const [group, setGroup] = useState("none");
  const [sort, setSort] = useState(config.sortOpts[0]?.[0] ?? "recent");
  const [filters, setFilters] = useState<Set<string>>(new Set());
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter((x) => !q || config.search(x).toLowerCase().includes(q))
      .filter((x) => filters.size === 0 || filters.has(config.status(x)))
      .slice()
      .sort((a, b) => config.sortCmp(sort, a, b));
  }, [items, query, filters, sort, config]);

  const row = (x: T): ReactNode => {
    const tone = OPS_TONE[config.status(x)] ?? "neutral";
    const color = config.iconColor?.(x);
    return (
      <div className="item" key={x.id}>
        <span className="more-ic" style={color ? { color } : undefined}>
          <KIcon name={config.icon(x)} size={17} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="t">{config.titleOf(x)}</div>
          <div className="s">{config.sub(x)}</div>
        </div>
        {config.price && (
          <span className="pricetag" style={{ fontSize: 14, marginRight: 8 }}>
            {config.price(x)}
          </span>
        )}
        <span className={`ps-badge ps-badge--${tone}`} style={{ flex: "none" }}>
          {config.status(x)}
        </span>
      </div>
    );
  };

  return (
    <>
      <Crumbs items={[{ label: "More", href: "/m/more" }, { label: config.title }]} />
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {config.title}
      </h1>

      <ActionBar<T>
        k={config.k}
        query={query}
        setQuery={setQuery}
        placeholder={config.searchPlaceholder}
        view={view}
        setView={setView}
        views={["list", "table"]}
        group={group}
        setGroup={setGroup}
        groupOpts={config.groupOpts}
        sort={sort}
        setSort={setSort}
        sortOpts={config.sortOpts}
        filterActive={filters.size}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        filterChildren={
          <div>
            {config.filterStates.map((st) => (
              <TogRow key={st} label={st} on={filters.has(st)} set={() => setFilters((f) => toggleSet(f, st))} />
            ))}
          </div>
        }
      />

      {visible.length === 0 ? (
        <EmptySkeleton cols={config.emptyCols} title={config.emptyTitle} hint="" />
      ) : view === "table" ? (
        <DataTable fields={config.tableFields} items={visible} />
      ) : group !== "none" ? (
        <GroupedList
          skey={config.k}
          groups={Object.entries(
            visible.reduce<Record<string, T[]>>((acc, x) => {
              const key = config.groupKey(group, x);
              (acc[key] = acc[key] ?? []).push(x);
              return acc;
            }, {}),
          ).sort(([a], [b]) => a.localeCompare(b))}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          renderRow={row}
        />
      ) : (
        visible.map(row)
      )}

      {config.cta && (
        <Link
          href={config.cta.href}
          className="ps-btn ps-btn--cta ps-btn--lg"
          style={{ width: "100%", justifyContent: "center", marginTop: 10, textDecoration: "none" }}
        >
          <KIcon name="Plus" size={16} /> {config.cta.label}
        </Link>
      )}
    </>
  );
}
