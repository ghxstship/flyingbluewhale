"use client";

import { OpsLedgerView, type OpsLedgerConfig } from "../_ops/OpsLedgerView";
import { OPS_LOGISTICS, type OpsLogistics } from "@/lib/mobile/ops-seed";

/**
 * COMPVSS · Logistics — the inbound/outbound freight & dock-assignment ledger
 * (kit 33 v3.0, Operations).
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
  groupOpts: [
    ["none", "None"],
    ["status", "Status"],
    ["dir", "Direction"],
  ],
  groupKey: (g, x) => (g === "dir" ? (x.dir === "in" ? "Inbound" : "Outbound") : x.status),
  sortOpts: [
    ["when", "Schedule"],
    ["carrier", "Carrier"],
  ],
  sortCmp: (s, a, b) => (s === "carrier" ? a.carrier.localeCompare(b.carrier) : 0),
  filterStates: ["Arrived", "En Route", "Scheduled", "Delayed"],
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

export default function LogisticsPage() {
  return (
    <div className="screen screen-anim">
      <OpsLedgerView items={OPS_LOGISTICS} config={CONFIG} />
    </div>
  );
}
