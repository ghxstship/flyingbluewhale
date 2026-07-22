"use client";

import { useState } from "react";
import { NormalizedList, RecordDetail, SwipeRow, type FieldDef } from "@/components/mobile/kit";

export type Vendor = {
  id: string;
  name: string;
  trade: string;
  trades: string[];
  logo: string;
  /** Vendor's own mark, when they have one. Falls back to `logo` initials. */
  logoUrl: string | null;
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
  website: string;
  actions: string;
};

/** Normalize a stored site value into an https URL for a real anchor. */
function siteHref(site: string): string {
  const s = site.trim();
  if (!s) return "";
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
}

/** Kit 34 v3.4 — normalized (NormalizedList: search + View Options/Share drawers
 *  + schema DataView list/gallery/table + trade pills). Keeps the kit 32 A6
 *  real contact intents (tel:/mailto:/https swipe actions). */
export function CompaniesView({ vendors, labels }: { vendors: Vendor[]; labels: Labels }) {
  const [detail, setDetail] = useState<Vendor | null>(null);
  const allTrades = [...new Set(vendors.map((v) => v.trade))];

  const FIELDS: FieldDef<Vendor>[] = [
    { id: "name", label: "Vendor", type: "text", get: (x) => x.name },
    { id: "trade", label: "Trade", type: "select", options: allTrades, get: (x) => x.trade },
    { id: "scope", label: "Scope Of Work", type: "text", get: (x) => x.scope },
    { id: "rating", label: "Rating", type: "num", get: (x) => x.ratingAvg ?? 0 },
  ];

  const row = (v: Vendor) => (
    <SwipeRow
      key={v.id}
      onClick={() => setDetail(v)}
      menuTitle={labels.actions}
      actions={[
        ...(v.phone ? [{ icon: "Phone", label: labels.call, tone: "ok" as const, href: `tel:${v.phone}` }] : []),
        ...(v.email ? [{ icon: "Mail", label: labels.email, tone: "info" as const, href: `mailto:${v.email}` }] : []),
        ...(v.site ? [{ icon: "Globe", label: labels.website, tone: "neutral" as const, href: siteHref(v.site) }] : []),
      ]}
    >
      <div className="item tap" style={{ margin: 0, cursor: "pointer" }}>
        {v.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="logo-tile"
            src={v.logoUrl}
            alt=""
            style={{ objectFit: "cover" }}
          />
        ) : (
          <span className="logo-tile">{v.logo}</span>
        )}
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="t">{v.name}</div>
          <div className="s">{v.scope || v.trade}</div>
        </div>
        <span className="ps-badge ps-badge--info">{v.trade}</span>
      </div>
    </SwipeRow>
  );

  const gallery = (v: Vendor) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <span className="logo-tile" style={{ width: 48, height: 48, borderRadius: 13, fontSize: 16 }}>
        {v.logo}
      </span>
      <div className="t" style={{ fontSize: 12, textAlign: "center", marginTop: 8 }}>
        {v.name}
      </div>
      <span className="vchip">{v.trade}</span>
    </div>
  );

  return (
    <>
      <NormalizedList
        k="co"
        items={vendors}
        fields={FIELDS}
        search={(v) => `${v.name} ${v.trade} ${v.scope}`}
        searchPlaceholder={labels.search}
        renderRow={row}
        gallery={gallery}
        views={["list", "gallery", "table"]}
        pill={{ get: (v) => v.trade, order: allTrades }}
        empty={{ cols: ["Vendor", "Trade", "Scope Of Work"], title: labels.emptyTitle, hint: labels.emptyBody }}
      />
      {detail && (
        <RecordDetail
          title={detail.name}
          icon="Building2"
          fields={[
            { k: "Trade", v: detail.trades.length ? detail.trades.join(", ") : detail.trade },
            ...(detail.scope ? [{ k: "Scope", v: detail.scope, full: true }] : []),
            ...(detail.ratingAvg != null ? [{ k: "Rating", v: `${detail.ratingAvg.toFixed(1)} (${detail.ratingCount})` }] : []),
            ...(detail.phone ? [{ k: "Phone", v: detail.phone }] : []),
            ...(detail.email ? [{ k: "Email", v: detail.email }] : []),
            ...(detail.site ? [{ k: "Website", v: detail.site }] : []),
          ]}
          actions={[
            ...(detail.phone ? [{ label: labels.call, icon: "Phone", on: () => { window.location.href = `tel:${detail.phone}`; } }] : []),
            ...(detail.email ? [{ label: labels.email, icon: "Mail", on: () => { window.location.href = `mailto:${detail.email}`; } }] : []),
            ...(detail.site ? [{ label: labels.website, icon: "Globe", on: () => { window.location.href = siteHref(detail.site); } }] : []),
          ]}
          onClose={() => setDetail(null)}
        />
      )}
    </>
  );
}
