"use client";

import { useMemo, useState } from "react";
import { ActionBar, DataTable, GroupedList, SwipeRow, TogRow } from "@/components/mobile/kit";
import type { ViewMode } from "@/components/mobile/kit";
import { EmptyState } from "@/components/ui/EmptyState";

export type Vendor = {
  id: string;
  name: string;
  trade: string;
  trades: string[];
  logo: string;
  scope: string;
  phone: string;
  email: string;
  site: string;
  ratingAvg: number | null;
  ratingCount: number;
};

type Labels = {
  search: string;
  emptyTitle: string;
  emptyBody: string;
  call: string;
  email: string;
};

export function CompaniesView({ vendors, labels }: { vendors: Vendor[]; labels: Labels }) {
  const [query, setQuery] = useState("");
  const [view, setView] = useState<ViewMode>("list");
  const [group, setGroup] = useState("none");
  const [sort, setSort] = useState("name");
  const [trades, setTrades] = useState<Set<string>>(new Set());
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const allTrades = useMemo(() => [...new Set(vendors.map((v) => v.trade))], [vendors]);

  const items = useMemo(() => {
    return vendors
      .filter((v) => trades.size === 0 || trades.has(v.trade))
      .filter(
        (v) =>
          !query ||
          (v.name + " " + v.trade + " " + v.scope).toLowerCase().includes(query.toLowerCase()),
      )
      .sort((a, b) =>
        sort === "trade" ? a.trade.localeCompare(b.trade) : a.name.localeCompare(b.name),
      );
  }, [vendors, trades, query, sort]);

  const row = (v: Vendor) => (
    <SwipeRow
      key={v.id}
      onClick={() => {}}
      actions={[
        {
          icon: "Phone",
          label: labels.call,
          tone: "ok",
          on: () => {
            if (v.phone) window.location.href = `tel:${v.phone}`;
          },
        },
        {
          icon: "Mail",
          label: labels.email,
          tone: "info",
          on: () => {
            if (v.email) window.location.href = `mailto:${v.email}`;
          },
        },
      ]}
    >
      <div className="item tap" style={{ margin: 0, cursor: "pointer" }}>
        <span className="logo-tile">{v.logo}</span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="t">{v.name}</div>
          <div className="s">{v.scope || v.trade}</div>
        </div>
        <span className="ps-badge ps-badge--info">{v.trade}</span>
      </div>
    </SwipeRow>
  );

  let groups: [string, Vendor[]][] | null = null;
  if (group === "trade") {
    const mp: Record<string, Vendor[]> = {};
    items.forEach((v) => {
      (mp[v.trade] = mp[v.trade] || []).push(v);
    });
    groups = allTrades.filter((k) => mp[k]).map((k) => [k, mp[k]] as [string, Vendor[]]);
  }

  return (
    <>
      <ActionBar
        k="co"
        query={query}
        setQuery={setQuery}
        placeholder={labels.search}
        view={view}
        setView={setView}
        views={["list", "gallery", "table"]}
        group={group}
        setGroup={setGroup}
        groupOpts={[
          ["none", "None"],
          ["trade", "Trade"],
        ]}
        sort={sort}
        setSort={setSort}
        sortOpts={[
          ["name", "Name"],
          ["trade", "Trade"],
        ]}
        filterActive={trades.size}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        filterChildren={
          <div>
            {allTrades.map((tr) => (
              <TogRow
                key={tr}
                label={tr}
                on={trades.has(tr)}
                set={() =>
                  setTrades((p) => {
                    const n = new Set(p);
                    n.has(tr) ? n.delete(tr) : n.add(tr);
                    return n;
                  })
                }
              />
            ))}
          </div>
        }
      />

      {view === "gallery" ? (
        <div className="gal-grid">
          {items.map((v) => (
            <div className="gal-card" key={v.id}>
              <span
                className="logo-tile"
                style={{ width: 48, height: 48, borderRadius: 13, fontSize: 16 }}
              >
                {v.logo}
              </span>
              <div className="t" style={{ fontSize: 12, textAlign: "center", marginTop: 8 }}>
                {v.name}
              </div>
              <span className="vchip">{v.trade}</span>
            </div>
          ))}
        </div>
      ) : view === "table" ? (
        <DataTable
          fields={[
            { id: "name", label: "Vendor", type: "text", get: (x: Vendor) => x.name },
            { id: "trade", label: "Trade", type: "text", get: (x: Vendor) => x.trade },
            { id: "scope", label: "Scope Of Work", type: "text", get: (x: Vendor) => x.scope },
            { id: "rating", label: "Rating", type: "num", get: (x: Vendor) => x.ratingAvg ?? 0 },
          ]}
          items={items}
        />
      ) : groups ? (
        <GroupedList
          skey="ve"
          groups={groups}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          renderRow={(x) => row(x as Vendor)}
        />
      ) : (
        items.map(row)
      )}

      {!items.length && <EmptyState title={labels.emptyTitle} description={labels.emptyBody} />}
    </>
  );
}
