"use client";

import { FormShell } from "@/components/FormShell";
import { useT } from "@/lib/i18n/LocaleProvider";
import { awardRfqAction } from "./actions";

/**
 * "Award → Draft PO" form (v7.8 record action). Vendor + optional PO
 * amount; the server action re-validates the RFQ state so a stale tab
 * can't double-award. Amount defaults to the lowest submitted bid when
 * one exists.
 */
export function AwardRfqForm({
  rfqId,
  vendors,
  defaultAmount,
}: {
  rfqId: string;
  vendors: { id: string; name: string }[];
  defaultAmount?: string;
}) {
  const t = useT();
  return (
    <FormShell
      action={awardRfqAction.bind(null, rfqId)}
      submitLabel={t("console.procurement.rfqs.award.submit", undefined, "Award → Draft PO")}
      dirtyGuard={false}
      className="space-y-3"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-[var(--p-text-2)]" htmlFor="rfq-award-vendor">
            {t("console.procurement.rfqs.award.vendor", undefined, "Winning vendor")}
          </label>
          <select id="rfq-award-vendor" name="vendor_id" required defaultValue="" className="ps-input mt-1.5 w-full">
            <option value="" disabled>
              {t("console.procurement.rfqs.award.pickVendor", undefined, "Select a vendor…")}
            </option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--p-text-2)]" htmlFor="rfq-award-amount">
            {t("console.procurement.rfqs.award.amount", undefined, "PO amount (USD)")}
          </label>
          <input
            id="rfq-award-amount"
            name="amount"
            type="number"
            min="0"
            step="0.01"
            defaultValue={defaultAmount}
            className="ps-input mt-1.5 w-full"
          />
        </div>
      </div>
    </FormShell>
  );
}
