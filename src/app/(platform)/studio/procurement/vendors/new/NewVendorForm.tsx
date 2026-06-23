"use client";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { useT } from "@/lib/i18n/LocaleProvider";
import { createVendorAction } from "../actions";

export function NewVendorForm() {
  const t = useT();
  return (
    <FormShell
      action={createVendorAction}
      cancelHref="/studio/procurement/vendors"
      submitLabel={t("console.procurement.vendors.new.submit", undefined, "Create Vendor")}
    >
      <Input label={t("console.procurement.vendors.new.name", undefined, "Name")} name="name" required />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={t("console.procurement.vendors.new.email", undefined, "Email")}
          name="contact_email"
          type="email"
        />
        <Input label={t("console.procurement.vendors.new.phone", undefined, "Phone")} name="contact_phone" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={t("console.procurement.vendors.new.category", undefined, "Category")}
          name="category"
          placeholder={t(
            "console.procurement.vendors.new.categoryPlaceholder",
            undefined,
            "Staging, lighting, catering…",
          )}
        />
        <Input
          label={t("console.procurement.vendors.new.coiExpires", undefined, "COI expires")}
          name="coi_expires_at"
          type="date"
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="w9" /> {t("console.procurement.vendors.new.w9OnFile", undefined, "W-9 on file")}
      </label>
    </FormShell>
  );
}
