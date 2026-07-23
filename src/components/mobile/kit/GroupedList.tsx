"use client";

import { type Dispatch, type ReactNode, type SetStateAction } from "react";
import { KIcon } from "./icon";
import { useT } from "@/lib/i18n/LocaleProvider";

/**
 * Collapsible grouped list. Ported from the prototype `GroupedList`.
 *
 * `groups` is `[name, items][]`; `renderRow(item, groupName)` renders each
 * row. Collapse state is a `Set` of `${skey}:${name}` keys, owned by the
 * caller, with expand-all / collapse-all in the group bar.
 */
export type GroupedListProps<T> = {
  skey: string;
  groups: Array<[string, T[]]>;
  collapsed: Set<string>;
  setCollapsed: Dispatch<SetStateAction<Set<string>>>;
  renderRow: (item: T, groupName: string) => ReactNode;
};

export function GroupedList<T>({ skey, groups, collapsed, setCollapsed, renderRow }: GroupedListProps<T>) {
  const t = useT();
  const keys = groups.map(([name]) => `${skey}:${name}`);
  const allCollapsed = keys.length > 0 && keys.every((k) => collapsed.has(k));
  const toggleAll = () =>
    setCollapsed((prev) => {
      const n = new Set(prev);
      if (allCollapsed) keys.forEach((k) => n.delete(k));
      else keys.forEach((k) => n.add(k));
      return n;
    });
  const toggle = (k: string) =>
    setCollapsed((prev) => {
      const n = new Set(prev);
      if (n.has(k)) n.delete(k);
      else n.add(k);
      return n;
    });
  return (
    <>
      <div className="grp-bar">
        <button type="button" className="grp-all" onClick={toggleAll}>
          <KIcon name={allCollapsed ? "ChevronsUpDown" : "ChevronsDownUp"} size={13} />{" "}
          {allCollapsed ? t("m.kit.expandAll", undefined, "Expand all") : t("m.kit.collapseAll", undefined, "Collapse all")}
        </button>
      </div>
      {groups.map(([name, items]) => {
        const k = `${skey}:${name}`;
        const c = collapsed.has(k);
        return (
          <div key={name}>
            <button type="button" className="grph grph-c" aria-expanded={!c} onClick={() => toggle(k)}>
              <KIcon name={c ? "ChevronRight" : "ChevronDown"} size={14} style={{ flex: "none" }} />
              <span style={{ flex: 1, textAlign: "left" }}>{name}</span>
              <span className="gc">{items.length}</span>
            </button>
            {!c && items.map((it) => renderRow(it, name))}
          </div>
        );
      })}
    </>
  );
}
