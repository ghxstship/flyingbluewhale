"use client";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { useT } from "@/lib/i18n/LocaleProvider";
import { createMileageAction } from "../actions";

export function NewMileageForm() {
  const t = useT();
  const today = new Date().toISOString().slice(0, 10);
  return (
    <FormShell
      action={createMileageAction}
      cancelHref="/console/finance/mileage"
      submitLabel={t("console.finance.mileage.new.submit", undefined, "Log Mileage")}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label={t("console.finance.mileage.new.origin", undefined, "Origin")} name="origin" required />
        <Input
          label={t("console.finance.mileage.new.destination", undefined, "Destination")}
          name="destination"
          required
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={t("console.finance.mileage.new.miles", undefined, "Miles")}
          name="miles"
          type="number"
          step="0.1"
          required
        />
        <Input
          label={t("console.finance.mileage.new.date", undefined, "Date")}
          name="logged_on"
          type="date"
          required
          defaultValue={today}
        />
      </div>
      <div>
        <label className="text-xs font-medium text-[var(--text-secondary)]">
          {t("console.finance.mileage.new.notes", undefined, "Notes")}
        </label>
        <textarea name="notes" rows={2} className="input-base mt-1.5 w-full" />
      </div>
    </FormShell>
  );
}
