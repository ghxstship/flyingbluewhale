"use client";

import Link from "next/link";
import { HubChrome } from "@/components/mobile/HubChrome";
import { KIcon, NormalizedList, type FieldDef } from "@/components/mobile/kit";
import type { CatalogKind } from "@/lib/db/catalog-kinds";
import { formatMoney } from "@/lib/i18n/format";

export type CatalogEntry = {
  id: string;
  kind: CatalogKind;
  kindLabel: string;
  name: string;
  code: string | null;
  unitCostCents: number | null;
};

export type CatalogLabels = {
  back: string;
  title: string;
  search: string;
  request: string;
  empty: string;
  emptyHint: string;
};

function money(cents: number | null): string {
  if (cents == null) return "";
  return formatMoney(cents, { fractionDigits: 0 });
}

/** Kit 34 v3.4 — normalized (NormalizedList: search + View Options/Share drawers
 *  + schema DataView list/table + kind pills). Each row prefills the advance
 *  request form for that catalog item. */
export function CatalogView({ items, labels }: { items: CatalogEntry[]; labels: CatalogLabels }) {
  const kinds = [...new Set(items.map((it) => it.kindLabel))];

  const FIELDS: FieldDef<CatalogEntry>[] = [
    { id: "name", label: labels.title, type: "text", get: (it) => it.name },
    { id: "kindLabel", label: "Kind", type: "select", options: kinds, get: (it) => it.kindLabel },
    { id: "code", label: "Code", type: "text", get: (it) => it.code ?? "" },
    { id: "cost", label: "Unit Cost", type: "num", get: (it) => it.unitCostCents ?? 0 },
  ];

  const row = (it: CatalogEntry) => (
    <div className="item tap" key={it.id} style={{ alignItems: "center" }}>
      <span className="cart-thumb" style={{ width: 40, height: 40 }}>
        <KIcon name="Package" size={16} style={{ color: "var(--p-text-3)" }} />
      </span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div className="t">{it.name}</div>
        <div className="s">
          {money(it.unitCostCents)}
          {it.code ? (
            <>
              {" "}
              · <span style={{ fontFamily: "var(--p-mono)" }}>{it.code}</span>
            </>
          ) : null}
        </div>
      </div>
      <Link
        href={`/m/advances/new?catalogItemId=${encodeURIComponent(it.id)}&kind=${it.kind}`}
        className="ps-btn ps-btn--cta ps-btn--sm"
        style={{ flex: "none", textDecoration: "none" }}
      >
        <KIcon name="Plus" size={14} /> {labels.request}
      </Link>
    </div>
  );

  return (
    <>
      <HubChrome hubKey="equipment" active="catalog" canManage />
      <NormalizedList
        k="ct"
        items={items}
        fields={FIELDS}
        search={(it) => `${it.name} ${it.code ?? ""} ${it.kindLabel}`}
        searchPlaceholder={labels.search}
        renderRow={row}
        views={["list", "table"]}
        pill={{ get: (it) => it.kindLabel, order: kinds }}
        empty={{ cols: [labels.title, "Kind", "Unit Cost"], title: labels.empty, hint: labels.emptyHint }}
      />
    </>
  );
}
