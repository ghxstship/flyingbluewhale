"use client";

import { useState, type ReactNode } from "react";
import { KIcon } from "./icon";
import { Sheet } from "./Sheet";
import { pressable } from "./blocks";
import { DataTable } from "./DataTable";
import { VIEW_ICON, type ViewMode } from "./ViewToggle";
import type { FieldDef, FieldType, SortRule } from "./DataTable";

/**
 * Airtable-plus schema-driven view engine — kit 34 v3.3/v3.4
 * (design_handoff_compvss_field/runtime/app.jsx: `FilterGroups` / `applyModel`
 * / `groupTree` / `ViewSheet` / `ShareSheet` / `DataView` / `GroupedTree`).
 *
 * One `FieldDef[]` schema per list drives table columns, nested filter groups,
 * multi-key sort, multi-level grouping AND every view (list/table/board/
 * calendar/gallery). The View Options + Share & Export controls render as
 * full-width bottom-sheet drawers (the canon `Sheet` chrome), not popovers.
 *
 * Generic + presentational: callers pass translated labels + data. No i18n,
 * no Supabase here.
 */

/** Project clock — the demo "now" so relative dates (Today / This week) resolve.
 *  A module constant (never `new Date()` at render — that desyncs SSR/hydration).
 *  Seed datasets anchor to this. */
export const NOW_ISO = "2026-06-20";

export type ModelFilterOp =
  | "contains" | "ncontains" | "is" | "isnot" | "empty" | "nempty"
  | "eq" | "ne" | "gt" | "lt" | "gte" | "lte"
  | "don" | "dbefore" | "dafter" | "dbetween" | "dtoday" | "dweek";

export type Conj = "and" | "or";
export type ModelRule = { field: string; op: ModelFilterOp; value?: string; value2?: string };
export type FilterGroup = { conj: Conj; rules: ModelRule[] };
export type FilterModel = { conj: Conj; groups: FilterGroup[] };
export type GroupNode<T> = { label: string; items: T[]; children: GroupNode<T>[] | null };

/** Op catalogs by the field-type bucket the builders read. */
export const MODEL_FILTER_OPS: Record<"text" | "num" | "enum" | "date", ReadonlyArray<readonly [ModelFilterOp, string]>> = {
  text: [
    ["contains", "contains"], ["ncontains", "doesn't contain"], ["is", "is"],
    ["isnot", "is not"], ["empty", "is empty"], ["nempty", "is not empty"],
  ],
  num: [["eq", "="], ["ne", "≠"], ["gt", ">"], ["lt", "<"], ["gte", "≥"], ["lte", "≤"]],
  date: [
    ["don", "is on"], ["dbefore", "is before"], ["dafter", "is after"],
    ["dbetween", "is between"], ["dtoday", "is today"], ["dweek", "is this week"],
  ],
  enum: [["is", "is"], ["isnot", "is not"]],
};

function bucket(type: FieldType): "text" | "num" | "enum" | "date" {
  if (type === "num") return "num";
  if (type === "date") return "date";
  if (type === "select" || type === "bool") return "enum";
  return "text";
}

