"use client";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { useT } from "@/lib/i18n/LocaleProvider";
import { createFabAction } from "../actions";

export function NewFabForm() {
  const t = useT();
  return (
    <FormShell
      action={createFabAction}
      cancelHref="/studio/production/fabrication"
      submitLabel={t("console.production.fabrication.new.submit", undefined, "Create Order")}
    >
      <Input label={t("console.production.fabrication.new.title", undefined, "Title")} name="title" required />
      <div>
        <label htmlFor="description" className="text-xs font-medium text-[var(--p-text-2)]">
          {t("console.production.fabrication.new.description", undefined, "Description")}
        </label>
        <textarea id="description" name="description" rows={3} className="ps-input mt-1.5 w-full" />
      </div>
      <Input label={t("console.production.fabrication.new.due", undefined, "Due")} name="due_at" type="date" />
    </FormShell>
  );
}
