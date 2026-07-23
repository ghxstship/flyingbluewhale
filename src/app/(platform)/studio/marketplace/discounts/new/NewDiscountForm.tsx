"use client";

import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { useT } from "@/lib/i18n/LocaleProvider";
import {
  DISCOUNT_KINDS,
  DISCOUNT_KIND_LABELS,
  DISCOUNT_STATES,
  DISCOUNT_STATE_LABELS,
} from "@/lib/discounts_promoters";
import { createDiscountAction } from "../actions";

export function NewDiscountForm() {
  const t = useT();
  return (
    <FormShell
      action={createDiscountAction}
      cancelHref="/studio/marketplace/discounts"
      submitLabel={t("console.marketplace.discounts.new.submit", undefined, "Create Code")}
    >
      <Input
        label={t("console.marketplace.discounts.new.fields.code", undefined, "Code")}
        name="code"
        required
        maxLength={60}
        placeholder="SUMMER25"
        className="font-mono"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="kind" className="text-xs font-medium text-[var(--p-text-2)]">
            {t("console.marketplace.discounts.new.fields.kind", undefined, "Kind")}
          </label>
          <select id="kind" name="kind" defaultValue="percent" className="ps-input mt-1.5 w-full">
            {DISCOUNT_KINDS.map((k) => (
              <option key={k} value={k}>
                {DISCOUNT_KIND_LABELS[k]}
              </option>
            ))}
          </select>
        </div>
        <Input
          label={t("console.marketplace.discounts.new.fields.value", undefined, "Value")}
          name="value"
          type="number"
          min={0}
          required
          hint={t(
            "console.marketplace.discounts.new.hints.value",
            undefined,
            "Percent: basis points (1000 = 10%). Fixed: cents off (500 = $5.00).",
          )}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={t("console.marketplace.discounts.new.fields.maxRedemptions", undefined, "Max redemptions")}
          name="max_redemptions"
          type="number"
          min={0}
          hint={t("console.marketplace.discounts.new.hints.maxRedemptions", undefined, "Leave blank for unlimited.")}
        />
        <div>
          <label htmlFor="discount_state" className="text-xs font-medium text-[var(--p-text-2)]">
            {t("console.marketplace.discounts.new.fields.status", undefined, "Status")}
          </label>
          <select id="discount_state" name="discount_state" defaultValue="active" className="ps-input mt-1.5 w-full">
            {DISCOUNT_STATES.map((s) => (
              <option key={s} value={s}>
                {DISCOUNT_STATE_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={t("console.marketplace.discounts.new.fields.startsAt", undefined, "Starts at")}
          name="starts_at"
          type="datetime-local"
        />
        <Input
          label={t("console.marketplace.discounts.new.fields.endsAt", undefined, "Ends at")}
          name="ends_at"
          type="datetime-local"
        />
      </div>

      <div>
        <label htmlFor="notes" className="text-xs font-medium text-[var(--p-text-2)]">
          {t("console.marketplace.discounts.new.fields.notes", undefined, "Notes")}
        </label>
        <textarea id="notes" name="notes" rows={3} className="ps-input mt-1.5 w-full" />
      </div>
    </FormShell>
  );
}