function isoAddDays(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

const NO_VALUE_OPS: ModelFilterOp[] = ["empty", "nempty", "dtoday", "dweek"];

export function evalRuleModel<T>(item: T, rule: ModelRule, fields: FieldDef<T>[]): boolean {
  const f = fields.find((x) => x.id === rule.field);
  if (!f) return true;
  if (f.type === "date") {
    const iso = f.iso ? f.iso(item) : null;
    if (!iso) return rule.op === "nempty";
    const wkStart = isoAddDays(NOW_ISO, -new Date(NOW_ISO + "T00:00:00").getDay());
    switch (rule.op) {
      case "don": return iso === rule.value;
      case "dbefore": return rule.value ? iso < rule.value : true;
      case "dafter": return rule.value ? iso > rule.value : true;
      case "dbetween": return (!rule.value || iso >= rule.value) && (!rule.value2 || iso <= rule.value2);
      case "dtoday": return iso === NOW_ISO;
      case "dweek": return iso >= wkStart && iso <= isoAddDays(wkStart, 6);
      default: return true;
    }
  }
  const v = f.get ? f.get(item) : undefined;
  const val = rule.value;
  const sv = String(v == null ? "" : v).toLowerCase();
  const svl = String(val == null ? "" : val).toLowerCase();
  switch (rule.op) {
    case "contains": return sv.includes(svl);
    case "ncontains": return !sv.includes(svl);
    case "is": return sv === svl;
    case "isnot": return sv !== svl;
    case "empty": return !v && v !== 0;
    case "nempty": return !!v || v === 0;
    case "eq": return Number(v) === Number(val);
    case "ne": return Number(v) !== Number(val);
    case "gt": return Number(v) > Number(val);
    case "lt": return Number(v) < Number(val);
    case "gte": return Number(v) >= Number(val);
    case "lte": return Number(v) <= Number(val);
    default: return true;
  }
}

export const emptyFilterModel = (): FilterModel => ({ conj: "and", groups: [] });

const liveRule = (r: ModelRule) => !!(r.field && r.op && (r.value !== "" || NO_VALUE_OPS.includes(r.op)));

export function countFilterRules(model: FilterModel | undefined): number {
  if (!model || !model.groups) return 0;
  return model.groups.reduce((n, g) => n + (g.rules || []).filter(liveRule).length, 0);
}

export function evalFilterModel<T>(item: T, model: FilterModel | undefined, fields: FieldDef<T>[]): boolean {
  if (!model || !model.groups || !model.groups.length) return true;
  const groups = model.groups
    .map((g) => ({ g, rs: (g.rules || []).filter(liveRule) }))
    .filter((x) => x.rs.length);
  if (!groups.length) return true;
  const pass = ({ g, rs }: { g: FilterGroup; rs: ModelRule[] }) =>
    g.conj === "or" ? rs.some((r) => evalRuleModel(item, r, fields)) : rs.every((r) => evalRuleModel(item, r, fields));
  return model.conj === "or" ? groups.some(pass) : groups.every(pass);
}

export function applyModel<T>(
  items: T[],
  fields: FieldDef<T>[],
  model: FilterModel | undefined,
  sortRules: SortRule[] | undefined,
): T[] {
  let out = items.filter((it) => evalFilterModel(it, model, fields));
  const asr = (sortRules || []).filter((r) => r.field);
  if (asr.length)
    out = [...out].sort((a, b) => {
      for (const r of asr) {
        const f = fields.find((x) => x.id === r.field);
        if (!f || !f.get) continue;
        const av = f.get(a);
        const bv = f.get(b);
        const cmp =
          f.type === "num"
            ? Number(av) - Number(bv)
            : String(av == null ? "" : av).localeCompare(String(bv == null ? "" : bv));
        if (cmp !== 0) return r.dir === "desc" ? -cmp : cmp;
      }
      return 0;
    });
  return out;
}

/** Multi-level grouping. levels = [fieldId, …] → nested tree, or null. */
export function groupTree<T>(items: T[], fields: FieldDef<T>[], levels: string[] | undefined): GroupNode<T>[] | null {
  const lv = (levels || []).filter((id) => id && id !== "none");
  if (!lv.length) return null;
  const build = (list: T[], depth: number): GroupNode<T>[] => {
    const f = fields.find((x) => x.id === lv[depth]);
    if (!f) return [];
    const mp = new Map<string, T[]>();
    list.forEach((it) => {
      const key = String((f.group ? f.group(it) : f.get ? f.get(it) : "") ?? "—");
      if (!mp.has(key)) mp.set(key, []);
      mp.get(key)!.push(it);
    });
    return [...mp.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([label, sub]) => ({ label, items: sub, children: depth + 1 < lv.length ? build(sub, depth + 1) : null }));
  };
  return build(items, 0);
}

/** Quick-filter pills from values present in the dataset (context-aware). */
export function dataPills<T>(
  items: T[],
  get: (x: T) => unknown,
  filters: Set<string>,
  onToggle: (v: string) => void,
  order?: string[],
): { label: string; active: boolean; on: () => void }[] {
  const seen: string[] = [];
  items.forEach((x) => {
    const v = get(x);
    if (v != null && v !== "" && !seen.includes(String(v))) seen.push(String(v));
  });
  const seq = order ? [...order.filter((v) => seen.includes(v)), ...seen.filter((v) => !order!.includes(v))] : seen;
  return seq.map((v) => ({ label: v, active: filters.has(v), on: () => onToggle(v) }));
}

/** Per-list control object the ActionBar drawers read/write. */
export type ViewCtl = {
  q: string;
  view: ViewMode;
  filters: Set<string>;
  sortRules: SortRule[];
  filterModel: FilterModel;
  groupLevels: string[];
};

export const emptyViewCtl = (view: ViewMode = "list"): ViewCtl => ({
  q: "",
  view,
  filters: new Set(),
  sortRules: [],
  filterModel: emptyFilterModel(),
  groupLevels: [],
});

/** Spread into `<ActionBar {...advBar(ctl, setCtl, FIELDS, views)} …>` to wire
 *  the schema-driven (drawer) mode from a ctl + patch setter. */
export function advBar<T>(
  C: ViewCtl,
  setX: (patch: Partial<ViewCtl>) => void,
  fields: FieldDef<T>[],
  views?: ViewMode[],
) {
  return {
    fields,
    views: views || (["list", "table", "board", "calendar"] as ViewMode[]),
    view: C.view,
    setView: (v: ViewMode) => setX({ view: v }),
    sortRules: C.sortRules,
    setSortRules: (r: SortRule[]) => setX({ sortRules: r }),
    filterModel: C.filterModel,
    setFilterModel: (m: FilterModel) => setX({ filterModel: m }),
    groupLevels: C.groupLevels,
    setGroupLevels: (l: string[]) => setX({ groupLevels: l }),
  };
}

const SEL: React.CSSProperties = {
  border: "1px solid var(--p-border)",
  borderRadius: 9,
  padding: "8px 9px",
  fontSize: 16,
  background: "var(--p-surface)",
  color: "var(--p-text-1)",
  fontFamily: "inherit",
  minWidth: 0,
};

const defaultRule = <T,>(fields: FieldDef<T>[]): ModelRule => {
  const f = fields[0]!;
  return { field: f.id, op: MODEL_FILTER_OPS[bucket(f.type)][0]![0], value: "" };
};

/** Nested condition builder: groups of rules, each group AND/OR, groups joined AND/OR. */
export function FilterGroups<T>({
  fields,
  model,
  setModel,
}: {
  fields: FieldDef<T>[];
  model: FilterModel;
  setModel: (m: FilterModel) => void;
}) {
  const m = model && model.groups ? model : emptyFilterModel();
  const setGroup = (gi: number, patch: Partial<FilterGroup>) =>
    setModel({ ...m, groups: m.groups.map((g, j) => (j === gi ? { ...g, ...patch } : g)) });
  const addGroup = () => setModel({ ...m, groups: [...m.groups, { conj: "and", rules: [defaultRule(fields)] }] });
  const delGroup = (gi: number) => setModel({ ...m, groups: m.groups.filter((_, j) => j !== gi) });
  const addRule = (gi: number) => setGroup(gi, { rules: [...m.groups[gi]!.rules, defaultRule(fields)] });
  const updRule = (gi: number, ri: number, patch: Partial<ModelRule>) =>
    setGroup(gi, { rules: m.groups[gi]!.rules.map((r, j) => (j === ri ? { ...r, ...patch } : r)) });
  const delRule = (gi: number, ri: number) => setGroup(gi, { rules: m.groups[gi]!.rules.filter((_, j) => j !== ri) });
  return (
    <div>
      {m.groups.map((g, gi) => (
        <div key={gi} style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".03em", textTransform: "uppercase", color: "var(--p-text-3)" }}>
              {gi === 0 ? "Where" : "…and where"}
            </span>
            {gi > 0 && (
              <button
                type="button"
                className="conj-tog"
                onClick={() => setModel({ ...m, conj: m.conj === "and" ? "or" : "and" })}
                style={{ border: "1px solid var(--p-border)", borderRadius: 7, background: "var(--p-surface)", color: "var(--p-accent)", fontSize: 11, fontWeight: 800, padding: "2px 8px", cursor: "pointer" }}
              >
                {m.conj.toUpperCase()}
              </button>
            )}
            <div style={{ flex: 1 }} />
            {m.groups.length > 1 && (
              <button type="button" onClick={() => delGroup(gi)} style={{ border: "none", background: "none", color: "var(--p-text-3)", cursor: "pointer", padding: 2 }}>
                <KIcon name="Trash2" size={15} />
              </button>
            )}
          </div>
          <div style={{ border: "1px solid var(--p-border)", borderRadius: 12, padding: 10, background: "var(--p-surface-2, var(--p-bg))" }}>
            {g.rules.map((r, ri) => {
              const f = fields.find((x) => x.id === r.field) || fields[0]!;
              const ops = MODEL_FILTER_OPS[bucket(f.type)];
              const needsVal = !NO_VALUE_OPS.includes(r.op);
              return (
                <div key={ri} style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: ri === g.rules.length - 1 ? 0 : 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 46, fontSize: 11, fontWeight: 700, color: "var(--p-text-3)" }}>
                      {ri === 0 ? (
                        "When"
                      ) : (
                        <button
                          type="button"
                          className="conj-tog"
                          onClick={() => setGroup(gi, { conj: g.conj === "and" ? "or" : "and" })}
                          style={{ border: "1px solid var(--p-border)", borderRadius: 6, background: "var(--p-surface)", color: "var(--p-accent)", fontSize: 10.5, fontWeight: 800, padding: "2px 5px", cursor: "pointer" }}
                        >
                          {g.conj.toUpperCase()}
                        </button>
                      )}
                    </span>
                    <select
                      value={r.field}
                      onChange={(e) => {
                        const nf = fields.find((x) => x.id === e.target.value)!;
                        updRule(gi, ri, { field: e.target.value, op: MODEL_FILTER_OPS[bucket(nf.type)][0]![0], value: "", value2: "" });
                      }}
                      style={{ ...SEL, flex: 1 }}
                    >
                      {fields.map((x) => (
                        <option key={x.id} value={x.id}>
                          {x.label}
                        </option>
                      ))}
                    </select>
                    <button type="button" onClick={() => delRule(gi, ri)} style={{ border: "none", background: "none", color: "var(--p-text-3)", cursor: "pointer", padding: 2 }}>
                      <KIcon name="X" size={15} />
                    </button>
                  </div>
                  <div style={{ display: "flex", gap: 6, paddingLeft: 52 }}>
                    <select value={r.op} onChange={(e) => updRule(gi, ri, { op: e.target.value as ModelFilterOp })} style={{ ...SEL, flex: "0 0 auto" }}>
                      {ops.map(([id, lbl]) => (
                        <option key={id} value={id}>
                          {lbl}
                        </option>
                      ))}
                    </select>
                    {needsVal &&
                      (f.type === "select" || f.type === "bool" ? (
                        <select value={r.value || ""} onChange={(e) => updRule(gi, ri, { value: e.target.value })} style={{ ...SEL, flex: 1 }}>
                          <option value="">Choose…</option>
                          {(f.options || []).map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </select>
                      ) : f.type === "date" ? (
                        r.op === "dbetween" ? (
                          <div style={{ display: "flex", gap: 4, flex: 1 }}>
                            <input type="date" value={r.value || ""} onChange={(e) => updRule(gi, ri, { value: e.target.value })} style={{ ...SEL, flex: 1 }} />
                            <input type="date" value={r.value2 || ""} onChange={(e) => updRule(gi, ri, { value2: e.target.value })} style={{ ...SEL, flex: 1 }} />
                          </div>
                        ) : (
                          <input type="date" value={r.value || ""} onChange={(e) => updRule(gi, ri, { value: e.target.value })} style={{ ...SEL, flex: 1 }} />
                        )
                      ) : (
                        <input value={r.value || ""} onChange={(e) => updRule(gi, ri, { value: e.target.value })} placeholder="value" type={f.type === "num" ? "number" : "text"} style={{ ...SEL, flex: 1 }} />
                      ))}
                  </div>
                </div>
              );
            })}
            <button type="button" className="pill" onClick={() => addRule(gi)} style={{ marginTop: 10, justifyContent: "center" }}>
              <KIcon name="Plus" size={13} /> Add condition
            </button>
          </div>
        </div>
      ))}
      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <button type="button" className="pill" onClick={addGroup} style={{ flex: 1, justifyContent: "center" }}>
          <KIcon name="Plus" size={13} /> Add condition group
        </button>
        {m.groups.length > 0 && (
          <button type="button" className="pill" onClick={() => setModel(emptyFilterModel())} style={{ justifyContent: "center" }}>
            Clear all
          </button>
        )}
      </div>
    </div>
  );
}

