"use client";

import { KIcon } from "@/components/mobile/kit";
import { useToast } from "@/lib/hooks/useToast";

/**
 * Finance → Accounting/ERP sync (kit 34 v3.7 · §5 handoff). COMPVSS owns budget
 * · PO · expense · coding and hands off at the ledger line: it syncs committed
 * budget + actuals to the accounting/ERP system, but does NOT run AP/AR or the
 * general ledger. A bounded affordance (no downstream system built here).
 */
export function FinanceSyncButton() {
  const toast = useToast();
  return (
    <div style={{ marginTop: 16 }}>
      <button
        type="button"
        className="ps-btn ps-btn--secondary ps-btn--lg"
        style={{ width: "100%", justifyContent: "center" }}
        onClick={() =>
          toast.success("Synced To Accounting/ERP", {
            description: "Committed budget + actuals pushed to your ledger",
          })
        }
      >
        <KIcon name="RefreshCw" size={16} /> Sync → Accounting/ERP
      </button>
      <p className="hint" style={{ marginTop: 8 }}>
        COMPVSS syncs committed budget + actuals to your accounting/ERP system — it doesn&apos;t run AP/AR or the general
        ledger.
      </p>
    </div>
  );
}
