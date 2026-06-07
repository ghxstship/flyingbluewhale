"use client";

import { FormShell } from "@/components/FormShell";
import { toTitle } from "@/lib/format";
import { Input } from "@/components/ui/Input";
import { useT } from "@/lib/i18n/LocaleProvider";
import { createLeadAction } from "../actions";

const STAGES = ["new", "qualified", "contacted", "proposal", "won", "lost"] as const;

export function NewLeadForm() {
  const t = useT();
  return (
    <FormShell
      action={createLeadAction}
      cancelHref="/console/leads"
      submitLabel={t("console.leads.new.submit", undefined, "Create Lead")}
    >
      <Input label={t("console.leads.new.name", undefined, "Name")} name="name" required maxLength={120} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label={t("console.leads.new.email", undefined, "Email")} name="email" type="email" />
        <Input label={t("console.leads.new.phone", undefined, "Phone")} name="phone" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={t("console.leads.new.source", undefined, "Source")}
          name="source"
          placeholder={t("console.leads.new.sourcePlaceholder", undefined, "Referral, web, event…")}
        />
        <div>
          <label className="text-xs font-medium text-[var(--p-text-2)]">
            {t("console.leads.new.stage", undefined, "Stage")}
          </label>
          <select name="stage" defaultValue="new" className="ps-input mt-1.5 w-full">
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {toTitle(s)}
              </option>
            ))}
          </select>
        </div>
      </div>
      <Input
        label={t("console.leads.new.estimatedValue", undefined, "Estimated Value — USD")}
        name="estimated_value"
        type="number"
        inputMode="decimal"
        step="0.01"
      />
      <div>
        <label className="text-xs font-medium text-[var(--p-text-2)]">
          {t("console.leads.new.notes", undefined, "Notes")}
        </label>
        <textarea name="notes" rows={3} className="ps-input mt-1.5 w-full" />
      </div>
    </FormShell>
  );
}