/** Multi-key sort with up/down reorder. */
export function SortReorder<T>({ fields, rules, setRules }: { fields: FieldDef<T>[]; rules: SortRule[]; setRules: (r: SortRule[]) => void }) {
  const used = new Set((rules || []).map((r) => r.field));
  const free = fields.filter((f) => !used.has(f.id));
  const add = () => {
    if (free[0]) setRules([...(rules || []), { field: free[0].id, dir: "asc" }]);
  };
  const upd = (i: number, patch: Partial<SortRule>) => setRules(rules.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const del = (i: number) => setRules(rules.filter((_, j) => j !== i));
  const move = (i: number, d: number) => {
    const n = [...rules];
    const j = i + d;
    if (j < 0 || j >= n.length) return;
    [n[i], n[j]] = [n[j]!, n[i]!];
    setRules(n);
  };
  return (
    <div>
      {(!rules || !rules.length) && <div className="hint" style={{ marginBottom: 10 }}>No sort applied — records show in default order.</div>}
      {(rules || []).map((r, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up" style={{ border: "none", background: "none", cursor: i === 0 ? "default" : "pointer", color: i === 0 ? "var(--p-border)" : "var(--p-text-3)", padding: 0, lineHeight: 0.6 }}>
              <KIcon name="ChevronUp" size={14} />
            </button>
            <button type="button" onClick={() => move(i, 1)} disabled={i === rules.length - 1} aria-label="Move down" style={{ border: "none", background: "none", cursor: i === rules.length - 1 ? "default" : "pointer", color: i === rules.length - 1 ? "var(--p-border)" : "var(--p-text-3)", padding: 0, lineHeight: 0.6 }}>
              <KIcon name="ChevronDown" size={14} />
            </button>
          </div>
          <span style={{ fontSize: 11, color: "var(--p-text-3)", width: 34 }}>{i === 0 ? "Sort" : "then"}</span>
          <select value={r.field} onChange={(e) => upd(i, { field: e.target.value })} style={{ ...SEL, flex: 1 }}>
            {fields.map((x) => (
              <option key={x.id} value={x.id} disabled={used.has(x.id) && x.id !== r.field}>
                {x.label}
              </option>
            ))}
          </select>
          <button type="button" onClick={() => upd(i, { dir: r.dir === "asc" ? "desc" : "asc" })} className="pill" style={{ padding: "6px 9px", gap: 3 }}>
            <KIcon name={r.dir === "asc" ? "ArrowUp" : "ArrowDown"} size={13} /> {r.dir === "asc" ? "A→Z" : "Z→A"}
          </button>
          <button type="button" onClick={() => del(i)} aria-label="Remove sort" style={{ border: "none", background: "none", color: "var(--p-text-3)", cursor: "pointer", padding: 2 }}>
            <KIcon name="X" size={15} />
          </button>
        </div>
      ))}
      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <button type="button" className="pill" onClick={add} disabled={!free.length} style={{ flex: 1, justifyContent: "center", opacity: free.length ? 1 : 0.5 }}>
          <KIcon name="Plus" size={13} /> Add sort
        </button>
        {rules && rules.length > 0 && (
          <button type="button" className="pill" onClick={() => setRules([])} style={{ justifyContent: "center" }}>
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

/** Multi-level grouping picker (group by field, then by field). */
export function GroupBuilder<T>({ fields, levels, setLevels }: { fields: FieldDef<T>[]; levels: string[]; setLevels: (l: string[]) => void }) {
  const lv = levels || [];
  const used = new Set(lv);
  const groupable = fields.filter((f) => f.type !== "num");
  const free = groupable.filter((f) => !used.has(f.id));
  const set = (i: number, id: string) => setLevels(id === "none" ? lv.filter((_, j) => j < i) : lv.map((v, j) => (j === i ? id : v)));
  const add = () => {
    if (free[0]) setLevels([...lv, free[0].id]);
  };
  return (
    <div>
      {!lv.length && <div className="hint" style={{ marginBottom: 10 }}>No grouping — flat list. Group by a field to see collapsible sections.</div>}
      {lv.map((id, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
          <span style={{ fontSize: 11, color: "var(--p-text-3)", width: 60 }}>{i === 0 ? "Group by" : "then by"}</span>
          <select value={id} onChange={(e) => set(i, e.target.value)} style={{ ...SEL, flex: 1 }}>
            {groupable.map((x) => (
              <option key={x.id} value={x.id} disabled={used.has(x.id) && x.id !== id}>
                {x.label}
              </option>
            ))}
            <option value="none">— Remove</option>
          </select>
        </div>
      ))}
      {free.length > 0 && lv.length < 3 && (
        <button type="button" className="pill" onClick={add} style={{ justifyContent: "center", marginTop: 2 }}>
          <KIcon name="Plus" size={13} /> {lv.length ? "Add sub-group" : "Group by field"}
        </button>
      )}
    </div>
  );
}

/** View Options bottom sheet — Layout · Filter · Sort · Group in one drawer. */
export function ViewSheet<T>({
  tab,
  fields,
  model,
  setModel,
  sortRules,
  setSortRules,
  levels,
  setLevels,
  view,
  setView,
  views,
  onClose,
}: {
  tab?: string;
  fields: FieldDef<T>[];
  model: FilterModel;
  setModel: (m: FilterModel) => void;
  sortRules: SortRule[];
  setSortRules: (r: SortRule[]) => void;
  levels: string[];
  setLevels: (l: string[]) => void;
  view?: ViewMode;
  setView?: (v: ViewMode) => void;
  views?: ViewMode[];
  onClose: () => void;
}) {
  const nF = countFilterRules(model);
  const nS = (sortRules || []).filter((r) => r.field).length;
  const nG = (levels || []).filter(Boolean).length;
  const SEGS: [string, string, string, number][] = [
    ...((views ? [["layout", "Layout", "LayoutGrid", 0]] : []) as [string, string, string, number][]),
    ["filter", "Filter", "SlidersHorizontal", nF],
    ["sort", "Sort", "ArrowDownUp", nS],
    ["group", "Group", "Group", nG],
  ];
  const [seg, setSeg] = useState(tab || (views ? "layout" : "filter"));
  const resetAll = () => {
    setModel(emptyFilterModel());
    setSortRules([]);
    setLevels([]);
  };
  return (
    <Sheet icon="SlidersHorizontal" title="View Options" onClose={onClose} panelStyle={{ maxHeight: "86%" }}>
      <div className="viewseg" style={{ marginBottom: 14 }}>
        {SEGS.map(([id, lab, ic, n]) => (
          <button key={id} type="button" className={seg === id ? "on" : ""} onClick={() => setSeg(id)}>
            <KIcon name={ic} size={14} /> {lab}
            {n > 0 && <span style={{ marginLeft: 5, fontWeight: 800, color: "var(--p-accent)" }}>{n}</span>}
          </button>
        ))}
      </div>
      <div style={{ minHeight: 120, marginBottom: 12 }}>
        {seg === "layout" && views && setView && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {views.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 7, padding: "16px 8px", borderRadius: 12, cursor: "pointer",
                  background: view === v ? "color-mix(in oklab, var(--p-accent) 14%, var(--p-surface))" : "var(--p-surface)",
                  border: `1px solid ${view === v ? "var(--p-accent)" : "var(--p-border)"}`,
                  color: view === v ? "var(--p-accent-text)" : "var(--p-text-2)",
                  font: "inherit",
                }}
              >
                <KIcon name={VIEW_ICON[v] || "List"} size={20} />
                <span style={{ fontSize: 12.5, fontWeight: 700 }}>{v[0]!.toUpperCase() + v.slice(1)}</span>
              </button>
            ))}
          </div>
        )}
        {seg === "filter" && <FilterGroups fields={fields} model={model} setModel={setModel} />}
        {seg === "sort" && <SortReorder fields={fields} rules={sortRules} setRules={setSortRules} />}
        {seg === "group" && <GroupBuilder fields={fields} levels={levels} setLevels={setLevels} />}
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button type="button" className="ps-btn ps-btn--secondary ps-btn--lg" style={{ flex: 1, justifyContent: "center" }} onClick={resetAll}>
          Reset All
        </button>
        <button type="button" className="ps-btn ps-btn--cta ps-btn--lg" style={{ flex: 1.4, justifyContent: "center" }} onClick={onClose}>
          Done
        </button>
      </div>
    </Sheet>
  );
}

