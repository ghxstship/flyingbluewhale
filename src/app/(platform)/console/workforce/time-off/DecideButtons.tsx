"use client";

import * as React from "react";
import { useActionState } from "react";
import { toast } from "sonner";
import { decideTimeOff, type DecideState } from "./actions";

/**
 * Approve / Deny pair for a pending time-off row. Client island so RPC
 * failures (e.g. insufficient balance) surface as a toast instead of
 * disappearing — the old plain <form action> discarded the result.
 */
export function DecideTimeOffButtons({
  requestId,
  approveLabel,
  denyLabel,
}: {
  requestId: string;
  approveLabel: string;
  denyLabel: string;
}) {
  const [state, formAction, pending] = useActionState<DecideState, FormData>(decideTimeOff, null);

  React.useEffect(() => {
    if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <div className="flex items-center gap-1">
      <form action={formAction}>
        <input type="hidden" name="id" value={requestId} />
        <input type="hidden" name="decision" value="approved" />
        <button type="submit" className="ps-btn btn-xs" disabled={pending}>
          {approveLabel}
        </button>
      </form>
      <form action={formAction}>
        <input type="hidden" name="id" value={requestId} />
        <input type="hidden" name="decision" value="denied" />
        <button type="submit" className="ps-btn ps-btn--ghost btn-xs" disabled={pending}>
          {denyLabel}
        </button>
      </form>
    </div>
  );
}
