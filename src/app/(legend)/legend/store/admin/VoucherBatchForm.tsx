"use client";

import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { useT } from "@/lib/i18n/LocaleProvider";
import { createVoucherBatchAction } from "./actions";

/**
 * Voucher batch mint form. Codes are generated server-side
 * (`PREFIX-XXXXXXXX`, unambiguous alphabet) and appear in the vouchers
 * register on success.
 */
export function VoucherBatchForm() {
  const t = useT();
  return (
    <FormShell
      action={createVoucherBatchAction}
      cancelHref="/legend/store/admin"
      submitLabel={t("console.legend.storeAdmin.vouchers.mint", undefined, "Mint vouchers")}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={t("console.legend.storeAdmin.vouchers.prefix", undefined, "Code prefix")}
          name="prefix"
          required
          maxLength={16}
          defaultValue="LEGEND"
          hint={t("console.legend.storeAdmin.vouchers.prefixHint", undefined, "Codes look like LEGEND-7KQ2M9XW.")}
        />
        <Input
          label={t("console.legend.storeAdmin.vouchers.count", undefined, "Number of codes")}
          name="count"
          type="number"
          min={1}
          max={200}
          required
          defaultValue="10"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Input
          label={t("console.legend.storeAdmin.vouchers.credits", undefined, "Credits per code")}
          name="credits"
          type="number"
          min={1}
          required
        />
        <Input
          label={t("console.legend.storeAdmin.vouchers.maxRedemptions", undefined, "Max redemptions")}
          name="max_redemptions"
          type="number"
          min={1}
          defaultValue="1"
          hint={t("console.legend.storeAdmin.vouchers.maxRedemptionsHint", undefined, "How many different people may redeem one code.")}
        />
        <Input
          label={t("console.legend.storeAdmin.vouchers.expires", undefined, "Expires on")}
          name="expires_on"
          type="date"
          hint={t("console.legend.storeAdmin.vouchers.expiresHint", undefined, "Leave blank for no expiry.")}
        />
      </div>
    </FormShell>
  );
}
