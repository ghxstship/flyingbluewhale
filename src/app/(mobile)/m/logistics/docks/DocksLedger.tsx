"use client";

import { OpsLedgerView, type OpsLedgerConfig } from "../../_ops/OpsLedgerView";
import type { DockSlot } from "@/lib/mobile/ops-seed";

/** COMPVSS · Logistics › Docks — the day's marshaling board (real org-scoped `field_dock_slots`). */
const CONFIG: OpsLedgerConfig<DockSlot> = {
  k: "dk",
  title: "Docks",
  hub: { key: "logistics", active: "docks" },
  searchPlaceholder: "Search dock slots…",
  search: (x) => `${x.label} ${x.dock} ${x.time}`,
  icon: () => "Warehouse",
  iconColor: (x) => (x.status === "Delayed" ? "var(--p-warning)" : undefined),
  titleOf: (x) => x.label,
  status: (x) => x.status,
  sub: (x) => `${x.dock} · ${x.time} · ${x.dur} · ${x.dir === "in" ? "Inbound" : "Outbound"}`,
  filterStates: ["Arrived", "En Route", "Scheduled", "Delayed"],
  // Quick pills = dock (meaningful context), never the status.
  pill: { get: (x) => x.dock, order: ["Dock A", "Dock B", "BOH"] },
  tableFields: [
    { id: "label", label: "Slot", type: "text", get: (x) => x.label },
    { id: "dock", label: "Dock", type: "text", get: (x) => x.dock },
    { id: "time", label: "Time", type: "text", get: (x) => x.time },
    { id: "status", label: "Status", type: "text", get: (x) => x.status },
  ],
  emptyCols: ["Slot", "Dock", "Status"],
  emptyTitle: "No dock slots",
};

export function DocksLedger({ items }: { items: DockSlot[] }) {
  return (
    <div className="screen screen-anim">
      <OpsLedgerView items={items} config={CONFIG} />
    </div>
  );
}
