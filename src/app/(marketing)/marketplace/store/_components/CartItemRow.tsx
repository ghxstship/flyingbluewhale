"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { formatMoney } from "@/lib/commerce_store";
import { updateCartItem, removeCartItem, type State } from "../actions";

export function CartItemRow({
  itemId,
  title,
  variantTitle,
  imageUrl,
  unitPriceCents,
  quantity,
  maxQty,
  currency,
}: {
  itemId: string;
  title: string;
  variantTitle: string | null;
  imageUrl: string | null;
  unitPriceCents: number;
  quantity: number;
  maxQty: number;
  currency: string;
}) {
  const router = useRouter();
  const [, updateAction, updatePending] = useActionState<State, FormData>(async (prev, fd) => {
    const r = await updateCartItem(prev, fd);
    router.refresh();
    return r;
  }, null);
  const [, removeAction, removePending] = useActionState<State, FormData>(async (prev, fd) => {
    const r = await removeCartItem(prev, fd);
    router.refresh();
    return r;
  }, null);

  return (
    <div className="flex items-center gap-4 p-4">
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt={title} loading="lazy" decoding="async" className="h-16 w-16 rounded-md object-cover" />
      ) : (
        <div className="surface-inset h-16 w-16 rounded-md" aria-hidden="true" />
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{title}</p>
        {variantTitle && <p className="text-xs text-[var(--p-text-2)]">{variantTitle}</p>}
        <p className="text-xs text-[var(--p-text-2)] tabular-nums">{formatMoney(unitPriceCents, currency)} each</p>
      </div>

      <form action={updateAction} className="flex items-center gap-2">
        <input type="hidden" name="item_id" value={itemId} />
        <label htmlFor={`qty-${itemId}`} className="sr-only">
          Quantity
        </label>
        <input
          id={`qty-${itemId}`}
          name="quantity"
          type="number"
          min={1}
          max={maxQty}
          defaultValue={quantity}
          className="ps-input w-16"
          aria-busy={updatePending || undefined}
        />
        <Button type="submit" variant="secondary" size="sm" loading={updatePending}>
          Update
        </Button>
      </form>

      <p className="w-24 text-right text-sm font-semibold tabular-nums">
        {formatMoney(unitPriceCents * quantity, currency)}
      </p>

      <form action={removeAction}>
        <input type="hidden" name="item_id" value={itemId} />
        <Button type="submit" variant="ghost" size="sm" loading={removePending}>
          Remove
        </Button>
      </form>
    </div>
  );
}
