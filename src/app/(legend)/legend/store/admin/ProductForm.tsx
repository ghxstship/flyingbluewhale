"use client";

import { useState } from "react";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import {
  PRODUCT_KINDS,
  PRODUCT_KIND_LABELS,
  PRODUCT_STATES,
  type CreditProduct,
  type ProductKind,
} from "@/lib/legend_store";
import { useT } from "@/lib/i18n/LocaleProvider";
import type { State } from "./actions";

/**
 * Create/edit form for a store product. The kind select drives which price
 * field applies: a pack is priced in money (cents) and grants `credits`; an
 * item is priced in `credits` (debited on purchase) with optional stock.
 */
export function ProductForm({
  action,
  product,
  submitLabel,
}: {
  action: (prev: State, fd: FormData) => Promise<State>;
  product?: CreditProduct;
  submitLabel: string;
}) {
  const t = useT();
  const [kind, setKind] = useState<ProductKind>(product?.product_kind ?? "pack");
  return (
    <FormShell action={action} cancelHref="/legend/store/admin" submitLabel={submitLabel}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={t("console.legend.storeAdmin.form.sku", undefined, "SKU")}
          name="sku"
          required
          maxLength={64}
          defaultValue={product?.sku ?? ""}
        />
        <Input
          label={t("console.legend.storeAdmin.form.name", undefined, "Name")}
          name="name"
          required
          maxLength={160}
          defaultValue={product?.name ?? ""}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="product_kind" className="text-xs font-medium text-[var(--p-text-2)]">
            {t("console.legend.storeAdmin.form.kind", undefined, "Kind")}
          </label>
          <select
            id="product_kind"
            name="product_kind"
            value={kind}
            onChange={(e) => setKind(e.target.value as ProductKind)}
            className="ps-input mt-1.5 w-full"
          >
            {PRODUCT_KINDS.map((k) => (
              <option key={k} value={k}>
                {PRODUCT_KIND_LABELS[k]}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-[var(--p-text-2)]">
            {kind === "pack"
              ? t("console.legend.storeAdmin.form.packHint", undefined, "A pack is bought with money and grants credits.")
              : t("console.legend.storeAdmin.form.itemHint", undefined, "An item is bought with credits from the buyer's balance.")}
          </p>
        </div>
        <div>
          <label htmlFor="product_state" className="text-xs font-medium text-[var(--p-text-2)]">
            {t("console.legend.storeAdmin.form.state", undefined, "State")}
          </label>
          <select
            id="product_state"
            name="product_state"
            defaultValue={product?.product_state ?? "active"}
            className="ps-input mt-1.5 w-full"
          >
            {PRODUCT_STATES.map((s) => (
              <option key={s} value={s}>
                {s === "active"
                  ? t("console.legend.storeAdmin.form.stateActive", undefined, "Active")
                  : t("console.legend.storeAdmin.form.stateArchived", undefined, "Archived")}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={
            kind === "pack"
              ? t("console.legend.storeAdmin.form.creditsGranted", undefined, "Credits granted")
              : t("console.legend.storeAdmin.form.creditPrice", undefined, "Price in credits")
          }
          name="credits"
          type="number"
          min={1}
          required
          defaultValue={product ? String(product.credits) : ""}
        />
        {kind === "pack" ? (
          <Input
            label={t("console.legend.storeAdmin.form.priceCents", undefined, "Price (cents)")}
            name="price_cents"
            type="number"
            min={0}
            required
            defaultValue={product ? String(product.price_cents) : ""}
            hint={t("console.legend.storeAdmin.form.priceCentsHint", undefined, "4900 = $49.00. Charged through Stripe checkout.")}
          />
        ) : (
          <Input
            label={t("console.legend.storeAdmin.form.stock", undefined, "Stock")}
            name="stock_qty"
            type="number"
            min={0}
            defaultValue={product?.stock_qty !== null && product?.stock_qty !== undefined ? String(product.stock_qty) : ""}
            hint={t("console.legend.storeAdmin.form.stockHint", undefined, "Units available. Leave blank for unlimited.")}
          />
        )}
      </div>

      <div>
        <label htmlFor="description" className="text-xs font-medium text-[var(--p-text-2)]">
          {t("console.legend.storeAdmin.form.description", undefined, "Description")}
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          maxLength={2000}
          className="ps-input mt-1.5 w-full"
          defaultValue={product?.description ?? ""}
        />
      </div>
    </FormShell>
  );
}
