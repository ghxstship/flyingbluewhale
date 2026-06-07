"use client";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { useT } from "@/lib/i18n/LocaleProvider";
import type { State } from "./actions";
import {
  XPMS_DEPARTMENTS,
  XPMS_DISCIPLINES,
  XPMS_LINE_TYPES,
  XPMS_PHASES,
  XPMS_TIERS,
  XPMS_XYZ,
} from "@/lib/finance/xpms-budget";

const SELECT_CLASS = "w-full rounded-md border border-[var(--p-border)] bg-[var(--p-surface)] px-3 py-2 text-sm";

function Select({
  label,
  name,
  options,
  defaultValue,
  required = false,
}: {
  label: string;
  name: string;
  options: readonly string[];
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-[var(--p-text-2)]">{label}</span>
      <select name={name} defaultValue={defaultValue ?? ""} required={required} className={SELECT_CLASS}>
        <option value="">—</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </label>
  );
}

/**
 * XPMS edit form. Mirrors NewBudgetForm; reads existing row values via
 * the `row` prop and pre-populates each field. Money values come back
 * as cents — convert to dollars for the dollar-string inputs.
 */
export function EditBudgetForm({
  budgetId,
  row,
  action,
}: {
  budgetId: string;
  row: Record<string, unknown>;
  action: (state: State, fd: FormData) => Promise<State>;
}) {
  const t = useT();
  const get = (k: string) => (row[k] != null ? String(row[k]) : "");
  const getMoney = (k: string) => {
    const v = row[k];
    return typeof v === "number" ? (v / 100).toFixed(2) : "";
  };
  return (
    <FormShell
      action={action}
      cancelHref={`/console/finance/budgets/${budgetId}`}
      submitLabel={t("console.finance.budgets.edit.submit", undefined, "Save Changes")}
    >
      {/* Sea Trial FINDING-022: optimistic concurrency token. */}
      <input type="hidden" name="_updated_at" defaultValue={get("updated_at")} />

      {/* Identity */}
      <fieldset className="space-y-3">
        <legend className="text-xs font-semibold tracking-wider text-[var(--p-text-2)] uppercase">Identity</legend>
        <Input
          label={t("console.finance.budgets.edit.name", undefined, "Name")}
          name="name"
          defaultValue={get("name")}
          required
          maxLength={200}
        />
        <div className="grid gap-3 sm:grid-cols-3">
          <Input
            label={t("console.finance.budgets.edit.event", undefined, "Event")}
            name="event"
            defaultValue={get("event")}
            maxLength={160}
          />
          <Input
            label={t("console.finance.budgets.edit.location", undefined, "Location")}
            name="location"
            defaultValue={get("location")}
            maxLength={160}
          />
          <Input
            label={t("console.finance.budgets.edit.activation", undefined, "Activation")}
            name="activation"
            defaultValue={get("activation")}
            maxLength={160}
          />
        </div>
      </fieldset>

      {/* XPMS taxonomy */}
      <fieldset className="space-y-3">
        <legend className="text-xs font-semibold tracking-wider text-[var(--p-text-2)] uppercase">
          XPMS Classification
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <Select
            label={t("console.finance.budgets.edit.department", undefined, "Department")}
            name="department"
            options={XPMS_DEPARTMENTS}
            defaultValue={get("department")}
          />
          <Input
            label={t("console.finance.budgets.edit.team", undefined, "Team")}
            name="team"
            defaultValue={get("team")}
            maxLength={120}
          />
          <Input
            label={t("console.finance.budgets.edit.class", undefined, "Class")}
            name="class"
            defaultValue={get("class")}
            maxLength={120}
          />
          <Input
            label={t("console.finance.budgets.edit.item", undefined, "Item")}
            name="item"
            defaultValue={get("item")}
            maxLength={120}
          />
        </div>
      </fieldset>

      {/* Lifecycle / axes */}
      <fieldset className="space-y-3">
        <legend className="text-xs font-semibold tracking-wider text-[var(--p-text-2)] uppercase">
          Lifecycle &amp; Axes
        </legend>
        <div className="grid gap-3 sm:grid-cols-3">
          <Select
            label={t("console.finance.budgets.edit.phase", undefined, "Phase (8-Gate)")}
            name="xpms_phase"
            options={XPMS_PHASES}
            defaultValue={get("xpms_phase")}
          />
          <Select
            label={t("console.finance.budgets.edit.discipline", undefined, "Discipline")}
            name="discipline"
            options={XPMS_DISCIPLINES}
            defaultValue={get("discipline")}
          />
          <Select
            label={t("console.finance.budgets.edit.tier", undefined, "Tier")}
            name="tier"
            options={XPMS_TIERS}
            defaultValue={get("tier")}
          />
          <Select
            label={t("console.finance.budgets.edit.xyz", undefined, "XYZ — Cost Behaviour")}
            name="xyz"
            options={XPMS_XYZ}
            defaultValue={get("xyz")}
          />
          <Select
            label={t("console.finance.budgets.edit.lineType", undefined, "Line Type")}
            name="line_type"
            options={XPMS_LINE_TYPES}
            defaultValue={get("line_type") || "Scope"}
            required
          />
        </div>
      </fieldset>

      {/* Money */}
      <fieldset className="space-y-3">
        <legend className="text-xs font-semibold tracking-wider text-[var(--p-text-2)] uppercase">Money</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label={t("console.finance.budgets.edit.quantity", undefined, "Quantity")}
            name="quantity"
            type="number"
            inputMode="decimal"
            step="0.01"
            defaultValue={get("quantity")}
          />
          <Input
            label={t("console.finance.budgets.edit.rate", undefined, "Rate — USD")}
            name="rate"
            type="number"
            inputMode="decimal"
            step="0.01"
            defaultValue={getMoney("rate_cents")}
            hint={t("console.finance.budgets.edit.rateHint", undefined, "Estimate = Quantity × Rate (computed by DB)")}
          />
          <Input
            label={t("console.finance.budgets.edit.amount", undefined, "Budget — USD")}
            name="amount"
            type="number"
            inputMode="decimal"
            step="0.01"
            required
            defaultValue={getMoney("amount_cents")}
          />
          <Input
            label={t("console.finance.budgets.edit.vendor", undefined, "Vendor")}
            name="vendor"
            defaultValue={get("vendor")}
            maxLength={160}
          />
        </div>
      </fieldset>

      {/* Notes */}
      <fieldset className="space-y-3">
        <legend className="text-xs font-semibold tracking-wider text-[var(--p-text-2)] uppercase">Notes</legend>
        <Input
          label={t("console.finance.budgets.edit.status", undefined, "Status")}
          name="budget_status"
          defaultValue={get("budget_status")}
          maxLength={80}
        />
        <Input
          label={t("console.finance.budgets.edit.externalNotes", undefined, "External notes")}
          name="external_notes"
          defaultValue={get("external_notes")}
          maxLength={4000}
        />
        <Input
          label={t("console.finance.budgets.edit.internalNotes", undefined, "Internal notes")}
          name="internal_notes"
          defaultValue={get("internal_notes")}
          maxLength={4000}
        />
      </fieldset>
    </FormShell>
  );
}
