"use client";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { useT } from "@/lib/i18n/LocaleProvider";
import { createTimeEntryAction } from "../actions";

export function NewTimeEntryForm() {
  const t = useT();
  const now = new Date();
  const iso = now.toISOString().slice(0, 16);
  return (
    <FormShell
      action={createTimeEntryAction}
      cancelHref="/console/finance/time"
      submitLabel={t("console.finance.time.new.submitLabel", undefined, "Log Time")}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={t("console.finance.time.new.startedLabel", undefined, "Started")}
          name="started_at"
          type="datetime-local"
          required
          defaultValue={iso}
        />
        <Input
          label={t("console.finance.time.new.endedLabel", undefined, "Ended")}
          name="ended_at"
          type="datetime-local"
        />
      </div>
      <Input label={t("console.finance.time.new.descriptionLabel", undefined, "Description")} name="description" />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="billable" defaultChecked />{" "}
        {t("console.finance.time.new.billableLabel", undefined, "Billable")}
      </label>
    </FormShell>
  );
}
