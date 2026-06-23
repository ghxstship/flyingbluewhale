"use client";

import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { useT } from "@/lib/i18n/LocaleProvider";
import { toTitle } from "@/lib/format";
import { createContract } from "./actions";

type State = { error?: string; ok?: true; fieldErrors?: Record<string, string>; values?: Record<string, string> } | null;
export type ContractFormInitial = {
  title?: string;
  kind?: string;
  state?: string;
  number?: string;
  counterparty_name?: string;
  counterparty_email?: string;
  total_value_minor?: number | null;
  total_value_currency?: string;
  start_date?: string;
  end_date?: string;
  notes?: string;
};

const KINDS = [
  "sponsor_deal",
  "vendor_sow",
  "master_services",
  "talent_booking",
  "employment_equivalent",
  "ip_license",
  "partnership",
  "nda",
  "vendor_prequal",
  "rental_agreement",
  "venue_agreement",
  "other",
] as const;

const STATES = [
  "draft",
  "in_review",
  "negotiation",
  "awaiting_signatures",
  "active",
  "expiring",
  "expired",
  "terminated",
  "renewed",
  "archived",
] as const;

export function NewContractForm({
  action,
  submitLabel,
  initial,
}: {
  action?: (prev: State, formData: FormData) => Promise<State>;
  submitLabel?: string;
  initial?: ContractFormInitial;
} = {}) {
  const t = useT();
  return (
    <FormShell
      action={action ?? createContract}
      cancelHref="/studio/contracts"
      submitLabel={submitLabel ?? t("console.contracts.new.submit", undefined, "Create Contract")}
    >
      <Input
        label={t("console.contracts.new.title", undefined, "Title")}
        name="title"
        required
        maxLength={200}
        defaultValue={initial?.title}
        placeholder={t("console.contracts.new.titlePlaceholder", undefined, "Sponsorship — MMW26")}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-[var(--p-text-2)]">
            {t("console.contracts.columns.kind", undefined, "Kind")}
          </label>
          <select name="kind" defaultValue={initial?.kind ?? "other"} className="ps-input mt-1.5 w-full" required>
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {toTitle(k.replace(/_/g, " "))}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--p-text-2)]">
            {t("console.contracts.columns.state", undefined, "State")}
          </label>
          <select name="state" defaultValue={initial?.state ?? "draft"} className="ps-input mt-1.5 w-full">
            {STATES.map((s) => (
              <option key={s} value={s}>
                {toTitle(s.replace(/_/g, " "))}
              </option>
            ))}
          </select>
        </div>
      </div>
      <Input
        label={t("console.contracts.fields.number", undefined, "Number")}
        name="number"
        maxLength={80}
        defaultValue={initial?.number}
        placeholder={t("console.contracts.new.numberPlaceholder", undefined, "Auto-generated if blank")}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={t("console.contracts.columns.counterparty", undefined, "Counterparty")}
          name="counterparty_name"
          maxLength={200}
          defaultValue={initial?.counterparty_name}
        />
        <Input
          label={t("console.contracts.fields.counterpartyEmail", undefined, "Counterparty Email")}
          name="counterparty_email"
          type="email"
          maxLength={200}
          defaultValue={initial?.counterparty_email}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <MoneyInput
          label={t("console.contracts.columns.value", undefined, "Value")}
          name="total_value_minor"
          defaultCents={initial?.total_value_minor ?? undefined}
        />
        <div>
          <label className="text-xs font-medium text-[var(--p-text-2)]">
            {t("console.contracts.fields.currency", undefined, "Currency")}
          </label>
          <select
            name="total_value_currency"
            defaultValue={initial?.total_value_currency ?? "USD"}
            className="ps-input mt-1.5 w-full"
          >
            <option>USD</option>
            <option>EUR</option>
            <option>GBP</option>
            <option>CAD</option>
          </select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={t("console.contracts.fields.start", undefined, "Start")}
          name="start_date"
          type="date"
          defaultValue={initial?.start_date}
        />
        <Input
          label={t("console.contracts.fields.end", undefined, "End")}
          name="end_date"
          type="date"
          defaultValue={initial?.end_date}
        />
      </div>
      <div>
        <label className="text-xs font-medium text-[var(--p-text-2)]">
          {t("console.contracts.fields.notes", undefined, "Notes")}
        </label>
        <textarea name="notes" rows={3} className="ps-input mt-1.5 w-full" defaultValue={initial?.notes} />
      </div>
    </FormShell>
  );
}