function ShareToggle({ on, set, label }: { on: boolean; set: (v: boolean) => void; label: string }) {
  return (
    <button type="button" className="switch" role="switch" aria-checked={on} aria-label={label} data-on={on ? "1" : undefined} onClick={() => set(!on)} style={{ border: "none", padding: 0 }}>
      <span className="knob" />
    </button>
  );
}

function ShareRow({ icon, t, s, right, onClick }: { icon: string; t: string; s?: string; right?: ReactNode; onClick?: () => void }) {
  return (
    <div className={`item${onClick ? " tap" : ""}`} style={onClick ? { cursor: "pointer" } : undefined} {...pressable(onClick)}>
      <span className="more-ic">
        <KIcon name={icon} size={17} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="t">{t}</div>
        {s && <div className="s">{s}</div>}
      </div>
      {right}
    </div>
  );
}

/**
 * Share & Export bottom sheet — a REAL shareable link (this view's live URL) +
 * genuine client-side row exports (CSV / JSON) + print. No fabricated share-token
 * service or automation backend: permissioned/expiring public links, scheduled
 * delivery, webhooks and embeds are provisioned in the ATLVS web console, so they
 * are not shown here rather than faked. Export rows are the caller's current
 * filtered set (`rows` + `fields`); absent them, only Print is offered.
 */
