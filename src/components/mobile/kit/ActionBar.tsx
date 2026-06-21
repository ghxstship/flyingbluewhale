"use client";

import { type ReactNode } from "react";
import { KIcon } from "./icon";
import { PillMenu, Popover, mkItems } from "./Menu";
import { VIEW_ICON, type ViewMode } from "./ViewToggle";
import {
  FilterBuilder,
  SortBuilder,
  type Conjunction,
  type FieldDef,
  type FilterRule,
  type SortRule,
} from "./DataTable";

/**
 * Normalized search + icon controls for every list screen. Ported from the
 * prototype `ActionBar`.
 *
 * Two modes: pass `fields` to get the Airtable-style Popover sort/filter
 * builders (advanced); otherwise pass `sortOpts` / `filterChildren` for the
 * simple `[id,label]` PillMenu + custom popover variant.
 */
export type ActionBarProps<T> = {
  k: string;
  query: string;
  setQuery: (q: string) => void;
  placeholder?: string;
  view?: ViewMode;
  setView?: (v: ViewMode) => void;
  views?: ViewMode[];
  group?: string;
  setGroup?: (g: string) => void;
  groupOpts?: ReadonlyArray<readonly [string, string]>;
  sort?: string;
  setSort?: (s: string) => void;
  sortOpts?: ReadonlyArray<readonly [string, string]>;
  filterActive?: number;
  filterChildren?: ReactNode;
  menuOpen: string | null;
  setMenuOpen: (key: string | null) => void;
  fields?: FieldDef<T>[];
  sortRules?: SortRule[];
  setSortRules?: (rules: SortRule[]) => void;
  filterRules?: FilterRule[];
  setFilterRules?: (rules: FilterRule[]) => void;
  filterConj?: Conjunction;
  setFilterConj?: (conj: Conjunction) => void;
};

export function ActionBar<T>({
  k,
  query,
  setQuery,
  placeholder,
  view,
  setView,
  views,
  group,
  setGroup,
  groupOpts,
  sort,
  setSort,
  sortOpts,
  filterActive,
  filterChildren,
  menuOpen,
  setMenuOpen,
  fields,
  sortRules,
  setSortRules,
  filterRules,
  setFilterRules,
  filterConj = "and",
  setFilterConj,
}: ActionBarProps<T>) {
  const glab = groupOpts ? Object.fromEntries(groupOpts) : undefined;
  const slab = sortOpts ? Object.fromEntries(sortOpts) : undefined;
  const adv = !!fields;
  const nSort = adv ? (sortRules || []).filter((r) => r.field).length : 0;
  const nFilter = adv
    ? (filterRules || []).filter(
        (r) => r.field && r.op && (r.value !== "" || r.op === "empty" || r.op === "nempty"),
      ).length
    : 0;
  return (
    <div className="actionbar">
      <div className="searchbar">
        <KIcon name="Search" size={16} />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={placeholder} />
        {query && <KIcon name="X" size={15} style={{ cursor: "pointer" }} onClick={() => setQuery("")} />}
      </div>
      <div className="clusters">
        {views && view && setView && (
          <PillMenu
            label="View"
            icon={VIEW_ICON[view] || "List"}
            openKey={k + "v"}
            menuOpen={menuOpen}
            setMenuOpen={setMenuOpen}
            align="right"
            items={views.map((v) => ({
              label: v[0]!.toUpperCase() + v.slice(1),
              icon: <KIcon name={view === v ? "Check" : VIEW_ICON[v]} size={14} />,
              onSelect: () => {
                setView(v);
                setMenuOpen(null);
              },
            }))}
          />
        )}
        {groupOpts && glab && group != null && setGroup && (
          <PillMenu
            label={group === "none" ? "Group" : `Group: ${glab[group]}`}
            icon="Group"
            active={group !== "none"}
            openKey={k + "g"}
            menuOpen={menuOpen}
            setMenuOpen={setMenuOpen}
            align="right"
            items={mkItems(groupOpts, group, setGroup, () => setMenuOpen(null))}
          />
        )}
        {adv ? (
          <Popover
            label="Sort"
            icon="ArrowDownUp"
            count={nSort}
            width={272}
            openKey={k + "s"}
            menuOpen={menuOpen}
            setMenuOpen={setMenuOpen}
            align="right"
          >
            <SortBuilder fields={fields!} rules={sortRules || []} setRules={setSortRules || (() => {})} />
          </Popover>
        ) : (
          sortOpts &&
          slab &&
          sort != null &&
          setSort && (
            <PillMenu
              label={`Sort: ${slab[sort]}`}
              icon="ArrowDownUp"
              openKey={k + "s"}
              menuOpen={menuOpen}
              setMenuOpen={setMenuOpen}
              align="right"
              items={mkItems(sortOpts, sort, setSort, () => setMenuOpen(null))}
            />
          )
        )}
        {adv ? (
          <Popover
            label="Filter"
            icon="SlidersHorizontal"
            count={nFilter}
            width={290}
            openKey={k + "f"}
            menuOpen={menuOpen}
            setMenuOpen={setMenuOpen}
            align="right"
          >
            <FilterBuilder
              fields={fields!}
              rules={filterRules || []}
              setRules={setFilterRules || (() => {})}
              conj={filterConj}
              setConj={setFilterConj || (() => {})}
            />
          </Popover>
        ) : (
          filterChildren && (
            <Popover
              label="Filter"
              icon="SlidersHorizontal"
              count={filterActive || 0}
              openKey={k + "f"}
              menuOpen={menuOpen}
              setMenuOpen={setMenuOpen}
              align="right"
            >
              {filterChildren}
            </Popover>
          )
        )}
      </div>
    </div>
  );
}
