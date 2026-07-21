"use client";

import { OpsLedgerView, type OpsLedgerConfig } from "../_ops/OpsLedgerView";
import type { OpsLogistics } from "@/lib/mobile/ops-seed";

/**
 * COMPVSS · Logistics — the inbound/outbound freight & dock-assignment ledger
 * (kit 33 v3.0, Operations). Rows are the real org-scoped `field_shipments`.
 */
const CONFIG: OpsLedgerConfig<OpsLogistics> = {
  k: "lo",
  title: "Logistics",
  searchPlaceholder: "Search logistics…",
  search: (x) => `${x.t} ${x.carrier} ${x.dock}`,
  icon: () => "Truck",
  iconColor: (x) => (x.status === "Delayed" ? "var(--p-warning)" : undefined),
  titleOf: (x) => x.t,
  status: (x) => x.status,
  sub: (x) => `${x.carrier} · ${x.dock} · ${x.when}`,
  hub: { key: "logistics", active: "shipments" },
  filterStates: ["Arrived", "En Route", "Scheduled", "Delayed"],
  // Quick pills = freight direction (meaningful context), never the status.
  pill: { get: (x) => (x.dir === "in" ? "Inbound" : "Outbound"), order: ["Inbound", "Outbound"] },
  tableFields: [
    { id: "t", label: "Shipment", type: "text", get: (x) => x.t },
    { id: "carrier", label: "Carrier", type: "text", get: (x) => x.carrier },
    { id: "dock", label: "Dock", type: "text", get: (x) => x.dock },
    { id: "when", label: "Window", type: "text", get: (x) => x.when },
    { id: "status", label: "Status", type: "text", get: (x) => x.status },
  ],
  emptyCols: ["Shipment", "Dock", "Status"],
  emptyTitle: "No shipments",
};

export function LogisticsLedger({ items }: { items: OpsLogistics[] }) {
  return (
    <div className="screen screen-anim">
      <OpsLedgerView items={items} config={CONFIG} />
    </div>
  );
}
