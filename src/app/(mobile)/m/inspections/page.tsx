"use client";

import { OpsLedgerView, type OpsLedgerConfig } from "../_ops/OpsLedgerView";
import { OPS_INSPECTIONS, type OpsInspection } from "@/lib/mobile/ops-seed";

/**
 * COMPVSS · Inspections — the checklists & safety-walks ledger (kit 33 v3.0,
 * Operations). Start Inspection routes to the punch-list surface.
 */
const CONFIG: OpsLedgerConfig<OpsInspection> = {
  k: "in",
  title: "Inspections",
  searchPlaceholder: "Search inspections…",
  search: (x) => `${x.t} ${x.area} ${x.by}`,
  icon: (x) => x.icon,
  iconColor: (x) =>
    x.status === "Flagged"
      ? "var(--p-warning)"
      : x.status === "Passed"
        ? "var(--p-success)"
        : undefined,
  titleOf: (x) => x.t,
  status: (x) => x.status,
  sub: (x) => `${x.area} · ${x.done}/${x.checks} checks · ${x.by} · ${x.time}`,
  groupOpts: [
    ["none", "None"],
    ["status", "Status"],
    ["area", "Area"],
  ],
  groupKey: (g, x) => (g === "area" ? x.area : x.status),
  sortOpts: [
    ["recent", "Recent"],
    ["area", "Area"],
  ],
  sortCmp: (s, a, b) => (s === "area" ? a.area.localeCompare(b.area) : 0),
  filterStates: ["Passed", "In Progress", "Flagged"],
  tableFields: [
    { id: "t", label: "Inspection", type: "text", get: (x) => x.t },
    { id: "area", label: "Area", type: "text", get: (x) => x.area },
    { id: "checks", label: "Checks", type: "text", get: (x) => `${x.done}/${x.checks}` },
    { id: "by", label: "By", type: "text", get: (x) => x.by },
    { id: "status", label: "Status", type: "text", get: (x) => x.status },
  ],
  emptyCols: ["Inspection", "Area", "Status"],
  emptyTitle: "No inspections",
  cta: { label: "Start Inspection", href: "/m/punch" },
};

export default function InspectionsPage() {
  return (
    <div className="screen screen-anim">
      <OpsLedgerView items={OPS_INSPECTIONS} config={CONFIG} />
    </div>
  );
}
