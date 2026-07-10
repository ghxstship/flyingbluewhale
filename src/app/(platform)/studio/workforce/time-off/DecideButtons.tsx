"use client";

import * as React from "react";
import { useActionState } from "react";
import { toast } from "@/lib/hooks/useToast";
import { decideTimeOff, type DecideState } from "./actions";

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
  const [denying, setDenying] = React.useState(false);

  React.useEffect(() => {
    if (state?.error) toast.error(state.error);
  }, [state]);

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
        <button type="submit" className="ps-btn btn-xs" disabled={pending}>
          {confirmDenyLabel ?? denyLabel}
        </button>
        <button
          type="button"
          className="ps-btn ps-btn--ghost btn-xs"
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
        <button type="submit" className="ps-btn btn-xs" disabled={pending}>
          {approveLabel}
        </button>
      </form>
      <button type="button" className="ps-btn ps-btn--ghost btn-xs" onClick={() => setDenying(true)} disabled={pending}>
        {denyLabel}
      </button>
    </div>
  );
}
