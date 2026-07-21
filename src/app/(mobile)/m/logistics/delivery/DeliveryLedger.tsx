"use client";

import { OpsLedgerView, type OpsLedgerConfig } from "../../_ops/OpsLedgerView";
import type { DeliveryTicket } from "@/lib/mobile/ops-seed";

/** COMPVSS · Logistics › Delivery — on-site marshaling tickets (real org-scoped `field_deliveries`). */
const CONFIG: OpsLedgerConfig<DeliveryTicket> = {
  k: "dl",
  title: "Delivery",
  hub: { key: "logistics", active: "delivery" },
  searchPlaceholder: "Search deliveries…",
  search: (x) => `${x.t} ${x.ref} ${x.from} ${x.to} ${x.runner}`,
  icon: () => "PackageCheck",
  titleOf: (x) => x.t,
  status: (x) => x.status,
  sub: (x) => `${x.from} → ${x.to} · ${x.pieces} pc · ${x.runner}`,
  filterStates: ["Requested", "Staged", "In Transit", "Delivered"],
  // Quick pills = handling need (meaningful context), never the status.
  pill: { get: (x) => x.need },
  tableFields: [
    { id: "t", label: "Move", type: "text", get: (x) => x.t },
    { id: "to", label: "Destination", type: "text", get: (x) => x.to },
    { id: "runner", label: "Runner", type: "text", get: (x) => x.runner },
    { id: "status", label: "Status", type: "text", get: (x) => x.status },
  ],
  emptyCols: ["Move", "Destination", "Status"],
  emptyTitle: "No deliveries",
};

export function DeliveryLedger({ items }: { items: DeliveryTicket[] }) {
  return (
    <div className="screen screen-anim">
      <OpsLedgerView items={items} config={CONFIG} />
    </div>
  );
}
