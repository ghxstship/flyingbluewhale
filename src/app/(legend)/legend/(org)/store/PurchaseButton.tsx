"use client";

import { useActionState } from "react";
import { useT } from "@/lib/i18n/LocaleProvider";
import { purchaseItemAction, type State } from "./actions";
import { resolveActionError } from "@/lib/errors";

/**
 * Spend control for a credits-priced store item. Renders an honest disabled
 * state when the caller can't afford the item or it's out of stock (the
 * server-side RPC remains the authority); otherwise posts the purchase and
 * surfaces the atomic result.
 */
export function PurchaseButton({
  productId,
  price,
  balance,
  outOfStock,
}: {
  productId: string;
  price: number;
  balance: number;
  outOfStock: boolean;
}) {
  const [state, action, pending] = useActionState<State, FormData>(purchaseItemAction, null);
  const t = useT();
  const shortfall = Math.max(0, price - balance);
  const blocked = outOfStock || shortfall > 0;

  return (
    <form action={action} className="flex flex-col gap-1">
      <input type="hidden" name="product_id" value={productId} />
      <button
        type="submit"
        disabled={pending || blocked}
        className="ps-btn ps-btn--secondary"
        style={{ minHeight: 44, justifyContent: "center" }}
      >
        {pending
          ? "…"
          : outOfStock
            ? t("console.legend.store.outOfStock", undefined, "Out of stock")
            : t("console.legend.store.redeemCredits", { count: String(price) }, `Redeem ${price} credits`)}
      </button>
      {!outOfStock && shortfall > 0 && (
        <p className="text-xs text-[var(--p-text-2)]">
          {t("console.legend.store.needMore", { count: String(shortfall) }, `You need ${shortfall} more credits.`)}
        </p>
      )}
      {state?.error && (
        <p className="text-xs text-[var(--p-danger)]" role="alert">
          {resolveActionError(state.error, t)}
        </p>
      )}
      {state?.ok && <p className="text-xs text-[var(--p-success)]">{state.ok}</p>}
    </form>
  );
}
