"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { formatMoney } from "@/lib/commerce_store";
import { addToCart, type State } from "../actions";

type VariantOption = {
  id: string;
  title: string;
  price_cents: number | null;
  inventory_qty: number;
};

export function AddToCartForm({
  productId,
  variants,
  basePriceCents,
  currency,
}: {
  productId: string;
  variants: VariantOption[];
  basePriceCents: number;
  currency: string;
}) {
  const [state, formAction, pending] = useActionState<State, FormData>(addToCart, null);
  const [variantId, setVariantId] = useState<string>(variants[0]?.id ?? "");

  const selected = variants.find((v) => v.id === variantId) ?? null;
  const priceCents = selected?.price_cents ?? basePriceCents;

  return (
    <form action={formAction} className="surface flex flex-col gap-4 p-4">
      <input type="hidden" name="product_id" value={productId} />

      {variants.length > 0 && (
        <div>
          <label htmlFor="variant_id" className="text-xs font-medium text-[var(--p-text-2)]">
            Option
          </label>
          <select
            id="variant_id"
            name="variant_id"
            className="ps-input mt-1.5 w-full"
            value={variantId}
            onChange={(e) => setVariantId(e.target.value)}
          >
            {variants.map((v) => (
              <option key={v.id} value={v.id} disabled={v.inventory_qty <= 0}>
                {v.title}
                {v.inventory_qty <= 0 ? " (sold out)" : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="quantity" className="text-xs font-medium text-[var(--p-text-2)]">
            Quantity
          </label>
          <input
            id="quantity"
            name="quantity"
            type="number"
            min={1}
            max={99}
            defaultValue={1}
            className="ps-input mt-1.5 w-full"
          />
        </div>
        <div className="flex flex-col justify-end">
          <span className="text-xs text-[var(--p-text-2)]">Price</span>
          <span className="text-base font-semibold tabular-nums">{formatMoney(priceCents, currency)}</span>
        </div>
      </div>

      {state?.error && <Alert kind="error">{state.error}</Alert>}

      <Button type="submit" loading={pending}>
        {pending ? "Adding" : "Add to cart"}
      </Button>
    </form>
  );
}
