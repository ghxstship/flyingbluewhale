"use client";

import * as React from "react";
import { useActionState } from "react";
import { useT } from "@/lib/i18n/LocaleProvider";
import { decideRecertAction, type DecideState } from "./actions";
import { resolveActionError } from "@/lib/errors";

/**
 * Approve / Deny pair for a pending recert request — the DecideButtons
 * precedent from /studio/workforce/time-off. Deny is two-step: the first
 * click reveals an optional decision-note field so the requester's push
 * carries the reason instead of a bare "denied". Errors render inline
 * (client island, not a discarded plain <form action> result).
 */
export function DecideRecertButtons({ recertId }: { recertId: string }) {
  const [state, formAction, pending] = useActionState<DecideState, FormData>(decideRecertAction, null);
  const t = useT();
  const [denying, setDenying] = React.useState(false);

  const approveLabel = t("console.legend.compliance.recerts.approve", undefined, "Approve");
  const denyLabel = t("console.legend.compliance.recerts.deny", undefined, "Deny");

  if (state?.ok) {
    return (
      <span className="text-xs font-medium text-[var(--p-success)]">
        {t("console.legend.compliance.recerts.decided", undefined, "Decided")}
      </span>
    );
  }

  if (denying) {
    return (
      <div className="flex flex-col items-end gap-1">
        <form action={formAction} className="flex items-center gap-1">
          <input type="hidden" name="id" value={recertId} />
          <input type="hidden" name="decision" value="rejected" />
          <input
            type="text"
            name="note"
            maxLength={500}
            placeholder={t("console.legend.compliance.recerts.notePlaceholder", undefined, "Reason (optional)")}
            className="ps-input ps-input--sm w-40"
            autoFocus
          />
          <button
            type="submit"
            className="ps-btn ps-btn--sm"
            aria-label={t("console.legend.compliance.recerts.confirmDenyAria", undefined, `${denyLabel}: recert request`)}
            disabled={pending}
          >
            {t("console.legend.compliance.recerts.confirmDeny", undefined, "Confirm Deny")}
          </button>
          <button
            type="button"
            className="ps-btn ps-btn--ghost ps-btn--sm"
            onClick={() => setDenying(false)}
            disabled={pending}
          >
            {t("common.cancel", undefined, "Cancel")}
          </button>
        </form>
        {state?.error && <span className="text-xs text-[var(--p-danger)]">{resolveActionError(state.error, t)}</span>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-1">
        <form action={formAction}>
          <input type="hidden" name="id" value={recertId} />
          <input type="hidden" name="decision" value="approved" />
          <button
            type="submit"
            className="ps-btn ps-btn--sm"
            aria-label={t("console.legend.compliance.recerts.approveAria", undefined, `${approveLabel}: recert request`)}
            disabled={pending}
          >
            {approveLabel}
          </button>
        </form>
        <button
          type="button"
          className="ps-btn ps-btn--ghost ps-btn--sm"
          aria-label={t("console.legend.compliance.recerts.denyAria", undefined, `${denyLabel}: recert request`)}
          onClick={() => setDenying(true)}
          disabled={pending}
        >
          {denyLabel}
        </button>
      </div>
      {state?.error && <span className="text-xs text-[var(--p-danger)]">{resolveActionError(state.error, t)}</span>}
    </div>
  );
}
