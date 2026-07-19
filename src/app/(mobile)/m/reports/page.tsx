"use client";

import { OpsLedgerView, type OpsLedgerConfig } from "../_ops/OpsLedgerView";
import { OPS_REPORTS, type OpsReport } from "@/lib/mobile/ops-seed";

/**
 * COMPVSS · Reports — the incident & daily-log ledger (kit 33 v3.0, Operations).
 * Records live in-app from the canonical `OPS_REPORTS` seed; File A Report
 * routes to the real incident intake.
 */
const CONFIG: OpsLedgerConfig<OpsReport> = {
  k: "re",
  title: "Reports",
  searchPlaceholder: "Search reports…",
  search: (x) => `${x.t} ${x.type} ${x.by} ${x.area}`,
  icon: (x) => x.icon,
  iconColor: (x) => (x.status === "Open" ? "var(--p-danger)" : undefined),
  titleOf: (x) => x.t,
  status: (x) => x.status,
  sub: (x) => `${x.type}${x.sev ? ` · ${x.sev}` : ""} · ${x.by} · ${x.time}`,
  hub: { key: "operations", active: "reports" },
  filterStates: ["Open", "Under Review", "Filed", "Closed"],
  tableFields: [
    { id: "t", label: "Report", type: "text", get: (x) => x.t },
    { id: "type", label: "Type", type: "text", get: (x) => x.type },
    { id: "area", label: "Area", type: "text", get: (x) => x.area },
    { id: "by", label: "Filed By", type: "text", get: (x) => x.by },
    { id: "status", label: "Status", type: "text", get: (x) => x.status },
  ],
  emptyCols: ["Report", "Type", "Status"],
  emptyTitle: "No reports",
  cta: { label: "File A Report", href: "/m/incidents/new" },
};

export default function ReportsPage() {
  return (
    <div className="screen screen-anim">
      <OpsLedgerView items={OPS_REPORTS} config={CONFIG} />
    </div>
  );
}
