"use client";

import { KIcon } from "@/components/mobile/kit";
import { useToast } from "@/lib/hooks/useToast";
import { useT } from "@/lib/i18n/LocaleProvider";

/**
 * Finance → Accounting/ERP sync (kit 34 v3.7 · §5 handoff). COMPVSS owns budget
 * · PO · expense · coding and hands off at the ledger line: it syncs committed
 * budget + actuals to the accounting/ERP system, but does NOT run AP/AR or the
 * general ledger. A bounded affordance (no downstream system built here).
 */
export function FinanceSyncButton() {
  const t = useT();
  const toast = useToast();
  return (
    <div style={{ marginTop: 16 }}>
      <button
        type="button"
        className="ps-btn ps-btn--secondary ps-btn--lg"
        style={{ width: "100%", justifyContent: "center" }}
        onClick={() =>
          toast.info(t("m.finance.sync.notConnected", undefined, "Accounting Sync Not Connected"), {
            description: t(
              "m.finance.sync.notConnectedBody",
              undefined,
              "Committed budget + actuals are ready to hand off. Connect an accounting/ERP integration to enable auto-sync.",
            ),
          })
        }
      >
        <KIcon name="RefreshCw" size={16} /> {t("m.finance.sync.cta", undefined, "Sync → Accounting/ERP")}
      </button>
      <p className="hint" style={{ marginTop: 8 }}>
        {t(
          "m.finance.sync.hint",
          undefined,
          "COMPVSS hands committed budget + actuals to your accounting/ERP system. It doesn't run AP/AR or the general ledger.",
        )}
      </p>
    </div>
  );
}
