"use client";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { useT } from "@/lib/i18n/LocaleProvider";
import { createLocationAction } from "../actions";

export function NewLocationForm() {
  const t = useT();
  return (
    <FormShell
      action={createLocationAction}
      cancelHref="/studio/locations"
      submitLabel={t("console.locations.new.submit", undefined, "Save Location")}
    >
      <Input label={t("console.locations.new.name", undefined, "Name")} name="name" required />
      <Input label={t("console.locations.new.address", undefined, "Address")} name="address" />
      <div className="grid gap-4 sm:grid-cols-3">
        <Input label={t("console.locations.new.city", undefined, "City")} name="city" />
        <Input label={t("console.locations.new.region", undefined, "Region")} name="region" />
        <Input label={t("console.locations.new.postcode", undefined, "Postal Code")} name="postcode" />
      </div>
      <Input label={t("console.locations.new.country", undefined, "Country")} name="country" />
      <div>
        <label className="text-xs font-medium text-[var(--p-text-2)]">
          {t("console.locations.new.notes", undefined, "Notes")}
        </label>
        <textarea name="notes" rows={2} className="ps-input mt-1.5 w-full" />
      </div>
    </FormShell>
  );
}
