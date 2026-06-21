"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ActionBar,
  DataTable,
  GroupedList,
  ItemUnits,
  KIcon,
  type FieldDef,
  type ViewMode,
} from "@/components/mobile/kit";
import { EmptyState } from "@/components/ui/EmptyState";
import type { CatalogKind } from "@/lib/db/assignments";

export type InventoryItem = {
  id: string;
  kind: CatalogKind;
  cat: string;
  name: string;
  code: string | null;
  unitCostCents: number | null;
  qty: number | null;
};

export type InventoryLabels = {
  eyebrow: string;
  title: string;
  search: string;
  scan: string;
  empty: string;
  emptyHint: string;
  units: string;
  colItem: string;
  colCategory: string;
  colCode: string;
  colQty: string;
  colCost: string;
  onHand: string;
  tracked: string;
  untracked: string;
};

function money(cents: number | null): string {
  if (cents == null) return "—";
  return `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function qtyTone(qty: number | null): "ok" | "warn" | "neutral" {
  if (qty == null) return "neutral";
  if (qty <= 0) return "warn";
  return "ok";
}

export function InventoryView({ items, labels }: { items: InventoryItem[]; labels: InventoryLabels }) {
  const [q, setQ] = useState("");
  const [view, setView] = useState<ViewMode>("list");
  const [group, setGroup] = useState("none");
  const [sort, setSort] = useState("name");
  const [cats, setCats] = useState<Set<string>>(new Set());
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  // Distinct categories present in the data → filter chips.
  const allCats = useMemo(() => {
    const seen: string[] = [];
    for (const it of items) if (!seen.includes(it.cat)) seen.push(it.cat);
    return seen.sort((a, b) => a.localeCompare(b));
  }, [items]);

  const filtered = useMemo(() => {
    const ql = q.toLowerCase();
    return items
      .filter((it) => cats.size === 0 || cats.has(it.cat))
      .filter(
        (it) => !ql || (it.name + " " + (it.code ?? "")).toLowerCase().includes(ql),
      )
      .sort((a, b) =>
        sort === "code"
          ? (a.code ?? "").localeCompare(b.code ?? "")
          : sort === "qty"
            ? (b.qty ?? -1) - (a.qty ?? -1)
            : a.name.localeCompare(b.name),
      );
  }, [items, q, cats, sort]);

  const tableFields: FieldDef<InventoryItem>[] = [
    { id: "name", label: labels.colItem, type: "text", get: (x) => x.name },
    { id: "cat", label: labels.colCategory, type: "text", get: (x) => x.cat },
    { id: "code", label: labels.colCode, type: "text", get: (x) => x.code ?? "—" },
    { id: "qty", label: labels.colQty, type: "num", get: (x) => x.qty ?? "—" },
    { id: "cost", label: labels.colCost, type: "text", get: (x) => money(x.unitCostCents) },
  ];

  const toggleCat = (c: string) =>
    setCats((prev) => {
      const n = new Set(prev);
      n.has(c) ? n.delete(c) : n.add(c);
      return n;
    });

  const row = (x: InventoryItem) => {
    const open = expanded === x.id;
    const tone = qtyTone(x.qty);
    // Per-instance ItemUnits expansion: synthesize the on-hand instances from
    // inventory_qty (the catalog has no per-serial table — units are derived).
    const units =
      x.qty != null && x.qty > 0
        ? Array.from({ length: Math.min(x.qty, 12) }, (_, i) => ({
            tag: `${x.code ?? x.cat.slice(0, 3).toUpperCase()}-${String(i + 1).padStart(3, "0")}`,
            status: labels.tracked,
            holder: x.cat,
            tone: "ok" as const,
          }))
        : [];
    return (
      <div key={x.id}>
        <div
          className="item tap"
          style={{ cursor: "pointer" }}
          onClick={() => setExpanded(open ? null : x.id)}
        >
          <span className="bar" style={{ background: `var(--p-${tone === "warn" ? "warning" : tone === "ok" ? "success" : "border"})` }} />
          <span className="cart-thumb" style={{ width: 38, height: 38 }}>
            <KIcon name="Package" size={16} style={{ color: "var(--p-text-3)" }} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="t">{x.name}</div>
            <div className="s">
              {x.qty != null ? `${x.qty} ${labels.onHand}` : labels.untracked}
              {x.code ? <> · <span style={{ fontFamily: "var(--p-mono)" }}>{x.code}</span></> : null}
            </div>
          </div>
          <span className={`ps-badge ps-badge--${tone}`}>{money(x.unitCostCents)}</span>
          {units.length > 0 && (
            <KIcon name={open ? "ChevronDown" : "ChevronRight"} size={16} style={{ color: "var(--p-text-3)", flex: "none" }} />
          )}
        </div>
        {open && units.length > 0 && (
          <div style={{ padding: "4px 4px 10px" }}>
            <div className="wl" style={{ marginBottom: 6 }}>{labels.units}</div>
            <ItemUnits units={units} onToast={() => {}} />
          </div>
        )}
      </div>
    );
  };

  const grouped =
    group === "cat"
      ? allCats
          .map((c) => [c, filtered.filter((x) => x.cat === c)] as [string, InventoryItem[]])
          .filter(([, m]) => m.length)
      : null;

  return (
    <>
      <div className="scr-eye">{labels.eyebrow}</div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>{labels.title}</h1>
      <ActionBar<InventoryItem>
        k="iv"
        query={q}
        setQuery={setQ}
        placeholder={labels.search}
        view={view}
        setView={setView}
        views={["list", "gallery", "table"]}
        group={group}
        setGroup={setGroup}
        groupOpts={[["none", "None"], ["cat", labels.colCategory]]}
        sort={sort}
        setSort={setSort}
        sortOpts={[["name", "Name"], ["qty", labels.colQty], ["code", labels.colCode]]}
        filterActive={cats.size}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        filterChildren={
          <>
            <div className="wl" style={{ marginBottom: 8 }}>{labels.colCategory}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 10 }}>
              {allCats.map((c) => (
                <button key={c} type="button" className={`chip ${cats.has(c) ? "on" : ""}`} onClick={() => toggleCat(c)}>
                  {c}
                </button>
              ))}
            </div>
            <button type="button" className="pill" style={{ width: "100%", justifyContent: "center", marginTop: 4 }} onClick={() => setCats(new Set())}>
              Reset filters
            </button>
          </>
        }
      />
      {view === "gallery" ? (
        <div className="mkt">
          {filtered.map((x) => (
            <div className="mcard" key={x.id} onClick={() => setExpanded(expanded === x.id ? null : x.id)}>
              <div className="mthumb">
                <KIcon name="Package" size={30} style={{ color: "var(--p-text-3)" }} />
                {x.code && <span className="mtag">{x.code}</span>}
              </div>
              <div className="t" style={{ fontSize: 13, marginTop: 7 }}>{x.name}</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
                <span className="s" style={{ fontSize: 11 }}>{x.qty != null ? `${x.qty} ${labels.onHand}` : labels.untracked}</span>
                <span className={`ps-badge ps-badge--${qtyTone(x.qty)}`}>{money(x.unitCostCents)}</span>
              </div>
            </div>
          ))}
        </div>
      ) : view === "table" ? (
        <DataTable fields={tableFields} items={filtered} />
      ) : grouped ? (
        <GroupedList<InventoryItem> skey="iv" groups={grouped} collapsed={collapsed} setCollapsed={setCollapsed} renderRow={row} />
      ) : (
        filtered.map(row)
      )}
      {!filtered.length && <EmptyState title={labels.empty} description={labels.emptyHint} />}
      <Link
        href="/m/inventory/scan"
        className="ps-btn ps-btn--cta ps-btn--lg"
        style={{ width: "100%", justifyContent: "center", marginTop: 12, textDecoration: "none" }}
      >
        <KIcon name="ScanLine" size={16} /> {labels.scan}
      </Link>
    </>
  );
}