export function ShareSheet<T>({
  title,
  onClose,
  rows,
  fields,
}: {
  title: string;
  onClose: () => void;
  rows?: readonly T[];
  fields?: readonly FieldDef<T>[];
}) {
  const [seg, setSeg] = useState("share");
  const [linkOn, setLinkOn] = useState(true);
  const [copied, setCopied] = useState(false);
  // Honest link: the live URL of the current view — copy/share what resolves.
  const link = typeof window !== "undefined" ? window.location.href : "";
  const slug =
    (title || "view").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "view";
  const cols = fields ?? [];
  const canExport = rows != null && rows.length > 0 && cols.length > 0;

  const copy = () => {
    try {
      navigator.clipboard?.writeText(link);
    } catch {
      /* clipboard unavailable */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const cellValue = (r: T, f: FieldDef<T>): string => {
    const v = f.get ? f.get(r) : (r as Record<string, unknown>)[f.id];
    return v == null ? "" : String(v);
  };
  const download = (data: string, mime: string, ext: string) => {
    try {
      const blob = new Blob([data], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${slug}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      /* download unavailable in this context */
    }
    onClose();
  };
  const exportCsv = () => {
    if (!rows) return;
    const esc = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
    const head = cols.map((f) => esc(f.label)).join(",");
    const body = rows.map((r) => cols.map((f) => esc(cellValue(r, f))).join(",")).join("\n");
    download(`${head}\n${body}`, "text/csv;charset=utf-8", "csv");
  };
  const exportJson = () => {
    if (!rows) return;
    const data = rows.map((r) =>
      Object.fromEntries(cols.map((f) => [f.id, f.get ? f.get(r) : (r as Record<string, unknown>)[f.id]])),
    );
    download(JSON.stringify(data, null, 2), "application/json", "json");
  };

  return (
    <Sheet icon="Share" title="Share & Export" onClose={onClose} panelStyle={{ maxHeight: "86%" }}>
      <div className="viewseg" style={{ marginBottom: 14 }}>
        {([["share", "Share", "Link"], ["export", "Export", "Download"]] as [string, string, string][]).map(([id, lab, ic]) => (
          <button key={id} type="button" className={seg === id ? "on" : ""} onClick={() => setSeg(id)}>
            <KIcon name={ic} size={14} /> {lab}
          </button>
        ))}
      </div>
      {seg === "share" && (
        <div>
          <div className="sech" style={{ marginTop: 0 }}>
            <h2>Shareable Link</h2>
            <ShareToggle on={linkOn} set={setLinkOn} label="Shareable link" />
          </div>
          {linkOn && (
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <div className="searchbar" style={{ flex: 1, margin: 0 }}>
                <KIcon name="Link" size={15} />
                <input readOnly value={link} style={{ fontFamily: "var(--p-mono)", fontSize: 12 }} />
              </div>
              <button type="button" className={`ps-btn ${copied ? "ps-btn--secondary" : "ps-btn--cta"} ps-btn--lg`} onClick={copy} style={{ flex: "none", justifyContent: "center" }}>
                <KIcon name={copied ? "Check" : "Copy"} size={15} /> {copied ? "Copied" : "Copy"}
              </button>
            </div>
          )}
          <p className="s" style={{ color: "var(--p-text-3)", margin: "0 0 12px", lineHeight: 1.4 }}>
            Opens this view for teammates already on ATLVS. Permissioned public links and expiring
            links are set up in the ATLVS web console.
          </p>
          <div className="sech">
            <h2>Invite People</h2>
          </div>
          <a
            className="ps-btn ps-btn--secondary ps-btn--lg"
            style={{ width: "100%", justifyContent: "center" }}
            href={`mailto:?subject=${encodeURIComponent(title || "ATLVS view")}&body=${encodeURIComponent(link)}`}
          >
            <KIcon name="Send" size={15} /> Share via Email
          </a>
        </div>
      )}
      {seg === "export" && (
        <div>
          <div className="sech" style={{ marginTop: 0 }}>
            <h2>Export{canExport ? ` · ${rows!.length} ${rows!.length === 1 ? "row" : "rows"}` : ""}</h2>
          </div>
          {canExport ? (
            <>
              <ShareRow icon="Sheet" t="CSV Spreadsheet" s="Rows & columns as filtered" right={<KIcon name="Download" size={16} style={{ color: "var(--p-text-3)" }} />} onClick={exportCsv} />
              <ShareRow icon="Braces" t="JSON" s="Raw records for developers" right={<KIcon name="Download" size={16} style={{ color: "var(--p-text-3)" }} />} onClick={exportJson} />
            </>
          ) : (
            <p className="s" style={{ color: "var(--p-text-3)", margin: "0 0 12px", lineHeight: 1.4 }}>
              Row exports (CSV / JSON) are available from list and table views.
            </p>
          )}
          <div className="sech">
            <h2>Print</h2>
          </div>
          <button
            type="button"
            className="ps-btn ps-btn--secondary ps-btn--lg"
            style={{ width: "100%", justifyContent: "center" }}
            onClick={() => {
              onClose();
              window.print();
            }}
          >
            <KIcon name="Printer" size={15} /> Print Current View
          </button>
        </div>
      )}
    </Sheet>
  );
}

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Schema-driven multi-view renderer — list / table / board / calendar / gallery. */
export function DataView<T>({
  view,
  items,
  fields,
  renderRow,
  onRow,
  statusField,
  statusOrder,
  dateField,
  gallery,
  boardTone,
  listWrapClassName,
}: {
  view: ViewMode;
  items: T[];
  fields: FieldDef<T>[];
  renderRow: (item: T, compact?: boolean) => ReactNode;
  onRow?: (item: T) => void;
  statusField?: string;
  statusOrder?: string[];
  dateField?: string;
  gallery?: (item: T) => ReactNode;
  boardTone?: Record<string, string>;
  /** Optional wrapper class for the flat list view (e.g. `"tl"` for a timeline
   *  rail). Applied only to the ungrouped list layout. */
  listWrapClassName?: string;
}) {
  if (view === "table") return <DataTable fields={fields} items={items} onRow={onRow} />;
  if (view === "board") {
    const f = fields.find((x) => x.id === statusField);
    if (!f || !f.get) return <>{items.map((it, i) => <div key={i}>{renderRow(it)}</div>)}</>;
    const get = f.get;
    const vals = statusOrder || [...new Set(items.map((it) => String(get(it))))];
    return (
      <div className="board-scroll" style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 6, margin: "0 -2px" }}>
        {vals.map((col) => {
          const cards = items.filter((it) => String(get(it)) === col);
          return (
            <div key={col} style={{ flex: "0 0 190px", minWidth: 190 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 2px 8px", fontSize: 11, fontWeight: 800, letterSpacing: ".04em", textTransform: "uppercase", color: "var(--p-text-3)" }}>
                <span style={{ width: 7, height: 7, borderRadius: 99, background: `var(--p-${(boardTone && boardTone[col]) || "text-3"})` }} />
                {col}
                <span style={{ opacity: 0.6 }}>{cards.length}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {cards.map((it, i) => (
                  <div key={i} className="board-card" {...pressable(onRow ? () => onRow(it) : undefined)} style={{ cursor: onRow ? "pointer" : "default", background: "var(--p-surface)", border: "1px solid var(--p-border)", borderRadius: 12, padding: 11, boxShadow: "var(--p-elev-1)" }}>
                    {gallery ? gallery(it) : renderRow(it, true)}
                  </div>
                ))}
                {!cards.length && <div style={{ fontSize: 11, color: "var(--p-text-3)", padding: "8px 2px" }}>—</div>}
              </div>
            </div>
          );
        })}
      </div>
    );
  }
  if (view === "calendar") {
    const f = fields.find((x) => x.id === dateField);
    const iso = f?.iso;
    const withDate = items.map((it) => ({ it, iso: iso ? iso(it) : null })).filter((x) => x.iso);
    const noDate = items.filter((it) => !(iso && iso(it)));
    const days = [...new Set(withDate.map((x) => x.iso as string))].sort();
    return (
      <div>
        {days.map((day) => {
          const d = new Date(day + "T00:00:00");
          const isToday = day === NOW_ISO;
          return (
            <div key={day} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "2px 0 8px" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: 10, background: isToday ? "var(--p-accent)" : "var(--p-surface-2, var(--p-surface))", border: "1px solid var(--p-border)", color: isToday ? "var(--p-accent-contrast)" : "var(--p-text-1)", flex: "none" }}>
                  <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", opacity: 0.8 }}>{MON[d.getMonth()]}</span>
                  <span style={{ fontSize: 16, fontWeight: 800, lineHeight: 1 }}>{d.getDate()}</span>
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--p-text-2)" }}>
                  {WEEKDAY[d.getDay()]}
                  {isToday && <span style={{ color: "var(--p-accent)" }}> · Today</span>}
                </div>
              </div>
              {withDate.filter((x) => x.iso === day).map((x, i) => <div key={i}>{renderRow(x.it)}</div>)}
            </div>
          );
        })}
        {noDate.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div className="sech" style={{ margin: "2px 0 8px" }}>
              <h2>Unscheduled</h2>
            </div>
            {noDate.map((it, i) => <div key={i}>{renderRow(it)}</div>)}
          </div>
        )}
      </div>
    );
  }
  if (view === "gallery")
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {items.map((it, i) => (
          <div key={i} className="gallery-card" {...pressable(onRow ? () => onRow(it) : undefined)} style={{ cursor: onRow ? "pointer" : "default", background: "var(--p-surface)", border: "1px solid var(--p-border)", borderRadius: 14, padding: 12, boxShadow: "var(--p-elev-1)" }}>
            {gallery ? gallery(it) : renderRow(it, true)}
          </div>
        ))}
      </div>
    );
  if (listWrapClassName) return <div className={listWrapClassName}>{items.map((it, i) => <div key={i}>{renderRow(it)}</div>)}</div>;
  return <>{items.map((it, i) => <div key={i}>{renderRow(it)}</div>)}</>;
}

