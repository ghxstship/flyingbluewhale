"use client";

import { useMemo, useState, type ReactNode } from "react";
import { KIcon } from "./icon";

/**
 * Airtable-style view engine + schema-driven data table. Ported from the
 * prototype `FILTER_OPS` / `evalRule` / `applyView` / `FilterBuilder` /
 * `SortBuilder` / `DataTable`.
 *
 * `FieldDef<T>` is the shared schema that powers both the filter/sort
 * builders and the table columns — define your fields once, get every view.
 */
export type FieldType = "text" | "num" | "date" | "select" | "bool";

export type FieldDef<T> = {
  id: string;
  label: string;
  type: FieldType;
  options?: string[];
  /** Accessor for the field's raw value off an item. */
  get?: (item: T) => unknown;
  /** Optional custom cell renderer for the table view (defaults to `get`). */
  cell?: (item: T) => ReactNode;
};

export type FilterOp =
  | "contains"
  | "ncontains"
  | "is"
  | "isnot"
  | "empty"
  | "nempty"
  | "eq"
  | "ne"
  | "gt"
  | "lt"
  | "gte"
  | "lte";

export type FilterRule = { field: string; op: FilterOp; value: string };
export type SortRule = { field: string; dir: "asc" | "desc" };
export type Conjunction = "and" | "or";

/** Op catalogs keyed by the field-type bucket the builders use. */
export const FILTER_OPS: Record<"text" | "num" | "enum", ReadonlyArray<readonly [FilterOp, string]>> = {
  text: [
    ["contains", "contains"],
    ["ncontains", "doesn't contain"],
    ["is", "is"],
    ["isnot", "is not"],
    ["empty", "is empty"],
    ["nempty", "is not empty"],
  ],
  num: [
    ["eq", "="],
    ["ne", "≠"],
    ["gt", ">"],
    ["lt", "<"],
    ["gte", "≥"],
    ["lte", "≤"],
  ],
  enum: [
    ["is", "is"],
    ["isnot", "is not"],
  ],
};

/** Map a FieldDef type to its FILTER_OPS bucket. */
function opBucket(type: FieldType): "text" | "num" | "enum" {
  if (type === "num") return "num";
  if (type === "select" || type === "bool") return "enum";
  return "text";
}

function readValue<T>(field: FieldDef<T>, item: T): unknown {
  return field.get ? field.get(item) : undefined;
}

export function evalRule<T>(item: T, rule: FilterRule, fields: FieldDef<T>[]): boolean {
  const f = fields.find((x) => x.id === rule.field);
  if (!f) return true;
  const v = readValue(f, item);
  const val = rule.value;
  const sv = String(v == null ? "" : v).toLowerCase();
  const svl = String(val == null ? "" : val).toLowerCase();
  switch (rule.op) {
    case "contains":
      return sv.includes(svl);
    case "ncontains":
      return !sv.includes(svl);
    case "is":
      return sv === svl;
    case "isnot":
      return sv !== svl;
    case "empty":
      return !v && v !== 0;
    case "nempty":
      return !!v || v === 0;
    case "eq":
      return Number(v) === Number(val);
    case "ne":
      return Number(v) !== Number(val);
    case "gt":
      return Number(v) > Number(val);
    case "lt":
      return Number(v) < Number(val);
    case "gte":
      return Number(v) >= Number(val);
    case "lte":
      return Number(v) <= Number(val);
    default:
      return true;
  }
}

export function applyView<T>(
  items: T[],
  fields: FieldDef<T>[],
  filterRules: FilterRule[] | undefined,
  conj: Conjunction,
  sortRules: SortRule[] | undefined,
): T[] {
  const af = (filterRules || []).filter(
    (r) => r.field && r.op && (r.value !== "" || r.op === "empty" || r.op === "nempty"),
  );
  let out = af.length
    ? items.filter((it) =>
        conj === "or" ? af.some((r) => evalRule(it, r, fields)) : af.every((r) => evalRule(it, r, fields)),
      )
    : items;
  const asr = (sortRules || []).filter((r) => r.field);
  if (asr.length)
    out = [...out].sort((a, b) => {
      for (const r of asr) {
        const f = fields.find((x) => x.id === r.field);
        if (!f) continue;
        const av = readValue(f, a);
        const bv = readValue(f, b);
        const cmp =
          f.type === "num" ? Number(av) - Number(bv) : String(av).localeCompare(String(bv));
        if (cmp !== 0) return r.dir === "desc" ? -cmp : cmp;
      }
      return 0;
    });
  return out;
}

