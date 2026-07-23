"use client";

import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { useT } from "@/lib/i18n/LocaleProvider";
import { createAttributionAction } from "../actions";

export function AttributionForm({ promoterId }: { promoterId: string }) {
  const t = useT();
  const action = createAttributionAction.bind(null, promoterId);
  return (
    <FormShell
      action={action}
      submitLabel={t("console.marketplace.discounts.promotersTree.attribution.submit", undefined, "Record")}
      dirtyGuard={false}
    >
      <Input
        label={t(
          "console.marketplace.discounts.promotersTree.attribution.fields.transactionRef",
          undefined,
          "Transaction reference",
        )}
        name="transaction_ref"
        required
        maxLength={200}
        placeholder={t(
          "console.marketplace.discounts.promotersTree.attribution.placeholders.transactionRef",
          undefined,
          "order / invoice id",
        )}
        className="font-mono"
      />
      <Input
        label={t(
          "console.marketplace.discounts.promotersTree.attribution.fields.amountCents",
          undefined,
          "Amount (cents)",
        )}
        name="amount_cents"
        type="number"
        min={0}
        required
        hint={t(
          "console.marketplace.discounts.promotersTree.attribution.hints.amountCents",
          undefined,
          "Gross transaction amount in cents. Commission is captured at the promoter's current rate.",
        )}
      />
      <div>
        <label htmlFor="notes" className="text-xs font-medium text-[var(--p-text-2)]">
          {t("console.marketplace.discounts.promotersTree.attribution.fields.notes", undefined, "Notes")}
        </label>
        <textarea id="notes" name="notes" rows={2} className="ps-input mt-1.5 w-full" />
      </div>
    </FormShell>
  );
}
