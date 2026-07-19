"use client";

import { OpsLedgerView, type OpsLedgerConfig } from "../_ops/OpsLedgerView";
import { OPS_TRAVEL, type OpsTravel } from "@/lib/mobile/ops-seed";

/**
 * COMPVSS · Travel & Lodging — itineraries, hotels, ground & per-diem ledger
 * (kit 33 v3.0, Operations).
 */
const CONFIG: OpsLedgerConfig<OpsTravel> = {
  k: "tr",
  title: "Travel & Lodging",
  searchPlaceholder: "Search travel…",
  search: (x) => `${x.t} ${x.detail}`,
  icon: (x) => x.icon,
  titleOf: (x) => x.t,
  status: (x) => x.status,
  sub: (x) => `${x.detail} · ${x.when}`,
  hub: { key: "operations", active: "travel" },
  filterStates: ["Confirmed", "Pending", "Loaded"],
  // Quick pills = travel category (Flight/Hotel/Ground/Per Diem), never the status.
  pill: { get: (x) => x.t.split(" · ")[0] ?? x.t, order: ["Flight", "Hotel", "Ground", "Per Diem"] },
  tableFields: [
    { id: "t", label: "Item", type: "text", get: (x) => x.t },
    { id: "detail", label: "Detail", type: "text", get: (x) => x.detail },
    { id: "when", label: "When", type: "text", get: (x) => x.when },
    { id: "status", label: "Status", type: "text", get: (x) => x.status },
  ],
  emptyCols: ["Item", "When", "Status"],
  emptyTitle: "No travel booked",
};

export default function TravelPage() {
  return (
    <div className="screen screen-anim">
      <OpsLedgerView items={OPS_TRAVEL} config={CONFIG} />
    </div>
  );
}
