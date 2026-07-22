"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { HubChrome } from "@/components/mobile/HubChrome";
import {
  ItemUnits,
  KIcon,
  NormalizedList,
  type FieldDef,
  type Unit as KitUnit,
} from "@/components/mobile/kit";
import type { CatalogKind } from "@/lib/db/catalog-kinds";
import { formatMoney } from "@/lib/i18n/format";
import { CustodySheet, type CustodyTarget } from "./CustodySheet";

export type AssetUnit = {
  /** The `assets` row — required to act on the unit, not just show it. */
  id: string;
  /** Raw UAL state (the `status` field above is its display label). */
  state: string;
  tag: string;
  status: string;
  holder: string;
  tone: "ok" | "warn" | "danger" | "info" | "accent" | "neutral";
};

export type InventoryItem = {
  id: string;
  kind: CatalogKind;
  cat: string;
  name: string;
  code: string | null;
  unitCostCents: number | null;
  qty: number | null;
  // Real per-instance chain-of-custody rows from `assets` (empty if none).
  units: AssetUnit[];
};

export type InventoryLabels = {
  eyebrow: string;
  title: string;
  search: string;
  custody: { take: string; ret: string; cancel: string; managerOnly: string };
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
  serialized: string;
  available: string;
};

function money(cents: number | null): string {
  if (cents == null) return "—";
  return formatMoney(cents, { fractionDigits: 0 });
}

function qtyTone(qty: number | null): "ok" | "warn" | "neutral" {
  if (qty == null) return "neutral";
  if (qty <= 0) return "warn";
  return "ok";
}

export function InventoryView({
  items,
  labels,
  canManage,
}: {
  items: InventoryItem[];
  labels: InventoryLabels;
  /** Manager band — gates the hub chrome's managerOnly member links. */
  canManage: boolean;
}) {
  const [custody, setCustody] = useState<CustodyTarget | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Distinct categories present in the data → quick-filter pills.
  const allCats = useMemo(() => {
    const seen: string[] = [];
    for (const it of items) if (!seen.includes(it.cat)) seen.push(it.cat);
    return seen.sort((a, b) => a.localeCompare(b));
  }, [items]);

  const FIELDS: FieldDef<InventoryItem>[] = [
    { id: "name", label: labels.colItem, type: "text", get: (x) => x.name },
    { id: "cat", label: labels.colCategory, type: "select", options: allCats, get: (x) => x.cat },
    { id: "code", label: labels.colCode, type: "text", get: (x) => x.code ?? "—" },
    { id: "qty", label: labels.colQty, type: "num", get: (x) => x.qty ?? "—" },
    { id: "cost", label: labels.colCost, type: "text", get: (x) => money(x.unitCostCents) },
  ];

  const row = (x: InventoryItem) => {
    const open = expanded === x.id;
    const tone = qtyTone(x.qty);
    // Prefer REAL per-instance chain-of-custody from the `assets` table. When a
    // catalog row has no asset instances, fall back to an available-count
    // summary derived from inventory_qty — labeled as the available count, not
    // fabricated serial numbers.
    const hasRealUnits = x.units.length > 0;
    const units: KitUnit[] = hasRealUnits
      ? x.units
      : x.qty != null && x.qty > 0
        ? [
            {
              tag: `${x.qty} ${labels.available}`,
              status: labels.tracked,
              holder: x.cat,
              tone: "ok" as const,
            },
          ]
        : [];
    return (
      <div key={x.id}>
        <div
          className="item tap"
          role="button"
          tabIndex={0}
          aria-expanded={open}
          style={{ cursor: "pointer" }}
          onClick={() => setExpanded(open ? null : x.id)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setExpanded(open ? null : x.id);
            }
          }}
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
            <div className="wl" style={{ marginBottom: 6 }}>
              {hasRealUnits ? labels.serialized : labels.units}
            </div>
            <ItemUnits
              units={units}
              onToast={(u) => {
                // Tapping a unit used to call a literal no-op. It now opens
                // the custody control for that specific asset.
                const { id, state } = u;
                // Presentational units (no backing asset row) stay inert.
                if (!id || !state) return;
                setCustody((cur) => (cur?.id === id ? null : { id, tag: u.tag, state, status: u.status }));
              }}
            />
            {custody && units.some((u) => u.id === custody.id) && (
              <CustodySheet
                target={custody}
                onClose={() => setCustody(null)}
                labels={labels.custody}
              />
            )}
          </div>
        )}
      </div>
    );
  };

  const galleryCard = (x: InventoryItem) => (
    <>
      <div className="mthumb">
        <KIcon name="Package" size={30} style={{ color: "var(--p-text-3)" }} />
        {x.code && <span className="mtag">{x.code}</span>}
      </div>
      <div className="t" style={{ fontSize: 13, marginTop: 7 }}>{x.name}</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
        <span className="s" style={{ fontSize: 11 }}>{x.qty != null ? `${x.qty} ${labels.onHand}` : labels.untracked}</span>
        <span className={`ps-badge ps-badge--${qtyTone(x.qty)}`}>{money(x.unitCostCents)}</span>
      </div>
    </>
  );

  return (
    <>
      <HubChrome hubKey="equipment" active="inventory" canManage={canManage} />
      <NormalizedList
        k="iv"
        items={items}
        fields={FIELDS}
        search={(x) => `${x.name} ${x.code ?? ""} ${x.cat}`}
        searchPlaceholder={labels.search}
        renderRow={row}
        gallery={galleryCard}
        views={["list", "gallery", "table"]}
        pill={{ get: (x) => x.cat, order: allCats }}
        empty={{ cols: [labels.colItem, labels.colQty, labels.colCost], title: labels.empty, hint: labels.emptyHint }}
        footer={
          <Link
            href="/m/inventory/scan"
            className="ps-btn ps-btn--cta ps-btn--lg"
            style={{ width: "100%", justifyContent: "center", marginTop: 12, textDecoration: "none" }}
          >
            <KIcon name="ScanLine" size={16} /> {labels.scan}
          </Link>
        }
      />
    </>
  );
}
