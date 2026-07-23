"use client";

import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { useT } from "@/lib/i18n/LocaleProvider";
import { PROMOTER_STATES, PROMOTER_STATE_LABELS } from "@/lib/discounts_promoters";
import { createPromoterAction } from "../actions";

export function NewPromoterForm() {
  const t = useT();
  return (
    <FormShell
      action={createPromoterAction}
      cancelHref="/studio/marketplace/discounts/promoters"
      submitLabel={t("console.marketplace.discounts.promotersTree.new.submit", undefined, "Create Promoter")}
    >
      <Input
        label={t("console.marketplace.discounts.promotersTree.new.fields.name", undefined, "Name")}
        name="name"
        required
        maxLength={160}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={t("console.marketplace.discounts.promotersTree.new.fields.email", undefined, "Email")}
          name="email"
          type="email"
        />
        <Input
          label={t("console.marketplace.discounts.promotersTree.new.fields.refCode", undefined, "Ref code")}
          name="ref_code"
          maxLength={60}
          placeholder="DJNOVA"
          className="font-mono"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={t(
            "console.marketplace.discounts.promotersTree.new.fields.commissionBps",
            undefined,
            "Commission (bps)",
          )}
          name="commission_bps"
          type="number"
          min={0}
          max={10000}
          defaultValue={1000}
          required
          hint={t(
            "console.marketplace.discounts.promotersTree.new.hints.commissionBps",
            undefined,
            "Basis points (1500 = 15%).",
          )}
        />
        <div>
          <label htmlFor="promoter_state" className="text-xs font-medium text-[var(--p-text-2)]">
            {t("console.marketplace.discounts.promotersTree.new.fields.status", undefined, "Status")}
          </label>
          <select id="promoter_state" name="promoter_state" defaultValue="active" className="ps-input mt-1.5 w-full">
            {PROMOTER_STATES.map((s) => (
              <option key={s} value={s}>
                {PROMOTER_STATE_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="notes" className="text-xs font-medium text-[var(--p-text-2)]">
          {t("console.marketplace.discounts.promotersTree.new.fields.notes", undefined, "Notes")}
        </label>
        <textarea id="notes" name="notes" rows={3} className="ps-input mt-1.5 w-full" />
      </div>
    </FormShell>
  );
}
