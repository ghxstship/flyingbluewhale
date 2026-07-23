"use client";

import * as React from "react";
import { useActionState } from "react";
import { toast } from "@/lib/hooks/useToast";
import { useT } from "@/lib/i18n/LocaleProvider";
import { decideTimeOff, type DecideState } from "./actions";

import { useActionErrorResolver } from "@/lib/errors-client";
/**
 * Approve / Deny pair for a pending time-off row. Client island so RPC
 * failures (e.g. insufficient balance) surface as a toast instead of
 * disappearing — the old plain <form action> discarded the result.
 *
 * Deny is two-step: the first click reveals an optional decision-note
 * field, so the requester's push can carry the reason instead of a bare
 * "denied".
 */
export function DecideTimeOffButtons({
  requestId,
  approveLabel,
  denyLabel,
  notePlaceholder,
  confirmDenyLabel,
  cancelLabel,
}: {
  requestId: string;
  approveLabel: string;
  denyLabel: string;
  notePlaceholder?: string;
  confirmDenyLabel?: string;
  cancelLabel?: string;
}) {
  const [state, formAction, pending] = useActionState<DecideState, FormData>(decideTimeOff, null);
  const resolveErr = useActionErrorResolver();
  const t = useT();
  const [denying, setDenying] = React.useState(false);

  // A11Y-3: the visible labels are bare verbs in a table of identical rows —
  // give assistive tech the object too (label-in-name kept: each aria-label
  // starts with the visible text).
  const approveAria = t("console.workforce.timeOff.action.approveAria", undefined, `${approveLabel}: time-off request`);
  const denyAria = t("console.workforce.timeOff.action.denyAria", undefined, `${denyLabel}: time-off request`);
  const confirmDenyAria = t(
    "console.workforce.timeOff.action.confirmDenyAria",
    undefined,
    `${confirmDenyLabel ?? denyLabel}: time-off request`,
  );

  React.useEffect(() => {
    if (state?.error) toast.error(resolveErr(state.error));
  }, [state, resolveErr]);

  if (denying) {
    return (
      <form action={formAction} className="flex items-center gap-1">
        <input type="hidden" name="id" value={requestId} />
        <input type="hidden" name="decision" value="denied" />
        <input
          type="text"
          name="note"
          maxLength={500}
          placeholder={notePlaceholder ?? "Reason (optional)"}
          className="ps-input ps-input--sm w-40"
          autoFocus
        />
        <button type="submit" className="ps-btn ps-btn--sm" aria-label={confirmDenyAria} disabled={pending}>
          {confirmDenyLabel ?? denyLabel}
        </button>
        <button
          type="button"
          className="ps-btn ps-btn--ghost ps-btn--sm"
          onClick={() => setDenying(false)}
          disabled={pending}
        >
          {cancelLabel ?? "Cancel"}
        </button>
      </form>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <form action={formAction}>
        <input type="hidden" name="id" value={requestId} />
        <input type="hidden" name="decision" value="approved" />
        <button type="submit" className="ps-btn ps-btn--sm" aria-label={approveAria} disabled={pending}>
          {approveLabel}
        </button>
      </form>
      <button
        type="button"
        className="ps-btn ps-btn--ghost ps-btn--sm"
        aria-label={denyAria}
        onClick={() => setDenying(true)}
        disabled={pending}
      >
        {denyLabel}
      </button>
    </div>
  );
}
