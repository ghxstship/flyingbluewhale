"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  HubChrome,
} from "@/components/mobile/HubChrome";
import { NormalizedList, ScreenHeader, KIcon, type FieldDef, type ViewMode } from "@/components/mobile/kit";
import { OPS_TONE } from "@/lib/mobile/ops-seed";

/**
 * OpsLedgerView — the one shared list surface for the Operations + Logistics
 * hub ledgers (Reports · Inspections · Permits · Travel · Shipments).
 *
 * Kit 34 v3.4 normalization: every ledger is on the standard record-list stack
 * (`NormalizedList` → search + the ActionBar drawers [View Options / Share &
 * Export] + schema-driven DataView [list/table/board] + GroupedTree + quick
 * pills). Hub members render the hub chrome (back · title · viewseg); the row
 * shape mirrors the kit (icon · title · sub · status badge, optional price).
 *
 * The five surfaces stay pure config over this component — no bespoke layouts.
 */

export type OpsLedgerConfig<T extends { id: string }> = {
  /** Stable ActionBar/list namespace key. */
  k: string;
  /** Surface title — the ScreenHeader leaf when not a hub member. */
  title: string;
  /** Hub context: renders `HubChrome` (member viewseg) instead of a plain
   *  header. Operations + Logistics hubs carry no manager-gated members, so the
   *  full viewseg is always shown. */
  hub?: { key: string; active: string };
  searchPlaceholder: string;
  /** Free-text haystack for the search box. */
  search: (x: T) => string;
  icon: (x: T) => string;
  /** Optional CSS color for the row icon (kit tints Open/Flagged/Delayed…). */
  iconColor?: (x: T) => string | undefined;
  /** Row title accessor. */
  titleOf: (x: T) => string;
  sub: (x: T) => string;
  status: (x: T) => string;
  /** Optional trailing price tag (Expenses-style). */
  price?: (x: T) => string;
  /** Status values offered as board columns (canonical order). Status drives the
   *  board + the per-row badge — NEVER the quick-filter pills (see `pill`). */
  filterStates: readonly string[];
  /** The meaningful, context-aware field surfaced as quick-filter pills. This is
   *  NEVER the status — status is already the board columns + row badge and stays
   *  filterable via the advanced drawer. Its present values become the pills
   *  (e.g. Reports→type, Inspections→area, Logistics→direction, Permits→authority). */
  pill: { get: (x: T) => string; order?: readonly string[] };
  /** The field schema — drives table columns, filter, sort, group AND views. */
  tableFields: FieldDef<T>[];
  emptyCols: string[];
  emptyTitle: string;
  /** Optional bottom CTA wired to a real repo route (no toast-only stubs). */
  cta?: { label: string; href: string };
  onRow?: (x: T) => void;
};

export function OpsLedgerView<T extends { id: string }>({
  items,
  config,
}: {
  items: T[];
  config: OpsLedgerConfig<T>;
}) {
  const hasStatusField = config.tableFields.some((f) => f.id === "status");
  const boardTone: Record<string, string> = {};
  for (const s of config.filterStates) boardTone[s] = OPS_TONE[s] ?? "neutral";

  const row = (x: T, compact?: boolean): ReactNode => {
    const tone = OPS_TONE[config.status(x)] ?? "neutral";
    const color = config.iconColor?.(x);
    return (
      <div className="item" key={x.id}>
        <span className="more-ic" style={color ? { color } : undefined}>
          <KIcon name={config.icon(x)} size={17} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="t">{config.titleOf(x)}</div>
          {!compact && <div className="s">{config.sub(x)}</div>}
        </div>
        {config.price && (
          <span className="pricetag" style={{ fontSize: 14, marginRight: 8 }}>
            {config.price(x)}
          </span>
        )}
        <span className={`ps-badge ps-badge--${tone}`} style={{ flex: "none" }}>
          {config.status(x)}
        </span>
      </div>
    );
  };

  const views: ViewMode[] = hasStatusField ? ["list", "table", "board"] : ["list", "table"];

  return (
    <>
      {config.hub ? (
        <HubChrome hubKey={config.hub.key} active={config.hub.active} canManage />
      ) : (
        <ScreenHeader crumbs={[{ label: "More", href: "/m/more" }, { label: config.title }]} title={config.title} />
      )}

      <NormalizedList
        k={config.k}
        items={items}
        fields={config.tableFields}
        search={config.search}
        searchPlaceholder={config.searchPlaceholder}
        renderRow={row}
        onRow={config.onRow}
        views={views}
        statusField={hasStatusField ? "status" : undefined}
        statusOrder={config.filterStates as string[]}
        boardTone={boardTone}
        pill={{ get: config.pill.get, order: config.pill.order as string[] | undefined }}
        empty={{ cols: config.emptyCols, title: config.emptyTitle }}
        footer={
          config.cta ? (
            <Link
              href={config.cta.href}
              className="ps-btn ps-btn--cta ps-btn--lg"
              style={{ width: "100%", justifyContent: "center", marginTop: 10, textDecoration: "none" }}
            >
              <KIcon name="Plus" size={16} /> {config.cta.label}
            </Link>
          ) : undefined
        }
      />
    </>
  );
}