const selStyle: React.CSSProperties = {
  border: "1px solid var(--p-border)",
  borderRadius: 8,
  padding: "6px 7px",
  fontSize: 12,
  background: "var(--p-surface)",
  color: "var(--p-text-1)",
  fontFamily: "inherit",
  minWidth: 0,
};

export type FilterBuilderProps<T> = {
  fields: FieldDef<T>[];
  rules: FilterRule[];
  setRules: (rules: FilterRule[]) => void;
  conj: Conjunction;
  setConj: (conj: Conjunction) => void;
};

export function FilterBuilder<T>({ fields, rules, setRules, conj, setConj }: FilterBuilderProps<T>) {
  const first = fields[0];
  const add = () => {
    if (!first) return;
    const ops = FILTER_OPS[opBucket(first.type)];
    const op = ops[0]?.[0] ?? "contains";
    setRules([...(rules || []), { field: first.id, op, value: "" }]);
  };
  const upd = (i: number, patch: Partial<FilterRule>) =>
    setRules(rules.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const del = (i: number) => setRules(rules.filter((_, j) => j !== i));
  return (
    <div style={{ width: 258 }}>
      {(!rules || !rules.length) && (
        <div className="hint" style={{ marginBottom: 8 }}>
          No conditions. Show all items.
        </div>
      )}
      {(rules || []).map((r, i) => {
        const f = fields.find((x) => x.id === r.field) || first;
        if (!f) return null;
        const ops = FILTER_OPS[opBucket(f.type)];
        const needsVal = r.op !== "empty" && r.op !== "nempty";
        return (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 44, fontSize: 11, fontWeight: 700, color: "var(--p-text-3)" }}>
                {i === 0 ? (
                  "Where"
                ) : (
                  <select
                    value={conj}
                    onChange={(e) => setConj(e.target.value as Conjunction)}
                    style={{ ...selStyle, padding: "3px 4px", width: 44 }}
                  >
                    <option value="and">And</option>
                    <option value="or">Or</option>
                  </select>
                )}
              </span>
              <select
                value={r.field}
                onChange={(e) => {
                  const nf = fields.find((x) => x.id === e.target.value);
                  const nops = nf ? FILTER_OPS[opBucket(nf.type)] : FILTER_OPS.text;
                  upd(i, { field: e.target.value, op: nops[0]?.[0] ?? "contains", value: "" });
                }}
                style={{ ...selStyle, flex: 1 }}
              >
                {fields.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => del(i)}
                style={{ border: "none", background: "none", color: "var(--p-text-3)", cursor: "pointer", padding: 2 }}
              >
                <KIcon name="X" size={14} />
              </button>
            </div>
            <div style={{ display: "flex", gap: 6, paddingLeft: 50 }}>
              <select
                value={r.op}
                onChange={(e) => upd(i, { op: e.target.value as FilterOp })}
                style={{ ...selStyle, flex: "0 0 auto" }}
              >
                {ops.map(([id, lbl]) => (
                  <option key={id} value={id}>
                    {lbl}
                  </option>
                ))}
              </select>
              {needsVal &&
                (f.type === "select" || f.type === "bool" ? (
                  <select
                    value={r.value}
                    onChange={(e) => upd(i, { value: e.target.value })}
                    style={{ ...selStyle, flex: 1 }}
                  >
                    <option value="">Choose…</option>
                    {(f.options || []).map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={r.value}
                    onChange={(e) => upd(i, { value: e.target.value })}
                    placeholder="value"
                    type={f.type === "num" ? "number" : "text"}
                    style={{ ...selStyle, flex: 1 }}
                  />
                ))}
            </div>
          </div>
        );
      })}
      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <button type="button" className="pill" onClick={add} style={{ flex: 1, justifyContent: "center" }}>
          <KIcon name="Plus" size={13} /> Add condition
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

export type SortBuilderProps<T> = {
  fields: FieldDef<T>[];
  rules: SortRule[];
  setRules: (rules: SortRule[]) => void;
};

export function SortBuilder<T>({ fields, rules, setRules }: SortBuilderProps<T>) {
  const used = new Set((rules || []).map((r) => r.field));
  const free = fields.filter((f) => !used.has(f.id));
  const add = () => {
    const f0 = free[0];
    if (f0) setRules([...(rules || []), { field: f0.id, dir: "asc" }]);
  };
  const upd = (i: number, patch: Partial<SortRule>) =>
    setRules(rules.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const del = (i: number) => setRules(rules.filter((_, j) => j !== i));
  return (
    <div style={{ width: 252 }}>
      {(!rules || !rules.length) && (
        <div className="hint" style={{ marginBottom: 8 }}>
          No sort applied.
        </div>
      )}
      {(rules || []).map((r, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 7 }}>
          <span style={{ fontSize: 10, color: "var(--p-text-3)", width: 26 }}>{i === 0 ? "Sort" : "then"}</span>
          <select
            value={r.field}
            onChange={(e) => upd(i, { field: e.target.value })}
            style={{ ...selStyle, flex: 1 }}
          >
            {fields.map((x) => (
              <option key={x.id} value={x.id} disabled={used.has(x.id) && x.id !== r.field}>
                {x.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => upd(i, { dir: r.dir === "asc" ? "desc" : "asc" })}
            className="pill"
            style={{ padding: "5px 8px", gap: 3 }}
          >
            <KIcon name={r.dir === "asc" ? "ArrowUp" : "ArrowDown"} size={12} /> {r.dir === "asc" ? "Asc" : "Desc"}
          </button>
          <button
            type="button"
            onClick={() => del(i)}
            style={{ border: "none", background: "none", color: "var(--p-text-3)", cursor: "pointer", padding: 2 }}
          >
            <KIcon name="X" size={14} />
          </button>
        </div>
      ))}
      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <button
          type="button"
          className="pill"
          onClick={add}
          disabled={!free.length}
          style={{ flex: 1, justifyContent: "center", opacity: free.length ? 1 : 0.5 }}
        >
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

export type DataTableProps<T> = {
  fields: FieldDef<T>[];
  items: T[];
  onRow?: (item: T) => void;
  /** Tap-to-sort column headers (kit 32 D1). Defaults on; a header is only
   * sortable when its field carries a `get` accessor (no accessor, nothing
   * honest to compare). Cycle per column: asc → desc → back to the list's
   * own order (the ActionBar sort stays the base order). */
  sortable?: boolean;
};

export function DataTable<T>({ fields, items, onRow, sortable = true }: DataTableProps<T>) {
  const [headerSort, setHeaderSort] = useState<SortRule | null>(null);

  const canSort = (f: FieldDef<T>) => sortable && typeof f.get === "function";

  const tap = (f: FieldDef<T>) => {
    setHeaderSort((cur) => {
      if (!cur || cur.field !== f.id) return { field: f.id, dir: "asc" };
      if (cur.dir === "asc") return { field: f.id, dir: "desc" };
      return null; // third tap clears back to the caller's order
    });
  };

  const rows = useMemo(() => {
    if (!headerSort) return items;
    const f = fields.find((x) => x.id === headerSort.field);
    if (!f || !f.get) return items;
    return [...items].sort((a, b) => {
      const av = readValue(f, a);
      const bv = readValue(f, b);
      const cmp = f.type === "num" ? Number(av) - Number(bv) : String(av ?? "").localeCompare(String(bv ?? ""));
      return headerSort.dir === "desc" ? -cmp : cmp;
    });
  }, [items, fields, headerSort]);

  return (
    <div className="dt-wrap">
      <table className="dt">
        <thead>
          <tr>
            {fields.map((f) => {
              const active = headerSort?.field === f.id ? headerSort.dir : null;
              const ariaSort = active === "asc" ? "ascending" : active === "desc" ? "descending" : undefined;
              return (
                <th key={f.id} className={f.type === "num" ? "num" : ""} aria-sort={ariaSort}>
                  {canSort(f) ? (
                    <button
                      type="button"
                      onClick={() => tap(f)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 3,
                        background: "none",
                        border: "none",
                        padding: 0,
                        margin: 0,
                        font: "inherit",
                        color: active ? "var(--p-text-1)" : "inherit",
                        cursor: "pointer",
                        minHeight: 28,
                      }}
                    >
                      {f.label}
                      {active && <KIcon name={active === "asc" ? "ArrowUp" : "ArrowDown"} size={11} />}
                    </button>
                  ) : (
                    f.label
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((it, i) => (
            <tr key={i} onClick={() => onRow?.(it)}>
              {fields.map((f) => {
                const v: ReactNode = f.cell ? f.cell(it) : (readValue(f, it) as ReactNode);
                return (
                  <td key={f.id} className={f.type === "num" ? "num" : ""}>
                    {v == null ? "" : v}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
