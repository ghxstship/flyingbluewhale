"use client";

import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { RecordCombobox } from "@/components/RecordCombobox";
import { useT } from "@/lib/i18n/LocaleProvider";
import { createInvoiceAction } from "../actions";

export function NewInvoiceForm({
  defaultClientId,
  defaultClientName,
}: {
  defaultClientId?: string;
  defaultClientName?: string;
}) {
  const t = useT();
  return (
    <FormShell
      action={createInvoiceAction}
      cancelHref="/studio/finance/invoices"
      submitLabel={t("console.finance.invoices.new.submit", undefined, "Create Invoice")}
    >
      <Input
        label={t("console.finance.invoices.new.title", undefined, "Title")}
        name="title"
        required
        maxLength={200}
        placeholder={t("console.finance.invoices.new.titlePlaceholder", undefined, "Event production retainer")}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <RecordCombobox
          table="clients"
          name="client_id"
          label={t("console.finance.invoices.new.client", undefined, "Client")}
          noneLabel={t("console.finance.invoices.new.noClientOption", undefined, "No client")}
          defaultValue={defaultClientId}
          defaultLabel={defaultClientName}
          searchPlaceholder={t("console.finance.invoices.new.searchClients", undefined, "Search clients…")}
          emptyLabel={t("console.finance.invoices.new.noClientMatches", undefined, "No matching clients")}
        />
        <RecordCombobox
          table="projects"
          name="project_id"
          label={t("console.finance.invoices.new.project", undefined, "Project")}
          noneLabel={t("console.finance.invoices.new.noProjectOption", undefined, "No project")}
          searchPlaceholder={t("console.finance.invoices.new.searchProjects", undefined, "Search projects…")}
          emptyLabel={t("console.finance.invoices.new.noProjectMatches", undefined, "No matching projects")}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <MoneyInput
          label={t("console.finance.invoices.new.amount", undefined, "Amount")}
          name="amount_cents"
          required
        />
        <div>
          <label className="text-xs font-medium text-[var(--p-text-2)]">
            {t("console.finance.invoices.new.currency", undefined, "Currency")}
          </label>
          <select name="currency" defaultValue="USD" className="ps-input mt-1.5 w-full">
            <option>USD</option>
            <option>EUR</option>
            <option>GBP</option>
            <option>CAD</option>
          </select>
        </div>
        <Input label={t("console.finance.invoices.new.due", undefined, "Due")} name="due_at" type="date" />
      </div>
      <Input label={t("console.finance.invoices.new.issued", undefined, "Issued")} name="issued_at" type="date" />
      <div>
        <label className="text-xs font-medium text-[var(--p-text-2)]">
          {t("console.finance.invoices.new.notes", undefined, "Notes")}
        </label>
        <textarea name="notes" rows={3} className="ps-input mt-1.5 w-full" />
      </div>
    </FormShell>
  );
}
