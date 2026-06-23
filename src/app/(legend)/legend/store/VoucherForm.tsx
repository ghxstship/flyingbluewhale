"use client";

import { useActionState } from "react";
import { redeemVoucherAction, type State } from "./actions";

/**
 * Voucher redemption form. Posts a code to the server action and surfaces the
 * success/error result.
 */
export function VoucherForm() {
  const [state, action, pending] = useActionState<State, FormData>(redeemVoucherAction, null);
  return (
    <form action={action} className="surface flex flex-col gap-2 p-4">
      <label htmlFor="voucher-code" className="text-sm font-semibold text-[var(--p-text-1)]">
        Redeem a voucher
      </label>
      <div className="flex gap-2">
        <input id="voucher-code" name="code" placeholder="LEGEND-XXXX" className="ps-input flex-1" style={{ minHeight: 44 }} />
        <button type="submit" disabled={pending} className="ps-btn ps-btn--secondary" style={{ minHeight: 44 }}>
          {pending ? "…" : "Redeem"}
        </button>
      </div>
      {state?.error && (
        <p className="text-xs text-[var(--p-danger)]" role="alert">
          {state.error}
        </p>
      )}
      {state?.ok && <p className="text-xs text-[var(--p-success)]">{state.ok}</p>}
    </form>
  );
}
