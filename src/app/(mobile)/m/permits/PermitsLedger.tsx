"use client";

import { OpsLedgerView, type OpsLedgerConfig } from "../_ops/OpsLedgerView";
import type { OpsPermit } from "@/lib/mobile/ops-seed";

/**
 * COMPVSS · Permits & Compliance — permits, COIs & cert-expiry ledger (kit 33
 * v3.0, Operations). Rows are the real org-scoped `field_permits`. Requesting a
 * permit is manager-gated in ATLVS; the field surface is read-first (no CTA).
 */
const CONFIG: OpsLedgerConfig<OpsPermit> = {
  k: "pe",
  title: "Permits & Compliance",
  searchPlaceholder: "Search permits…",
  search: (x) => `${x.t} ${x.auth}`,
  icon: (x) => x.icon,
  iconColor: (x) => (x.status === "Expiring" ? "var(--p-warning)" : undefined),
  titleOf: (x) => x.t,
  status: (x) => x.status,
  sub: (x) => `${x.auth} · ${x.exp}`,
  hub: { key: "operations", active: "permits" },
  filterStates: ["Active", "Expiring"],
  // Quick pills = issuing authority (meaningful context), never the status.
  pill: { get: (x) => x.auth },
  tableFields: [
    { id: "t", label: "Permit", type: "text", get: (x) => x.t },
    { id: "auth", label: "Authority", type: "text", get: (x) => x.auth },
    { id: "exp", label: "Validity", type: "text", get: (x) => x.exp },
    { id: "status", label: "Status", type: "text", get: (x) => x.status },
  ],
  emptyCols: ["Permit", "Authority", "Status"],
  emptyTitle: "No permits",
};

export function PermitsLedger({ items }: { items: OpsPermit[] }) {
  return (
    <div className="screen screen-anim">
      <OpsLedgerView items={items} config={CONFIG} />
    </div>
  );
}