/** Nested collapsible group tree (from `groupTree`). */
export function GroupedTree<T>({
  skey,
  tree,
  renderRow,
  collapsed,
  setCollapsed,
  depth = 0,
  path = "",
}: {
  skey: string;
  tree: GroupNode<T>[];
  renderRow: (item: T) => ReactNode;
  collapsed: Set<string>;
  setCollapsed: (s: Set<string>) => void;
  depth?: number;
  path?: string;
}) {
  return (
    <>
      {tree.map((node, i) => {
        const key = `${skey}:${path}${i}:${node.label}`;
        const isOpen = !collapsed.has(key);
        const toggle = () => {
          const n = new Set(collapsed);
          if (n.has(key)) n.delete(key);
          else n.add(key);
          setCollapsed(n);
        };
        const count = node.items.length;
        return (
          <div key={key} style={{ marginBottom: 8 }}>
            <button
              type="button"
              onClick={toggle}
              style={{
                display: "flex", alignItems: "center", gap: 7, width: "100%", padding: "6px 2px", background: "none", border: "none",
                marginLeft: depth * 10, font: "inherit", cursor: "pointer", color: "var(--p-text-2)",
              }}
            >
              <KIcon name={isOpen ? "ChevronDown" : "ChevronRight"} size={15} />
              <span style={{ fontSize: 12.5, fontWeight: 800, letterSpacing: ".01em" }}>{node.label}</span>
              <span style={{ fontSize: 11, color: "var(--p-text-3)", fontWeight: 700 }}>{count}</span>
            </button>
            {isOpen &&
              (node.children ? (
                <GroupedTree skey={skey} tree={node.children} renderRow={renderRow} collapsed={collapsed} setCollapsed={setCollapsed} depth={depth + 1} path={`${path}${i}.`} />
              ) : (
                <div style={{ marginLeft: depth * 10 }}>{node.items.map((it, j) => <div key={j}>{renderRow(it)}</div>)}</div>
              ))}
          </div>
        );
      })}
    </>
  );
}
