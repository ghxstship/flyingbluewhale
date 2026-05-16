"use client";

import { useActionState, useTransition } from "react";
import { claimOpenShift, withdrawClaim, type ClaimState } from "./actions";

export function ClaimButton({ shiftId }: { shiftId: string }) {
  const [state, action, pending] = useActionState<ClaimState, FormData>(claimOpenShift, null);

  return (
    <form action={action}>
      <input type="hidden" name="open_shift_id" value={shiftId} />
      {state?.error && (
        <p className="mb-2 text-xs text-[var(--color-error)]">{state.error}</p>
      )}
      {state?.success ? (
        <p className="text-xs text-[var(--color-success)]">Claim submitted — awaiting approval.</p>
      ) : (
        <button type="submit" disabled={pending} className="btn btn-primary w-full text-sm">
          {pending ? "Claiming…" : "Claim Shift"}
        </button>
      )}
    </form>
  );
}

export function WithdrawButton({ claimId }: { claimId: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => start(() => withdrawClaim(claimId))}
      className="w-full rounded border border-[var(--border-color)] py-2 text-sm text-[var(--text-muted)]"
    >
      {pending ? "…" : "Withdraw Claim"}
    </button>
  );
}
