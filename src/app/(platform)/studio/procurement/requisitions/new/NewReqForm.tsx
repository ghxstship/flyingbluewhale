"use client";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { useT } from "@/lib/i18n/LocaleProvider";
import { createReqAction } from "../actions";

export function NewReqForm() {
  const t = useT();
  return (
    <FormShell
      action={createReqAction}
      cancelHref="/studio/procurement/requisitions"
      submitLabel={t("console.procurement.requisitions.new.submit", undefined, "Create Requisition")}
    >
      <Input label={t("console.procurement.requisitions.new.title", undefined, "Title")} name="title" required />
      <div>
        <label className="text-xs font-medium text-[var(--p-text-2)]">
          {t("console.procurement.requisitions.new.description", undefined, "Description")}
        </label>
        <textarea name="description" rows={3} className="ps-input mt-1.5 w-full" />
      </div>
      <Input
        label={t("console.procurement.requisitions.new.estimatedCost", undefined, "Estimated Cost (USD)")}
        name="estimated"
        type="number"
        step="0.01"
      />
    </FormShell>
  );
}
