"use client";

import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { useT } from "@/lib/i18n/LocaleProvider";
import { createWipSnapshot } from "./actions";

export function NewWipSnapshotForm({ projects }: { projects: { id: string; name: string }[] }) {
  const t = useT();
  const today = new Date().toISOString().slice(0, 10);
  return (
    <FormShell
      action={createWipSnapshot}
      cancelHref="/studio/finance/wip"
      submitLabel={t("console.finance.wip.new.submit", undefined, "Create Snapshot")}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-[var(--p-text-2)]">
            {t("console.finance.wip.new.project", undefined, "Project")}
            <span aria-hidden="true" className="ms-0.5 text-[var(--p-danger)]">
              *
            </span>
          </label>
          <select name="project_id" required defaultValue="" className="ps-input mt-1.5 w-full">
            <option value="" disabled>
              {t("console.finance.wip.new.selectProject", undefined, "— Select a project —")}
            </option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <Input
          label={t("console.finance.wip.new.snapshotDate", undefined, "Snapshot Date")}
          name="snapshot_date"
          type="date"
          required
          defaultValue={today}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={t("console.finance.wip.new.contractAmount", undefined, "Contract Amount")}
          name="contract_amount"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          required
          prefix="$"
          defaultValue="0"
        />
        <Input
          label={t("console.finance.wip.new.changeOrders", undefined, "Approved Change Orders")}
          name="approved_change_orders"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          prefix="$"
          defaultValue="0"
        />
        <Input
          label={t("console.finance.wip.new.costsToDate", undefined, "Costs to Date")}
          name="costs_to_date"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          prefix="$"
          defaultValue="0"
        />
        <Input
          label={t("console.finance.wip.new.etc", undefined, "Estimated Cost to Complete")}
          name="estimated_cost_to_complete"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          prefix="$"
          defaultValue="0"
        />
        <Input
          label={t("console.finance.wip.new.percentComplete", undefined, "Percent Complete")}
          name="percent_complete"
          type="number"
          inputMode="decimal"
          step="0.1"
          min="0"
          max="100"
          suffix="%"
          defaultValue="0"
        />
        <Input
          label={t("console.finance.wip.new.billedToDate", undefined, "Billed to Date")}
          name="billed_to_date"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          prefix="$"
          defaultValue="0"
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="bonded" className="size-4 accent-[var(--p-accent)]" />
        {t("console.finance.wip.new.bonded", undefined, "Bonded")}
      </label>

      <Input
        label={t("console.finance.wip.new.suretyCarrier", undefined, "Surety Carrier")}
        name="surety_carrier"
        maxLength={200}
        placeholder={t("console.finance.wip.new.suretyPlaceholder", undefined, "e.g. Travelers Casualty & Surety")}
      />

      <div>
        <label className="text-xs font-medium text-[var(--p-text-2)]">
          {t("console.finance.wip.new.notes", undefined, "Notes")}
        </label>
        <textarea name="notes" rows={3} maxLength={2000} className="ps-input mt-1.5 w-full" />
      </div>
    </FormShell>
  );
}
