"use client";

import { useActionState } from "react";
import { useT } from "@/lib/i18n/LocaleProvider";
import { redeemVoucherAction, type State } from "./actions";
import { resolveActionError } from "@/lib/errors";

/**
 * Voucher redemption form. Posts a code to the server action and surfaces the
 * success/error result.
 */
export function VoucherForm() {
  const [state, action, pending] = useActionState<State, FormData>(redeemVoucherAction, null);
  const t = useT();
  return (
    <form action={action} className="surface flex flex-col gap-2 p-4">
      <label htmlFor="voucher-code" className="text-sm font-semibold text-[var(--p-text-1)]">
        {t("console.legend.store.voucher.title", undefined, "Redeem a voucher")}
      </label>
      <div className="flex gap-2">
        <input id="voucher-code" name="code" placeholder="LEGEND-XXXX" className="ps-input flex-1" style={{ minHeight: 44 }} />
        <button type="submit" disabled={pending} className="ps-btn ps-btn--secondary" style={{ minHeight: 44 }}>
          {pending ? "…" : t("console.legend.store.voucher.redeem", undefined, "Redeem")}
        </button>
      </div>
      {state?.error && (
        <p className="text-xs text-[var(--p-danger)]" role="alert">
          {resolveActionError(state.error, t)}
        </p>
      )}
      {state?.ok && <p className="text-xs text-[var(--p-success)]">{state.ok}</p>}
    </form>
  );
}
