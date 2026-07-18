"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ActionBar, Crumbs, GroupedList, KIcon } from "@/components/mobile/kit";
import { EmptyState } from "@/components/ui/EmptyState";
import type { CatalogKind } from "@/lib/db/assignments";
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

export function CatalogView({ items, labels }: { items: CatalogEntry[]; labels: CatalogLabels }) {
  const [q, setQ] = useState("");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const groups = useMemo<[string, CatalogEntry[]][]>(() => {
    const ql = q.toLowerCase();
    const matched = items.filter(
      (it) => !ql || (it.name + " " + (it.code ?? "")).toLowerCase().includes(ql),
    );
    const order: string[] = [];
    const map = new Map<string, CatalogEntry[]>();
    for (const it of matched) {
      if (!map.has(it.kindLabel)) {
        map.set(it.kindLabel, []);
        order.push(it.kindLabel);
      }
      map.get(it.kindLabel)!.push(it);
    }
    return order.map((k) => [k, map.get(k)!]);
  }, [items, q]);

  const row = (it: CatalogEntry) => (
    <div className="item tap" key={it.id} style={{ alignItems: "center" }}>
      <span className="cart-thumb" style={{ width: 40, height: 40 }}>
        <KIcon name="Package" size={16} style={{ color: "var(--p-text-3)" }} />
      </span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div className="t">{it.name}</div>
        <div className="s">
          {money(it.unitCostCents)}
          {it.code ? <> · <span style={{ fontFamily: "var(--p-mono)" }}>{it.code}</span></> : null}
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
      {/* Kit 32 C1: crumb trail on the catalog path (More → Catalog); the
          item leg continues on the prefilled request form. */}
      <Crumbs items={[{ label: labels.back, href: "/m/more" }, { label: labels.title }]} />
      <h1 className="scr-h" style={{ marginBottom: 12 }}>{labels.title}</h1>
      <ActionBar<CatalogEntry>
        k="ct"
        query={q}
        setQuery={setQ}
        placeholder={labels.search}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
      />
      <GroupedList<CatalogEntry>
        skey="cat"
        groups={groups}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        renderRow={row}
      />
      {!groups.length && <EmptyState title={labels.empty} description={labels.emptyHint} />}
    </>
  );
}
