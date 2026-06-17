"use client";

import { useActionState } from "react";
import { confirmShiftAction, type ShiftConfirmState } from "@/app/(mobile)/m/shift/actions";

// Inline confirm/decline buttons for upcoming shifts — workers can respond
// without navigating into a shift detail. Matches Connecteam's 2025 feature
// where "employees can confirm or reject shifts directly from the mobile
// schedule without opening the shift."

export function ShiftConfirmControls({
  shiftId,
  confirmationState,
}: {
  shiftId: string;
  confirmationState: "pending" | "confirmed" | "declined";
}) {
  const [state, action, pending] = useActionState<ShiftConfirmState, FormData>(confirmShiftAction, null);

  if (confirmationState === "confirmed") {
    return <span className="text-[10px] text-[var(--p-success)]">✓ Confirmed</span>;
  }
  if (confirmationState === "declined") {
    return <span className="text-[10px] text-[var(--p-text-2)]">Declined</span>;
  }

  return (
    <form action={action} className="flex items-center gap-1.5">
      <input type="hidden" name="shift_id" value={shiftId} />
      <button
        type="submit"
        name="confirmation_state"
        value="confirmed"
        disabled={pending}
        className="rounded-full bg-[var(--p-success)]/10 px-2.5 py-0.5 text-[10px] font-semibold text-[var(--p-success)] hover:bg-[var(--p-success)]/20 disabled:opacity-50"
      >
        Confirm
      </button>
      <button
        type="submit"
        name="confirmation_state"
        value="declined"
        disabled={pending}
        className="rounded-full bg-[var(--p-text-2)]/10 px-2.5 py-0.5 text-[10px] font-semibold text-[var(--p-text-2)] hover:bg-[var(--p-text-2)]/20 disabled:opacity-50"
      >
        Decline
      </button>
      {state?.error && <span className="text-[10px] text-[var(--p-error)]">{state.error}</span>}
    </form>
  );
}
