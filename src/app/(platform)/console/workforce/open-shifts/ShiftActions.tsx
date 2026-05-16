"use client";

import { useTransition } from "react";
import { updateShiftState, decideClaimAction } from "./actions";

export function CancelShiftButton({ shiftId }: { shiftId: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => start(() => updateShiftState(shiftId, "cancelled"))}
      className="text-xs text-[var(--color-error)] underline-offset-2 hover:underline"
    >
      {pending ? "…" : "Cancel"}
    </button>
  );
}

export function DecideClaimButton({ claimId }: { claimId: string }) {
  const [pending, start] = useTransition();
  return (
    <span className="flex gap-2">
      <button
        disabled={pending}
        onClick={() => start(() => decideClaimAction(claimId, "approved"))}
        className="text-xs text-[var(--color-success)] underline-offset-2 hover:underline"
      >
        {pending ? "…" : "Approve"}
      </button>
      <button
        disabled={pending}
        onClick={() => start(() => decideClaimAction(claimId, "declined"))}
        className="text-xs text-[var(--color-error)] underline-offset-2 hover:underline"
      >
        Decline
      </button>
    </span>
  );
}
