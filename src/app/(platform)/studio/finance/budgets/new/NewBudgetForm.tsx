"use client";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { useT } from "@/lib/i18n/LocaleProvider";
import { createBudgetAction } from "../actions";
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
  defaultValue = "",
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
      <select name={name} defaultValue={defaultValue} required={required} className={SELECT_CLASS}>
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

export function NewBudgetForm() {
  const t = useT();
  return (
    <FormShell
      action={createBudgetAction}
      cancelHref="/studio/finance/budgets"
      submitLabel={t("console.finance.budgets.new.submit", undefined, "Create Budget")}
    >
      {/* Identity */}
      <fieldset className="space-y-3">
        <legend className="text-xs font-semibold tracking-wider text-[var(--p-text-2)] uppercase">Identity</legend>
        <Input label={t("console.finance.budgets.new.name", undefined, "Name")} name="name" required maxLength={120} />
        <div className="grid gap-3 sm:grid-cols-3">
          <Input label={t("console.finance.budgets.new.event", undefined, "Event")} name="event" maxLength={160} />
          <Input
            label={t("console.finance.budgets.new.location", undefined, "Location")}
            name="location"
            maxLength={160}
          />
          <Input
            label={t("console.finance.budgets.new.activation", undefined, "Activation")}
            name="activation"
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
            label={t("console.finance.budgets.new.department", undefined, "Department")}
            name="department"
            options={XPMS_DEPARTMENTS}
          />
          <Input label={t("console.finance.budgets.new.team", undefined, "Team")} name="team" maxLength={120} />
          <Input label={t("console.finance.budgets.new.class", undefined, "Class")} name="class" maxLength={120} />
          <Input label={t("console.finance.budgets.new.item", undefined, "Item")} name="item" maxLength={120} />
        </div>
      </fieldset>

      {/* Lifecycle / axes */}
      <fieldset className="space-y-3">
        <legend className="text-xs font-semibold tracking-wider text-[var(--p-text-2)] uppercase">
          Lifecycle &amp; Axes
        </legend>
        <div className="grid gap-3 sm:grid-cols-3">
          <Select
            label={t("console.finance.budgets.new.phase", undefined, "Phase (8-Gate)")}
            name="xpms_phase"
            options={XPMS_PHASES}
          />
          <Select
            label={t("console.finance.budgets.new.discipline", undefined, "Discipline")}
            name="discipline"
            options={XPMS_DISCIPLINES}
          />
          <Select label={t("console.finance.budgets.new.tier", undefined, "Tier")} name="tier" options={XPMS_TIERS} />
          <Select
            label={t("console.finance.budgets.new.xyz", undefined, "XYZ (Cost Behaviour)")}
            name="xyz"
            options={XPMS_XYZ}
          />
          <Select
            label={t("console.finance.budgets.new.lineType", undefined, "Line Type")}
            name="line_type"
            options={XPMS_LINE_TYPES}
            defaultValue="Scope"
            required
          />
        </div>
        <p className="text-[11px] text-[var(--p-text-2)]">
          {t(
            "console.finance.budgets.new.lineTypeHint",
            undefined,
            "Fee & Contingency are LINE TYPE values. They roll up separately and never inflate a phase total.",
          )}
        </p>
      </fieldset>

      {/* Money */}
      <fieldset className="space-y-3">
        <legend className="text-xs font-semibold tracking-wider text-[var(--p-text-2)] uppercase">Money</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label={t("console.finance.budgets.new.quantity", undefined, "Quantity")}
            name="quantity"
            type="number"
            inputMode="decimal"
            step="0.01"
          />
          <MoneyInput
            label={t("console.finance.budgets.new.rate", undefined, "Rate (USD)")}
            name="rate_cents"
            hint={t("console.finance.budgets.new.rateHint", undefined, "Estimate = Quantity × Rate (computed by DB)")}
          />
          <MoneyInput
            label={t("console.finance.budgets.new.amount", undefined, "Budget (USD)")}
            name="amount_cents"
            required
            hint={t("console.finance.budgets.new.amountHint", undefined, "The approved baseline")}
          />
          <Input label={t("console.finance.budgets.new.vendor", undefined, "Vendor")} name="vendor" maxLength={160} />
        </div>
      </fieldset>

      {/* Notes */}
      <fieldset className="space-y-3">
        <legend className="text-xs font-semibold tracking-wider text-[var(--p-text-2)] uppercase">Notes</legend>
        <Input
          label={t("console.finance.budgets.new.status", undefined, "Status")}
          name="budget_state"
          maxLength={80}
        />
        <Input
          label={t("console.finance.budgets.new.externalNotes", undefined, "External notes")}
          name="external_notes"
          maxLength={4000}
        />
        <Input
          label={t("console.finance.budgets.new.internalNotes", undefined, "Internal notes")}
          name="internal_notes"
          maxLength={4000}
        />
      </fieldset>
    </FormShell>
  );
}
