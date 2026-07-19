"use client";

import { OpsLedgerView, type OpsLedgerConfig } from "../../_ops/OpsLedgerView";
import { GATE_QUEUE, type GateEntry } from "@/lib/mobile/ops-seed";

/** COMPVSS · Logistics › Gate — vehicle check-in queue (creds → call to dock). */
const CONFIG: OpsLedgerConfig<GateEntry> = {
  k: "gt",
  title: "Gate",
  hub: { key: "logistics", active: "gate" },
  searchPlaceholder: "Search gate queue…",
  search: (x) => `${x.vehicle} ${x.carrier} ${x.driver} ${x.dock}`,
  icon: () => "ScanLine",
  iconColor: (x) => (x.status === "Held" ? "var(--p-danger)" : undefined),
  titleOf: (x) => x.vehicle,
  status: (x) => x.status,
  sub: (x) => `${x.carrier} · ${x.driver} · ${x.dock} · ${x.cred}`,
  filterStates: ["At Dock", "Waiting", "Cleared", "Held"],
  // Quick pills = carrier (meaningful context), never the status.
  pill: { get: (x) => x.carrier },
  tableFields: [
    { id: "vehicle", label: "Vehicle", type: "text", get: (x) => x.vehicle },
    { id: "carrier", label: "Carrier", type: "text", get: (x) => x.carrier },
    { id: "dock", label: "Dock", type: "text", get: (x) => x.dock },
    { id: "status", label: "Status", type: "text", get: (x) => x.status },
  ],
  emptyCols: ["Vehicle", "Carrier", "Status"],
  emptyTitle: "No vehicles in queue",
};

export default function GatePage() {
  return (
    <div className="screen screen-anim">
      <OpsLedgerView items={GATE_QUEUE} config={CONFIG} />
    </div>
  );
}
