"use client";

import { useActionState } from "react";
import { useT } from "@/lib/i18n/LocaleProvider";
import { acknowledgeAlert, type State } from "./actions";

/**
 * One-tap acknowledge for an org alert. Client island so a failed
 * acknowledgement surfaces inline instead of tripping the route error
 * boundary (digest-masked in production).
 */
export function AcknowledgeButton({ alertId }: { alertId: string }) {
  const t = useT();
  const [state, formAction, pending] = useActionState<State, FormData>(acknowledgeAlert, null);
  return (
    <form action={formAction}>
      <input type="hidden" name="alertId" value={alertId} />
      <button type="submit" disabled={pending} className="ps-btn ps-btn--cta ps-btn--sm">
        {pending
          ? t("m.alerts.acknowledging", undefined, "Acknowledging…")
          : t("m.alerts.acknowledge", undefined, "Acknowledge")}
      </button>
      {state?.error && (
        <div className="s" style={{ color: "var(--p-danger-text)", marginTop: 4 }}>
          {state.error}
        </div>
      )}
    </form>
  );
}
