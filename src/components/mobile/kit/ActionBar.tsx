"use client";

import { useState, type ReactNode } from "react";
import { KIcon } from "./icon";
import { PillMenu, Popover, mkItems } from "./Menu";
import { VIEW_ICON, useViewModeLabels, type ViewMode } from "./ViewToggle";
import { useT } from "@/lib/i18n/LocaleProvider";
import {
  FilterBuilder,
  SortBuilder,
  type Conjunction,
  type FieldDef,
  type FilterRule,
  type SortRule,
} from "./DataTable";
import { ViewSheet, ShareSheet, countFilterRules, type FilterModel } from "./viewengine";

/**
 * Normalized search + controls for every list screen. Ported from the
 * prototype `ActionBar` (design_handoff_compvss_field/runtime/app.jsx:708).
 *
 * Three modes:
 *  - **Drawer (kit 34 v3.3, canon):** pass `filterModel` + `setFilterModel`
 *    (via `advBar(ctl, setCtl, FIELDS, views)`). Renders exactly two icon
 *    buttons — **View Options** and **Share & Export** — each opening a
 *    full-width bottom-sheet drawer, plus the context-aware quick-filter pill
 *    row. This is the standard for all 24 normalized surfaces.
 *  - **Popover (legacy advanced):** pass `fields` + `filterRules` for the
 *    inline Airtable-style sort/filter Popover builders.
 *  - **Basic:** pass `sortOpts` / `filterChildren` for the simple `[id,label]`
 *    PillMenu + custom popover variant (documented non-grid exceptions).
 */
export type ActionBarPill = { label: string; active: boolean; on: () => void; count?: number };

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
  /** Drawer mode (kit 34): the nested filter model + multi-level group levels. */
  filterModel?: FilterModel;
  setFilterModel?: (m: FilterModel) => void;
  groupLevels?: string[];
  setGroupLevels?: (l: string[]) => void;
  /** Quick-filter pill row (context-aware, synced with the drawer filter). */
  pills?: ActionBarPill[];
  onPillsClear?: () => void;
  /** Show the Share & Export button in drawer mode (defaults on). */
  share?: boolean;
  /** The caller's current filtered rows — enables REAL CSV/JSON export in the
   *  Share & Export sheet. Omit and the sheet offers Print only. */
  exportRows?: readonly T[];
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
  filterModel,
  setFilterModel,
  groupLevels,
  setGroupLevels,
  pills,
  onPillsClear,
  share = true,
  exportRows,
}: ActionBarProps<T>) {
  const t = useT();
  const viewLabels = useViewModeLabels();
  const glab = groupOpts ? Object.fromEntries(groupOpts) : undefined;
  const slab = sortOpts ? Object.fromEntries(sortOpts) : undefined;
  const drawer = !!(fields && filterModel && setFilterModel);
  const adv = !drawer && !!fields;
  const [sheet, setSheet] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  const viewCount = drawer
    ? countFilterRules(filterModel) +
      (sortRules || []).filter((r) => r.field).length +
      (groupLevels || []).filter(Boolean).length
    : 0;

  const nSort = adv ? (sortRules || []).filter((r) => r.field).length : 0;
  const nFilter = adv
    ? (filterRules || []).filter(
        (r) => r.field && r.op && (r.value !== "" || r.op === "empty" || r.op === "nempty"),
      ).length
    : 0;
  const anyPill = pills && pills.some((p) => p.active);

  return (
    <>
      <div className="actionbar">
        <div className="searchbar">
          <KIcon name="Search" size={16} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={placeholder} aria-label={placeholder || t("m.kit.bar.search", undefined, "Search")} />
          {query && (
            <button
              type="button"
              aria-label={t("m.kit.bar.clearSearch", undefined, "Clear search")}
              onClick={() => setQuery("")}
              style={{ border: "none", background: "none", padding: 0, cursor: "pointer", display: "inline-flex", color: "inherit" }}
            >
              <KIcon name="X" size={15} />
            </button>
          )}
        </div>
        <div className="clusters">
          {views && view && setView && !drawer && (
            <PillMenu
              label={t("m.kit.bar.view", undefined, "View")}
              icon={VIEW_ICON[view] || "List"}
              openKey={k + "v"}
              menuOpen={menuOpen}
              setMenuOpen={setMenuOpen}
              align="right"
              items={views.map((v) => ({
                label: viewLabels[v] ?? v[0]!.toUpperCase() + v.slice(1),
                icon: <KIcon name={view === v ? "Check" : VIEW_ICON[v]} size={14} />,
                onSelect: () => {
                  setView(v);
                  setMenuOpen(null);
                },
              }))}
            />
          )}
          {drawer ? (
            <>
              <button
                type="button"
                className="pill ico"
                data-active={viewCount ? "" : undefined}
                onClick={() => setSheet(views ? "layout" : "filter")}
                aria-label={t("m.kit.bar.viewOptions", undefined, "View options")}
              >
                <KIcon name="SlidersHorizontal" size={16} />
                {viewCount > 0 && <span className="acount">{viewCount}</span>}
              </button>
              {share && (
                <button type="button" className="pill ico" onClick={() => setShareOpen(true)} aria-label={t("m.kit.bar.share", undefined, "Share & export")}>
                  <KIcon name="Share" size={16} />
                </button>
              )}
            </>
          ) : (
            <>
              {groupOpts && glab && group != null && setGroup && (
                <PillMenu
                  label={group === "none" ? t("m.kit.bar.group", undefined, "Group") : t("m.kit.bar.groupActive", { label: glab[group]! }, `Group: ${glab[group]}`)}
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
                  label={t("m.kit.bar.sort", undefined, "Sort")}
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
                    label={t("m.kit.bar.sortActive", { label: slab[sort]! }, `Sort: ${slab[sort]}`)}
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
                  label={t("m.kit.bar.filter", undefined, "Filter")}
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
                    label={t("m.kit.bar.filter", undefined, "Filter")}
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
            </>
          )}
        </div>
      </div>
      {pills && pills.length > 0 && (
        <div className="chips" style={{ paddingBottom: 10, marginTop: -2 }}>
          <button type="button" className={`chip ${anyPill ? "" : "on"}`} aria-pressed={!anyPill} onClick={() => onPillsClear?.()}>
            {t("m.kit.bar.all", undefined, "All")}
          </button>
          {pills.map((p) => (
            <button key={p.label} type="button" className={`chip ${p.active ? "on" : ""}`} aria-pressed={p.active} onClick={p.on}>
              {p.label}
              {p.count != null && <span style={{ marginLeft: 5, fontWeight: 800, opacity: 0.6 }}>{p.count}</span>}
            </button>
          ))}
        </div>
      )}
      {drawer && sheet && (
        <ViewSheet
          tab={sheet}
          fields={fields!}
          model={filterModel!}
          setModel={setFilterModel!}
          sortRules={sortRules || []}
          setSortRules={setSortRules || (() => {})}
          levels={groupLevels || []}
          setLevels={setGroupLevels || (() => {})}
          view={view}
          setView={setView}
          views={views}
          onClose={() => setSheet(null)}
        />
      )}
      {drawer && shareOpen && (
        <ShareSheet
          title={placeholder ? placeholder.replace(/^Search /, "").replace(/…$/, "") : t("m.kit.bar.records", undefined, "records")}
          onClose={() => setShareOpen(false)}
          rows={exportRows}
          fields={fields}
        />
      )}
    </>
  );
}
