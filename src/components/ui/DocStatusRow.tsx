import * as React from "react";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { DOC_STATUS_BADGE, type DocStatus } from "@/lib/subcontractor";

/**
 * DocStatusRow — compliance document-status row (v7.5 subcontractor-ops).
 *
 * Document name · expiry meter · status badge. The single net-new primitive of
 * the subcontractor-operations layer; used by the Compliance Vault and the
 * work-order bid-inbox eligibility check. Reads `--p-success / --p-warning /
 * --p-danger` via the Badge + ProgressBar recipes — no new tokens, no hardcoded
 * color. Spacing snaps to the 4px ramp via Tailwind scale utilities.
 */
const STATUS_LABEL: Record<DocStatus, string> = {
  current: "Current",
  expiring: "Expiring",
  expired: "Expired",
  missing: "Missing",
};

export type DocStatusRowProps = {
  /** Human document name, e.g. "Certificate of Insurance". */
  name: string;
  /** ISO date (YYYY-MM-DD) the document expires; omit for non-expiring (W-9). */
  expiresOn?: string;
  /** Derived status (see `deriveDocStatus`). */
  status: DocStatus;
  /** Remaining-life percentage for the meter (0–100); omit to hide the meter. */
  remainingPct?: number;
  /** Whether the document is required for the trade (shows a "Required" hint). */
  required?: boolean;
  className?: string;
};

export function DocStatusRow({ name, expiresOn, status, remainingPct, required, className = "" }: DocStatusRowProps) {
  const showMeter = typeof remainingPct === "number" && status !== "missing";
  return (
    <div
      className={`flex items-center gap-3 border-b border-[var(--p-border)] py-2 last:border-0 ${className}`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-[var(--p-text-1)]">{name}</span>
          {required && (
            <span className="font-mono text-[11px] tracking-wide text-[var(--p-text-3)] uppercase">Required</span>
          )}
        </div>
        {expiresOn && (
          <div className="mt-0.5 text-xs text-[var(--p-text-2)]">
            {status === "expired" ? "Expired" : "Expires"} {expiresOn}
          </div>
        )}
      </div>
      {showMeter && (
        <div className="w-24 shrink-0" aria-hidden="true">
          <ProgressBar value={remainingPct} />
        </div>
      )}
      <Badge variant={DOC_STATUS_BADGE[status]}>{STATUS_LABEL[status]}</Badge>
    </div>
  );
}
